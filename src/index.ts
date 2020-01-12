import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { either, left } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";

type ExtractableParameters = Pick<
  APIGatewayProxyEvent,
  // tslint:disable-next-line: max-union-size
  | "headers"
  | "multiValueHeaders"
  | "pathParameters"
  | "queryStringParameters"
  | "multiValueQueryStringParameters"
  | "stageVariables"
>;

export type CodecMapBase = {
  // tslint:disable-next-line: no-any
  readonly [name: string]: t.Any;
};

export type ExtractionMapBase = Partial<
  {
    readonly [p in keyof ExtractableParameters]: CodecMapBase;
  } & {
    readonly body: t.Any;
  }
>;

type Filter<T, U> = T extends U ? T : never;

export type TransformCodecToValue<CodecMap extends CodecMapBase> = {
  [k in keyof CodecMap]: t.TypeOf<CodecMap[k]>;
};

export type ValueMap<ExtractionMap extends ExtractionMapBase> = {
  readonly [p in keyof ExtractionMap]: TransformCodecToValue<
    Filter<ExtractionMap[p], CodecMapBase>
  >;
};

export type HandlerFunction<ExtractionMap extends ExtractionMapBase> = (
  values: ValueMap<ExtractionMap>
) => Promise<unknown>;

export type ValidationErrorHandler = (
  errors: t.Errors
) => APIGatewayProxyResult;
export type UnhandledErrorHandler = (error: unknown) => APIGatewayProxyResult;
export type SuccessHandler = <ResultType>(
  result: ResultType
) => APIGatewayProxyResult;

export type JSONObject = { readonly [key: string]: JSON };
export interface JSONArray extends Array<JSON> {}
export type JSON = null | string | number | boolean | JSONArray | JSONObject;

const jsonFromStringCodec = new t.Type<JSON, string, unknown>(
  "JSONFromString",
  (u): u is JSON => u !== undefined,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      try {
        return t.success(JSON.parse(s));
      } catch (e) {
        if (e instanceof Error) {
          return t.failure(u, c, e.message);
        } else {
          return t.failure(u, c, "Unknown error");
        }
      }
    }),
  a => JSON.stringify(a)
);

const defaultValidationErrorHandler: ValidationErrorHandler = e => ({
  statusCode: 400,
  body: JSON.stringify({
    error: PathReporter.report(left(e)).join(", ")
  })
});

const defaultUnhandledErrorHandler: UnhandledErrorHandler = e => ({
  statusCode: 500,
  body: JSON.stringify({
    error: `Unhandled error: ${JSON.stringify(e)}`
  })
});

const defaultSuccessHandler: SuccessHandler = e => ({
  statusCode: 200,
  body: JSON.stringify(e)
});

export const configureWrapper = ({
  validationErrorHandler = defaultValidationErrorHandler,
  unhandledErrorHandler = defaultUnhandledErrorHandler,
  successHandler = defaultSuccessHandler
}: {
  readonly validationErrorHandler?: ValidationErrorHandler;
  readonly unhandledErrorHandler?: UnhandledErrorHandler;
  readonly successHandler?: SuccessHandler;
}) => {
  return <ExtractionMap extends ExtractionMapBase>(
    codecMaps: ExtractionMap,
    handlerFn: HandlerFunction<ExtractionMap>
  ) => async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const keys = Object.keys(codecMaps) as ReadonlyArray<keyof ExtractionMap>;

    const mergedParameterCodecs = keys
      .filter(key => key !== "body" && codecMaps[key] !== undefined)
      .reduce((prev, key) => {
        // TODO: Work out why this needs to be force casted
        const subMap = (codecMaps[key] as unknown) as CodecMapBase;
        return { ...prev, [key]: t.type(subMap) };
      }, {});

    const mergedCodecs =
      codecMaps.body === undefined
        ? mergedParameterCodecs
        : {
            ...mergedParameterCodecs,
            body: jsonFromStringCodec.pipe(codecMaps.body)
          };

    const rootCodec = t.type(mergedCodecs);
    const decoded = rootCodec.decode(event) as t.Validation<
      ValueMap<ExtractionMap>
    >;

    if (decoded.isLeft()) {
      return validationErrorHandler(decoded.value);
    }

    try {
      const result = await handlerFn(decoded.value);

      return successHandler(result);
    } catch (e) {
      return unhandledErrorHandler(e);
    }
  };
};
