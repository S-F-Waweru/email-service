# Project guide

## Purpose

NVO Email Service is a central contact-form backend for multiple websites. A
website sends a validated request to `POST /contact`; the service saves it,
queues a job, and returns immediately. A Bull worker then creates the email,
sends it through SMTP, and records whether delivery succeeded.

## Request flow

```text
Company website
  -> POST /contact
  -> validation, API-key check, throttling, and idempotency check
  -> PostgreSQL contact_requests row
  -> Redis/Bull mail job
  -> mail processor
  -> SMTP provider
  -> configured company recipient
```

PostgreSQL is the durable record. Redis holds asynchronous jobs. SMTP delivers
the message. All three services must be available for the full flow to work.

## Main directories

```text
src/
  common/       guards and global exception formatting
  config/       configured site lookup
  contact/      endpoint, DTO, persistence, and queue submission
  database/     TypeORM datasource and migrations
  mail/         Bull processor, SMTP client, and email template
  main.ts       application security, CORS, validation, and Scalar setup
docs/           project and deployment documentation
```

## Environment variables

Copy `.env.example` to `.env` for local development. Do not commit `.env` or
real credentials.

| Variable                        | Purpose                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| `PORT`                          | HTTP port; defaults to `3000`                                          |
| `DB_HOST`, `DB_PORT`            | PostgreSQL network address                                             |
| `DB_USER`, `DB_PASS`, `DB_NAME` | PostgreSQL credentials and database                                    |
| `REDIS_HOST`, `REDIS_PORT`      | Redis network address                                                  |
| `SMTP_HOST`, `SMTP_PORT`        | SMTP network address                                                   |
| `SMTP_SECURE`                   | `true` for implicit TLS, normally port 465; `false` for STARTTLS/local |
| `SMTP_USER`, `SMTP_PASS`        | SMTP credentials; blank for local Mailpit                              |
| `SMTP_FROM`                     | Sender name and address                                                |
| `CORS_ORIGINS`                  | Comma-separated website origins allowed by browsers                    |
| `THROTTLE_TTL_MS`               | Rate-limit time window in milliseconds                                 |
| `THROTTLE_LIMIT`                | Requests allowed per IP in the time window                             |
| `SITE_<NAME>_APIKEY`            | API key accepted for a configured site                                 |
| `SITE_<NAME>_RECIPIENT`         | Recipient for that site's contact messages                             |

The currently recognized site IDs are defined in `src/config/sites.config.ts`.
For example, body `siteId: "deliva"` uses `SITE_DELIVA_APIKEY` and
`SITE_DELIVA_RECIPIENT`. Both must exist or authentication fails.

An API key embedded in browser JavaScript can be inspected by visitors. Treat
these keys as site identifiers and abuse-control inputs, not as credentials that
can safely grant access to sensitive data. Keep throttling enabled and consider
CAPTCHA or server-side submission for sites that attract abuse.

## API

### Health check

```http
GET /
```

Returns `NVO Email Service is running` when the HTTP process is responding.

### Submit a contact request

```http
POST /contact
Content-Type: application/json
x-api-key: <site API key>
idempotency-key: <unique submission ID>
```

Minimum body:

```json
{
  "siteId": "deliva",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+254700000000",
  "message": "I would like to learn more about your services."
}
```

Optional body fields are `company` and `subject`. Generate one UUID when the
visitor starts a submission and reuse it only when retrying that same submission.
Generate a new idempotency key for a genuinely new message.

Typical success response:

```json
{
  "id": "contact-request-uuid",
  "status": "queued",
  "duplicate": false
}
```

Errors use a consistent body:

```json
{
  "statusCode": 400,
  "timestamp": "2026-09-24T08:03:57.311Z",
  "path": "/contact",
  "method": "POST",
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

## Local email testing

Start PostgreSQL, Redis, and Mailpit:

```bash
docker compose up -d postgres redis
npm run mailpit:up
```

Use these local SMTP values:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=NVO Contact <no-reply@nvo.local>
```

Open `http://localhost:8025` to inspect captured messages. Mailpit never belongs
in the production environment.

## Database migrations

Schema synchronization is disabled. Change the schema through migrations:

```bash
npm run migration:show
npm run migration:run
npm run migration:create -- src/database/migrations/AddField
npm run migration:generate -- src/database/migrations/AddField
npm run migration:revert
```

The production image automatically runs pending migrations immediately before
starting the API. Back up the database before deploying a destructive migration.

## Tests

Unit tests mock PostgreSQL, Redis, and SMTP, so supporting services are not needed:

```bash
npm test
npm run test:watch
npm run test:cov
```

Before merging or deploying, run:

```bash
npm run build
npm run lint
npm test
```

## Troubleshooting

### `Invalid API key or site`

- Confirm the body `siteId` is recognized.
- Confirm both site environment variables are set.
- Confirm `x-api-key` exactly matches the site key.
- Restart the API after changing `.env`.
- In Scalar, do not provide one value under Authentication and a different
  manual `x-api-key` header.

### `MaxRetriesPerRequestError`

Bull cannot connect to Redis. Confirm Redis is running and verify
`REDIS_HOST`/`REDIS_PORT`. Use `localhost` when Nest runs on the host and `redis`
when Nest runs inside the same Compose network.

### Request is queued but no message arrives

- Inspect the API/worker logs.
- Confirm SMTP host, port, TLS mode, and credentials.
- Confirm the recipient environment variable for the selected site.
- Inspect Mailpit at `http://localhost:8025` during local development.
- Check the `status` column in `contact_requests` for `sent` or `failed`.
