# Web server for the project "The School of Salamanca"

We are using the [caddy](https://caddyserver.com/) web server for hosting our website at <https://test.salamanca.school>. It listens to various subdomain names such as <https://api.test.salamanca.school/>, <https://id.test.salamanca.school/>, <https://search.test.salamanca.school/>, and behaves differently depending on which subdomain an incoming request was addressed at.

Besides core features such as [serving files from the filesystem](https://caddyserver.com/docs/caddyfile/directives/file_server) and [reverse proxying](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), and general advantages such as easy configuration (with sensible defaults), [automatic https encryption and certificate handling](https://caddyserver.com/docs/automatic-https), good performance and [plug-in architecture](https://caddyserver.com/docs/modules/), our site is drawing on these things in particular:

- [templating](https://caddyserver.com/docs/caddyfile/directives/templates)
- [maps for routing](https://caddyserver.com/docs/caddyfile/directives/map)
- [PHP FastCGI interface](https://caddyserver.com/docs/caddyfile/directives/php_fastcgi)
- [RESTful API management](https://caddyserver.com/docs/api)
- our own [connection negotiation plugin](https://caddyserver.com/docs/modules/http.matchers.conneg)

This is the development version. For the stable release, visit the Apache-/existdb-hosted <https://salamanca.school/>.

## Setup

### Get existdb

eXist-db is presupposed as the software creating all the webdata files and putting them somewhere for the webserver to find them. If you have podman installed you can use the [systemd service description file](../existdb/existdb-container.service) available in this repository, drop it in `/etc/systemd/system` and enable/launch it with `sudo systemctl enable existdb-container ; sudo systemctl start existdb-container`. It will then use podman to:
- run exist-db in a containerized environment
- expose existdb's `data/export` folder as the host's `/var/data/existdb/data/export` folder

Then, you only need to install the development branch [refactoring/2022](https://github.com/digicademy/svsal/tree/refactoring/2022) of the svsal app in existdb.

### Get caddy executable

Download the caddy executable from the [download page](https://caddyserver.com/download) - don't forget to add the `mpilhlt/caddy-conneg` plugin -, and save it to `/usr/local/bin/caddy` on your server.

### Prepare folders

Create a folder `/var/data/caddy` on your server.
Copy the `site` folder of this repository to `/var/data/caddy/site`.

```sh
# symlink /var/data/caddy/site/data to /var/data/existdb/data/export
sudo ln -s /var/data/existdb/data/export /var/data/caddy/site/data
# Change ownership so that both existdb and caddy can write to the data folder
sudo chown -R existdb:podman             /var/data/caddy/site/data
sudo chmod -R g+w                        /var/data/caddy/site/data
```

### Systemd Service Definition File

Our caddy server is managed as a systemd service. You can also find the service definition file at [caddy.service](./caddy.service).
For the `ExecStart` value, you can choose to automatically resume with the last running configuration or start with the [caddy_config.json](./caddy_config.json) file. In the latter case, you will have to re-populate the routing map after restart. For this, see [below]().

```systemd
; ExecStart=/usr/local/bin/caddy run --config /etc/caddy/caddy_config.json --resume
ExecStart=/usr/local/bin/caddy run --config /etc/caddy/caddy_config.json
```

### Caddy Configuration

Configuration is somewhat complex in our case as we are providing different configurations for the different subdomains. The simplest case is when a requested resource can be shipped from the filesystem, this is achieved by the

```caddy
	root * /var/data/caddy/site
	file_server
```

directive. As you can see in the [site folder](../site) of this repository, this contains html files and other assets. Most of the actual data is accessed via a symbolic link from the `site/data` subfolder to the `/var/data/existdb/data/export` folder.

However, this is made more complex by our ambition to provide persistent identifiers for the texts and text passages, and to have these identifiers resolve to different representations of the respective text (passage) via content negotiation or `format` query parameter as documented in this [blogpost](https://blog.salamanca.school/de/2016/11/15/whats-in-a-uri-part-1/) from 2016.

(In the following section, the routing process is described in more detail. If you want to follow along in the actual configuration, you may want to have a look at the [sample Caddyfile](./Caddyfile.dontusethis). Note however, that, for reasons described below, this is not what we are actually using! What we did was loading this configuration and exporting it in caddy's native JSON format, and then tweaking this by hand: most importantly, inserting the `"@id": "routing_map"` identifier to the matcher handle so that we can easier update the routing map via API calls. The result was the [caddy_config.json](./caddy_config.json) file that we are using to configure the initial caddy launch. But in order to understand the routing, it's probably better to have a look at the Caddyfile first.)

#### Routing

So let's assume a request for an "id url" as we recommend our files to be referenced, say a request for <https://id.test.salamanca.school/texts/W0034:8>, comes in...

1. The subdomain specified in the request (`id.test.salamanca.school`) tells caddy to proceed with the directives in the respective section
2. tbc ...

#### Interacting with the (Routing) Configuration

Normally our admin interface in existdb takes care of adding routes when new works are rendered, and restarting caddy should reload the last running configuration so that no information is lost. However, we have compiled a couple of commands and scripts to manually read and write the (routing) configuration via caddy's API. Most of them presuppose that [curl](https://curl.se/) and [jq](https://stedolan.github.io/jq/) are available on your host.

You can use the [buildroutes.sh](./buildroutes.sh) script to collate all the routing information that existdb has written to the data subfolders *for all the individual works* into one big routing table in `/var/data/caddy/site/data/combined_routes.json`. Then, you can use the [postroutes.sh](./postroutes.sh) script to load this file into caddy's `routing_map` map. (Maybe check that there are no duplicates with leftovers from the map before the loading. See below.)

The script [example_commands.sh](./example_commands.sh) is not meant to be run directly, it is just a collection of these useful commands (listed here as well for convenience):

```sh
# load config
curl -X POST "http://localhost:2019/load" \
	-H "Content-Type: application/json" \
	-d @caddy_config.json

# remove routing information
curl -X DELETE \
	"http://localhost:2019/id/routing_map/mappings"

# add routing information of a single work
curl -X POST \
	-H "Content-Type: application/json" \
	-d @/var/data/caddy/site/data/W0095/W0095_routes.json \
	"http://localhost:2019/id/routing_map/mappings/..."

# see config
curl -X GET \
        "http://localhost:2019/config/apps/http/servers" | jq | less

# see first 10 mappings results:
curl -X GET \
	"http://localhost:2019/id/routing_map/mappings" | jq '.[0:10]'

# see mappings that satisfy some criterion:
curl -X GET \
        "http://localhost:2019/id/routing_map/mappings" | jq '.[] | select (.input == "/texts/W0018")'

# build a single json file with routing information from existdb exports (also buildroutes.sh):
jq -n 'reduce inputs as $in (null;
   . + if $in|type == "array" then $in else [$in] end)
' $(find /var/data/caddy/site/data -name '*_routes.json') > /var/data/caddy/site/data/combined_routes.json

# post routing information from single file (also postroutes.sh):
curl -X POST \
	-H "Content-Type: application/json" \
	-d @/var/data/caddy/site/data/combined_routes.json \
	"http://localhost:2019/id/routing_map/mappings"
```

*(Yes, the last two are the contents of the two scripts mentioned before.)*
