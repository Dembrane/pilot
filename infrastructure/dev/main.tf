provider "azurerm" {
  features {}
  subscription_id = var.subscription_id

}

resource "azurerm_resource_group" "rg" {
  location = "westeurope"
  name     = "DBR-dev-Infrastructure-Main-RG"
}

variable "environment" {
  default = "dev"
}

variable "subscription_id" {
  description = "The Azure subscription ID"
}

variable "acr_username" {
  description = "The username for the Azure Container Registry"
}

variable "acr_password" {
  description = "The password for the Azure Container Registry"
}

### Networking

variable "functional_scope" {
  default = "Infrastructure"
}

# Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "DBR-${var.environment}-Networks-Main-VNET"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Private Subnets
resource "azurerm_subnet" "private_subnet" {
  count                = 2
  name                 = "DBR-${var.environment}-Networks-private-subnet-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.${count.index + 1}.0/24"]
}

# Public Subnets (for Application Gateway)
resource "azurerm_subnet" "public_subnet" {
  count                = 2
  name                 = "DBR-${var.environment}-Networks-public-subnet-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.${count.index + 10}.0/24"]
}

# NAT Gateway Subnet
resource "azurerm_subnet" "nat_gateway_subnet" {
  name                 = "DBR-${var.environment}-Networks-natgateway-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.20.0/24"]
}

# NSG for Private Subnets
resource "azurerm_network_security_group" "private_nsg" {
  name                = "DBR-${var.environment}-Networks-private-NSG"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "AllowFromPublicSubnet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefixes    = azurerm_subnet.public_subnet[*].address_prefixes[0]
    destination_address_prefix = "*"
  }
}

# NSG for Public Subnets
resource "azurerm_network_security_group" "public_nsg" {
  name                = "DBR-${var.environment}-Networks-public-NSG"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "AllowFromPublicSubnet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefixes    = azurerm_subnet.public_subnet[*].address_prefixes[0]
    destination_address_prefix = "*"
  }
}

# Associate NSGs with Subnets
resource "azurerm_subnet_network_security_group_association" "private_nsg_association" {
  count                     = 2
  subnet_id                 = azurerm_subnet.private_subnet[count.index].id
  network_security_group_id = azurerm_network_security_group.private_nsg.id
}

resource "azurerm_subnet_network_security_group_association" "public_nsg_association" {
  count                     = 2
  subnet_id                 = azurerm_subnet.public_subnet[count.index].id
  network_security_group_id = azurerm_network_security_group.public_nsg.id
}

# Public IP for NAT Gateway
resource "azurerm_public_ip" "nat_gateway_public_ip" {
  name                = "DBR-${var.environment}-Networks-natgateway-PIP"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# NAT Gateway
resource "azurerm_nat_gateway" "nat_gateway" {
  name                    = "DBR_${var.environment}_Networks_NAT_GW" # underscores are used because dashes are not allowed in the name
  location                = azurerm_resource_group.rg.location
  resource_group_name     = azurerm_resource_group.rg.name
  sku_name                = "Standard"
  idle_timeout_in_minutes = 10
}

# Associate NAT Gateway with public IP
resource "azurerm_nat_gateway_public_ip_association" "nat_gateway_ip_association" {
  nat_gateway_id       = azurerm_nat_gateway.nat_gateway.id
  public_ip_address_id = azurerm_public_ip.nat_gateway_public_ip.id
}

# Associate NAT Gateway with private subnets
resource "azurerm_subnet_nat_gateway_association" "private_subnet_nat_association" {
  count          = 2
  subnet_id      = azurerm_subnet.private_subnet[count.index].id
  nat_gateway_id = azurerm_nat_gateway.nat_gateway.id
}

# Route Tables
resource "azurerm_route_table" "private_route_table" {
  name                = "DBR-${var.environment}-Networks-private-RT"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_route_table" "public_route_table" {
  name                = "DBR-${var.environment}-Networks-public-RT"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  route {
    name           = "to-internet"
    address_prefix = "0.0.0.0/0"
    next_hop_type  = "Internet"
  }
}

# Associate Route Tables with Subnets
resource "azurerm_subnet_route_table_association" "private_route_association" {
  count          = 2
  subnet_id      = azurerm_subnet.private_subnet[count.index].id
  route_table_id = azurerm_route_table.private_route_table.id
}

resource "azurerm_subnet_route_table_association" "public_route_association" {
  count          = 2
  subnet_id      = azurerm_subnet.public_subnet[count.index].id
  route_table_id = azurerm_route_table.public_route_table.id
}

### Compute

data "azurerm_container_registry" "acr" {
  name                = "dbrcicdacr"
  resource_group_name = "DBR-cicd-Infrastructure-Main-RG"
}


## RabitMQ azure container instance based on rabbitmq:3.13

resource "azurerm_container_group" "rabbitmq" {
  name                = "DBR-${var.environment}-Workers-RabbitMQ-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  container {
    name   = "rabbitmq"
    image  = "mcr.microsoft.com/azurelinux/base/rabbitmq-server:3.13"
    cpu    = "1"
    memory = "2"
    ports {
      port     = 5672
      protocol = "TCP"
    }
    ports {
      port     = 15672
      protocol = "TCP"
    }
  }

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

}

## Deploy participant-frontend by tag "development-latest" from ACR

resource "azurerm_container_group" "participant_frontend" {
  name                = "DBR-${var.environment}-Workers-ParticipantFrontend-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  container {
    name   = "participant-frontend"
    image  = "${data.azurerm_container_registry.acr.login_server}/participant-frontend:development-latest"
    cpu    = "1"
    memory = "2"
    ports {
      port     = 5173
      protocol = "TCP"
    }
  }

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

}




### Data

## Redis

# lowest settings for dev
resource "azurerm_redis_cache" "basic_redis" {
  name                = "DBR-dev-Workers-CachingLayer-RedisCluster"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  capacity            = 0  # Lowest capacity for Basic tier
  family              = "C"  # Basic/Standard family
  sku_name            = "Basic"

  redis_configuration {
  }

}

# Output the Redis Cache hostname
output "redis_hostname" {
  value = azurerm_redis_cache.basic_redis.hostname
}

# Output the Redis Cache SSL port
output "redis_ssl_port" {
  value = azurerm_redis_cache.basic_redis.ssl_port
}

## PSQL on Azure SQL

# for some reason our az subscription doesnt allow this. i raised a ticket but in the meantime we can proceed w cosmodb for psql -dt
#resource "azurerm_mysql_flexible_server" "psql" {
#  name                   = "dbr-${var.environment}-data-psql-server"
#  resource_group_name    = azurerm_resource_group.rg.name
#  location               = azurerm_resource_group.rg.location
#  sku_name               = "B_Standard_B1ms"
#  administrator_login           = "psqladmin"
#  administrator_password        = "1n1t14l_p@ssw0rd"
#}

#resource "azurerm_mysql_flexible_database" "psql" {
#  name                = "dbr-${var.environment}-data-psql-db"
#  resource_group_name = azurerm_resource_group.rg.name
#  server_name         = azurerm_mysql_flexible_server.psql.name
#  charset             = "utf8"
#  collation           = "utf8_unicode_ci"
#}

resource "azurerm_cosmosdb_postgresql_cluster" "cosmo" {
  name                = "dbr-dev-backend-database-psql"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  node_count          = 0

  administrator_login_password = "1n1t14l_p@ssw0rd"

  coordinator_storage_quota_in_mb = 65536
  coordinator_vcore_count         = 1
  coordinator_server_edition      = "BurstableMemoryOptimized"

  node_server_edition             = "MemoryOptimized"
  node_storage_quota_in_mb        = 524288
  node_vcores                     = 2
}

### OAI


resource "azurerm_resource_group" "openai_rg" { # used diff RG to move around easily due to model avail
  name     = "DBR-${var.environment}-OAI-Main-RG"
  location = "westeurope"  #
}

resource "azurerm_cognitive_account" "openai" {
  name                = "DBR-${var.environment}-OAI-Main-CA"
  location            = azurerm_resource_group.openai_rg.location
  resource_group_name = azurerm_resource_group.openai_rg.name
  kind                = "OpenAI"
  sku_name            = "S0"  # Adjust as needed
  custom_subdomain_name = "dbr-${var.environment}-oai-main-ca"
}

resource "azurerm_cognitive_deployment" "whisper" {
  name                 = "DBR-${var.environment}-OAI-Main-CD"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "whisper" 
    version = "001" 
  }

  sku {
    name     = "Standard"
    capacity = 1
  }
}

resource "azurerm_cognitive_deployment" "four_o" {
  name                 = "DBR-${var.environment}-OAI-Main-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o" 
    version = "2024-05-13" 
  }

  sku {
    name     = "GlobalStandard"
    capacity = 1
  }
}

resource "azurerm_cognitive_account" "openai-switzerland" {
  name                = "DBR-${var.environment}-OAI-Main-CA-switzerland"
  location            = "switzerlandnorth"
  resource_group_name = azurerm_resource_group.openai_rg.name
  kind                = "OpenAI"
  sku_name            = "S0"  # Adjust as needed
  custom_subdomain_name = "dbr-${var.environment}-oai-main-ca-emb"
}


resource "azurerm_cognitive_deployment" "embedding" {
  name                 = "DBR-${var.environment}-OAI-Main-embedding-small"
  cognitive_account_id = azurerm_cognitive_account.openai-switzerland.id

  model {
    format  = "OpenAI"
    name    = "text-embedding-3-small" 
   // version = "2024-05-13" 
  }

  sku {
    name     = "Standard"
  }
}

## params

data "azurerm_client_config" "current" {}

# Azure Key Vault
resource "azurerm_key_vault" "DBR-prod-Backend-RuntimeConfig-KeyVault" {
  name                        = "DBR-${var.environment}-AppData-RuntimeConfig-KeyVault"
  location                    = "westeurope"
  resource_group_name         = azurerm_resource_group.rg.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"

  purge_protection_enabled = true
  soft_delete_enabled      = true
}

# Key Vault Secrets (sensitive values)
resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "POSTGRES_PASSWORD"
  value        = "dembrane"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "rabbitmq_password" {
  name         = "RABBITMQ_DEFAULT_PASS"
  value        = "dembrane"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_secret" {
  name         = "DIRECTUS_SECRET"
  value        = "replace-with-secure-secret"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_admin_password" {
  name         = "DIRECTUS_ADMIN_PASSWORD"
  value        = "replace-with-secure-password"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "smtp_password" {
  name         = "SMTP_PASSWORD"
  value        = "replace-with-secure-password"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "auth_google_client_secret" {
  name         = "AUTH_GOOGLE_CLIENT_SECRET"
  value        = "replace-with-secure-secret"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

# Key Vault Key Parameters (non-sensitive values)
resource "azurerm_key_vault_key" "directus_session_cookie_name" {
  name         = "DIRECTUS_SESSION_COOKIE_NAME"
  key_type     = "RSA"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_key" "public_url" {
  name         = "DIRECTUS_PUBLIC_URL"
  key_type     = "RSA"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_key" "smtp_from" {
  name         = "SMTP_FROM"
  key_type     = "RSA"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_key" "smtp_host" {
  name         = "SMTP_HOST"
  key_type     = "RSA"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_key" "admin_base_url" {
  name         = "ADMIN_BASE_URL"
  key_type     = "RSA"
  key_vault_id = azurerm_key_vault.DBR-prod-Backend-RuntimeConfig-KeyVault.id
}
