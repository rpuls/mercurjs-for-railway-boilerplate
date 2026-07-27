# Repository guidance

- This is an isolated four-app Railway template, not a git fork of Mercur's
  current monorepo. Each app has its own lockfile and Railway root directory.
- Mercur 1.5.3 intentionally pairs with Medusa 2.11.3. Do not independently
  bump Medusa packages or mix their patch versions.
- `S3_ENDPOINT` is private backend-to-bucket traffic; `S3_FILE_URL` is the
  browser-facing read-only Railway Function. Railway service references are
  case-sensitive: the expected Function name is `Bucket-proxy`.
- Railway Bucket does not support ACL headers. Keep `acl: false`, and do not
  enable path-style addressing unless using the local MinIO emulator or a
  legacy MinIO deployment.
- Production intentionally refuses local file storage. Storage parsing and
  validation lives in `backend/src/config/storage.ts`.
- `compose.yaml` is the deterministic Railway-like debug environment. MinIO is
  only an S3 protocol emulator; the backend always uses Medusa's stock S3
  provider.
- The backend launcher is supplied by `medusajs-launch-utils`. When it masks a
  failure, run its child migration/seed/admin commands directly to preserve
  stdout and stderr.
- Mercur 1.5.3's core payout module constructs Stripe unconditionally. When no
  real key is configured, `medusa-config.ts` installs an internal non-secret
  placeholder solely to keep the demo bootable and selects Medusa's manual
  payment provider. Never treat that placeholder as functioning Stripe.
  Checkout and connected-account webhooks use separate `STRIPE_WEBHOOK_SECRET`
  and `STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET` values.
