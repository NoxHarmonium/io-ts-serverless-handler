# io-ts-serverless-handler

![npm](https://img.shields.io/npm/v/io-ts-serverless-handler)
![Node.js CI](https://github.com/NoxHarmonium/io-ts-serverless-handler/workflows/Node.js%20CI/badge.svg)
[![Codechecks](https://raw.githubusercontent.com/codechecks/docs/master/images/badges/badge-default.svg?sanitize=true)](https://codechecks.io)
[![codecov](https://codecov.io/gh/NoxHarmonium/io-ts-serverless-handler/branch/master/graph/badge.svg)](https://codecov.io/gh/NoxHarmonium/io-ts-serverless-handler)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fplantain-00%2Ftype-coverage%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
![licence](https://img.shields.io/npm/l/io-ts-serverless-handler)
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

There is a sample Serverless project provided in this repo in the `example` directory.

You can try it out yourself:

```bash
cd example
yarn install
yarn sls deploy -s my-stage --verbose
```

## Roadmap

1. Better documentation
2. CI/CD
3. Support for serverless handlers for providers other than AWS
