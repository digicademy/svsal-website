# SvSal Search Engine

We are using the [sphinxsearch](http://sphinxsearch.com/) search engine hosted at <https://search.{{$domain}}>. It is accessed via an [OpenSearch API](https://github.com/dewitt/opensearch) (the A9, 2005 one) provided by digicademy's [open-sphinxsearch](https://github.com/digicademy/open-sphinxsearch) php software.

This is the development version which has some changes facilitating client-side processing (see [test.salamanca.school](https://test.salamanca.school/)).

## Sphinxsearch configuration

The subfolder [sphinxsearch-config](./sphinxsearch-config) contains various configuration files for sphinxsearch that we keep in `/etc/sphinxsearch`:

- `*.conf` configuration files:
  - when sphinxsearch starts, it reads [sphinx.conf](./sphinxsearch-config/sphinx.conf), which reads the following two files, in order:
  - [base.conf](./sphinxsearch-config/base.conf) with config for the server (logging, port, etc.) and some settings for the indexer (memory limits)
  - [index-svsal.conf](./sphinxsearch-config/index-svsal.conf), which contains settings for the (raw and lemmatized) indices for the salamanca project (how to feed the indexer, charsets and wordlists)
- `*.txt` wordlists contain stopwords or wordform-lemma associations (like `&ntonç > entonces` or `eglesja > iglesia`). This is what enables the [search form on our webapp](https://www.{{$domain}}/search.html) to respond to different wordforms and historical orthography with all forms of the (hopefully) corresponding lemma.
- `*.sh` shell scripts:
  - [index-all.sh](./sphinxsearch-config/index-all.sh) is called (with `sudo`) when the index needs to be repopulated (e.g. when a new work has been added). It finds all search snippets in `/var/data/existdb/data/export`, manipulates a namespace field and then calls the indexer with `sudo -u sphinxsearch indexer --all --rotate`. It also suppresses warnings (e.g. about duplicate entries in the wordlists that we have to clean when there is some time to spare for this) being printed on the console. Everything is logged though, so no worries.
  - [xmlpipe.sh](./sphinxsearch-config/xmlpipe.sh) is called from sphinxsearch indexer (as it is configured as providing the data source for the salamanca indices in `index-svsal.conf`). It adds an xml doctype tag and wraps the schema (see below) and all the snippets that it then reads from `/var/data/existdb/data/export` in a `<sphinx:docset>` element
- `sal-schema.xml` these are the fields in the search snippets that our webapp produces

## Open-Sphinxsearch configuration

Our instance of open-sphinxsearch is installed in `/opt/opensphinxsearch`, and referenced in our [caddy webserver](../webserver/README.md) as root of the `search.{{$domain}}` subdomain, served via `php_fastcgi`:

```caddy
search.{{$domain}} {
	# there are more settings here, this is just to mention the main php/open-sphinxsearch settings:
	root * /opt/opensphinxsearch/public
	php_fastcgi unix//run/php/php-fpm.sock
	file_server
}
```

For the time being, PHP configuration at the moment is left as an exercise for the reader.

As described in the [open-sphinxsearch stock setup](https://github.com/digicademy/open-sphinxsearch), we have modified the [configuration.json](./open-sphinxsearch-config/configuration.json) file as well as some of the views/[templates](./open-sphinxsearch-config/templates):
- changes in `templates/description.xml`, `templates/index.html`, `templates/keywords.xml` are trivial (just labels and homepage)
- in `templates/suggest.json`, we make use of the fragment path field created by our webapp, instead of just the sphinxsearch id
- in `templates/excerpts.xml`, we have to handle escaping of xml entities contained in the excerpts
- in [templates/response.xml](./open-sphinxsearch-config/templates/response.xml), there are the most changes:
  - we return search terms so that users can check what the lemmatization was doing
  - we return all our project specific fields (see the [schema](./sphinxsearch-config/sal-schema.xml))
