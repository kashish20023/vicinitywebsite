# Studio I Coworking Platform — Finance & Settlement Reconciliation Report

**Run ID**: `2026-09-22-final-run`  
**Finance Mode**: Studio I Direct Merchant Collection Mode (Active)  
**Beneficiary Mode**: Disabled by Default (Simulated QA Acceptance Environment Available)

---

## 1. Direct Merchant Financial Position

Based on live PostgreSQL queries against `BookingFinanceSnapshot` and `PaymentOrder`:

| Financial Ledger Component | Amount (Paise) | Display Amount (INR) | Accounting Category |
| :--- | :--- | :--- | :--- |
| **Gross Customer Payments** | 52,994 paise | ₹529.94 | Asset (Operating Bank Account) |
| **Promotional Coupon Discounts** | 4,990 paise | ₹49.90 | Marketing Expense |
| **GST Output Tax (18%)** | 8,084 paise | ₹80.84 | Liability (Govt Tax Payable) |
| **Refundable Security Deposits** | 0 paise | ₹0.00 | Liability (Member Escrow) |
| **Simulated Gateway Fee (1.5%)** | 795 paise | ₹7.95 | Operating Expense |
| **Net Realized Coworking Revenue** | 44,115 paise | ₹441.15 | Net Operating Income |
| **Refunds Disbursed to Date** | 0 paise | ₹0.00 | Contra Revenue |
| **Reconciled Bank Balance** | 44,115 paise | ₹441.15 | Net Retained Earnings |

### Balance Invariant Check
$$\text{Gross} - \text{GST} - \text{Deposit} - \text{GatewayFee} - \text{Refunds} = \text{Net Revenue}$$
$$52,994 - 8,084 - 0 - 795 - 0 = 44,115 \quad (\text{BALANCED})$$

---

## 2. Beneficiary Settlements (Adapted from FairBnB)

- **Default Operational State**: Strictly **DISABLED**. All coworking revenue flows directly to Studio I as the exclusive direct merchant.
- **Configurable Property Sharing**: An isolated administrative toggle exists under `/admin/finance` allowing property owner revenue-sharing simulations without modifying production ledgers.
- **Simulated Agreement**:
  - Code: `AGR-LH-2026-V1` (Lehariya Campus Flagship Agreement).
  - Allocation Basis: 80% Net Realized Collection after GST and deposits.
  - Calculated Simulated Payout: ₹352.92 [SIMULATED].
  - Transfer Intent State: Verified idempotent authorization and execution.
