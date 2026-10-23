# ADR-008: Item photos stored in Postgres, served by a public route

## Context

Menu items need photos, uploaded from the menu manager. v1 has no object
storage / CDN credentials, and the app must work identically in the Base44
sandbox and on any managed Postgres (e.g. Neon).

## Decision

Store photo bytes in Postgres (`item_photos`, bytea), tenant-scoped through the
repo factory like every other tenant table. Serve them publicly at
`/api/photos/{id}` with immutable caching — ids are unguessable cuid2 and photos
are inherently public: the QR menu shows them to anonymous customers. Uploads
run through a `secureAction` validated by `src/lib/photo.ts`
(JPG/PNG/WebP ≤ 4 MB); the Server Action body limit is raised to 5 MB in
`next.config.ts`.

## Consequences

- No external storage dependency; works locally and on any managed Postgres.
- Replaced/deleted photos leave orphan rows — a future job can garbage-collect
  `item_photos` rows unreferenced by `menu_items.image_url`.
- Bytes are served through the Next.js process; move to object storage plus
  client/server-side resizing before heavy production traffic.
