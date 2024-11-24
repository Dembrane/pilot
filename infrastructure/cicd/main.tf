provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  skip_provider_registration = true
}

resource "azurerm_resource_group" "rg" {
  location = "westeurope"
  name     = "DBR-cicd-Infrastructure-Main-RG"
}

variable "environment" {
  default = "cicd"
}

variable "subscription_id" {
  description = "The Azure subscription ID"
}
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "kv" {
  name                        = "DBR-cicd-Infra-Main-KV"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                    = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge"
    ]
  }
}

#resource "azurerm_key_vault_access_policy" "acr_kv_access" {
#  key_vault_id = azurerm_key_vault.kv.id
#  tenant_id    = data.azurerm_client_config.current.tenant_id
#  object_id    = azurerm_container_registry.acr.identity[0].principal_id#

#  secret_permissions = [#
#    "Get",
#  ]

#  depends_on = [azurerm_container_registry.acr]
#}

# ACR 
resource "azurerm_container_registry" "acr" {
  name                = "dbr${var.environment}acr"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true

  identity {
    type = "SystemAssigned"
  }
}

# Add Docker Hub username to Key Vault
data "azurerm_key_vault_secret" "dockerhub_username" {
  name         = "dockerhubusername"
  key_vault_id = azurerm_key_vault.kv.id
}

# Add Docker Hub password to Key Vault
data "azurerm_key_vault_secret" "dockerhub_password" {
  name         = "dockerhubpassword"
  key_vault_id = azurerm_key_vault.kv.id
}


# Create cache rule for Whisper ASR image
resource "azurerm_container_registry_cache_rule" "whisper_cache" {
  name                  = "whisper-asr-cache"
  container_registry_id = azurerm_container_registry.acr.id
  source_repo           = "docker.io/onerahmet/openai-whisper-asr-webservice"
  target_repo           = "whisper-asr-webservice"
  credential_set_id     = "${azurerm_container_registry.acr.id}/credentialSets/PublicDockerDatTran"
}

# cache rule for rabbitmq image
resource "azurerm_container_registry_cache_rule" "rabbitmq_cache" {
  name                  = "rabbitmq-cache"
  container_registry_id = azurerm_container_registry.acr.id
  source_repo           = "docker.io/rabbitmq"
  target_repo           = "rabbitmq"
  credential_set_id     = "${azurerm_container_registry.acr.id}/credentialSets/PublicDockerDatTran"
}
# whisper image from public docker
