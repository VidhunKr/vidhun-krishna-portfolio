# Google Apps Script (contact form + AI chat)

Saves contact messages and AI chat transcripts to Google Sheets, and emails you with `MailApp`.

## Setup

1. Create a Google Sheet (e.g. `Portfolio Contact Responses`).
2. Open **Extensions → Apps Script**.
3. Paste everything from `Code.gs`.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` URL into `js/config.js` → `GOOGLE_SCRIPT_URL`.

## Sheets

- **ContactForm** — contact form rows
- **AI Chat Conversations** — chatbot transcripts (created automatically)

## Optional secret

If you set Script Property `CHAT_EMAIL_SECRET`, chat posts must include matching `chatSecret`.  
If unset, chat emails work like the public contact form.

## After script edits

**Deploy → Manage deployments → Edit → New version**, then Deploy again.
