#!/bin/sh

rm -r build/generated/locale-extract

# At this time, tsc throws some errors due to duplicate types. We don't care though, as it emits either way
yarn run i18n:build

find build/generated/locale-extract -type f -print0 | xargs -0 sed -i -r "s/<(\/?)>/<\1React.Fragment>/g"

yarn run i18n:extract
