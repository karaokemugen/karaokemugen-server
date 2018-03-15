# Karaoke Mugen Server

This is the online server component of Karaoke Mugen.

It allows for creation of local tunnels to reach isolated Karaoke Mugen instances.

With a bit of time, it'll allow us to centralize stats from many Karaoke Mugen instances.

## Installation

Make sure node and yarn are up to dat

* node 8 or later
* yarn 1 or later

Clone this repository and install dependencies

```sh
yarn install
```

Karaoke Mugen Server needs localtunnel-server :

```sh
git clone https://github.com/localtunnel/server.git localtunnel-server
cd localtunnel-server
yarn install
cd ..
```

## Launch

Run

```sh
yarn start
```
