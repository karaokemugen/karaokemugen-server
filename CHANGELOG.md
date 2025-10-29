# 2025.11.01

From now on changelogs will be made for Karaoke Mugen Server.

It's about time.

## Breaking changes

- Docker: PGID and PUID env vars have been added to allow setting the user and group the container will write files as

## Changes 

- Translations: Updated german
- Maintainers: Maintainers can no remove suggestions
- Import: You can now forbid creation of some tag types when importing songs via the import page. See sample config file for info.

## Fixes

- Fix: Master server uplink and discoverability fixed
- Fix: Fixed country code detection when displaying suggestion dialog
- Fix: Fullscreen should now work with Webkit-based browsers

## Dev

- Deps: Updated to Nuxt
