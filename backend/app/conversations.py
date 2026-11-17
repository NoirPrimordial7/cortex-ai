"""Owner-scoped one-turn context. Stored hints never confer authorization."""

import re

from .security import execute, now, one, uid

FOLLOW_UP = re.compile(
    r"^\s*(?:and\b|(?:what|how) about\b|(?:does|did|is|was|will|would) (?:that|it|this)\b"
    r"|(?:as of|on)\s+\d|how many (?:days|are left)\b)",
    re.I,
)


def previous_turn(ctx, conversation_id):
    return one(
        ctx.db,
        """SELECT t.kind,t.topic,t.resolved_entity
        FROM conversation_turns t JOIN queries q
          ON q.tenant_id=t.tenant_id AND q.id=t.query_id AND q.user_id=t.user_id
        WHERE t.tenant_id=:tenant AND t.user_id=:user AND t.conversation_id=:conversation
          AND q.expires_at>:at
        ORDER BY t.created_at DESC,t.id DESC LIMIT 1""",
        **ctx.parameters(), conversation=str(conversation_id), at=now(),
    )


def remember(ctx, conversation_id, query_id, kind, topic, entity):
    execute(
        ctx.db,
        """INSERT INTO conversation_turns
        (id,tenant_id,user_id,conversation_id,query_id,kind,topic,resolved_entity,created_at)
        VALUES (:id,:tenant,:user,:conversation,:query,:kind,:topic,:entity,:at)""",
        **ctx.parameters(), id=uid(), conversation=str(conversation_id), query=query_id,
        kind=kind, topic=topic, entity=entity, at=now(),
    )
