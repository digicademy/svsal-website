#!/bin/sh

find /var/data/existdb/data/export -type f -name "*.snippet.xml" -exec sed -i 's| xmlns:sphinx="https://www.salamanca.school/xquery/sphinx"||g' {} +
