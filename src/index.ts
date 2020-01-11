import { APIGatewayProxyEvent } from "aws-lambda";
import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";

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

const decodeParam = <CodecType extends t.Any, ReturnType = t.TypeOf<CodecType>>(
  codec: CodecType,
  value: unknown
): ReturnType => {
  const result: Either<t.Errors, ReturnType> = codec.decode(value);
  if (result.isLeft()) {
    throw new Error("oops");
  }
  return result.value;
};

const decodeBody = <CodecType extends t.Any, ReturnType = t.TypeOf<CodecType>>(
  codec: CodecType,
  value: unknown
): ReturnType => {
  if (typeof value !== "string") {
    // Future work: does this need to support bodies other than JSON?
    throw new Error("The body parameter must be well formed JSON.");
  }
  const parsedObject = JSON.parse(value);
  const result: Either<t.Errors, ReturnType> = codec.decode(parsedObject);
  if (result.isLeft()) {
    throw new Error("oops");
  }
  return result.value;
};

const processCodecs = <
  CodecMap extends CodecMapBase,
  ParamMap extends Record<string, unknown>
>(
  codecMap: CodecMap,
  paramMap: ParamMap | null
): TransformCodecToValue<CodecMap> => {
  const keys = Object.keys(codecMap) as ReadonlyArray<keyof CodecMap>;
  return keys.reduce(
    (prev, key) => ({
      ...prev,
      [key]: decodeParam(
        codecMap[key],
        paramMap === null ? null : paramMap[key as string]
      )
    }),
    {} as TransformCodecToValue<CodecMap>
  );
};

export const codecHandler = <ExtractionMap extends ExtractionMapBase>(
  codecMaps: ExtractionMap,
  handlerFn: HandlerFunction<ExtractionMap>
) => (event: APIGatewayProxyEvent) => {
  const keys = Object.keys(codecMaps) as ReadonlyArray<
    keyof ExtractionMap & keyof ExtractableParameters
  >;
  const flat = keys.reduce((prev, key) => {
    if (key === "body") {
      return prev;
    }
    const codecMap: CodecMapBase = codecMaps[key] as CodecMapBase;
    return { ...prev, [key]: processCodecs(codecMap, event[key]) };
  }, {} as ValueMap<ExtractionMap>);
  return codecMaps.body !== undefined
    ? handlerFn({
        ...flat,
        body: decodeBody(codecMaps.body, event.body)
      })
    : handlerFn(flat);
};
