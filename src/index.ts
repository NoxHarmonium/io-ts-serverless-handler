import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { jsonFromStringCodec } from "./codecs";
import {
  defaultSuccessHandler,
  defaultUnhandledErrorHandler,
  defaultValidationErrorHandler
} from "./default-handlers";
import {
  BaseCodecType,
  EventMapBase,
  ExtractableParameters,
  HandlerConfig,
  HandlerFunction,
  ValueMap
} from "./types";
import { removeEmpty, typedKeys } from "./utils";

export * from "./types";

const defaultConfig: Required<HandlerConfig> = {
  validationErrorHandler: defaultValidationErrorHandler,
  unhandledErrorHandler: defaultUnhandledErrorHandler,
  successHandler: defaultSuccessHandler,
  strict: false
};

const defaultEvent: Required<ExtractableParameters> = {
  headers: {},
  multiValueHeaders: {},
  pathParameters: {},
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  stageVariables: {},
  body: null
};

/**
 * Takes an optional config object and returns a function that wraps
 * a handler function
 */
export const configureWrapper = (config: HandlerConfig | undefined) => <
  EventMap extends EventMapBase,
  ReturnType
>(
  codecMaps: EventMap,
  handlerFn: HandlerFunction<EventMap, ReturnType>
) => async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const {
    validationErrorHandler,
    unhandledErrorHandler,
    successHandler,
    strict
  } = {
    ...defaultConfig,
    ...config
  };

  const keys = typedKeys<EventMapBase>(codecMaps);
  // Filter out any keys that are not provided and merge all the codecs into
  // a root codec definition that can decode the lambda event
  const mergedParameterCodecs = keys.reduce((prev, key) => {
    const subMap = codecMaps[key];
    return key === "body" || subMap === undefined
      ? prev
      : { ...prev, [key]: strict ? t.exact(subMap) : subMap };
  }, {} as ValueMap<EventMap>);

  const decodeBody = (body: BaseCodecType): Partial<ValueMap<EventMap>> => ({
    // type-coverage:ignore-next-line - io-ts types use any
    body: jsonFromStringCodec.pipe(body)
  });

  const mergedCodecs =
    codecMaps.body === undefined
      ? mergedParameterCodecs
      : {
          ...mergedParameterCodecs,
          // The body must first be a valid string, then valid JSON then parsed
          // and validated against the codec that is provided in the codec map
          ...decodeBody(codecMaps.body)
        };

  // Turn the root codec definition into an actual codec
  const rootCodec = strict ? t.strict(mergedCodecs) : t.type(mergedCodecs);
  // Make io-ts do the hard work of validating the event object
  const decoded = rootCodec.decode({
    ...defaultEvent,
    ...removeEmpty(event)
  }) as t.Validation<ValueMap<EventMap>>;

  if (isLeft(decoded)) {
    // There was an error validating the event
    // This would probably be returned with a 400 status code
    return validationErrorHandler(decoded.left);
  }

  try {
    const result = await handlerFn(decoded.right);

    // Everything went OK and the handler function returned a value
    // This would probably be returned with a 200 status code
    return successHandler(result);
  } catch (e) {
    // An error occurred that was not captured by the handler
    // This would probably be returned with a 500 status code
    return unhandledErrorHandler(e);
  }
};
