# ADR 002: Invite-only signup

## Context

Spec gate says "sign-up flows work", but the product defines no public
self-signup anywhere; customers have no accounts and owners are created by the
platform admin.

## Decision

The only account-creation path is invitation acceptance
(`/accept-invite?token=...`): Better Auth `signUpEmail` runs inside the
accept-transaction flow. "Sign-up" in the gate = accepting an invitation.

## Consequences

No open registration endpoint to abuse; enumeration surface is limited to the
unguessable invitation token (hash stored, 72h TTL, single use, FOR UPDATE
claim).
