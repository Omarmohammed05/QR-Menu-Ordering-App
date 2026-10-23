# ADR-007: Orders v1 hand off via WhatsApp deep link

## Context
Restaurants need orders without us building order tracking, payments, or
notifications in v1. Every restaurant already has a WhatsApp number in the
schema (`restaurants.whatsapp_number`).

## Decision
The public menu builds a client-side cart (in-memory only) and the "order"
button opens a `wa.me/<number>` deep link whose text is the localized,
itemized order. No order record is persisted server-side.

## Consequences
- No order history/analytics in v1; the WhatsApp chat is the source of truth.
- A stored phone number is required for ordering: without one, and when
  `accepting_orders` is off, the public menu stays browse-only.
- v2 can add persisted orders without changing the customer flow.
