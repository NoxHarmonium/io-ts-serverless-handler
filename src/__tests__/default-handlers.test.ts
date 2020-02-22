import * as t from "io-ts";
import {
  defaultSuccessHandler,
  defaultUnhandledErrorHandler,
  defaultValidationErrorHandler
} from "../default-handlers";
import { isLeft } from "fp-ts/lib/Either";

// tslint:disable: no-duplicate-string

describe("defaultValidationErrorHandler", () => {
  describe("when handling a validation error", () => {
    const validationError = t.string.decode(4);
    it("should format the output correctly", () => {
      expect.assertions(2);
      expect(isLeft(validationError)).toBe(true);
      if (isLeft(validationError)) {
        expect(
          defaultValidationErrorHandler(validationError.left)
        ).toMatchSnapshot();
      }
    });
  });
});

describe("defaultUnhandledErrorHandler", () => {
  describe("when handling a validation error", () => {
    const unhandledError = new Error("some error");
    it("should format the output correctly", () => {
      expect.assertions(1);
      expect(defaultUnhandledErrorHandler(unhandledError)).toMatchSnapshot();
    });
  });
});

describe("defaultSuccessHandler", () => {
  describe("when handling the handler output", () => {
    it("should format the output correctly", () => {
      expect.assertions(1);
      expect(
        defaultSuccessHandler({
          some: "object"
        })
      ).toMatchSnapshot();
    });
  });
});
