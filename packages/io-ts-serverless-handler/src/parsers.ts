import { JsonValue } from "type-fest";
import { Parser } from ".";

/**
 * A simple JSON parser.
 *
 * Defined here so it can be overriden for tests,
 * and possibly made pluggable in the future to support
 * different parsers.
 */
export const jsonParser: Parser<JsonValue> = {
  parse: JSON.parse,
};
