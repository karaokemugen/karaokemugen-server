# 2025.12.08

## Added

- Admins can now import song suggestion CSVs to add to the list of suggestions easily importable
- Added a new page for users "My submissions" allowing them to see which songs they've sent for approval and which got refused/accepted, and follow the review progress

## Changes

- Updated frontend dependencies
- Added `SQL` env var to display SQL queries in logs
- Added `DEBUG`  env var to display debug level info in console (they're always logged) 
- Some CLI options have been moved to an API route.
  - Suggestions (now has its own interface in admin panel)
  - Ban/unban session from stats (API only)
  - promoteToken (now has its own interface in admin panel)
  - changePassword (removed, no use anymore)
  - port (use the port config option instead)

## Fixes

- Subfile error is only displayed if there is a media
- Fixed issue builder when editing a song
- Fixed tag type selection when creating a tag during import
- Fixed profile modal on mobile
- Fixed duplicates in playlist modal
- Keep the right song in memory when opening an incident modal and switching songs due to autoplay
- Fixed routing from home page
- Fixed safeOnly kara query when there are no warning tags
- Fixed contributor emails checkbox label in profile moda

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
