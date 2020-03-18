import { left } from "fp-ts/lib/Either";
import { PathReporter } from "io-ts/lib/PathReporter";
import {
  SuccessHandler,
  UnhandledErrorHandler,
  ValidationErrorHandler
} from "./types";

/**
 * Uses the built in io-ts reporter to explain validation errors
 */
export const defaultValidationErrorHandler: ValidationErrorHandler = e => ({
  statusCode: 400,
  body: JSON.stringify({
    error: PathReporter.report(left(e)).join(", ")
  })
});

/**
 * Simply stringifies unhandled errors
 */
export const defaultUnhandledErrorHandler: UnhandledErrorHandler = e => ({
  statusCode: 500,
  body: JSON.stringify({
    error: `Unhandled error: ${JSON.stringify(e)}`
  })
});

/**
 * Simply stringifies the return of the handler function
 */
export const defaultSuccessHandler: SuccessHandler = e => ({
  statusCode: 200,
  body: JSON.stringify(e)
});
