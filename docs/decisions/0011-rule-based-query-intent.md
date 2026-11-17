# ADR 0011 — Rule-based query intent

Recorded 2026-11-17, Asia/Calcutta. Status: implemented for local review.

Classify prompts as policy fact, policy search, personal leave or unknown
using explicit token and phrase rules. Personal leave has precedence. The
original finite topic detector still identifies the strict policy fact slot.
Broad commands and specific leave categories such as maternity or sick leave
retrieve reviewed passages without promoting them to numeric entitlements.
Every route can return related policy passages. This is a rule-based
classifier with explicit test cases and no training data or new table.
