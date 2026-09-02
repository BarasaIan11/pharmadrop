# PharmaDrop — Technical Trade-offs & Architectural Decisions

This document outlines the three key architectural trade-offs made during the design and implementation of the **PharmaDrop** medicine delivery tracking system MVP.

---

## 1. Confirmation Code Security: Plaintext vs. Hashed Storage

### Decision:
The 4-digit confirmation code (`confirmation_code`) is generated at creation and stored as a plain text string field on the `Delivery` model rather than hashed (like a password with bcrypt/PBKDF2).

### Trade-off Rationale:
* **Pros**: 
  - Allows customers to view their exact 4-digit code directly on their order detail page (`/customer/orders/:id`) without needing complex reversible encryption keys.
  - Allows pharmacy staff and dispatchers to verify or troubleshoot missing code situations when a customer calls the station.
  - Enables simple 4-digit string equality matching (`code == delivery.confirmation_code`) during rider handoff.
* **Cons**:
  - Anyone with direct SQL database read access or full administrative permissions can inspect valid codes.
* **Mitigation**:
  - The API layer strictly restricts the `confirmation_code` field from being exposed in Rider view endpoints prior to delivery confirmation.
  - Attempt limiting locks the delivery after 3 failed attempts (`failed_code_attempts >= 3` sets `is_locked = True`), preventing brute-force enumeration attacks.

---

## 2. Architecture Scope: Single-Pharmacy MVP vs. Multi-Tenant Model

### Decision:
PharmaDrop is implemented as a single-pharmacy delivery system where all pharmacy staff and dispatchers share a single delivery database namespace, rather than a multi-tenant system with separate `Pharmacy` organization IDs.

### Trade-off Rationale:
* **Pros**:
  - Dramatically simplifies permissions, data models, and query filters for the MVP phase.
  - Eliminates multi-tenant routing, organization subdomains, and tenant isolation middleware complexity.
  - Focuses 100% of development effort on delivering a complete, robust happy-path delivery workflow across all 4 user roles.
* **Cons**:
  - Cannot support multiple competing pharmacy chains on a single hosted instance without data leakage.
* **Future Upgrade Path**:
  - Add a `Pharmacy` model and `pharmacy = FK(Pharmacy)` on `User` and `Delivery` models to enforce tenant scoping in DRF querysets.

---

## 3. Real-Time Tracking: HTTP REST Polling vs. WebSockets & SMS Integration

### Decision:
The system relies on RESTful HTTP API polling and explicit user actions rather than real-time WebSockets (Django Channels / Pusher) or SMS gateways (Twilio / Africa's Talking).

### Trade-off Rationale:
* **Pros**:
  - Zero external third-party API dependencies or paid SMS gateway costs required to run and test the complete system locally.
  - Avoids Redis / ASGI server deployment overhead (SQLite + standard WSGI DRF server runs seamlessly).
  - Simple, predictable state machine transitions driven by deterministic API requests.
* **Cons**:
  - Customers must refresh or navigate to see instant status changes unless client-side polling interval is enabled.
  - Customers receive their 4-digit code inside the web app UI rather than via SMS text message.
* **Future Upgrade Path**:
  - Integrate an SMS dispatch trigger on `DeliveryStatusEvent` creation (e.g. sending SMS when status changes to `OUT_FOR_DELIVERY` with code).

---

## Summary Matrix

| Domain | Selected Approach | High-Scale Production Alternative | Trade-off Benefit |
| :--- | :--- | :--- | :--- |
| **Code Security** | Plaintext + 3-Attempt Locking | Short-lived HMAC / Hashed PIN | Simple customer display & instant handoff verification |
| **Tenancy** | Single-Pharmacy Model | Multi-Tenant Organization FK | Streamlined MVP focus on core happy-path roles |
| **Live Updates** | DRF REST Endpoints | Django Channels + SMS Gateway | Zero external cost & 100% offline runnable demo |
