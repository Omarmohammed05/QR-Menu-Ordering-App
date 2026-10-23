# ADR-006: Public menu route

## Context
Customers reach a restaurant's menu by scanning a QR code. The URL must be
guessable, locale-negotiable, and work for signed-out visitors. Restaurants can
be suspended by the platform admin; menu items can be marked unavailable.

## Decision
- Public menu lives at `/{locale}/menu/{slug}`, served by a server component
  reading the same `listMenu` service the manage screen uses — no separate
  read model yet.
- Suspended or unknown slugs return 404, so probing reveals nothing about
  suspended tenants.
- Unavailable items are hidden from customers (staff still sees them in the
  manage screen); categories left with zero visible items are hidden.
- Item images render as plain `<img>`: URLs are arbitrary external hosts, and
  `next/image` would require allowlisting every restaurant's image host.

## Consequences
- The page is server-rendered per request; fine until traffic demands caching.
- First scan gets the locale from next-intl negotiation (cookie →
  Accept-Language → `ar`), ignoring the restaurant's `defaultLocale`; revisit
  when QR generation lands.
