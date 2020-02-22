import { either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { JsonValue } from "type-fest";

/**
 * A codec that takes a JSON string and does two things:
 *   1. Validates that the input is a string
 *   2. Validates that the string represents a valid JSON object
 * Useful to parse a JSON object that can then be passed into a higher order codec
 */
export const jsonFromStringCodec = new t.Type<JsonValue, string, unknown>(
  "JSONFromString",
  (u): u is JsonValue => u !== undefined,
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
