#! /bin/bash

echo '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
echo '<sphinx:docset>'
cat /etc/sphinxsearch/sal-schema.xml
find /var/data/existdb/data/export -type f -name "*.snippet.xml" -print0 | \
    xargs -0 -n 100 cat
echo '</sphinx:docset>'
