# 2025.11.23

This is a hotfix release

## Changes

- Translations: Updated german and breton

## Fixes

- Fix search karas
- Fix all_karas_tags not refreshed after regen
- Add margin on suggestion card

# 2025.11.01

From now on changelogs will be made for Karaoke Mugen Server.

It's about time.

## Breaking changes

- Docker: PGID and PUID env vars have been added to allow setting the user and group the container will write files as

## Changes

- Translations: Updated german
- Maintainers: Maintainers can no remove suggestions
- Import: You can now forbid creation of some tag types when importing songs via the import page. See sample config file for info.
- Import: Number of inboxes submitted can be limited by user. This is a placeholder before we deploy the "My Submissions" feature subset. Check sample config file for help. (`Import.LoginNeeded` and `Import.MaxPerUser`)
- Favorites: Favorited date is now added to the database from now on.
- Remotes: Config item `Remote.BaseHost` is deprecated. KM Server now relies on `Frontend.Host` for remotes' domain.
- CLI: Added new profiling option `--profiling` for debugging

## Fixes

- Performance: Improved stats queries performance (requested/favorited/played songs)
- Fix: SQL Transactions are better handled
- Fix: Master server uplink and discoverability fixed
- Fix: Fixed country code detection when displaying suggestion dialog
- Fix: Fullscreen should now work with Webkit-based browsers

## Dev

- Deps: Updated backend and frontend deps
