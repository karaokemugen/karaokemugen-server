# Karaoke Mugen Server

This is the online server component of Karaoke Mugen.

Check its main instance at https://kara.moe

Features :

- Allow people to browse through a karaoke database
- Expose karaoke sessions to the public via a room code based on subdomain (like abcd.kara.moe)
- Offer access to the karaoke database online through an API similar to KM App. Also serves associated files.
- Centralize stats uploaded by Karaoke Mugen instances
- More news at 11.

## Installation

Make sure node and yarn are up to date

- node 14 or later
- yarn 3 or later
- PostgreSQL 12 or later

Clone this repository and install dependencies

```sh
yarn pull
yarn install
yarn build:all
```

## Setup database

Use the supplied `config.sample.yml` file and copy it to `app/config.yml`. Edit it and fill in the blanks (username, password, port, host and database name of your choosing.)

As a superuser on PostgreSQL, you need to create the database properly. Use the `psql` command-line tool to connect to your PostgreSQL database.

Example with a database called karaokemugen_server (don't forget to put your own password instead of `musubi`) :

```SQL
CREATE DATABASE karaokemugen_server ENCODING 'UTF8';
CREATE USER karaokemugen_server WITH ENCRYPTED PASSWORD 'musubi';
GRANT ALL PRIVILEGES ON DATABASE karaokemugen_server TO karaokemugen_server;
```

Switch to the newly created database and enable the `unaccent` extension.

```SQL
\c karaokemugen_server
CREATE EXTENSION unaccent;
CREATE EXTENSION pgcrypto;
```

Karaoke Mugen Server will create tables and such on first run.

Edit the `app/config.yml` file and fill in the blanks (Karas, Lyrics, Medias, Series and host of your choosing.). 

Run database migrations :

```sh
yarn migrate
```

Use the command above to generate the database :

```sh
yarn start --generate
```

## Configure frontend

For local use, please put this in your `app/config.yml` file :

```yaml
Frontend:
  Port: 1350
API:
  Secure: false
KaraExplorer:
  Secure: false
```

For production use :

- API.Host : Put your server's domain name. It's used by the API to know which domain to listen to and serve requests.
- API.Secure : Wether your API is going to be on HTTPS or HTTP front server. Enabled by default, disable it for local tests without being behind a webserver
- Frontend.Port : Port you should access your KM Server at. Usually on nginx or Apache you'll proxy/reverse proxy requests coming from port 80 to this port
- KaraExplorer.Host : Host KMExplorer should be listening to

## Prepare a karaoke base

KM Server uses git to keep a karaoke base up to date. Stup one in any directory, like `app/karaokebase` via `git clone` then point the config to this directory, like this :

```yaml
System:
  Repositories:
    - Name: kara.moe
      Enabled: true
      BaseDir: app/karaokebase,
      Path: 
        Medias: 
          - app/medias
```

## Launch

Run

```sh
yarn start
```

This link should work now : http://localhost:1350/base
