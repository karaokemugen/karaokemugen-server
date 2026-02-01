# 2026.02.01

## Changes

- Updated dependencies
- Translations: Updated german, french, english, polish and breton
- Display shared favorites between user logged in and another user (#175)
- Be able to send a reason for accepted inbox status (#441)
- Properly error out on unknown status change (#431)
- Remove maintainer and admin from trust level dashboard (#432)
- Update guest avatars
- Send mails asynchronously for inbox changes (#447)
- Display build date, tag and commit in admin dashboard (#446)
- Added the section “People who liked this also liked” (#97)
- gif avatar is now working again (#437)
- Add ReplyTo config item for mailer (#460)
  - `Mail.ReplyTo` is added in configuration.
- Automatically detect and label new contributors submissions (#456)
  - `Gitlab.Labels.NewContributor` is added in configuration.
- Add some gitlab issue metadata (label, due time) to better track karaokes with changes required (#455)
  - `Gitlab.Labels.ChangesRequested` is added in configuration.
- Blur for video preview only on some tags (#381)
  - `Frontend.SensitiveTags` is added in configuration. See config.sample.yml for the format.
- To avoid spam, suggestions liked now require to be logged (#435)
- Allow sorting by added date in favorite (#426)

## Fixes

- Fixed "mail to" link for admin email
- Fixed /kara/xxx/:kid links
- Fixed assign issue to maintainer when downloading a song
- Removed WHERE clauses on sorted results for played/requested/favorited
- Fixed display of dashboard to only admin and maintainer
- Fixed contributor trust level select init
- Fixed reason add also for changes_requested status
- Fixed margin on suggest card
- Fixed missing i18n for inbox status change mail
- Fixed version in issue title
- Fixed multiple email sent for the same status
- Fixed sent review mail and note only the first time
- Fixed puid / guid definition in docker compose
- Fixed routing to playlist
- Fixed import playlist with duplicate songs
- Fixed submit karaoke without collections
- Fixed issues not linked in the inbox
- Fixed set inboxes to accepted instead of removing them
- Fixed regexp for myanimelist, bluesky and mastodon account
- Fixed quota display
- Fixed dump creation
- Fixed throw errors when clearing inbox
- Fixed accepted note display in issue
- Fixed type of submission is updated from "Creation" to "Modification"
- Fixed when accessing a karaoke page using a direct link, the collection selector is not displayed
- Fixed markdown list in gitlab comment

# 2025.12.15

This is a hotfix release

## Changes

- Reworked suggestion modal
- Improved performance on random song queries
- Translations: Updated breton

## Fixes

- No @ allowed in usernames. Administrators need to manually update existing username that have @.
- Fixed the filter by user in submissions page
- Fixed dashboard to be display only if necessary for maintainer

# 2025.12.08

## Added

- Admins can now import song suggestion CSVs to add to the list of suggestions easily importable
- Added a new page for users "My submissions" allowing them to see which songs they've sent for approval and which got refused/accepted, and follow the review progress.
  - `Frontend.Import.MaxPerUser` is removed
  - `Frontend.Import.ContributorTrustLevels` and `Frontend.Import.CleanupDays` are added

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
- Rename `Frontend.DiscourseURL` to `Frontend.ForumURL`

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
