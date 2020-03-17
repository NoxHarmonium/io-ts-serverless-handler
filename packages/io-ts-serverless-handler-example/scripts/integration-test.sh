#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

if ! [ -x "$(command -v git)" ]; then
  echo 'Error: git is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v yarn)" ]; then
  echo 'Error: yarn is not installed.' >&2
  exit 1
fi

# Thanks: https://stackoverflow.com/a/246128/1153203
CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
STAGE=$(git rev-parse --short HEAD)-"${GITHUB_RUN_ID:-"0"}"

echo "Checking AWS CLI config..."

aws sts get-caller-identity > /dev/null || {
    echo "Could not get caller identity. Ensure you have AWS credentials set up for your environment."  >&2
    echo "See: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html" >&2
    exit 1;
}

cleanup() {
  echo 'Cleaning up!'
  yarn sls remove -s "$STAGE" --verbose
}

pushd "$CURRENT_DIR/.."

trap 'cleanup' ERR

yarn sls deploy -s "$STAGE" --verbose
ENDPOINT=$(yarn sls info -s "$STAGE" --verbose | grep -oP '(?<=ServiceEndpoint: ).*')

echo "Endpoint is [${ENDPOINT}]"

curl "$ENDPOINT"/products

cleanup

popd
