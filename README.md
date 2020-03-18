# io-ts-serverless-handler

![npm](https://img.shields.io/npm/v/io-ts-serverless-handler)
![Node.js CI](https://github.com/NoxHarmonium/io-ts-serverless-handler/workflows/Node.js%20CI/badge.svg)
[![codecov](https://codecov.io/gh/NoxHarmonium/io-ts-serverless-handler/branch/master/graph/badge.svg)](https://codecov.io/gh/NoxHarmonium/io-ts-serverless-handler)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2FNoxHarmonium%2Fio-ts-serverless-handler%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
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

There is a sample Serverless project provided in this repo in the [packages/example](package/example) directory.

### Running locally

You can run it locally:

```bash
cd packages/example
yarn start
```

and make some requests to it:

```bash
# Get a list of products
$ curl localhost:3000/products/
# Get a list of products with filters
$ curl localhost:3000/products/?pageNumber=2&pageSize=2
# Get the product with ID 0
$ curl localhost:3000/products/0
```

### Deploying to AWS

You can also deploy the example project to an AWS environment:

```bash
cd packages/example
yarn sls deploy -s my-stage --verbose
```

After deployment, the URL of the API endpoint will be logged
and you can use it to make requests as outlined above.
For example:

```bash
# Get a list of products
$ curl https://dlda9fab1c.execute-api.us-east-1.amazonaws.com/my-stage/products/
# Get a list of products with filters
$ curl https://dlda9fab1c.execute-api.us-east-1.amazonaws.com/my-stage/products/?pageNumber=2&pageSize=2
# Get the product with ID 0
$ curl https://dlda9fab1c.execute-api.us-east-1.amazonaws.com/my-stage/products/0
```

### Automated Integration Test

There is also a script which will deploy the example project to AWS,
run some tests against it,
and then tear it down again.

It is run by the CI pipeline automatically,
but you can run it locally:

```bash
cd packages/example
yarn integration-test
```

## Development

### Project Structure

This project uses [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)
to separate the core package and the example project.

To install the dependencies for all the packages,
you run yarn install at the root of the project,
and yarn will resolve all the inter-package dependencies.

```bash
$ yarn install
```

After the dependencies are resolved,
you can work in each project individually.

You can also run commands across every project simultaniously.
For example, to test every package, run the following:

```bash
yarn workspaces run test
```

### Releases

This project uses [semantic-release](https://github.com/semantic-release/semantic-release)
to automatically deploy to NPM when needed
after changes are merged to the master branch.

Commit messages must be formatted using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).
This allows semantic-release to determine how to increment versions.

A tool is provided to help write these commits. Simply use `yarn commit` instead of `git commit`
and a wizard will guide you through the commit message writing process.

## Roadmap

1. Extend example project to ensure all AWS API Gateway event types are covered
2. Support for serverless handlers for providers other than AWS
