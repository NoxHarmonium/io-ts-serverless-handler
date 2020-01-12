import { APIGatewayProxyEvent } from "aws-lambda";
import * as t from "io-ts";
import { configureWrapper, HandlerFunction } from "..";

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

const codecHandler = configureWrapper({});

describe("when wrapping a standard handler", () => {
  describe("when the payload is valid", () => {
    it("should succeed", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: 4
        },
        body: JSON.stringify({
          message: "hello"
        })
      } as unknown) as APIGatewayProxyEvent;
      const handler = codecHandler(mockSchema, mockHandler);

      const result = await handler(mockEvent);
      console.dir(result);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when the payload is invalid", () => {
    it("should return a bad request", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: 4
        },
        body: 5
      } as unknown) as APIGatewayProxyEvent;
      const handler = codecHandler(mockSchema, mockHandler);

      const result = await handler(mockEvent);
      expect(result.statusCode).toEqual(400);
    });
    it("should list every error", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: "string"
        },
        body: false
      } as unknown) as APIGatewayProxyEvent;
      const handler = codecHandler(mockSchema, mockHandler);

      const result = await handler(mockEvent);
      expect(result).toMatchSnapshot();
    });
  });
});
