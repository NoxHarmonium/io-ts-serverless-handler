import { APIGatewayProxyEvent } from "aws-lambda";
import * as t from "io-ts";
import { configureWrapper, HandlerFunction } from "..";

// tslint:disable: no-duplicate-string no-identical-functions

describe("when using default options", () => {
  const codecHandler = configureWrapper({});
  describe("when the codec definition has a body", () => {
    const mockSchema = {
      queryStringParameters: t.type({
        pageSize: t.number
      }),
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
    describe("when an unhandled error occurs", () => {
      const brokenHandler = codecHandler(
        {
          queryStringParameters: t.type({
            pageNumber: t.number
          })
        },
        // tslint:disable-next-line: no-reject
        async () => Promise.reject(new Error("oops"))
      );
      it("should return an internal server error", async () => {
        const mockEvent = ({
          queryStringParameters: {
            pageNumber: 4
          }
        } as unknown) as APIGatewayProxyEvent;

        const result = await brokenHandler(mockEvent);
        expect(result.statusCode).toEqual(500);
        expect(result.body).toMatchSnapshot();
      });
    });
  });
  describe("when the codec definition has optional parameters", () => {
    const handler = codecHandler(
      {
        queryStringParameters: t.type({
          pageNumber: t.number,
          pageSize: t.union([t.undefined, t.number])
        }),
        headers: t.partial({
          someHeader: t.number
        })
      },
      async ({
        queryStringParameters: { pageNumber, pageSize },
        headers: { someHeader }
      }) => ({
        hello: "there",
        params: {
          pageNumber,
          pageSize,
          someHeader
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
    describe("when the optional parameter is empty", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: 4
        },
        headers: {}
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
        },
        headers: {
          someHeader: 6
        }
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
  });
  describe("when providing extra parameters not defined in the codec", () => {
    const handler = codecHandler(
      {
        queryStringParameters: t.type({
          pageNumber: t.number
        })
      },
      async params => params
    );
    const mockEvent = ({
      queryStringParameters: {
        pageNumber: 4,
        extraParameter: "hello"
      },
      pathParameters: {
        something: true
      }
    } as unknown) as APIGatewayProxyEvent;
    it("should  not strip the extra parameters", async () => {
      const result = await handler(mockEvent);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
});

describe("when using strict mode", () => {
  const strictCodecHandler = configureWrapper({
    strict: true
  });
  const strictHandler = strictCodecHandler(
    {
      queryStringParameters: t.type({
        pageNumber: t.number
      })
    },
    async params => params
  );
  describe("when providing the exact required input", () => {
    const mockEvent = ({
      queryStringParameters: {
        pageNumber: 4
      }
    } as unknown) as APIGatewayProxyEvent;
    it("should succeed", async () => {
      const result = await strictHandler(mockEvent);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when providing extra parameters not defined in the codec", () => {
    const mockEvent = ({
      queryStringParameters: {
        pageNumber: 4,
        extraParameter: "hello"
      },
      pathParameters: {
        something: true
      }
    } as unknown) as APIGatewayProxyEvent;
    it("should strip the extra parameters", async () => {
      const result = await strictHandler(mockEvent);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
});

describe("when providing custom handlers", () => {
  const customCodecHandler = configureWrapper({
    successHandler: result => ({
      statusCode: 200,
      body: JSON.stringify({
        result,
        custom: true
      })
    }),
    unhandledErrorHandler: e => ({
      statusCode: 500,
      body: JSON.stringify({
        oops: JSON.stringify(e),
        custom: true
      })
    }),
    validationErrorHandler: e => ({
      statusCode: 400,
      body: JSON.stringify({
        error: e,
        custom: true
      })
    })
  });
  const handler = customCodecHandler(
    {
      queryStringParameters: t.type({
        pageNumber: t.number
      })
    },
    async ({ queryStringParameters: { pageNumber } }) => ({
      hello: "there",
      params: {
        pageNumber
      }
    })
  );
  describe("when the payload is valid", () => {
    it("should succeed", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: 4
        },
        body: JSON.stringify({
          message: "hello"
        })
      } as unknown) as APIGatewayProxyEvent;

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

      const result = await handler(mockEvent);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when an unhandled error occurs", () => {
    const brokenHandler = customCodecHandler(
      {
        queryStringParameters: t.type({
          pageNumber: t.number
        })
      },
      // tslint:disable-next-line: no-reject
      async () => Promise.reject(new Error("oops"))
    );
    it("should return a internal server error", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: 4
        }
      } as unknown) as APIGatewayProxyEvent;

      const result = await brokenHandler(mockEvent);
      expect(result.statusCode).toEqual(500);
      expect(result.body).toMatchSnapshot();
    });
  });
});

// TODO: Write tests for multi value parameters
