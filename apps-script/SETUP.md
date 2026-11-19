# Google Apps Script contact form (no Gmail password)

Saves each message to a Google Sheet and emails you with `MailApp` — no Node backend, no App Password.

## Setup

1. Create a Google Sheet (e.g. `Portfolio Contact Responses`).
2. Open **Extensions → Apps Script**.
3. Paste everything from `Code.gs`.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` URL into `js/config.js` → `GOOGLE_SCRIPT_URL`.

## After script edits

**Deploy → Manage deployments → Edit → New version**, then Deploy again so the live URL picks up changes.
