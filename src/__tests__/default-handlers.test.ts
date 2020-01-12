import * as t from "io-ts";
import {
  defaultSuccessHandler,
  defaultUnhandledErrorHandler,
  defaultValidationErrorHandler
} from "../default-handlers";

// tslint:disable: no-duplicate-string

describe("defaultValidationErrorHandler", () => {
  describe("when handling a validation error", () => {
    const validationError = t.string.decode(4);
    it("should format the output correctly", () => {
      expect.assertions(2);
      expect(validationError.isLeft()).toBe(true);
      if (validationError.isLeft()) {
        expect(
          defaultValidationErrorHandler(validationError.value)
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
