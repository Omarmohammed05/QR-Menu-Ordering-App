# ADR 003: Email delivery deferred out of v1

## Context

Spec requires owner email verification and password reset, but no email
provider exists in the stack for v1 and none can run in the sandbox.

## Decision

No email provider in v1. Invitation links are shown to the inviting admin
(once, copyable); dev password-reset links are logged (token only, no PII).
Email verification is disabled; reset stays functional via the logged link.
A provider slots into `sendResetPassword` + an invitation send hook later.

## Consequences

Flows work end to end in dev/sandbox; production hardening must add a real
provider before public launch. Nothing user-facing pretends an email was sent.
