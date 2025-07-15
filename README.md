# Karaoke Mugen Server

This is the online server component of Karaoke Mugen.

# Overview

KM Server is an online component for the [Karaoke Mugen Desktop App](https://mugen.karaokes.moe/en). While it can be used on its own to offer a searchable karaoke database, its main purpose is to offer online features to KM App.

# Use cases

Is KM Server for you?

- For events : your users will have their own user accounts, favorites and so on with only the songs you wish to offer to your public. You can also use your own domain for KM App remote URLs like `https://xxxx.mugen.re`
- For karaoke groups : it can showcase your work to the internet and allow other KM Apps to download your content

# Features

- User account system with favorites and persistent settings accross different KM Apps
- Community playlist sharing
- Serve a song repository to KM Apps
- Make this song repository browsable online (media is hardsubbed automatically via ffmpeg)
- Serve a remote interface to your KM App so users can browse and request songs from their smartphones during a karaoke session
- Gather stats from KM apps connecting to your instance (if the users opted in)
- Manage song suggestions from other karaoke sources
- ...and a few other minor features. See [Server API documentation](https://api.karaokes.moe/server)

# Deploy via Docker

- Copy `.env.example` to `.env` and change the environment variables to your needs. `ADMIN_USER` and `ADMIN_PASSWORD` will be used to create an admin user during container launch.
- If you are going to use the "remote" feature (allowing short URLs for people using Karaoke Mugen app on your server, like `https://abcd.mugen.re`) make sure you're using a wildcard domain certificate so all subdomains of your KM Server are using the certificate. See `docs/docker/apache.example.conf` for guidance.
- Make sure a git repository with your karaoke base exists in `app/repos/karaokebase/json`.
- Run `docker compose up -d`
- Point your reverse proxy to port 1350 as it's the only exposed port.

# Installation from source

Make sure node and yarn are up to date on a machine with at least **2 gb** of ram

**Requirements:**

- node 22 or later
- yarn 3 or later
- PostgreSQL 12 or later

**Optional:**

- [ffmpeg with libfdk_aac and ass](./docs/ffmpeg-build-script.sh) support for generating hardsubs
- A FTP server for allowing maintainers to upload medias (vsftp is simple and works out)

[Detailed debian installation instructions](./docs/kmserver-setup-debian.md)

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
ALTER DATABASE karaokemugen_server OWNER TO karaokemugen_server;
GRANT CREATE ON SCHEMA public TO public;
```

Switch to the newly created database and enable the `unaccent` and `pgcrypto` extension. Depending on your PostgreSQL version, some extensions might be already installed.

```SQL
\c karaokemugen_server
CREATE EXTENSION unaccent;
CREATE EXTENSION pgcrypto;
```

Karaoke Mugen Server will create tables and such on first run.

Edit the `app/config.yml`:

- Set `InstanceID` to a GUID (Example: `120e3d08-9f5f-44d1-9655-2a04f6e600b`). Use a UUID/GUID generator online to get one.
- Set `JwtSecret` to a random text

Run database migrations to setup the structure:

```sh
yarn migrate
```

## Prepare a karaoke base

KM Server uses git to keep a karaoke base up to date. Setup a git project on gitlab, github, gitea (selfhosted) or similar and clone it to `app/karaokebase` via `git clone`, then point the config to this directory, like this :

```yaml
System:
  Repositories:
    - Name: mugen.re
      Enabled: true
      BaseDir: app/karaokebase/git
      FullArchiveURL: https://mugen.re/downloads/master.zip # URL to the complete repository as zip
      SourceArchiveURL: https://gitlab.com/karaokemugen/bases/karaokebase/-/archive/master/karaokebase-master.zip
      Path:
        Medias:
          - app/karaokebase/medias
```

**Note for new repositories:** A `repo.yml` file is needed in the root directory of the repository, which defines some settings.

Generate the kara database based on your current files in the repository paths:

```sh
yarn start --generate
```

## Configure frontend

For local use, please put this in your `app/config.yml` file :

```yaml
Frontend:
  Port: 1350
  Secure: false
```

For production use :

- `Frontend.Host` : Put your server's domain name.
- `Frontend.Secure`: Wether your frontend is going to be on HTTPS or HTTP front server. Enabled by default, disable it for local tests without being behind a webserver
- `Frontend.Port`: Port you should access your KM Server at. Usually on nginx or Apache you'll proxy/reverse proxy requests coming from port 80 to this port

### Master Server uplink

If your server wants to be known by apps which by default use mugen.re as a default master server, you need to add this to your configuration :

```YAML
App: 
  MasterServersUplink: 
    - mugen.re
```

Your KM Server will then send a heartbeat ping to the master servers listed. Any KM Server can act as a master server, it depends on which apps query it.

## Launch

Run

```sh
yarn start
```

This link should work now : http://localhost:1350/

For frontend dev use, launch also :

```sh
yarn watch:kmexplorer
```

This link should work now : http://localhost:3000/

### Configure autostart and restart on crash

On a machine with systemd, copy the file [kmserver.service](docs/kmserver.service) to `/etc/systemd/system/kmserver.service`.

This assumes the project is located in `/srv/kmserver` and the user to execute is `kmserver`. You can change the file accordingly and then add the service to autostart with `systemctl enable kmserver`.

Now you can start the kmserver with `sudo service kmserver start`, see its status with `sudo service kmserver status` and show the logs with `sudo journalctl -u kmserver.service -b`.

## Update the base on the fly

The base can be updated by git and refreshed on the fly by making a request to `/api/update` with an admin authorization token. You can point a webhook from your git service to call this URL whenever someone pushed a change, so that kmserver will update itself automatically.

Example curl request to trigger an update: `curl -f -X POST -H authorization:<AUTH_TOKEN> https://<repo url>/api/update`

Curl request to get an authorization token (use an admin account) : `curl --header "Content-Type: application/json" --data '{"username":"<username>","password":"<password>"}' --request POST https://<repo url>/api/auth/login`

To create an admin user, create an admin user with `--createAdmin user,password`. Example :

```
yarn start --createAdmin myadminuser,cannotbethiscute` for example.
```

# Translation

[![Translation status](https://hosted.weblate.org/widgets/karaoke-mugen/-/karaoke-mugen-server/multi-auto.svg)](https://hosted.weblate.org/engage/karaoke-mugen/)