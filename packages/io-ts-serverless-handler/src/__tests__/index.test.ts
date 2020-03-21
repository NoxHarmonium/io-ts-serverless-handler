import { APIGatewayProxyEvent, Context } from "aws-lambda";
import * as t from "io-ts";
import { NumberFromString } from "io-ts-types/lib/NumberFromString";
import { BooleanFromString } from "io-ts-types/lib/BooleanFromString";
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString";
import { configureWrapper, HandlerFunction } from "..";
import { jsonFromStringCodec } from "../codecs";

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "mockFunction",
  functionVersion: "2",
  invokedFunctionArn:
    "arn:aws:lambda:ap-southeast-2:1234456776:function:${FunctionName}",
  memoryLimitInMB: "1024",
  awsRequestId: "mock ID",
  logGroupName: "group name",
  logStreamName: "stream name",
  identity: {
    cognitoIdentityId: "mock-identity-id",
    cognitoIdentityPoolId: "mock-identity-pool-id"
  },
  clientContext: {
    client: {
      installationId: "string",
      appTitle: "string",
      appVersionName: "string",
      appVersionCode: "string",
      appPackageName: "string"
    },
    Custom: "some custom",
    env: {
      platformVersion: "string",
      platform: "string",
      make: "string",
      model: "string",
      locale: "string"
    }
  },
  getRemainingTimeInMillis: () => 60000,

  // tslint:disable: no-empty no-any
  done: (_?: Error, _result?: unknown) => {},
  fail: (_error: Error | string): void => {},
  // type-coverage:ignore-next-line
  succeed: (_messageOrObject: any): void => {}
  // tslint:enable: no-empty no-any
};

// tslint:disable: no-duplicate-string no-identical-functions no-big-function
describe("when using default options", () => {
  const codecHandler = configureWrapper({});
  describe("when the codec definition has a body", () => {
    const mockSchema = {
      queryStringParameters: t.type({
        pageSize: NumberFromString
      }),
      body: t.type({
        message: t.string
      })
    };
    const mockHandler: HandlerFunction<typeof mockSchema, unknown> = async (
      { queryStringParameters: { pageSize }, body },
      { awsRequestId }
    ) => ({
      pageSize: pageSize + 2,
      body,
      awsRequestId
    });
    describe("when the payload is valid", () => {
      it("should succeed", async () => {
        const mockEvent = ({
          queryStringParameters: {
            pageSize: "4"
          },
          body: JSON.stringify({
            message: "hello"
          })
        } as unknown) as APIGatewayProxyEvent;
        const handler = codecHandler(mockSchema, mockHandler);

        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
    describe("when the payload is invalid", () => {
      it("should return a bad request", async () => {
        const mockEvent = ({
          queryStringParameters: {
            pageSize: "4"
          },
          body: 5
        } as unknown) as APIGatewayProxyEvent;
        const handler = codecHandler(mockSchema, mockHandler);

        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(400);
      });
      it("should list every error", async () => {
        const mockEvent = ({
          queryStringParameters: {
            pageSize: "not-a-number"
          },
          body: false
        } as unknown) as APIGatewayProxyEvent;
        const handler = codecHandler(mockSchema, mockHandler);

        const result = await handler(mockEvent, mockContext);
        expect(result).toMatchSnapshot();
      });
    });
    describe("when an unhandled error occurs", () => {
      const brokenHandler = codecHandler(
        {
          queryStringParameters: t.type({
            pageNumber: NumberFromString
          })
        },
        // tslint:disable-next-line: no-reject
        async () => Promise.reject(new Error("oops"))
      );
      it("should return an internal server error", async () => {
        const mockEvent = ({
          queryStringParameters: {
            pageNumber: "4"
          }
        } as unknown) as APIGatewayProxyEvent;

        const result = await brokenHandler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(500);
        expect(result.body).toMatchSnapshot();
      });
    });
  });
  describe("when the codec definition has optional parameters", () => {
    const handler = codecHandler(
      {
        queryStringParameters: t.type({
          pageNumber: NumberFromString,
          pageSize: t.union([t.undefined, NumberFromString])
        }),
        headers: t.partial({
          someHeader: NumberFromString
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
          pageNumber: "4"
        }
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
    describe("when the optional parameter is empty", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: "4"
        },
        headers: {}
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
    describe("when the optional parameter is null", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: "4"
        },
        headers: null
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
    describe("when the optional parameter is supplied", () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: "4",
          pageSize: "9"
        },
        headers: {
          someHeader: "6"
        }
      } as unknown) as APIGatewayProxyEvent;
      it("should succeed", async () => {
        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toEqual(200);
        expect(result).toMatchSnapshot();
      });
    });
  });
  describe("when providing extra parameters not defined in the codec", () => {
    const handler = codecHandler(
      {
        queryStringParameters: t.type({
          pageNumber: NumberFromString
        })
      },
      async params => params
    );
    const mockEvent = ({
      queryStringParameters: {
        pageNumber: "4",
        extraParameter: "hello"
      },
      pathParameters: {
        something: "true"
      }
    } as unknown) as APIGatewayProxyEvent;
    it("should  not strip the extra parameters", async () => {
      const result = await handler(mockEvent, mockContext);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when exhaustively specifying all possible properties", () => {
    // Extreemly contrived schema to try and expose corner cases
    const mockSchema = {
      headers: t.intersection([
        t.type({
          requiredHeader: NumberFromString
        }),
        t.partial({
          optionalHeader: t.union([BooleanFromString, t.null])
        })
      ]),
      multiValueHeaders: t.intersection([
        t.type({ requiredMVH: t.array(DateFromISOString) }),
        t.partial({
          optionalMVH: t.union([t.array(t.union([t.string, t.null])), t.null])
        })
      ]),
      pathParameters: t.intersection([
        t.type({
          requiredPathParamA: t.string,
          requiredPathParamB: DateFromISOString
        }),
        t.partial({
          optionalPathParam: NumberFromString
        })
      ]),
      queryStringParameters: t.intersection([
        t.type({
          requiredQueryStringA: t.string,
          requiredQueryStringB: jsonFromStringCodec.pipe(t.array(t.number))
        }),
        t.partial({
          optionalQueryString: t.union([t.string, t.null])
        })
      ]),
      multiValueQueryStringParameters: t.intersection([
        t.type({
          requiredMVQueryString: t.array(BooleanFromString)
        }),
        t.partial({
          optionalMVQueryString: t.union([t.array(jsonFromStringCodec), t.null])
        })
      ]),
      stageVariables: t.intersection([
        t.type({
          requiredStageVariable: t.string
        }),
        t.partial({
          optionalStageVariable: t.union([jsonFromStringCodec, t.null])
        })
      ]),
      body: t.type({
        some: t.string
      })
    };
    const mockHandler = codecHandler(
      mockSchema,
      async (
        {
          headers: { requiredHeader, optionalHeader },
          multiValueHeaders: { requiredMVH, optionalMVH },
          pathParameters: {
            requiredPathParamA,
            requiredPathParamB,
            optionalPathParam
          },
          queryStringParameters: {
            requiredQueryStringA,
            requiredQueryStringB,
            optionalQueryString
          },
          multiValueQueryStringParameters: {
            requiredMVQueryString,
            optionalMVQueryString
          },
          stageVariables: { requiredStageVariable, optionalStageVariable },
          body
        },
        { awsRequestId }
      ) => ({
        requiredHeader,
        optionalHeader,
        requiredMVH,
        optionalMVH,
        requiredPathParamA,
        requiredPathParamB,
        optionalPathParam,
        requiredQueryStringA,
        requiredQueryStringB,
        optionalQueryString,
        requiredMVQueryString,
        optionalMVQueryString,
        requiredStageVariable,
        optionalStageVariable,
        body,
        awsRequestId
      })
    );

    it("should be able to parse a full payload correctly", async () => {
      const mockEvent = ({
        headers: {
          requiredHeader: "123",
          optionalHeader: "false"
        },
        multiValueHeaders: {
          requiredMVH: [
            new Date(0).toISOString(),
            new Date(100000).toUTCString()
          ],
          optionalMVH: ["abc", null, "def", null, null]
        },
        pathParameters: {
          requiredPathParamA: "string",
          requiredPathParamB: new Date(999999).toISOString(),
          optionalPathParam: "321.123"
        },
        queryStringParameters: {
          requiredQueryStringA: "abc",
          requiredQueryStringB: JSON.stringify([1, 2, 3]),
          optionalQueryString: "123abc"
        },
        multiValueQueryStringParameters: {
          requiredMVQueryString: ["true", "false", "true"],
          optionalMVQueryString: [
            JSON.stringify({ a: true }),
            JSON.stringify(false)
          ]
        },
        stageVariables: {
          requiredStageVariable: "asdf",
          optionalStageVariable: JSON.stringify({ a: { b: { c: 4 } } })
        },
        body: JSON.stringify({
          some: "string"
        })
      } as unknown) as Required<APIGatewayProxyEvent>;
      const response = await mockHandler(mockEvent, mockContext);
      expect(response).toMatchSnapshot();
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
        pageNumber: NumberFromString
      })
    },
    async (params, context) => ({
      params,
      context
    })
  );
  describe("when providing the exact required input", () => {
    const mockEvent = ({
      queryStringParameters: {
        pageNumber: "4"
      }
    } as unknown) as APIGatewayProxyEvent;
    it("should succeed", async () => {
      const result = await strictHandler(mockEvent, mockContext);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when providing extra parameters not defined in the codec", () => {
    const mockEvent = ({
      queryStringParameters: {
        pageNumber: "4",
        extraParameter: "hello"
      },
      pathParameters: {
        something: "true"
      }
    } as unknown) as APIGatewayProxyEvent;
    it("should strip the extra parameters", async () => {
      const result = await strictHandler(mockEvent, mockContext);
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
        pageNumber: NumberFromString
      })
    },
    async ({ queryStringParameters: { pageNumber } }, { awsRequestId }) => ({
      hello: "there",
      params: {
        pageNumber
      },
      awsRequestId
    })
  );
  describe("when the payload is valid", () => {
    it("should succeed", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: "4"
        },
        body: JSON.stringify({
          message: "hello"
        })
      } as unknown) as APIGatewayProxyEvent;

      const result = await handler(mockEvent, mockContext);
      expect(result.statusCode).toEqual(200);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when the payload is invalid", () => {
    it("should return a bad request", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: "4"
        },
        body: 5
      } as unknown) as APIGatewayProxyEvent;

      const result = await handler(mockEvent, mockContext);
      expect(result.statusCode).toEqual(400);
    });
    it("should list every error", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageSize: "string"
        },
        body: false
      } as unknown) as APIGatewayProxyEvent;

      const result = await handler(mockEvent, mockContext);
      expect(result).toMatchSnapshot();
    });
  });
  describe("when an unhandled error occurs", () => {
    const brokenHandler = customCodecHandler(
      {
        queryStringParameters: t.type({
          pageNumber: NumberFromString
        })
      },
      // tslint:disable-next-line: no-reject
      async () => Promise.reject(new Error("oops"))
    );
    it("should return a internal server error", async () => {
      const mockEvent = ({
        queryStringParameters: {
          pageNumber: "4"
        }
      } as unknown) as APIGatewayProxyEvent;

      const result = await brokenHandler(mockEvent, mockContext);
      expect(result.statusCode).toEqual(500);
      expect(result.body).toMatchSnapshot();
    });
  });
});
