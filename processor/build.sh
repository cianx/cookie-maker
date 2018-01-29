#!/usr/bin/env bash

set -e

mkdir -p build
cd build
cmake ..
make
bin/cookie-maker-tp tcp://validator:4004
