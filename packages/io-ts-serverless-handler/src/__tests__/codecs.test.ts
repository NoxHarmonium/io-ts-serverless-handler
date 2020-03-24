import { isLeft, isRight } from "fp-ts/lib/Either";
import each from "jest-each";
import { JsonValue } from "type-fest";
import { jsonFromStringCodec } from "../codecs";
import { jsonParser } from "../parsers";

jest.mock("../parsers");

describe("jsonFromStringCodec", () => {
  beforeEach(() => {
    // Regular implementation
    ((jsonParser.parse as unknown) as jest.Mock).mockImplementation(JSON.parse);
  });

  describe("when decoding a invalid input", () => {
    each([
      [undefined],
      ["undefined"],
      [null],
      [8],
      [false],
      [""],
      ["dfsjlsf"],
      ['{ "hello": 4 '],
    ]).test("fails when decoding [%p]", (input: unknown) => {
      expect.assertions(2);
      const result = jsonFromStringCodec.decode(input);
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toMatchSnapshot();
      }
    });
  });
  describe("when decoding a valid input", () => {
    each([["null"], ["8"], ["false"], ['{ "hello": 4 }']]).test(
      "succeeds when decoding [%p]",
      (input: unknown) => {
        expect.assertions(2);

        const result = jsonFromStringCodec.decode(input);
        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
          expect(result.right).toMatchSnapshot();
        }
      }
    );
  });
  describe("when encoding a JsonValue", () => {
    each([[null], [8], [false], [{ hello: 4 }]]).test(
      "succeeds when encoding [%p]",
      (input: JsonValue) => {
        expect.assertions(2);

        const isJsonValue = jsonFromStringCodec.is(jsonFromStringCodec);
        expect(isJsonValue).toBe(true);
        const result = jsonFromStringCodec.encode(input);
        expect(result).toMatchSnapshot();
      }
    );
  });
  describe("when an error that does not inherit from the Error object is thrown", () => {
    it("should propagate it and not crash", () => {
      expect.assertions(2);

      ((jsonParser.parse as unknown) as jest.Mock).mockImplementation(() => {
        // tslint:disable-next-line: no-string-throw
        throw "something that is not an Error object";
      });

      const result = jsonFromStringCodec.decode("*DFHDF7890");
      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toMatchSnapshot();
      }
    });
  });
});
