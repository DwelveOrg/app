# Telegram Authentication

Status: implemented on the `feature/telegram-auth` app and backend branches.

Sign-in runs through the Dwelve bot. The user is sent to a `t.me` deep link, presses Start,
and the bot replies with a one-time link that signs them in. There is no browser redirect to
Telegram's OAuth consent page and no callback URL to register.

## Flow and ownership

1. `GET /api/auth/telegram/start` asks the backend for a single-use **ticket** and the bot
   username, remembers a safe `next` path in a ten-minute `httpOnly` cookie, and redirects to
   `https://t.me/<bot>?start=<ticket>`.
2. The user presses Start. Telegram delivers `/start <ticket>` to the backend.
3. Nest consumes the ticket and finds or creates the user from the numeric Telegram id.
4. An account with no phone number on file is asked for one. The bot offers a
   `request_contact` button — Telegram shares the number the account is registered with, and
   only the sender's *own* contact is accepted — or the user types a number with its country
   code. Contact-shared numbers are stored as verified, typed ones as unverified. Accounts that
   already have a number skip this step.
5. The bot sends a **login token** link back into that user's own chat.
6. `GET /api/auth/telegram/complete?token=…` redeems it, writes the same encrypted Dwelve
   session cookie used by password auth, and redirects to onboarding or the requested path.

The bot speaks the user's own Telegram language (`language_code`: en, ru, uz), replies with a
hint to anything that is not part of a sign-in, and ignores group chats entirely.

The browser never receives the bot token, Dwelve JWTs, or an unverified identity payload.

## Login and signup screens

Both open on a three-way method chooser — Email, Google, Telegram — each with its own panel.
The Telegram panel explains the three steps before the button. On a pointer device the button
opens the bot in a new tab and the panel switches to "Check Telegram" with a way to reopen the
bot or return to the other methods; on touch, the page hands itself to the Telegram app. A
`?telegram=<status>` outcome reopens the Telegram panel so its notice is visible.

## Why the session is not returned to the starting tab

A deep link can be forwarded. If pressing Start signed in whichever browser created the
ticket, an attacker could mint a ticket, send their link to someone else, and be signed in as
them. Sending the credential back through the chat means it reaches whoever actually controls
the Telegram account. That is why the login page does not poll and does not complete on its
own: the user finishes in the tab opened from Telegram.

## BotFather setup

1. Open `@BotFather`, `/newbot`, and create a bot representing Dwelve.
2. `/mybots` -> the bot -> **API Token**. That token is `TELEGRAM_BOT_TOKEN`; it is a
   full-control credential for the bot and belongs only in the backend environment.
3. Nothing else. No Login Widget, no OIDC, no Redirect URIs, no Trusted Origins — the bot flow
   registers no URLs at all, which is what makes localhost development possible.

## Environment

This app needs **no** Telegram configuration: the bot username and the ticket both come from
the backend on each sign-in, so there is one source of truth and no secret in Vercel.

Backend (server-only):

```env
TELEGRAM_BOT_TOKEN="BotFather API token"
TELEGRAM_BOT_USERNAME="dwelve_bot"
TELEGRAM_WEBHOOK_SECRET="long random string, >=16 chars"
# Production receives updates:
TELEGRAM_WEBHOOK_URL="https://<api-host>/api/v1/auth/telegram/webhook"
# Development pulls them instead, because Telegram cannot reach localhost:
TELEGRAM_BOT_POLLING=true
```

## States and errors

- The control shows default, disabled, and opening states.
- A missing or unconfigured bot returns to the source page with the `unavailable` message.
- An expired, already-used, or missing login token returns the `expired` message.
- Both route handlers log the real reason under `[telegram-auth]`; the browser only ever sees
  the status, so the server log is where a misconfigured bot is diagnosable.

## User and account rules

`User.telegramId` is nullable and unique, and holds the numeric Telegram user id — the same
value the retired OIDC flow used as `sub`, so the identity model did not change.

`User.phoneNumber` (E.164) and `User.phoneNumberVerifiedAt` hold the number the bot collected.
It is contact data, not an identity key: it is not unique, and only a Telegram-shared contact
sets the verified timestamp.

Telegram does not provide email. A first-time Telegram account receives a stable, reserved,
non-deliverable address under `identity.dwelve.invalid`. It must never be treated as verified
contact data. A consequence worth knowing: pending invitations are matched by email, so an
emailed invite cannot currently be accepted by a Telegram-created account.

Dwelve does not automatically link a Telegram identity to an email/Google account. Safe
linking requires a future **Connect Telegram** flow started from an authenticated session.

## Local verification

```bash
# backend — with TELEGRAM_BOT_POLLING=true
npm run start:local

# app, second terminal
npm run dev
```

Open `/login`, choose **Telegram**, press **Continue with Telegram**, press Start in the bot,
share or type a phone number, then tap the link it sends. Test: first signup (phone asked) to
onboarding; returning login (phone skipped) to dashboard; sharing someone else's contact
(refused); a number without a country code (asked again); a replayed deep link; a reused login
link; logout and a protected route.

## Known limitations

- No authenticated email/Google-to-Telegram account linking, and no verified contact-email
  upgrade for Telegram-created accounts.
- Emailed invitations cannot be matched to Telegram-created accounts.
- One bot serves every environment unless separate bots are created per environment.
