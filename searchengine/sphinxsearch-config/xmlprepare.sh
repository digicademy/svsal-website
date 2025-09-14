#! /bin/bash

chgrp -R podman /var/data/existdb/data/export
chmod -R g+w    /var/data/existdb/data/export

find /var/data/existdb/data/export -type f -name "*.snippet.xml" -print0 | \
    xargs -0 -n 100 -P 6 sed -i 's| xmlns:sphinx="https://www.salamanca.school/xquery/sphinx"||g' >/dev/null 2>&1

