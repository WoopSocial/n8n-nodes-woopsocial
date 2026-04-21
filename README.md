# n8n-nodes-woopsocial

Post to Facebook, X/Twitter, Instagram, LinkedIn, YouTube, Pinterest and TikTok with one API key using WoopSocial inside n8n to create social posts, fetch WoopSocial data, and trigger workflows from WoopSocial delivery events without separate platform-based API keys or App IDs.

[![npm version](https://img.shields.io/npm/v/%40woopsocial%2Fn8n-nodes-woopsocial.svg)](https://www.npmjs.com/package/@woopsocial/n8n-nodes-woopsocial)
[![npm downloads](https://img.shields.io/npm/dm/%40woopsocial%2Fn8n-nodes-woopsocial.svg)](https://www.npmjs.com/package/@woopsocial/n8n-nodes-woopsocial)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)

`n8n-nodes-woopsocial` is a community node that helps teams automate social publishing workflows with WoopSocial.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Quick Start

1. Install `n8n-nodes-woopsocial` in n8n Community Nodes.
2. Create a **WoopSocial API** credential with your WoopSocial API key.
3. Add the **WoopSocial** node and run:
   - `Project -> Get Many` to verify connection.
   - `Post -> Create` to publish text or media posts.
4. Add trigger nodes to listen for publish success/failure events.

For trigger testing on local n8n, expose a public HTTPS URL and set `WEBHOOK_URL`.

## Installation

### In n8n UI (recommended)

1. Open **Settings** -> **Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-woopsocial`.
4. Confirm the installation and restart n8n if prompted.

### With npm (self-hosted)

Install in your n8n environment:

```bash
npm install @woopsocial/n8n-nodes-woopsocial
```

Then restart n8n.

## Credentials

This node uses a single credential type:

- **WoopSocial API**
  - **API Key**: your WoopSocial bearer token.
  - Credential test endpoint: `GET /v1/health`.

The node sends requests to `https://api.woopsocial.com/v1` using:

```http
Authorization: Bearer <API_KEY>
```

## Supported Nodes

- **WoopSocial** (action node)
- **WoopSocial Watch Published Posts Trigger**
- **WoopSocial Watch Failed Posts Trigger**

## Why This Node

- Publish content to multiple social platforms from a single workflow.
- Attach media from n8n binary data.
- Pull projects and social accounts for dynamic workflow logic.
- React in real time to successful or failed deliveries.

## Operations

### WoopSocial (Action)

- **Post**
  - **Create**: publish a post now, with text and optional media upload.
  - **Get**: fetch a post by ID.
- **Social Account**
  - **Get Many**: list connected social accounts (optional project filter).
- **Project**
  - **Get Many**: list projects.

### Trigger Nodes

- **WoopSocial Watch Published Posts Trigger**
  - Subscribes to `socialAccountPost.delivery.published`.
- **WoopSocial Watch Failed Posts Trigger**
  - Subscribes to `socialAccountPost.delivery.failed`.

## Usage Notes

- **Actions can be tested locally** on `localhost`.
- **Triggers require a public HTTPS webhook URL**. For local development, expose n8n via a tunnel and set `WEBHOOK_URL` before starting n8n.
- **Post -> Create** supports platform-specific options for:
  - X
  - LinkedIn
  - LinkedIn Pages
  - Instagram
  - Facebook
  - TikTok
  - YouTube
  - Pinterest (board selection)
- **Media upload** uses n8n binary input and sends bytes to WoopSocial `POST /media`.

## Pinterest Board Selector Behavior

n8n fixed collection UI context can be inconsistent in nested rows. To keep board selection reliable, the node includes a fallback that can show options as:

- `Account Username: Board Name`

When fallback mode is used, the node still resolves and sends the correct account and board IDs at execution time.

## Troubleshooting

- **No boards shown for a Pinterest account**
  - Confirm the selected account is connected in WoopSocial and still has access to that business profile and boards.
  - Re-select the project and account in the node to refresh dynamic options.
- **Trigger activation fails with local URL**
  - Use a public HTTPS URL via tunnel and set `WEBHOOK_URL`.
- **Community node not visible**
  - Confirm install succeeded and restart n8n.

## Compatibility

- Built with `@n8n/node-cli` community node tooling.
- TypeScript implementation with no runtime dependencies.
- For development/build, Node.js 22+ is recommended.

## Resources

- [WoopSocial](https://www.woopsocial.com/)
- [WoopSocial API base URL](https://api.woopsocial.com/v1)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/installation/)
- [n8n expressions docs](https://docs.n8n.io/code/expressions/)

## License

[MIT](./LICENSE.md)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
