# Karaoke Mugen Server

This is the online server component of Karaoke Mugen.

For now it allows to :

- Publish instance IP addresses to a domain name KM Server listens to (ex. kara.moe) so people who go to kara.moe are redirected to their local network's KM App instance.
- Offer access to the karaoke database online through an API similar to KM App. Also serves associated files.
- More to come, check issues.

With a bit of time, it'll allow us to centralize stats from many Karaoke Mugen instances.

## Installation

Make sure node and yarn are up to date

- node 10.13.0 or later
- yarn 1 or later
- PostgreSQL 10

Clone this repository and install dependencies

```sh
yarn install
```

## Build

```sh
yarn buildReact
```

## Setup database

Setup a PostgreSQL user and database, by default `karaokemugen_server`. Define a password and edit `database.json` to set credentials and such.

As a PostgreSQL super user, get into the newly created database and create the `unaccent` extension.

Example with a database called karaokemugen_server :

```pg
postgres=# \c karaokemugen_server
karaokemugen_server=# CREATE EXTENSION unaccent;
CREATE EXTENSION
karaokemugen_server=# \q
```

Karaoke Mugen Server will create tables and such on first run.

## Launch

Run

```sh
yarn start
```
