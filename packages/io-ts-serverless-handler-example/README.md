# io-ts-serverless-handler-example
A project to demonstrate how [io-ts-serverless-handler](https://github.com/NoxHarmonium/io-ts-serverless-handler) works

# Running

Simply run:

```bash
$ yarn install
$ yarn start
```

Some example test requests are:

```bash
# Get a list of products
$ curl localhost:3000/products/
# Get a list of products with filters
$ curl localhost:3000/products/?pageNumber=2&pageSize=2
# Get the product with ID 0
$ curl localhost:3000/products/0
```

## Roadmap

1. An example of body validation (POSTing new products)
2. CI/CD
3. Examine some existing serverless projects for patterns and try then out here
