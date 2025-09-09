## Objective
A simple, embeddable "Mini NISA" chatbot for the marketing/landing page, usable without signup, with strict per-conversation token caps and three isolated modes:
- CSV: interact with a preloaded CSV
- Notes Image: interact with a preloaded observation-notes image
- General: free-form chat

No uploads. Each mode has its own fresh conversation and token cap.

## Scope (MVP)
- Embed-only widget (iframe). Hidden/disabled outside iframes.
- Tabs: CSV, Notes Image, General. Switching tabs resets state.
- Read-only preview of preattached CSV/Image.
- First message in CSV/Image modes auto-sends with the preattached asset.
- Enforce per-conversation token caps; stop when limit is reached.

## UX
- Header tabs: [CSV] [Notes Image] [General]
- Placeholders:
  - CSV: "Ask questions about this dataset"
  - Notes Image: "Tell me about these notes"
  - General: "Ask me anything"
- Show remaining tokens; warn when low; disable send at limit.
- Hide upload UI and any non-essential controls (e.g., history, visibility, model selector).

## Config
- Flags/env:
  - `MINI_NISA_ENABLED`
  - `MINI_NISA_ALLOWED_ORIGINS` (comma-separated; include production `https://nisa.coach` and local dev such as `http://localhost:3000`, `http://127.0.0.1:5500` for testing)
  - `MINI_NISA_MAX_TOKENS_GENERAL`
  - `MINI_NISA_MAX_TOKENS_CSV`
  - `MINI_NISA_MAX_TOKENS_IMAGE`
- Assets (checked in or CDN):
  - CSV: `public/mini-nisa/sample.csv`
  - Image: `public/mini-nisa/observation-notes.png`

## Architecture
### Frontend (Widget)
- Route for embed: `/embed/mini-nisa` rendering `MiniNisaWidget`.
- Gate by iframe: render only if `window.top !== window.self`.
- State: `mode` (csv | image | general), `conversationId` (per tab), `remainingTokens`.
- Reuse chat UI components; hide unneeded features.
- For CSV/Image tabs, show read-only preview panel (CSV table snippet; image thumbnail/lightbox).

### Backend (API)
- New endpoint: `POST /api/mini-nisa/chat` → forwards into existing chat pipeline (guest-mode tools only).
- Request: `{ conversationId, mode, messages[] }`.
- On first message per `conversationId`:
  - If `mode === "csv"`, attach preloaded CSV.
  - If `mode === "image"`, attach preloaded image.
- Token accounting:
  - Accumulate provider-reported usage (prompt + completion) per `conversationId`.
  - Store minimal state (in-memory with TTL or simple DB row) to enforce per-mode caps.
  - When cap reached, return terminal message; client disables further sends for that tab.

## Token Limits
- Per-mode caps configured via env (above).
- Display remaining tokens in UI and reduce after each exchange based on API response.

## Security & Abuse
- CORS: restrict to `MINI_NISA_ALLOWED_ORIGINS` for embed route and API. Include `https://nisa.coach` in production and `http://localhost:*` / `http://127.0.0.1:*` for local testing.
- CSP frame-ancestors: restrict embed parents to `https://nisa.coach` in production; include localhost during development. Avoid allowing `*` and do not rely on `file:` parents.
- For local testing, serve the parent HTML via a local server (e.g., `python -m http.server`) rather than opening as `file://`.
- Rate limit by IP + `conversationId`.
- Iframe-only rendering; prevent top-level navigation.
- Limit tools to read-only/marketing-safe set.

## Analytics
- Events: widget_loaded, tab_selected, message_sent, response_received/streamed, tokens_used, limit_reached, session_ended.
- Properties: `mode`, `conversationId`, anonymized fingerprint.

## Implementation Steps
1) Routing & Gating
- Add `/embed/mini-nisa` and `MiniNisaWidget`; gate by iframe and feature flag.

2) UI
- Tabs for CSV / Notes Image / General; new `conversationId` per tab.
- Read-only asset preview (CSV snippet, image thumbnail with modal).
- Input with per-tab placeholder and token meter.

3) API
- `POST /api/mini-nisa/chat` that injects preattached asset on first message for CSV/Image.
- Track and return usage; enforce caps; send terminal message on limit.

4) Config & Assets
- Add env flags and caps. Place assets under `public/mini-nisa/`.
- CORS: allow `https://nisa.coach` and localhost dev origins for embed + API. Set CSP `frame-ancestors` to the same.

5) Guardrails & Telemetry
- Rate limiting and iframe-only guard.
- Analytics events instrumentation.

## Open Questions
- Default token caps per mode for marketing?
- CSV size and preview row count for performance/clarity?
- Exact guest-mode tool list to expose?
- In-memory vs DB with TTL for token tracking?
- Any additional staging domains to include in allowed origins/frame-ancestors?
