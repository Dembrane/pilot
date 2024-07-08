- uncheck from .env all the things related to roles
- npx directus schema apply ./snapshot.yaml
- run this query
  INSERT INTO public.conversation_project_tag (conversation_id, project_tag_id)
  SELECT conversation_id, project_tag
  FROM public.project_conversation_tag_association;
- remove all the previous tables from alembic
