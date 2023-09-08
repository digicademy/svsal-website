# Website for the project "The School of Salamanca"

Code for the [salamanca.school](https://{{$domain}}/) website (beyond XQuery). HTML/JS/CSS, templating, routing, config etc.

This is the development version (see [test.salamanca.school](https://test.salamanca.school/)). Our current approach here is to create static data with XQuery/in exist-db as much as possible and then keep XQuery/exist-db out of the actual shipping of the data. Thus, most of the processing is done clientside in javascript and in the caddy webserver, which provides us with fast routing, content negotiation, and templating ... and some other good stuff like automatic https, HTTP3 etc.

This repository contains:
- the actual [html, css, javascript and similar files and assets](./site) that are being shipped (assumed to be in `/var/data/caddy/site` on the server)
- the configuration files for our webserver [caddy](./webserver/README.md)
- the configuration files for our search engine [open-sphinxsearch](./searchengine/README.md)
- the main setup of our [exist-db](./existdb/README.md) instance

The more security-sensitive aspects of the setup, like user management and firewall rules, are not contained here.

Keep in mind that this development version also presupposes the corresponding development branch [refactoring/2022](https://github.com/digicademy/svsal/tree/refactoring/2022) of the svsal existdb XQuery webapp for creating and exporting the derived data files in a good format and to a good place on the filesystem.

This software is licensed under the [MIT license](LICENSE).
