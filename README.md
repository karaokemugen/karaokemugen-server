# Karaoke Mugen Server

This is the online server component of Karaoke Mugen.

It allows for creation of local tunnels to reach isolated Karaoke Mugen instances.

With a bit of time, it'll allow us to centralize stats from many Karaoke Mugen instances.

## Installation

Make sure node and yarn are up to dat

* node 8.10 or later
* yarn 1 or later
* PostgreSQL 10

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

```sh
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
