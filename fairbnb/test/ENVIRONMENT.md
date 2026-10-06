# QA Audit Test Environment & Isolation Configuration

## Run Metadata
- **Audit Run ID**: `run-20260921-1150`
- **Execution Date**: `2026-09-21T11:57:00+05:30`
- **Execution Target**: Primary Repository (`C:\Users\shubham\fairbnb--new`)
- **Git Branch**: `govind-temp`
- **Git HEAD**: `bef83941c10eb3da34d6f519c77bd117874e7d33`
- **Operating System**: Windows (Win32 x64)
- **Node.js**: `v24.18.0`
- **npm**: `11.16.0`

## Process Tree & Port Isolation
| Service | Role | Port | Process ID | Target URL / Connection |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | Database Server | `5433` | System Service | `localhost:5433` |
| **Backend API** | Test Application Process | `5010` | 30108 | `http://localhost:5010` |
| **Frontend UI** | Test Next.js App | `3010` | 9944 | `http://localhost:3010` |

*Shared database `fairbnb_db` and user manual review DB `fairbnb_demo_manual` remain untouched and isolated.*

## Database Isolation & Ownership Verification
- **Target Database**: `fairbnb_qa_audit_run_20260921_1150`
- **Migrations Applied**: 12 migrations applied from scratch via `prisma migrate deploy`:
  - `20260821050705_init_user_and_property`
  - `20260915143000_normalize_refund_status_casing`
  - `20260917150000_add_booking_finance_snapshot`
  - `20260917173000_add_missing_cohost_payout_history`
  - `20260919133000_align_snapshot_cohost_rule_types`
  - `20260919143000_add_payout_settlement_refund_models`
  - `20260919171000_add_user_cohost_code_and_revocation`
  - `20260919220000_add_reels_module`
  - `20260920200000_add_reels_analytics`
  - `20260920220000_add_reels_moderation`
  - `20260920230000_add_reels_performance_indexes`
  - `20260920240000_add_reels_ranking_score`
- **Exclusive Ownership Markers**:
  - `SystemSetting.QA_AUDIT_EXCLUSIVE_ID = 'fairbnb_qa_audit_run_20260921_1150'`
  - `SystemSetting.QA_AUDIT_RUN_ID = 'run-20260921-1150'`

## Test Roles & Credentials
| Role | User ID | Email | Phone | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `usr_qa_admin_run-20260921-1150` | `admin.qa@fairbnb.test` | `+919876000001` | `QaAudit@2026!` |
| **Host Alpha** | `usr_qa_host_a_run-20260921-1150` | `hosta.qa@fairbnb.test` | `+919876000002` | `QaAudit@2026!` |
| **Host Beta** | `usr_qa_host_b_run-20260921-1150` | `hostb.qa@fairbnb.test` | `+919876000003` | `QaAudit@2026!` |
| **Co-Host** | `usr_qa_cohost_run-20260921-1150` | `cohost.qa@fairbnb.test` | `+919876000004` | `QaAudit@2026!` |
| **Guest** | `usr_qa_guest_run-20260921-1150` | `guest.qa@fairbnb.test` | `+919876000005` | `QaAudit@2026!` |

## External Service Mocks
- **Cashfree Payouts**: `CASHFREE_ENV=MOCK`, `CASHFREE_PAYOUTS_ENABLED=true` (Simulation engine returns deterministic `cf_tx_mock_<timestamp>_<id>`).
- **Payments Gateway**: `MOCK_RAZORPAY`. Zero external bank/payment calls.
