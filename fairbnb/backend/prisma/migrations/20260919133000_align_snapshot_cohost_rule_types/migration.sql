-- Align co-host rule types in BookingFinanceSnapshot CHECK constraint
-- Drops existing restrictive constraint and re-creates it with all 4 authoritative rule types:
-- PERCENTAGE, FIXED_AMOUNT, CLEANING_FEE, CLEANING_FEE_PLUS_PERCENTAGE, plus legacy FIXED compatibility.

ALTER TABLE "BookingFinanceSnapshot" DROP CONSTRAINT IF EXISTS "chk_snapshot_cohost_rule_type_enum";

ALTER TABLE "BookingFinanceSnapshot" ADD CONSTRAINT "chk_snapshot_cohost_rule_type_enum"
  CHECK ("coHostRuleType" IS NULL OR "coHostRuleType" IN (
    'PERCENTAGE',
    'FIXED_AMOUNT',
    'CLEANING_FEE',
    'CLEANING_FEE_PLUS_PERCENTAGE',
    'FIXED'
  ));
