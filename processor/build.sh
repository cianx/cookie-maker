#!/usr/bin/env bash

set -e

# rm -rf build
mkdir -p build
cd build

cmake ..
make
bin/cookie-maker-tp tcp://validator:4004

#while true; do
#  inotifywait -qm  -e modify ../cookie-maker-tp.cpp | while read path events file; do
#    sleep 1
#    make
# done