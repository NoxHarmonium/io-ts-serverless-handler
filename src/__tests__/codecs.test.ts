import { isLeft, isRight } from "fp-ts/lib/Either";
import each from "jest-each";
import { jsonFromStringCodec } from "../codecs";

describe("jsonFromStringCodec", () => {
  describe("when decoding a invalid input", () => {
    each([
      [undefined],
      ["undefined"],
      [null],
      [8],
      [false],
      [""],
      ["dfsjlsf"],
      ['{ "hello": 4 ']
    ]).test("fails when decoding [%p]", input => {
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
      input => {
        expect.assertions(2);

        const result = jsonFromStringCodec.decode(input);
        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
          expect(result.right).toMatchSnapshot();
        }
      }
    );
  });
});
