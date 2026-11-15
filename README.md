# Verdict Desk

### Travel rights, made clear.

Verdict Desk is a focused travel-rights workspace for people who need a clear next step after a disrupted journey. Enter the details of a flight, train, bus, cab, metro ride, or hotel booking and get a plain-English verdict, practical evidence checklist, and a claim letter you can copy or export.

## What it does

- **Rights checker** for five travel modes: flights, trains, buses, cabs/metro, and hotels
- **Plain-English explanations** with a source or rule reference for each result
- **Actionable next steps** for refunds, cancellations, delays, baggage, fares, room issues, and more
- **Claim letter generator** with copy-to-clipboard and PDF export
- **Rights library** with searchable guidance cards
- **Saved cases** stored locally for guests or remotely for signed-in users
- **Demo mode** with realistic sample journeys
- **Context-aware travel assistant** with a rule-based fallback and optional Gemini integration
- **Offline-first caching** through a service worker
- **Responsive interface** designed for desktop and mobile screens

## Quick start

No build step or package installation is required.

1. Download or clone this repository.
2. Open `index.html` in a browser, or serve the folder through a local static server.
3. Use **Demo** to explore the product with sample cases.
4. Select **New rights check** to analyse a real journey.

For the most reliable experience, use a local server because service workers are restricted when pages are opened directly from `file://`.

### Serve locally

Using Python:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

Using Node.js:

```bash
npx serve .
```

## Optional integrations

### Accounts and cloud-saved cases

The app includes Supabase authentication and case storage. Guest mode works without an account and keeps cases in browser storage. Signed-in mode uses the Supabase project configured in `supabase-client.js`.

Before deploying publicly:

1. Create a `cases` table with the fields used by `storage.js`.
2. Enable email authentication in Supabase.
3. Add row-level security policies so users can only read, create, and delete their own cases.
4. Review the project URL and publishable key in `supabase-client.js`.

Never place a Supabase service-role key in the browser.

### Optional Gemini assistant

The chat assistant works with a built-in rule-based fallback. To enable Gemini responses, enter a Gemini API key through the app’s settings flow when available. The key is stored in browser local storage for this prototype; use a server-side proxy and secret management before production use.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Application shell, views, forms, and accessibility structure |
| `style.css` | Visual system, responsive layout, and component styles |
| `app.js` | Navigation, checking flow, case rendering, letters, and exports |
| `data.js` | Travel modes, rights guidance, sources, and result rules |
| `storage.js` | Local and Supabase-backed case persistence |
| `auth.js` | Guest sessions and Supabase authentication |
| `supabase-client.js` | Lightweight Supabase REST and auth client |
| `chat.js` | Chat UI, history, context, and fallback responses |
| `gemini-client.js` | Optional Gemini API integration |
| `demo.js` | Demo journeys, onboarding, smart helpers, and animations |
| `sw.js` | Offline caching and service-worker lifecycle |
| `manifest.json` | Progressive web app metadata |
| `logo.svg`, `ai-mark.svg`, `icon.svg` | Product and interface artwork |

## Design principles

- **Clarity over jargon:** translate complex travel rules into an understandable decision path.
- **Evidence matters:** every flow encourages users to keep tickets, booking confirmations, notices, screenshots, and receipts.
- **Useful even without an account:** the core checker and local saved cases work in guest mode.
- **Assist, don’t overpromise:** results are guidance, not a substitute for confirmation from the operator or qualified legal advice.

## Important note

Verdict Desk is an informational prototype. Eligibility can depend on the cause of the disruption, notice provided, ticket type, operator policy, route, and current regulations. Users should confirm the final remedy with the relevant airline, railway, operator, platform, hotel, or authority.

## Submission checklist

- [ ] Open the app through a local server and test the main navigation.
- [ ] Run one check in each travel mode.
- [ ] Try Demo mode and the onboarding flow.
- [ ] Test saving, reopening, and removing a case.
- [ ] Test claim-letter copy and PDF export.
- [ ] Verify the app loads with the network unavailable after the first visit.
- [ ] Configure production Supabase security policies before enabling public accounts.
