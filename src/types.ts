import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as t from "io-ts";

/**
 * Utility function that will filter out T if it doesn't extend from U
 */
type Filter<T, U> = T extends U ? T : never;

/**
 * The parts of APIGatewayProxyEvent that we want to validate
 */
export type ExtractableParameters = Pick<
  APIGatewayProxyEvent,
  // tslint:disable-next-line: max-union-size
  | "headers"
  | "multiValueHeaders"
  | "pathParameters"
  | "queryStringParameters"
  | "multiValueQueryStringParameters"
  | "stageVariables"
>;

/**
 * A map of codecs
 */
export type CodecMapBase = {
  readonly [name: string]: t.Any;
};

/**
 * Defines how to validate the properties in a handler event
 */
export type EventMapBase = Partial<
  {
    readonly [p in keyof ExtractableParameters]: CodecMapBase;
  } & {
    readonly body: t.Any;
  }
>;

/*
 * Takes a type that extends CodecMapBase and converts it
 * to a type that represents the type that io-ts will decode to
 */
export type TransformCodecToValue<CodecMap extends CodecMapBase> = {
  [k in keyof CodecMap]: t.TypeOf<CodecMap[k]>;
};

/**
 * Takes an EventMap and converts it to the type that represents
 * the type that io-ts will decode it to
 */
export type ValueMap<EventMap extends EventMapBase> = {
  readonly [p in keyof EventMap]: TransformCodecToValue<
    Filter<EventMap[p], CodecMapBase>
  >;
};

/**
 * The type of function that handled the decoded event properties
 * and returns a value that will be transformed and sent back to the client
 */
export type HandlerFunction<EventMap extends EventMapBase, ReturnType> = (
  values: ValueMap<EventMap>
) => Promise<ReturnType>;

/**
 * Takes the error output of a io-ts decode function and transforms it to
 * the output that is required by API gateway
 */
export type ValidationErrorHandler = (
  errors: t.Errors
) => APIGatewayProxyResult;
/**
 * Takes an unhandled error thrown by a handler and transforms it the output
 * that is required by API gateway
 */
export type UnhandledErrorHandler = (error: unknown) => APIGatewayProxyResult;
/**
 * Takes the response of a handler and transforms it to the output that is
 * required by API gateway
 */
export type SuccessHandler = <ResultType>(
  result: ResultType
) => APIGatewayProxyResult;

/**
 * Represents a generic JSON object that is part of a JSONValue
 */
export type JSONObject = { readonly [key: string]: JSONValue };
/**
 * Represents a generic JSON array which is part of a JSONValue
 */
export interface JSONArray extends Array<JSONValue> {}
/**
 * Represents a generic JSON value that is parsed from a JSON string
 */
export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONArray
  | JSONObject;

/**
 * Represents the set of config that is required to set up the handler wrapper
 */
export type HandlerConfig = {
  readonly validationErrorHandler?: ValidationErrorHandler;
  readonly unhandledErrorHandler?: UnhandledErrorHandler;
  readonly successHandler?: SuccessHandler;
  readonly strict?: boolean;
};
