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
cd react_site
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

## Launch

Run

```sh
yarn start
```

This link should works now : http://localhost:1350/base