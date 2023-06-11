#! /bin/bash

find /var/data/existdb/data/export -type f -name "*.snippet.xml" -exec sed -i 's| xmlns:sphinx="https://www.salamanca.school/xquery/sphinx"||g' {} +  >/dev/null 2>&1

echo '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
# curl --insecure --silent https://test.salamanca.school:8443/exist/apps/salamanca/sphinx-client.xql?mode=load

echo '<sphinx:docset>'
cat /etc/sphinxsearch/sal-schema.xml
# cat -s /var/data/caddy/site/data/**/snippets/*.xml
find /var/data/existdb/data/export -type f -name "*.snippet.xml" -exec cat {} +
echo '</sphinx:docset>'
