# How to run

Manual CI/CD for selfhosted bases which don't have access to a proper pipeline, running in docker container.

The container clones your karaoke base and validates it with Karaoke Mugen App (`--validate --strict`). If the validation succeeds, it calls the update route of your KM Server, which pulls the base and regenerates its database. Otherwise if it fails, it posts the error lines to a Discord webhook.

## Build

Build the image from this folder:

```sh
cd docs/cicd
sudo docker build . -t mugenci
```

The Karaoke Mugen version is cached after builing. To update the image to the latest version, build it with the `--no-cache` parameter.

## Run validation

Example command for the mugen.re repo:

```sh
sudo docker container run --rm \
 -e GIT_URL='https://gitlab.com/karaokemugen/bases/mugenre-database.git' \ # Replace with your own git repository
 -e KMSERVER_UPDATE_URL='https://mugen.re/api/update' \ # Replace with your own repository url
 -e KMSERVER_AUTH_TOKEN='<kmserver_admin_token>' \ # Replace with an admin token for that instance
 -e NOTIFICATION_URL='https://discord.com/api/webhooks/<webhook token>' \ # Optional discord webhook notification url
 -v /karaoke/medias/:/storage/medias mugenci # All medias of the repo have to be mounted here
```

The container exits with code 0 only if the validation succeeded and KM Server accepted the update request.
