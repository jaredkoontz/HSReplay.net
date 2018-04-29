#!/bin/bash

set -e

if [ "$(uname)" = "Darwin" ]; then
	BASEDIR="$(dirname $(stat -f ${BASH_SOURCE[0]}))/.."
else
	BASEDIR="$(readlink -f $(dirname $0))/.."
fi

STATICDIR="$BASEDIR/hsreplaynet/static/vendor"
FONTSDIR="$BASEDIR/hsreplaynet/static/fonts"

rm -rf "$STATICDIR" "$FONTSDIR"
mkdir -p "$STATICDIR" "$FONTSDIR"


# Bootstrap

VERSION="3.3.7"
PKGNAME="bootstrap-$VERSION-dist"
SOURCE="https://github.com/twbs/bootstrap/releases/download/v$VERSION/$PKGNAME.zip"
OUTDIR="$STATICDIR/bootstrap"
ZIPFILE="$OUTDIR/bootstrap.zip"

mkdir -p "$OUTDIR"
wget --no-verbose "$SOURCE" -O "$ZIPFILE"
unzip "$ZIPFILE" -d "$OUTDIR"
mv "$OUTDIR/$PKGNAME"/{css,js,fonts} "$OUTDIR"
rmdir "$OUTDIR/$PKGNAME"
rm "$ZIPFILE"


# jQuery

PKGNAME="jquery"
VERSION="1.12.4"
SOURCE="https://code.jquery.com/$PKGNAME-$VERSION.min.js"
OUTFILE="$STATICDIR/$PKGNAME.min.js"

wget --no-verbose "$SOURCE" -O "$OUTFILE"


# Raven

PKGNAME="raven"
VERSION="3.24.2"
SOURCE="https://cdn.ravenjs.com/$VERSION/$PKGNAME.min.js"
OUTFILE="$STATICDIR/$PKGNAME.min.js"

wget --no-verbose "$SOURCE" -O "$OUTFILE"


# Hearthstone enums

SOURCE="https://api.hearthstonejson.com/v1/enums.d.ts"
OUTFILE="$STATICDIR/../scripts/src/hearthstone.d.ts"

wget --no-verbose "$SOURCE" -O "$OUTFILE"


# Joust Fonts

FONTS_SOURCE="https://hearthsim.net/static/fonts"

belwe="belwefs_extrabold_macroman/Belwe-ExtraBold-webfont"
franklin="franklingothicfs_mediumcondensed_macroman/franklingothic-medcd-webfont"
for font in $belwe $franklin; do
	dir="$(dirname $font)"
	name="$(basename $font)"
	wget --no-verbose "$FONTS_SOURCE/$dir"/{$name.{eot,svg,ttf,woff,woff2},stylesheet.css} -P "$FONTSDIR/$dir"
done
