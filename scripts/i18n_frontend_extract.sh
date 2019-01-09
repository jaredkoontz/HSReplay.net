#!/bin/sh

rm -r build/generated/locale-extract

# At this time, tsc throws some errors due to duplicate types. We don't care though, as it emits either way
yarn run i18n:build
yarn run i18n:extract
