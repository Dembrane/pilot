export async function up(knex) {
  console.log("[DEBUG] Adding pgvector extension");
  // First ensure pgvector extension exists
  await knex.raw("CREATE EXTENSION IF NOT EXISTS vector");

  // Add vector columns if tables exist
  console.log("[DEBUG] Checking if tables exist");
  const tables = await knex("information_schema.tables")
    .select("table_name")
    .where({ table_schema: "public" });

  const tableNames = tables.map((t) => t.table_name);

  if (!tableNames.includes("quote")) {
    console.log("[DEBUG] quote table does not exist");
    // create table
    await knex.raw(`
            CREATE TABLE quote (
                __do_not_use_id SERIAL PRIMARY KEY
            );
        `);
  }

  console.log("[DEBUG] Adding embedding column to quote table");
  await knex.raw(
    "ALTER TABLE quote ADD COLUMN IF NOT EXISTS embedding vector(1536) NOT NULL"
  );

  if (!tableNames.includes("aspect")) {
    console.log("[DEBUG] aspect table does not exist");
    // create table
    await knex.raw(`
            CREATE TABLE aspect (
                __do_not_use_id SERIAL PRIMARY KEY
            );
        `);
  }

  console.log("[DEBUG] Adding centroid_embedding column to aspect table");
  await knex.raw(
    "ALTER TABLE aspect ADD COLUMN IF NOT EXISTS centroid_embedding vector(1536)"
  );
}

export async function down(knex) {
  // Remove vector columns if tables exist
  const tables = await knex("information_schema.tables")
    .select("table_name")
    .where({ table_schema: "public" });

  const tableNames = tables.map((t) => t.table_name);

  if (tableNames.includes("quote")) {
    await knex.schema.alterTable("quote", (table) => {
      table.dropColumn("embedding");
    });
  }

  if (tableNames.includes("aspect")) {
    await knex.schema.alterTable("aspect", (table) => {
      table.dropColumn("centroid_embedding");
    });
  }

  // Note: We don't remove the pgvector extension as other tables might need it
}
