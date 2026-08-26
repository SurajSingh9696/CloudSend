# CloudSend

A private, account-free file and text sharing service with a six-digit retrieval code. The interface is styled as a paper ledger, while the API stores metadata in MongoDB and binary files byte-for-byte in GridFS.

## Run locally

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to a MongoDB instance.
2. Optionally set `CRON_SECRET` if you plan to trigger the cleanup endpoint.
3. Run `npm install`.
4. Run `npm run dev`, then open `http://localhost:3000`.

## Included safeguards

- File uploads are capped at 25 MB on both client and server.
- Codes are generated as six-digit values, checked for collisions, and protected by a unique MongoDB index.
- Retrieval attempts are rate-limited to 10 per IP per minute.
- File responses preserve the original MIME type and use `Content-Disposition: attachment` for an unchanged download.
- Expirations are enforced at read time and indexed with MongoDB TTL.
- Burn-after-download records are atomically claimed before streaming.
# CloudSend
