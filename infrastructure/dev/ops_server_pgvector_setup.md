# Installing pgvector on Ubuntu Ops Server

Follow these steps to install pgvector on the Ubuntu ops server and configure it to work with Azure Cosmos DB for PostgreSQL.

## 1. Connect to the ops server

Use Azure Bastion to connect to the ops server:
- In the Azure Portal, navigate to the "DBR-dev-OpsServer-VM" virtual machine
- Click on "Connect" and select "Bastion"
- Enter the username "azureuser"
- For the password, use the following Azure CLI command to retrieve it from the Key Vault:
  ```
  az keyvault secret show --name ops-server-password --vault-name DBR-dev-RuntimeCfg-KV --query value -o tsv
  ```

## 2. Update system and install dependencies

Once connected, run the following commands:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential git
```

## 3. Install PostgreSQL client tools

Install the PostgreSQL client tools:

```bash
sudo apt install -y postgresql-client
```

## 4. Install pgvector

Clone the pgvector repository and build it:

```bash
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

## 5. Configure PostgreSQL client

Create a `.pgpass` file to store the database connection information:

```bash
echo "dbr-dev-backend-database-psql.postgres.cosmos.azure.com:5432:dembrane:dembrane:1n1t14l_p@ssw0rd" > ~/.pgpass
chmod 600 ~/.pgpass
```

## 6. Connect to the database and create the extension

Connect to the Azure Cosmos DB for PostgreSQL and create the pgvector extension:

```bash
psql -h dbr-dev-backend-database-psql.postgres.cosmos.azure.com -U dembrane -d dembrane -p 5432 -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## 7. Verify the installation

Confirm that the pgvector extension is installed:

```bash
psql -h dbr-dev-backend-database-psql.postgres.cosmos.azure.com -U dembrane -d dembrane -p 5432 -c "\dx"
```

You should see "vector" listed in the extensions.

## Note

- Replace the database connection details if they differ from the ones provided in the Terraform configuration.
- The initial password used here is for demonstration purposes. Ensure to use a secure password in a production environment.
- After setting up, consider removing or securing the `.pgpass` file to protect the database credentials.
- The VM password is stored securely in the Azure Key Vault. Always use the Azure CLI command provided in step 1 to retrieve it when needed.
