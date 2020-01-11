import { APIGatewayProxyEvent } from "aws-lambda";
import * as t from "io-ts";
import { codecHandler, HandlerFunction } from "..";

const mockSchema = {
  queryStringParameters: {
    pageSize: t.number
  },
  body: t.type({
    message: t.string
  })
};

const mockHandler: HandlerFunction<typeof mockSchema> = async ({
  queryStringParameters: { pageSize },
  body
}) => ({
  pageSize: pageSize + 2,
  body
});

describe("when wrapping a standard handler", () => {
  describe("when the payload is valid", () => {
    it("should succeed", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: 4
        },
        body: JSON.stringify({
          message: "hello"
        })
      } as unknown) as APIGatewayProxyEvent;
      const handler = codecHandler(mockSchema, mockHandler);

      const result = handler(mockEvent);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when the payload is invalid", () => {
    it("should throw an error", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: 4
        },
        body: 5
      } as unknown) as APIGatewayProxyEvent;
      const handler = codecHandler(mockSchema, mockHandler);

      expect(() => handler(mockEvent)).toThrowError();
    });
  });
});
