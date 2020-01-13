# io-ts-serverless-handler

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

export const getUsers = codecHandler(
  {
    queryParameters: t.partial({
      pageSize: t.number,
      pageNumber: t.number
    }),
    pathParameters: t.type({
      userId: t.string
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

## Roadmap

1. Better documentation
2. Support io-ts/fp-ts 2.x
3. CI/CD
4. Support for serverless handlers for providers other than AWS
