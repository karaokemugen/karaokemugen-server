# Karaoke Mugen Server

This is the online server component of Karaoke Mugen.

Features :

- Publish instance IP addresses to a domain name KM Server listens to (ex. kara.moe) so people who go to kara.moe are redirected to their local network's KM App instance.
- Offer access to the karaoke database online through an API similar to KM App. Also serves associated files.
- Centralize stats uploaded by Karaoke Mugen instances
- More news at 11.

## Installation

Make sure node and yarn are up to date

- node 10.13.0 or later
- yarn 1 or later
- PostgreSQL 10.6

Clone this repository and install dependencies

```sh
yarn install
cd kmexplorer
yarn install
cd ..
```

## Setup database

Use the supplied `database.sample.json` file and copy it to `database.json`. Edit it and fill in the blanks (username, password, port, host and database name of your choosing.). It should look like this :

```JSON
{
  "sql-file": true,
  "defaultEnv": "prod",
  "prod": {
    "driver": "pg",
    "user": "karaokemugen_server",
    "password": "musubi",
    "host": "localhost",
    "database": "karaokemugen_server",
    "schema": "public"
  }
}
```

As a superuser on PostgreSQL, you need to create the database properly. Use the `psql` command-line tool to connect to your PostgreSQL database. Example with the `database.json` above :

Example with a database called karaokemugen_server :
```SQL
CREATE DATABASE karaokemugen_server ENCODING 'UTF8';
CREATE USER karaokemugen_server WITH ENCRYPTED PASSWORD 'musubi';
GRANT ALL PRIVILEGES ON DATABASE karaokemugen_server TO karaokemugen_server;
```

Switch to the newly created database and enable the `unaccent` extension.

```SQL
\c karaokemugen_server
CREATE EXTENSION unaccent;
```

Karaoke Mugen Server will create tables and such on first run.

Use the supplied `config.sample.yml` file and copy it to `config.yml`. Edit it and fill in the blanks (Karas, Lyrics, Medias, Series and host of your choosing.). And use the command above to generate the database :
```sh
yarn start --generate
```

## Configure frontend

For local use, please put this in your `config.yml` file :

```yaml
Frontend:
  Host: localhost
  Port: 1350
KaraExplorer:
  Api: http://localhost:1350
  Port: 1351
  Path: /base
```

Explanations :

* Frontend.Host : Put your server's domain name. It's used by Express to know which domain to listen to and serve requests.
* Frontend.Port : Port you should access your KM Server at. Usually on nginx or Apache you'll proxy/reverse proxy requests coming from port 80 to this port
* KaraExplorer.Api : URL to the KM Server API. KM Explorer (the karaoke base browser) will use this URL to try to access the API to request data. Use https if necessary
* KaraExplorer.Port : Port on which KaraExplorer listens on. This is a separate port than Frontend.Port and should not be proxified at directly. KM Server will take care of routing stuff to and from KM Explorer
* KaraExplorer.Path : Path to the karaoke base. You cannot use / for this as it's used by the redirect service KM App uses.

## Launch

Run

```sh
yarn start
```

This link should works now : http://localhost:1350/base