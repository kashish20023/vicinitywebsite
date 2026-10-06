# Secret Rotation Plan — Fairbnb V2 Trust & Safety

**Last Updated:** 2026-10-01 (Checkpoint 17 / Corrective Pass)  
**Status:** Active — corrected to remove credential leakage risk

> CRITICAL RULE: This document MUST NOT contain any raw credential values, signing key content,
> password strings, or token values. All references below are to environment variable names only.
> Never print environment secrets, token values or credentials.

---

## 1. Managed Secrets

| Secret Name | Environment Variable | Usage | Rotation Frequency |
|---|---|---|---|
| Evidence Encryption Key | `V2_EVIDENCE_KEY` | AES-256-GCM evidence encryption in PostgresTrustSafetyRepository | 90 days or on suspected leak |
| JWT Signing Secret | `JWT_SECRET` | NestJS JwtModule — signs all access tokens | 180 days or on suspected leak |
| Database Password | `DATABASE_URL` | Contains encoded password in connection string | 90 days or on suspected leak |
| Admin API Key (if used) | `ADMIN_API_KEY` | Internal admin-to-admin API calls | 90 days |

---

## 2. Rotation vs Revocation Distinction

### Rotation (Planned)
Rotation replaces a secret while maintaining service continuity:
1. Generate new secret value in secure credential store (e.g., Vault, AWS Secrets Manager)
2. Update environment variable in deployment (Kubernetes Secret, .env.production)
3. Roll deployment (zero-downtime rolling restart)
4. Verify service healthy on new secret
5. Expire old secret (after verifying no in-flight tokens/sessions are still using old signing key)

### Revocation (Emergency)
Revocation immediately invalidates a secret on suspected leak:
1. **Immediately** rotate secret in credential store (as above)
2. **Simultaneously** invalidate all existing sessions:
   - JWT: Update `JWT_SECRET` causes all signed tokens to fail verification immediately
   - Database: Revoke old DB user password; all existing connections fail at next query
3. Force re-login for all active sessions
4. Review audit logs for unauthorized access in the period since last known-good rotation

---

## 3. Evidence Key (`V2_EVIDENCE_KEY`) Rotation

Evidence encrypted with old key version (`v1`) must remain decryptable during transition:

1. Add new key to credential store → assign version `v2`
2. Set `V2_EVIDENCE_KEY=<new-value>` AND `V2_EVIDENCE_KEY_PREV=<old-value>` in deployment
3. Update `PostgresTrustSafetyRepository.decryptEvidence()`:
   - Try `V2_EVIDENCE_KEY` first
   - Fall back to `V2_EVIDENCE_KEY_PREV` if auth tag fails
4. Re-encrypt all stored evidence with new key (background migration job; not a migration script)
5. Once re-encryption complete, remove `V2_EVIDENCE_KEY_PREV` from deployment

> **Note:** The key_version column in ts_moderation_cases tracks which version encrypted each row.

---

## 4. JWT Secret Rotation

**Corrective fix applied:** Previous versions of test scripts used hardcoded JWT secrets in scripts.
All test scripts now use `process.env.JWT_SECRET` exclusively.

Rotation procedure:
1. Generate cryptographically random secret ≥ 256 bits
2. Update `JWT_SECRET` in all deployment environments simultaneously
3. All in-flight JWTs become invalid immediately (users re-authenticate)
4. Verify no hardcoded copies in: source files, log files, test scripts, documentation

**Audit check (run before/after rotation):**
```
# Check for hardcoded JWT patterns (must return zero matches)
git grep -r "jwt" --include="*.ts" --include="*.js" --include="*.env" | grep -v ".env.example"
```
> Result must not show any literal secret values. Variable names (`JWT_SECRET`) are acceptable.

---

## 5. No Credentials in Source Code Policy

The following practices are MANDATORY:
- Signing keys and passwords: referenced ONLY via environment variables
- `.env` files: in `.gitignore`; never committed
- Test files: use `process.env.JWT_SECRET` (not hardcoded values)
- Documentation: use `<redacted>` or `$ENV_VAR_NAME` placeholders only
- Audit logs, error messages, and stack traces: masked snippets only (not raw phone numbers or raw evidence)

**Violation response:**
If a credential is found in git history:
1. Immediately revoke the exposed credential (emergency rotation above)
2. `git filter-repo` to remove from history (coordinate with all clones)
3. Post-mortem and corrective action
