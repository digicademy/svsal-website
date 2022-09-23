# eXist-db server for the project "The School of Salamanca"

Our website makes use of eXist-db for two things:

On the one hand, eXist-db is the software creating all the webdata files and putting them somewhere for the webserver to find them. Once this is done, it is no longer needed for shipping these files. But on the other hand, as users can request passages of many levels of granularity in various formats, we cannot anticipate everything that might eventually be requested, and we have to rely on eXist-db for on-the-fly generation of these files in many cases. (The process of deciding between shipping something from the filesystem and having eXist-db create it from scratch is described in our [webserver README](../webserver/README.md#Routing).)

## Setup eXist-db

If you have podman installed you can use the [systemd service description file](../existdb/existdb-container.service) available in this repository, drop it in `/etc/systemd/system` and enable/launch it with `sudo systemctl enable existdb-container ; sudo systemctl start existdb-container`. It will then use podman to:
- run exist-db in a containerized environment
- expose existdb's `data/export` folder as the host's `/var/data/existdb/data/export` folder

## Install the svsal webapp

Then, you only need to install the development branch [refactoring/2022](https://github.com/digicademy/svsal/tree/refactoring/2022) of the svsal app in existdb...

- get <https://github.com/digicademy/svsal/tree/refactoring/2022>, e.g. with `git clone https://github.com/digicademy/svsal/tree/refactoring/2022`
- run `ant` in its main folder
- install the resulting `build/svsal-*.xar` in eXist-db's package manager
  - this presupposes some preparation in terms of user and collection management that are not yet publicly documented. You can see all paths in the `modules/config.xqm`, however. The most relevant are: a `/db/apps/salamanca-tei/works/` collection that we are uploading our works to, a `db/apps/salamanca-webdata/` collection with subcollections (`html`, `iiif`, `index`, `pdf`, `rdf`, `snippets`, `txt`) for storing the files that eXist-db creates (besides exporting them to the filesystem). The `admin.html` file has `-rw-rwS---` privileges and can be opened only when logged in as the salamanca webapp owner or a user belonging to the salamanca admin group.
