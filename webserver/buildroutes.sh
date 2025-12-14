#!/bin/sh

jq -n 'reduce inputs as $in (null;
   . + if $in|type == "array" then $in else [$in] end)
' $(find -L /var/data/caddy/site/data -name '*_routes.json') | jq 'sort_by(.input)' > /var/data/caddy/site/data/combined_routes.json
