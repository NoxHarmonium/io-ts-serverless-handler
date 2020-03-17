import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as t from "io-ts";

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
  | "body"
>;

/**
 * The most general case of codec that can be assigned to an event map
 */
export type BaseCodecType = t.HasProps;

/**
 * Defines how to validate the properties in a handler event
 */
export type EventMapBase = Partial<
  {
    readonly // tslint:disable-next-line: no-any
    [p in keyof ExtractableParameters]: BaseCodecType;
  }
>;

/**
 * Takes an EventMap and converts it to the type that represents
 * the type that io-ts will decode it to
 */
export type ValueMap<EventMap extends EventMapBase> = {
  readonly [p in keyof EventMap]: t.TypeOf<
    // tslint:disable-next-line: no-any
    Extract<EventMap[p], BaseCodecType>
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
 * Represents the set of config that is required to set up the handler wrapper
 */
export type HandlerConfig = {
  readonly validationErrorHandler?: ValidationErrorHandler;
  readonly unhandledErrorHandler?: UnhandledErrorHandler;
  readonly successHandler?: SuccessHandler;
  readonly strict?: boolean;
};

/**
 * A parser function takes a string, and parses it to an object.
 */
export type Parser<O = unknown> = {
  readonly parse: (input: string) => O;
};