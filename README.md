# NVO Email Service

A reusable NestJS service for contact forms across multiple company websites. It
validates and stores submissions in PostgreSQL, queues delivery through Bull and
Redis, and sends formatted HTML and plain-text email through SMTP.

## Features

- Multi-site routing with a separate API key and recipient per website
- Required contact details: full name, email, phone number, and message
- Optional company and subject fields
- Idempotency protection against duplicate submissions
- PostgreSQL persistence and TypeORM migrations
- Redis-backed delivery queue with retries and exponential backoff
- Immediate `202 Accepted` response while queueing and delivery continue in the background
- HTML-safe responsive email template with a plain-text fallback
- Helmet, configurable CORS, request throttling, and consistent error responses
- OpenAPI documentation presented through Scalar at `/docs`
- Mailpit inbox for local SMTP testing without sending real email

## Documentation

- [Project guide](docs/PROJECT.md)
- [VPS production deployment](docs/VPS_DEPLOYMENT.md)
- [VPS deployment using only an IP address](docs/VPS_IP_DEPLOYMENT.md)
- Interactive API reference: `http://localhost:3000/docs`

## Requirements

- Node.js 24+
- npm
- Docker with the Compose plugin for local PostgreSQL, Redis, and Mailpit

## Local setup

```bash
cp .env.example .env
npm install
npm run services:up
```

Open:

- API: `http://localhost:3000`
- Scalar documentation: `http://localhost:3000/docs`
- Mailpit inbox: `http://localhost:8025`

This one command builds and starts the API, waits for PostgreSQL and Redis,
applies pending migrations, starts NestJS, and adds Mailpit for local SMTP. Mailpit
is defined only in `docker-compose.dev.yml` and must not be used in production.

## Test a contact submission

Configure a local site in `.env`:

```env
SITE_DELIVA_APIKEY=local-deliva-secret
SITE_DELIVA_RECIPIENT=contact@example.com
```

Submit a request:

```bash
curl --request POST 'http://localhost:3000/contact' \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: local-deliva-secret' \
  --header 'idempotency-key: contact-test-001' \
  --data-raw '{
    "siteId": "deliva",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+254700000000",
    "company": "Acme Ltd",
    "subject": "Website enquiry",
    "message": "Hello, I would like to learn more about your services."
  }'
```

Use a new `idempotency-key` for each new submission. Reusing one returns the
existing request and does not queue a duplicate email.

## Useful commands

```bash
npm run services:up     # Build/start API, PostgreSQL, Redis, and Mailpit
npm run services:down   # Stop the complete local stack
npm run services:logs   # Follow API container logs
npm run prod:up         # Build/start the production stack
npm run prod:down       # Stop the production stack
npm run prod:logs       # Follow production API logs
npm run migration:run  # Build and apply pending migrations
npm run migration:show # Show migration status
npm run build           # Compile the production application
npm run lint            # Run static analysis
npm test                # Run isolated unit tests
npm run test:cov        # Run tests with coverage
```

See [docs/PROJECT.md](docs/PROJECT.md) for configuration, architecture, API, and
troubleshooting details.
