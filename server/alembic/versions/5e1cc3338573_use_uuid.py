"""use uuid

Revision ID: 5e1cc3338573
Revises: e69bb172688b
Create Date: 2024-06-23 14:38:09.840262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5e1cc3338573'
down_revision: Union[str, None] = 'e69bb172688b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def drop_foreign_key_constraints():
    op.drop_constraint('project_session_id_fkey', 'project', type_='foreignkey')
    op.drop_constraint('project_analysis_run_project_id_fkey', 'project_analysis_run', type_='foreignkey')
    op.drop_constraint('project_tag_project_id_fkey', 'project_tag', type_='foreignkey')
    op.drop_constraint('view_project_analysis_run_id_fkey', 'view', type_='foreignkey')
    op.drop_constraint('aspect_project_analysis_run_id_fkey', 'aspect', type_='foreignkey')
    op.drop_constraint('aspect_view_id_fkey', 'aspect', type_='foreignkey')
    op.drop_constraint('chat_project_id_fkey', 'chat', type_='foreignkey')
    op.drop_constraint('chat_message_chat_id_fkey', 'chat_message', type_='foreignkey')
    op.drop_constraint('conversation_project_id_fkey', 'conversation', type_='foreignkey')
    op.drop_constraint('conversation_chunk_conversation_id_fkey', 'conversation_chunk', type_='foreignkey')
    op.drop_constraint('document_project_id_fkey', 'document', type_='foreignkey')
    op.drop_constraint('insight_project_analysis_run_id_fkey', 'insight', type_='foreignkey')
    op.drop_constraint('project_conversation_tag_association_conversation_id_fkey', 'project_conversation_tag_association', type_='foreignkey')
    op.drop_constraint('project_conversation_tag_association_project_tag_fkey', 'project_conversation_tag_association', type_='foreignkey')
    op.drop_constraint('quote_conversation_id_fkey', 'quote', type_='foreignkey')
    op.drop_constraint('quote_insight_id_fkey', 'quote', type_='foreignkey')
    op.drop_constraint('quote_project_analysis_run_id_fkey', 'quote', type_='foreignkey')
    op.drop_constraint('quote_aspect_association_aspect_id_fkey', 'quote_aspect_association', type_='foreignkey')
    op.drop_constraint('quote_aspect_association_quote_id_fkey', 'quote_aspect_association', type_='foreignkey')
    op.drop_constraint('representative_quote_aspect_association_aspect_id_fkey', 'representative_quote_aspect_association', type_='foreignkey')
    op.drop_constraint('representative_quote_aspect_association_quote_id_fkey', 'representative_quote_aspect_association', type_='foreignkey')
    op.drop_constraint('chat_conversation_association_chat_id_fkey', 'chat_conversation_association', type_='foreignkey')
    op.drop_constraint('chat_conversation_association_conversation_id_fkey', 'chat_conversation_association', type_='foreignkey')
    op.drop_constraint('chat_resource_association_chat_id_fkey', 'chat_resource_association', type_='foreignkey')
    op.drop_constraint('chat_resource_association_resource_id_fkey', 'chat_resource_association', type_='foreignkey')
    op.drop_constraint('conversation_chunk_quote_association_conversation_chunk_id_fkey', 'conversation_chunk_quote_association', type_='foreignkey')
    op.drop_constraint('conversation_chunk_quote_association_quote_id_fkey', 'conversation_chunk_quote_association', type_='foreignkey')


def add_foreign_key_constraints():
    op.create_foreign_key('project_session_id_fkey', 'project', 'session', ['session_id'], ['id'])
    op.create_foreign_key('project_analysis_run_project_id_fkey', 'project_analysis_run', 'project', ['project_id'], ['id'])
    op.create_foreign_key('project_tag_project_id_fkey', 'project_tag', 'project', ['project_id'], ['id'])
    op.create_foreign_key('view_project_analysis_run_id_fkey', 'view', 'project_analysis_run', ['project_analysis_run_id'], ['id'])
    op.create_foreign_key('aspect_project_analysis_run_id_fkey', 'aspect', 'project_analysis_run', ['project_analysis_run_id'], ['id'])
    op.create_foreign_key('aspect_view_id_fkey', 'aspect', 'view', ['view_id'], ['id'])
    op.create_foreign_key('chat_project_id_fkey', 'chat', 'project', ['project_id'], ['id'])
    op.create_foreign_key('chat_message_chat_id_fkey', 'chat_message', 'chat', ['chat_id'], ['id'])
    op.create_foreign_key('conversation_project_id_fkey', 'conversation', 'project', ['project_id'], ['id'])
    op.create_foreign_key('conversation_chunk_conversation_id_fkey', 'conversation_chunk', 'conversation', ['conversation_id'], ['id'])
    op.create_foreign_key('document_project_id_fkey', 'document', 'project', ['project_id'], ['id'])
    op.create_foreign_key('insight_project_analysis_run_id_fkey', 'insight', 'project_analysis_run', ['project_analysis_run_id'], ['id'])
    op.create_foreign_key('project_conversation_tag_association_conversation_id_fkey', 'project_conversation_tag_association', 'conversation', ['conversation_id'], ['id'])
    op.create_foreign_key('project_conversation_tag_association_project_tag_fkey', 'project_conversation_tag_association', 'project_tag', ['project_tag'], ['id'])
    op.create_foreign_key('quote_conversation_id_fkey', 'quote', 'conversation', ['conversation_id'], ['id'])
    op.create_foreign_key('quote_insight_id_fkey', 'quote', 'insight', ['insight_id'], ['id'])
    op.create_foreign_key('quote_project_analysis_run_id_fkey', 'quote', 'project_analysis_run', ['project_analysis_run_id'], ['id'])
    op.create_foreign_key('quote_aspect_association_aspect_id_fkey', 'quote_aspect_association', 'aspect', ['aspect_id'], ['id'])
    op.create_foreign_key('quote_aspect_association_quote_id_fkey', 'quote_aspect_association', 'quote', ['quote_id'], ['id'])
    op.create_foreign_key('representative_quote_aspect_association_aspect_id_fkey', 'representative_quote_aspect_association', 'aspect', ['aspect_id'], ['id'])
    op.create_foreign_key('representative_quote_aspect_association_quote_id_fkey', 'representative_quote_aspect_association', 'quote', ['quote_id'], ['id'])
    op.create_foreign_key('chat_conversation_association_chat_id_fkey', 'chat_conversation_association', 'chat', ['chat_id'], ['id'])
    op.create_foreign_key('chat_conversation_association_conversation_id_fkey', 'chat_conversation_association', 'conversation', ['conversation_id'], ['id'])
    op.create_foreign_key('chat_resource_association_chat_id_fkey', 'chat_resource_association', 'chat', ['chat_id'], ['id'])
    op.create_foreign_key('chat_resource_association_resource_id_fkey', 'chat_resource_association', 'document', ['resource_id'], ['id'])
    op.create_foreign_key('conversation_chunk_quote_association_conversation_chunk_id_fkey', 'conversation_chunk_quote_association', 'conversation_chunk', ['conversation_chunk_id'], ['id'])
    op.create_foreign_key('conversation_chunk_quote_association_quote_id_fkey', 'conversation_chunk_quote_association', 'quote', ['quote_id'], ['id'])

def alter_column_to_uuid(table_name, column_name, nullable=False):
    print(f'ALTER TABLE {table_name} ALTER COLUMN {column_name} TYPE UUID USING {column_name}::uuid')
    op.execute(f'ALTER TABLE {table_name} ALTER COLUMN {column_name} TYPE UUID USING {column_name}::uuid')
    if nullable:
        op.alter_column(table_name, column_name, existing_type=sa.UUID(), nullable=True)
    else:
        op.alter_column(table_name, column_name, existing_type=sa.UUID(), nullable=False)

def upgrade() -> None:
    # Drop foreign key constraints first
    drop_foreign_key_constraints()

    # Alter columns to UUID
    alter_column_to_uuid('aspect', 'id', nullable=False)
    alter_column_to_uuid('aspect', 'view_id', nullable=True)
    alter_column_to_uuid('aspect', 'project_analysis_run_id', nullable=True)
    alter_column_to_uuid('chat', 'id', nullable=False)
    alter_column_to_uuid('chat', 'project_id', nullable=True)
    alter_column_to_uuid('chat_conversation_association', 'chat_id', nullable=False)
    alter_column_to_uuid('chat_conversation_association', 'conversation_id', nullable=False)
    alter_column_to_uuid('chat_message', 'id', nullable=False)
    alter_column_to_uuid('chat_message', 'chat_id', nullable=False)
    alter_column_to_uuid('chat_resource_association', 'chat_id', nullable=False)
    alter_column_to_uuid('chat_resource_association', 'resource_id', nullable=False)
    alter_column_to_uuid('conversation', 'id', nullable=False)
    alter_column_to_uuid('conversation', 'project_id', nullable=False)
    alter_column_to_uuid('conversation_chunk', 'id', nullable=False)
    alter_column_to_uuid('conversation_chunk', 'conversation_id', nullable=False)
    alter_column_to_uuid('conversation_chunk_quote_association', 'conversation_chunk_id', nullable=False)
    alter_column_to_uuid('conversation_chunk_quote_association', 'quote_id', nullable=False)
    alter_column_to_uuid('document', 'id', nullable=False)
    alter_column_to_uuid('document', 'project_id', nullable=False)
    alter_column_to_uuid('insight', 'id', nullable=False)
    alter_column_to_uuid('insight', 'project_analysis_run_id', nullable=True)
    alter_column_to_uuid('project', 'id', nullable=False)
    alter_column_to_uuid('project_analysis_run', 'id', nullable=False)
    alter_column_to_uuid('project_analysis_run', 'project_id', nullable=False)
    alter_column_to_uuid('project_conversation_tag_association', 'conversation_id', nullable=False)
    alter_column_to_uuid('project_conversation_tag_association', 'project_tag', nullable=False)
    alter_column_to_uuid('project_tag', 'id', nullable=False)
    alter_column_to_uuid('project_tag', 'project_id', nullable=False)
    alter_column_to_uuid('quote', 'id', nullable=False)
    alter_column_to_uuid('quote', 'conversation_id', nullable=False)
    alter_column_to_uuid('quote', 'insight_id', nullable=True)
    alter_column_to_uuid('quote', 'project_analysis_run_id', nullable=True)
    alter_column_to_uuid('quote_aspect_association', 'quote_id', nullable=False)
    alter_column_to_uuid('quote_aspect_association', 'aspect_id', nullable=False)
    alter_column_to_uuid('representative_quote_aspect_association', 'quote_id', nullable=False)
    alter_column_to_uuid('representative_quote_aspect_association', 'aspect_id', nullable=False)
    alter_column_to_uuid('view', 'id', nullable=False)
    alter_column_to_uuid('view', 'project_analysis_run_id', nullable=True)
    # Re-add foreign key constraints
    add_foreign_key_constraints()

def alter_column_to_varchar(table_name, column_name, nullable=False):
    print(f'{table_name} {column_name} {nullable}')
    op.alter_column(table_name, column_name,
                    existing_type=sa.UUID(),
                    type_=sa.VARCHAR(),
                    existing_nullable=nullable)

def downgrade() -> None:
    # Drop foreign key constraints first
    drop_foreign_key_constraints()

    # Alter columns to VARCHAR
    alter_column_to_varchar('view', 'project_analysis_run_id', nullable=True)
    alter_column_to_varchar('view', 'id', nullable=False)
    alter_column_to_varchar('representative_quote_aspect_association', 'aspect_id', nullable=False)
    alter_column_to_varchar('representative_quote_aspect_association', 'quote_id', nullable=False)
    alter_column_to_varchar('quote_aspect_association', 'aspect_id', nullable=False)
    alter_column_to_varchar('quote_aspect_association', 'quote_id', nullable=False)
    alter_column_to_varchar('quote', 'project_analysis_run_id', nullable=True)
    alter_column_to_varchar('quote', 'insight_id', nullable=True)
    alter_column_to_varchar('quote', 'conversation_id', nullable=False)
    alter_column_to_varchar('quote', 'id', nullable=False)
    alter_column_to_varchar('project_tag', 'project_id', nullable=False)
    alter_column_to_varchar('project_tag', 'id', nullable=False)
    alter_column_to_varchar('project_conversation_tag_association', 'project_tag', nullable=False)
    alter_column_to_varchar('project_conversation_tag_association', 'conversation_id', nullable=False)
    alter_column_to_varchar('project_analysis_run', 'project_id', nullable=False)
    alter_column_to_varchar('project_analysis_run', 'id', nullable=False)
    alter_column_to_varchar('project', 'id', nullable=False)
    alter_column_to_varchar('insight', 'project_analysis_run_id', nullable=True)
    alter_column_to_varchar('insight', 'id', nullable=False)
    alter_column_to_varchar('document', 'project_id', nullable=False)
    alter_column_to_varchar('document', 'id', nullable=False)
    alter_column_to_varchar('conversation_chunk_quote_association', 'quote_id', nullable=False)
    alter_column_to_varchar('conversation_chunk_quote_association', 'conversation_chunk_id', nullable=False)
    alter_column_to_varchar('conversation_chunk', 'conversation_id', nullable=False)
    alter_column_to_varchar('conversation_chunk', 'id', nullable=False)
    alter_column_to_varchar('conversation', 'project_id', nullable=False)
    alter_column_to_varchar('conversation', 'id', nullable=False)
    alter_column_to_varchar('chat_resource_association', 'resource_id', nullable=False)
    alter_column_to_varchar('chat_resource_association', 'chat_id', nullable=False)
    alter_column_to_varchar('chat_message', 'chat_id', nullable=False)
    alter_column_to_varchar('chat_message', 'id', nullable=False)
    alter_column_to_varchar('chat_conversation_association', 'conversation_id', nullable=False)
    alter_column_to_varchar('chat_conversation_association', 'chat_id', nullable=False)
    alter_column_to_varchar('chat', 'project_id', nullable=True)
    alter_column_to_varchar('chat', 'id', nullable=False)
    alter_column_to_varchar('aspect', 'project_analysis_run_id', nullable=True)
    alter_column_to_varchar('aspect', 'view_id', nullable=True)
    alter_column_to_varchar('aspect', 'id', nullable=False)
    
    # Re-add foreign key constraints
    add_foreign_key_constraints()