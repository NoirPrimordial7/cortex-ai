# ADR 0013 — One-turn conversation context

Recorded 2026-11-17, Asia/Calcutta. Status: implemented for local review.

Migration 0004 records per-user, per-tenant conversation hints in the same
SQLite database. A caller supplies an optional UUID v4. Use only the most
recent unexpired turn for an explicit follow-up. Shared UUIDs cannot cross
user or tenant boundaries. Query expiry limits context to seven days.

A turn stores a topic or authorized employee identifier and routing kind,
with no balance, name or document text in its memory row. Rerun current
document or ledger authorization for every follow-up. A recognized
contractor or full-time follow-up reuses the topic in the requested scope.
An unsupported scope such as HR asks for clarification.

The browser keeps a conversation ID in memory while the Assistant is open.
Leaving the page or an evidence invalidation starts a new conversation.
One-turn memory does not infer arbitrary dates, departments, or pronouns.
