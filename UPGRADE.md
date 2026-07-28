# Mercur 1.5.3 / Railway Bucket release notes

> [!WARNING]
> This repository is a new template release, not a supported in-place upgrade
> package for an existing production deployment. Existing installations should
> not replace their application or storage stack with this version without
> planning and testing a complete migration.

## Version boundary

This template upgrades all Mercur backend packages from 1.4.3 to 1.5.3 and all
Medusa framework packages from 2.10.2 to 2.11.3. Mercur 1.5.3's official
backend pins Medusa 2.11.3; these versions must move together.

Mercur 2.x is not used here because it is a major rearchitecture based on a
Bun monorepo, CLI-installed source blocks, and a different project ownership
model. Converting an existing 1.x deployment is a separate migration project,
not a safe template dependency update.

The crossed Mercur changelog sections are 1.4.4, 1.4.5, 1.4.6, 1.5.0, 1.5.1,
1.5.2, and 1.5.3:
https://github.com/mercurjs/mercur/blob/release/v1.5.4/CHANGELOG.md

The upstream backend reference used for dependency and module alignment is:
https://github.com/mercurjs/mercur/tree/release/v1.5.4/apps/backend

The later 1.5.4 source branch was reviewed but not selected: its workspace
versions were never published to npm (the public packages stop at 1.5.3), so
it cannot satisfy a clean lockfile installation for template users.

## Existing Railway projects

The recommended action for an existing production project is to keep it on its
current application version and MinIO services. Do not delete MinIO or point an
existing database at a fresh deployment of this template.

An upgrade is not straightforward because it crosses application and Medusa
versions, runs database migrations, changes the file provider, moves stored
objects, and changes media URLs persisted in PostgreSQL. Copying the objects
alone is insufficient.

If an existing project must be upgraded, deploy this template as a separate
Railway project or isolated environment first. Treat the move as a manual data
migration:

1. Leave the existing production project and MinIO services running and
   unchanged.
2. Deploy and validate a complete new stack from this template, including its
   Railway Bucket and read-only `Bucket-proxy` Function.
3. Back up the existing PostgreSQL database and MinIO data.
4. Develop and rehearse an application-specific migration for database data,
   object keys, and persisted media URLs.
5. Compare records, object counts, and representative storefront/admin/vendor
   workflows before directing any production traffic to the new stack.
6. Plan a maintenance window, final synchronization, cutover, and rollback.
7. Keep the old stack available until the new deployment has been verified for
   an appropriate rollback period.

This repository does not provide an automated migration utility and cannot
guarantee compatibility with customized deployments. Users who are not
prepared to perform and validate this migration should not upgrade an existing
project; they should use this release only for new deployments.

## Security model

The Bucket stays private. Backend uploads use `S3_ENDPOINT`; public URLs use
`S3_FILE_URL`. The Function streams reads and never exposes credentials or
implements anonymous writes. Railway Bucket receives neither ACL headers nor
forced path-style addressing.
