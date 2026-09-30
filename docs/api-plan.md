# Future contract, not implemented in phase 1

POST /api/qr-requests (patient), POST /api/qr-requests/claim (clinician), POST /api/grants/approve (patient), POST /api/grants/:id/revoke (patient), GET /api/records/:patientId?sections=... (clinician), GET /api/access-events (patient).

The future clinician record endpoint must be distinct from own-patient section CRUD. Every clinician GET verifies session, clinician binding, patient, active/unexpired/unrevoked grant and requested-section subset before fetching values.

QR: random opaque token only; server stores hash; about 60 seconds expiry; atomic unclaimed -> claimed. Claim reveals no health data. Patient approves displayed claimant and fixed section set. Grant demo default: 10 minutes. Change sections via a new request, not silent grant widening. Rate-limit claims; deny EXPIRED, USED, NOT_APPROVED, REVOKED and FORBIDDEN. Audit outcomes without token or values.
