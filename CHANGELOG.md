# Changelog

All notable changes to this project are documented in this file.

## 0.1.0 - 2026-04-14

Initial release of `n8n-nodes-woopsocial`.

### Added

- `WoopSocialApi` credential with bearer token authentication and health check test.
- Main `WoopSocial` action node with resources:
  - `Project` -> `Get Many`
  - `Social Account` -> `Get Many`
  - `Post` -> `Get`
  - `Post` -> `Create` (text, optional media, platform-specific options)
- Trigger node `WoopSocial Watch Published Posts Trigger` for `socialAccountPost.delivery.published`.
- Trigger node `WoopSocial Watch Failed Posts Trigger` for `socialAccountPost.delivery.failed`.
- Dynamic load options for projects, social accounts, and Pinterest boards.
- Robust Pinterest board fallback behavior for fixed collection context edge cases.
- WoopSocial icons for light and dark themes.

### Notes

- This package follows n8n community node conventions.
- TypeScript-only implementation with zero runtime dependencies.
