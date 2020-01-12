import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as t from "io-ts";
import { jsonFromStringCodec } from "./codecs";
import {
  defaultSuccessHandler,
  defaultUnhandledErrorHandler,
  defaultValidationErrorHandler
} from "./default-handlers";
import {
  CodecMapBase,
  EventMapBase,
  HandlerConfig,
  HandlerFunction,
  ValueMap
} from "./types";

const defaultConfig: Required<HandlerConfig> = {
  validationErrorHandler: defaultValidationErrorHandler,
  unhandledErrorHandler: defaultUnhandledErrorHandler,
  successHandler: defaultSuccessHandler,
  strict: false
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

  const keys = Object.keys(codecMaps) as ReadonlyArray<keyof EventMap>;

  // Filter out any keys that are not provided and merge all the codecs into
  // a root codec definition that can decode the lambda event
  const mergedParameterCodecs = keys
    .filter(key => key !== "body" && codecMaps[key] !== undefined)
    .reduce((prev, key) => {
      // TODO: Work out why this needs to be force casted
      const subMap = (codecMaps[key] as unknown) as CodecMapBase;
      return { ...prev, [key]: strict ? t.strict(subMap) : t.type(subMap) };
    }, {});

  const mergedCodecs =
    codecMaps.body === undefined
      ? mergedParameterCodecs
      : {
          ...mergedParameterCodecs,
          // The body must first be a valid string, then valid JSON then parsed
          // and validated against the codec that is provided in the codec map
          body: jsonFromStringCodec.pipe(codecMaps.body)
        };

  // Turn the root codec definition into an actual codec
  const rootCodec = strict ? t.strict(mergedCodecs) : t.type(mergedCodecs);
  // Make io-ts do the hard work of validating the event object
  const decoded = rootCodec.decode(event) as t.Validation<ValueMap<EventMap>>;

  if (decoded.isLeft()) {
    // There was an error validating the event
    // This would probably be returned with a 400 status code
    return validationErrorHandler(decoded.value);
  }

  try {
    const result = await handlerFn(decoded.value);

    // Everything went OK and the handler function returned a value
    // This would probably be returned with a 200 status code
    return successHandler(result);
  } catch (e) {
    // An error occurred that was not captured by the handler
    // This would probably be returned with a 500 status code
    return unhandledErrorHandler(e);
  }
};

export * from "./types";
