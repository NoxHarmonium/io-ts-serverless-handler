import { removeEmpty } from "../utils";

describe("removeEmpty", () => {
  describe("when filtering an object with null values", () => {
    const testObj = {
      a: null,
      b: undefined,
      c: "string",
      d: 0,
      e: false,
      f: {},
    };
    it("should filter out keys with null values", () => {
      expect(removeEmpty(testObj)).toEqual({
        c: "string",
        d: 0,
        e: false,
        f: {},
      });
    });
  });
  describe("when filtering an object without null values", () => {
    const testObj = {
      c: "string",
      d: 0,
      e: false,
      f: {},
    };
    it("should leave the payload untouched", () => {
      expect(removeEmpty(testObj)).toEqual(testObj);
    });
  });
});
