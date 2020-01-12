import { APIGatewayProxyEvent } from "aws-lambda";
import * as t from "io-ts";
import { configureWrapper, HandlerFunction } from "..";

// tslint:disable: no-duplicate-string no-identical-functions

const codecHandler = configureWrapper({});

describe("when wrapping a standard handler", () => {
  describe("when the codec definition has a body", () => {
    const mockSchema = {
      queryStringParameters: {
        pageSize: t.number
      },
      body: t.type({
        message: t.string
      })
    };
    const mockHandler: HandlerFunction<typeof mockSchema, unknown> = async ({
      queryStringParameters: { pageSize },
      body
    }) => ({
      pageSize: pageSize + 2,
      body
    });
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
  describe("when the codec definition has optional parameters", () => {
    const handler = codecHandler(
      {
        queryStringParameters: {
          pageNumber: t.number,
          pageSize: t.union([t.undefined, t.number])
        }
      },
      async ({ queryStringParameters: { pageNumber, pageSize } }) => ({
        hello: "there",
        params: {
          pageNumber,
          pageSize
        }
      })
    );
    describe("when the optional parameter isn't supplied", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: 4
        }
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
    describe("when the optional parameter is supplied", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: 4,
          pageSize: 9
        }
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
  });
});
