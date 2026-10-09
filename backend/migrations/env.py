from alembic import context
from app.db import engine_for, metadata
from app.settings import Settings

connection = context.config.attributes.get("connection")
if connection is not None:
    context.configure(connection=connection, target_metadata=metadata)
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine_for(Settings.from_env().db_path).connect() as connection:
        context.configure(connection=connection, target_metadata=metadata)
        with context.begin_transaction():
            context.run_migrations()
