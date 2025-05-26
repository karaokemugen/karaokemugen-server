# Installation on debian 11/12 with a **non-root** user and at least 2gb of ram



# Install prerequisites

## Node
```sh
# https://github.com/nodesource/distributions
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt-get update
sudo apt-get install nodejs -y

sudo npm -g install yarn
```

## Postgres
```sh
# https://www.postgresql.org/download/linux/debian/
# Create the file repository configuration:
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import the repository signing key:
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update the package lists:
sudo apt-get update

# Install the latest version of PostgreSQL.
# If you want a specific version, use 'postgresql-12' or similar instead of 'postgresql':
sudo apt-get -y install postgresql
```

## Nginx reverse proxy with modules
```sh
sudo apt-get install -y nginx libnginx-mod-http-fancyindex
```

## (Optional for hardsubs) ffmpeg with all needed libraries (libfdk_aac, libass)

See the ready to use [build script](./ffmpeg-build-script.sh) or the [official instructions](https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu). Make sure to also install libass (available in apt repository) and add the `--enable-libass` parameter when buiding ffmpeg.

## Misc
```sh
sudo apt-get install -y git
sudo apt-get install -y uuid-runtime
```


## Setup ftp server for media
```sh
sudo apt install -y vsftpd
# Restrict users to chroot and set permissions (https://askubuntu.com/questions/674737/restrict-user-to-a-directory-vsftpd)
sed -i '/write_enable/s/^#//g' /etc/vsftpd.conf
sed -i '/local_umask/s/^#//g' /etc/vsftpd.conf
sed -i '/chroot_local_user/s/^#//g' /etc/vsftpd.conf
sed -zi '/allow_writeable_chroot=YES/!s/$/\nallow_writeable_chroot=YES/' /etc/vsftpd.conf
sed -zi '/local_umask=000/!s/$/\nlocal_umask=000/' /etc/vsftpd.conf # Allow read / write to everything newly created

sudo service vsftpd restart
```

## Add an user for pushing to the repo
```sh
sudo adduser kmuser --shell /usr/sbin/nologin
echo "kmuser:PASSWORD_CHANGEME" | sudo chpasswd # Set password

# Only necessary when home folder is different than storage folder
# Add media folder to home
sudo mkdir /home/kmuser/storage
mount --bind /storage /home/kmuser/storage
# Mount it permanently
echo "/storage /home/kmuser/storage none rw,bind 0 0" >> /etc/fstab
```

# Install kmserver

```sh
cd /srv
git clone https://gitlab.com/karaokemugen/code/karaokemugen-server.git kmserver
cd kmserver/

yarn
yarn pull

cp config.sample.yml app/config.yml
```

Edit `app/config.yml` and set InstanceID to an UUID and JwtSecret to a random text. Without these the server won't start.

```sh
yarn build:all
```

## Setup database

```sh
sudo -i -u postgres bash << EOF
psql -c "CREATE DATABASE karaokemugen_server ENCODING 'UTF8';"
psql -c "CREATE USER karaokemugen_server WITH ENCRYPTED PASSWORD 'musubi';" # Add own password here
psql -c "GRANT ALL PRIVILEGES ON DATABASE karaokemugen_server TO karaokemugen_server;"
psql -c "ALTER DATABASE karaokemugen_server OWNER TO karaokemugen_server;"
psql -c "GRANT CREATE ON SCHEMA public TO public;"

psql -d "karaokemugen_server" -c "CREATE EXTENSION unaccent;"
psql -d "karaokemugen_server" -c "CREATE EXTENSION pgcrypto;"
EOF
```

### Run migrations
```sh
yarn migrate
```

## Setup reverse proxy (nginx)

Insert your server hostname into the `server_name` fields of the file `docs/nginx.example.conf` and setup the ssl parameters for https, if available. You can also set it up with certbot later.
Then copy the config into the nginx folder:

```sh
cp /srv/kmserver/docs/nginx.example.conf /etc/nginx/sites-enabled/kmserver.conf
sudo service nginx reload
```

# Start km-server

## Run

Server must be run as non-root

```sh
yarn start --generate
yarn start
```


## (optional) create kmserver user if no dedicated user exists
```sh
sudo adduser kmserver --disabled-password --gecos ""
# Add access rights to /opt
sudo chown -R kmserver:kmserver /src/kmserver
# Change into user for the next steps
sudo su kmserver
```

## (optional) setup autoupdate

Since we're not attached to the gitlab pipeline for updates, this is an approach using a simple systemd timer. Requires kmserver user defined above.

```sh
echo "%kmserver ALL= NOPASSWD: /bin/systemctl restart kmserver" > /etc/sudoers.d/kmserver
```

Create service `/etc/systemd/system/kmserver-update.service` from the file [kmserver-update.service](kmserver-update.service)

Create timer `/etc/systemd/system/kmserver-update.timer` from the file [kmserver-update.timer](kmserver-update.timer)

Enable with `systemctl enable kmserver-update.timer && systemctl start kmserver-update.timer`

Check if timer is enabled `systemctl list-timers`


# Troubleshooting

## Database

### `ERROR:  new encoding (UTF8) is incompatible with the encoding of the template database (SQL_ASCII)`
[Solution](https://stackoverflow.com/questions/16736891/pgerror-error-new-encoding-utf8-is-incompatible#answer-16737776)

Your system is probably not running on UTF-8. Run sql to change database template:
```sql
UPDATE pg_database SET datistemplate = FALSE WHERE datname = 'template1';
DROP DATABASE template1;
CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UNICODE';
UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template1';

\c template1
VACUUM FREEZE;
```

## Nginx
### 403 Errors on _nuxt routes
Check the file permissions and if **SELinux** is enabled on the system. SELinux might cause access problems but it's configuration won't be covered here.

### Git error `fatal: the remote end hung up unexpectedly` when pushing

If you're using an ngnix reverse proxy on the git server, set a larger payload size in the `nginx.conf` (or `.conf` in `sites-enabled/`):
```
http {
    ...
    client_max_body_size 500M;
}
```