# Unblocking Higgsfield in this environment

The agent sandbox blocks outbound traffic to every Higgsfield host
(`403 Host not in allowlist`). To let the `higgsfield` CLI / skills generate images
and video, add the hosts below to the environment's **network egress allowlist**.

Hostnames were extracted directly from the CLI's Go binary
(`@higgsfield/cli/vendor/hf`) — these are the real endpoints it calls.

## Required (production)

| Host | Purpose | Without it |
|------|---------|-----------|
| `fnf-device-auth.higgsfield.ai` | Device / OAuth login (`higgsfield auth login`) | Can't authenticate at all |
| `fnf.higgsfield.ai` | **Main API** — generation, job polling, uploads, Marketing Studio, Soul, etc. | Nothing runs even when logged in |
| `higgsfield.ai` | Marketing site / some redirects | Minor calls fail |

> Note: the CLI uses **`fnf.higgsfield.ai`** as its API host — *not* `api.higgsfield.ai`
> (a natural guess that is actually wrong).

## Required for media (dynamic, presigned)

Generated results and your uploaded inputs are served via **presigned storage URLs**
returned by the API at runtime — not a fixed Higgsfield subdomain. These are almost
always AWS. Allowlist:

| Host pattern | Purpose |
|--------------|---------|
| `*.amazonaws.com` | S3 presigned upload + result download |
| `*.cloudfront.net` | CDN delivery of generated media (if used) |

Without these, jobs can **succeed** but you won't be able to upload reference images
or download the finished image/video.

## Optional

| Host | Purpose |
|------|---------|
| `mcp.higgsfield.ai` | If using the remote MCP server route instead of the CLI |
| `github.com`, `raw.githubusercontent.com` | Installing the CLI from GitHub releases (not needed — we installed via npm `@higgsfield/cli`) |
| `aidev-fnf.higgsfield.ai`, `dev.higgsfield.ai`, `durationfnf.higgsfield.ai` | Higgsfield internal/dev endpoints — **not** needed for normal use |

## Minimal set to get working

```
fnf-device-auth.higgsfield.ai
fnf.higgsfield.ai
higgsfield.ai
*.amazonaws.com
*.cloudfront.net
```

## Verify after allowlisting

```bash
higgsfield auth login          # should open device flow, not 403
higgsfield account status      # <email> — <plan>, <N> credits
higgsfield generate create z_image --prompt "test" --wait   # prints a result URL
```

Once `account status` succeeds, the prompt pack in
`mockups/higgsfield-redesign-prompts.md` will run end-to-end.
