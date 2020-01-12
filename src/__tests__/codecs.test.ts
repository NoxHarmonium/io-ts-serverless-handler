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
      const result = jsonFromStringCodec.decode(input);
      expect(result.isLeft()).toBe(true);
      expect(result.value).toMatchSnapshot();
    });
  });
  describe("when decoding a valid input", () => {
    each([["null"], ["8"], ["false"], ['{ "hello": 4 }']]).test(
      "succeeds when decoding [%p]",
      input => {
        const result = jsonFromStringCodec.decode(input);
        expect(result.isRight()).toBe(true);
        expect(result.value).toMatchSnapshot();
      }
    );
  });
});
