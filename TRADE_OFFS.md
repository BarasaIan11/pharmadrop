# PharmaDrop - Technical Trade-offs and Architectural Decisions

This document records the main implementation choices in the current PharmaDrop MVP, including their benefits, limitations, and likely next steps.

## 1. Delivery PIN: Reversible encryption vs. one-way hashing

### Decision

Each delivery receives a random four-digit confirmation PIN. It is encrypted with Fernet before storage in `Delivery.encrypted_code`; the encryption key is derived from `DJANGO_SECRET_KEY`. The plaintext PIN is revealed only to the order's customer and pharmacy staff through the API. Riders receive `****` and submit the customer-provided PIN to complete delivery.

### Why this was chosen

- A customer needs to retrieve the PIN after delivery creation, which a password-style hash cannot support.
- Encryption protects the PIN from casual database inspection while retaining handoff verification.
- Three failed attempts lock the order and create an audit event, limiting online PIN guessing.

### Costs and safeguards

- This is reversible protection: anyone with the encrypted value and Django secret can decrypt the PIN. The secret must be managed and rotated carefully.
- A four-digit PIN has limited entropy; authentication, role checks, edge rate limiting, and the three-attempt lock remain essential.
- PIN visibility is deliberately role-specific and must not be added to rider serializers or logs.

### Future direction

Use a short-lived, purpose-specific encryption key managed by a KMS, and add a dispatcher-controlled PIN unlock/reissue workflow delivered through a verified customer channel.

## 2. Pharmacy tenancy: Shared application, pharmacy-scoped records

### Decision

Pharmacies are first-class records. Staff, dispatchers, riders, and deliveries link to a `Pharmacy`; operational delivery and available-rider queries are filtered to the authenticated user's pharmacy. Rider assignment also rejects riders from another pharmacy.

### Why this was chosen

- One deployment can serve multiple pharmacy locations or organisations without duplicating the application.
- The model keeps operational data separated while staying simple enough for a single Django database and DRF query layer.
- Private Pusher channels use the pharmacy identifier, matching the API data boundary.

### Costs and safeguards

- This is application-level tenancy, not database-per-tenant isolation. An omitted queryset filter could expose cross-pharmacy data.
- Customers are global user accounts, so their delivery list is scoped by customer rather than pharmacy.
- Every operational endpoint needs the same pharmacy scope and cross-pharmacy authorization tests.

### Future direction

Centralize tenant scoping in queryset helpers or managers, expand tenant-focused tests, and consider database row-level security or isolated databases when stronger isolation is required.

## 3. Live tracking: Optional Pusher plus REST polling

### Decision

The REST API is the source of truth. When Pusher credentials are configured, the backend publishes delivery events to authenticated, pharmacy-specific private channels. Operational dashboards also refresh delivery data every 30 seconds as a fallback.

### Why this was chosen

- The complete workflow runs locally and in Docker without a message broker or realtime vendor account.
- Pusher provides near-instant updates without adding Django Channels, Redis, and persistent WebSocket infrastructure.
- Polling reconciles missed events and remains useful when a realtime connection fails.

### Costs and safeguards

- Pusher is an external dependency when enabled, with vendor cost and availability considerations.
- Polling trades immediacy for simplicity and creates periodic API load.
- Events are advisory; clients should refetch data and the API remains authoritative for every state transition.

### Future direction

Add event-delivery and polling observability, tune polling by dashboard visibility, and adopt a queue-backed realtime architecture if operational volume warrants it. Customer notifications should use an opt-in, audited SMS or WhatsApp provider.

## 4. Deployment: Containerized PostgreSQL vs. managed services

### Decision

The reference deployment uses Docker Compose with PostgreSQL, Django/Gunicorn, and an Nginx-served frontend. Django uses SQLite only when `DJANGO_DEBUG=true` and no `DATABASE_URL` is set.

### Why this was chosen

- The stack is reproducible and close to production behavior.
- PostgreSQL is better suited than SQLite for concurrent operational use.
- Nginx provides a same-origin `/api/` proxy, reducing browser CORS complexity.

### Costs and safeguards

- A Compose host still needs backups, TLS termination, monitoring, patching, and secrets management.
- PostgreSQL must not be publicly exposed.
- `seed_data` deletes application data before recreating demo records, so it is strictly a development/demo command.

### Future direction

Move stateful services to managed PostgreSQL, place the application behind a TLS-enabled load balancer, store secrets in a dedicated manager, and automate backup plus restore testing.

## Summary matrix

| Domain | Current approach | Main benefit | Primary limitation |
| --- | --- | --- | --- |
| Delivery PIN | Fernet-encrypted, role-limited four-digit PIN with lockout | Customer can retrieve the PIN without plaintext database storage | Reversible; low PIN entropy |
| Tenancy | Pharmacy foreign keys and scoped API querysets | Multi-pharmacy operation in one deployment | Isolation depends on correct application enforcement |
| Live updates | Optional Pusher private channels plus REST polling | Realtime when configured and resilient fallback | Vendor dependency and polling overhead |
| Deployment | Docker Compose with PostgreSQL | Reproducible, production-like stack | Host operations remain the deployer's responsibility |
