# io-ts-serverless-handler

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

A simple wrapper for [Serverless Framework](https://github.com/serverless/serverless) HTTP handlers
to remove the boilerplate of using [io-ts](https://github.com/gcanti/io-ts) codecs to validate and extract request parameters.

## Usage

Install with npm/yarn:

```bash
$ yarn add io-ts-serverless-handler
# or npm i --save io-ts-serverless-handler
```

Create a file where you configure the wrapper function and export it:

```typescript
// codec-handler.ts

import { configureWrapper } from "io-ts-serverless-handler";

export const codecHandler = configureWrapper({
  // Add optional config here
});
```

Wrap your handler functions with the wrapper function:

```typescript
import { codecHandler } from "./codec-handler.ts";
import { NumberFromString } from "io-ts-types/lib/NumberFromString";

export const getUsers = codecHandler(
  {
    queryParameters: t.partial({
      pageSize: NumberFromString,
      pageNumber: NumberFromString
    }),
    pathParameters: t.type({
      userId: NumberFromString
    })
  },
  async ({
    queryParameters: { pageSize, pageNumber },
    pathParameters: { userId }
  }) => {
    // At this point, all the parameters have been validated by io-ts
    // If a validation error occurred, a 400 would have been returned before this point
    return userService.getUser(userId, pageNumber, pageSize);
  }
);
```

The request body will parsed as JSON and then passed to
your codec.

All the other parameters from API Gateway will come through
as strings so if you want to decode a non-string type you will
have to use a codec that accepts a string, converts it to the type
you want and than validates that.

There are a lot of types in the
[io-ts-types](https://github.com/gcanti/io-ts-types)
library that can do this for you such as `NumberFromString`
or `BooleanFromString`.

## Example Project

There is an example Serverless project that demonstrates this library at:

https://github.com/NoxHarmonium/io-ts-serverless-handler-example

## Roadmap

1. Better documentation
2. CI/CD
3. Support for serverless handlers for providers other than AWS
