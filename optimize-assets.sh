#!/bin/bash

echo "Starting asset optimization..."

cd /var/www/laos-logistics

echo "1. Minifying CSS files..."
find . -name "*.css" -type f ! -path "./node_modules/*" -exec sh -c 'cssmin < {} > {}.min && mv {}.min {}' \;

echo "2. Minifying JS files..."
find . -name "*.js" -type f ! -path "./node_modules/*" -exec sh -c 'terser {} -o {}.min && mv {}.min {}' \;

echo "3. Optimizing images..."
find . -name "*.jpg" -o -name "*.jpeg" | while read img; do
    jpegoptim --strip-all "$img"
done

find . -name "*.png" | while read img; do
    optipng -o7 "$img"
done

find . -name "*.svg" | while read img; do
    svgo "$img"
done

echo "Asset optimization completed!"
