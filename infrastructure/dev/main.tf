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
# Private Subnets with Container Instance Delegation
resource "azurerm_subnet" "private_subnet" {
  count                = 2
  name                 = "DBR-${var.environment}-Networks-private-subnet-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.${count.index + 1}.0/24"]

  delegation {
    name = "container-instance-delegation"
    
    service_delegation {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action",
        "Microsoft.Network/virtualNetworks/subnets/join/action",
        "Microsoft.Network/virtualNetworks/subnets/prepareNetworkPolicies/action",
        "Microsoft.Network/virtualNetworks/subnets/unprepareNetworkPolicies/action"
      ]
    }
  }
}

resource "azurerm_subnet" "private_internal_subnet" {
  count                = 2
  name                 = "DBR-${var.environment}-Networks-private-subnet-new-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.${count.index + 3}.0/24"]  # New address space

  delegation {
    name = "container-instance-delegation"
    
    service_delegation {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action",
        "Microsoft.Network/virtualNetworks/subnets/join/action",
        "Microsoft.Network/virtualNetworks/subnets/prepareNetworkPolicies/action",
        "Microsoft.Network/virtualNetworks/subnets/unprepareNetworkPolicies/action"
      ]
    }
  }
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
# NSG for Public Subnets (Updated for App Gateway)
resource "azurerm_network_security_group" "public_nsg" {
  name                = "DBR-${var.environment}-Networks-public-NSG"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  # Original rule
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

  # Allow App Gateway v2 management ports
  security_rule {
    name                       = "AllowAppGatewayInbound"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "65200-65535"
    source_address_prefix      = "GatewayManager"
    destination_address_prefix = "*"
  }

  # Allow internet inbound traffic
  security_rule {
    name                       = "AllowInternetInbound"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
    source_address_prefix      = "Internet"
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

### deploy application gateway with no backend pool

# Define the Application Gateway
# SSL Certificate for App Gateway
resource "azurerm_key_vault_certificate" "appgw_cert" {
  name         = "appgw-wildcard-cert"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id

  certificate_policy {
    issuer_parameters {
      name = "Self"
    }

    key_properties {
      exportable = true
      key_size   = 2048
      key_type   = "RSA"
      reuse_key  = true
    }

    lifetime_action {
      action {
        action_type = "AutoRenew"
      }
      trigger {
        days_before_expiry = 30
      }
    }

    secret_properties {
      content_type = "application/x-pkcs12"
    }

    x509_certificate_properties {
      extended_key_usage = ["1.3.6.1.5.5.7.3.1"] # Server Authentication
      key_usage         = [
        "digitalSignature",
        "keyEncipherment"
      ]
      subject            = "CN=*.dbr-dev.azure.com"
      validity_in_months = 12
    }
  }
}

# Updated Application Gateway Configuration
resource "azurerm_application_gateway" "main" {
  name                = "DBR-${var.environment}-appgw"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.appgw_identity.id]
  }

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 1
  }

  gateway_ip_configuration {
    name      = "gateway-ip-config"
    subnet_id = azurerm_subnet.public_subnet[0].id
  }

  frontend_ip_configuration {
    name                 = "frontend-ip-config"
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  # Frontend ports
  frontend_port {
    name = "http-80"
    port = 80
  }

  frontend_port {
    name = "https-443"
    port = 443
  }

  ssl_certificate {
    name                = "wildcard-cert"
    key_vault_secret_id = "https://dbr-dev-runtimecfg-kv.vault.azure.net/secrets/appgw-wildcard-cert"
  }

  # Backend address pools
  backend_address_pool {
    name = "directus-pool"
    ip_addresses = [azurerm_container_group.directus.ip_address]
  }

  backend_address_pool {
    name = "api-server-pool"
    ip_addresses = [azurerm_container_group.api_server.ip_address]
  }

  backend_address_pool {
    name = "participant-frontend-pool"
    ip_addresses = [azurerm_container_group.participant_frontend.ip_address]
  }

  backend_address_pool {
    name = "dashboard-frontend-pool"
    ip_addresses = [azurerm_container_group.dashboard_frontend.ip_address]
  }

  # Backend settings
  backend_http_settings {
    name                  = "directus-settings"
    cookie_based_affinity = "Disabled"
    port                  = 8055
    protocol             = "Http"
    request_timeout      = 60
  }

  backend_http_settings {
    name                  = "api-settings"
    cookie_based_affinity = "Disabled"
    port                  = 8000
    protocol             = "Http"
    request_timeout      = 60
  }

  backend_http_settings {
    name                  = "frontend-settings"
    cookie_based_affinity = "Disabled"
    port                  = 5173
    protocol             = "Http"
    request_timeout      = 60
  }

  # HTTPS listeners
  http_listener {
    name                           = "directus-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert"
    host_name                     = "admin.dbr-dev.azure.com"
  }

  http_listener {
    name                           = "api-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert"
    host_name                     = "api.dbr-dev.azure.com"
  }

  http_listener {
    name                           = "participant-frontend-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert"
    host_name                     = "app.dbr-dev.azure.com"
  }

  http_listener {
    name                           = "dashboard-frontend-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert"
    host_name                     = "dashboard.dbr-dev.azure.com"
  }

  # Routing rules
  request_routing_rule {
    name                       = "directus-rule"
    priority                  = 10
    rule_type                 = "Basic"
    http_listener_name        = "directus-listener"
    backend_address_pool_name = "directus-pool"
    backend_http_settings_name = "directus-settings"
  }

  request_routing_rule {
    name                       = "api-rule"
    priority                  = 20
    rule_type                 = "Basic"
    http_listener_name        = "api-listener"
    backend_address_pool_name = "api-server-pool"
    backend_http_settings_name = "api-settings"
  }

  request_routing_rule {
    name                       = "participant-frontend-rule"
    priority                  = 30
    rule_type                 = "Basic"
    http_listener_name        = "participant-frontend-listener"
    backend_address_pool_name = "participant-frontend-pool"
    backend_http_settings_name = "frontend-settings"
  }

  request_routing_rule {
    name                       = "dashboard-frontend-rule"
    priority                  = 40
    rule_type                 = "Basic"
    http_listener_name        = "dashboard-frontend-listener"
    backend_address_pool_name = "dashboard-frontend-pool"
    backend_http_settings_name = "frontend-settings"
  }
}
# Required Public IP for the Application Gateway
resource "azurerm_public_ip" "appgw" {
  name                = "DBR-${var.environment}-appgw-pip"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  allocation_method   = "Static"
  sku                = "Standard"  # Required for v2 Application Gateway
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

  ip_address_type = "Private"
  subnet_ids       = [azurerm_subnet.private_subnet[0].id]

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  lifecycle {
    ignore_changes = [image_registry_credential]
  }

  diagnostics {
    log_analytics {
      log_type      = "ContainerInsights"
      workspace_id  = azurerm_log_analytics_workspace.main.workspace_id
      workspace_key = azurerm_log_analytics_workspace.main.primary_shared_key
      metadata = {
        "pod-uuid" = "rabbitmq-${var.environment}"
        "node-name" = "rabbitmq-node"
      }
    }
  }

}

## Deploy participant-frontend by tag "development-latest" from ACR

resource "azurerm_container_group" "participant_frontend" {
  name                = "DBR-${var.environment}-Workers-ParticipantFrontend-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  ip_address_type = "Private"
  subnet_ids       = [azurerm_subnet.private_subnet[0].id]

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


  lifecycle {
    ignore_changes = [image_registry_credential]
  }


  diagnostics {
    log_analytics {
      log_type      = "ContainerInsights"
      workspace_id  = azurerm_log_analytics_workspace.main.workspace_id
      workspace_key = azurerm_log_analytics_workspace.main.primary_shared_key
      metadata = {
        "pod-uuid" = "participant-frontend-${var.environment}"
        "node-name" = "participant-frontend-node"
      }
    }
  }

}

resource "azurerm_container_group" "dashboard_frontend" {
  name                = "DBR-${var.environment}-Workers-DashboardFrontend-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  ip_address_type = "Private"
  subnet_ids       = [azurerm_subnet.private_subnet[0].id]

  container {
    name   = "dashboard-frontend"
    image  = "${data.azurerm_container_registry.acr.login_server}/dashboard-frontend:development-latest"
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

  lifecycle {
    ignore_changes = [image_registry_credential]
  }

  diagnostics {
    log_analytics {
      log_type      = "ContainerInsights"
      workspace_id  = azurerm_log_analytics_workspace.main.workspace_id
      workspace_key = azurerm_log_analytics_workspace.main.primary_shared_key
      metadata = {
        "pod-uuid" = "dashboard-frontend-${var.environment}"
        "node-name" = "dashboard-frontend-node"
      }
    }
  }

}

## deploy directus on port 8055

resource "azurerm_container_group" "directus" {
  name                = "DBR-${var.environment}-Workers-Directus-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  ip_address_type = "Private"
  subnet_ids       = [azurerm_subnet.private_subnet[0].id]

  container {
    name   = "directus"
    image  = "${data.azurerm_container_registry.acr.login_server}/directus:development-latest"
    cpu    = "1"
    memory = "2"
    ports {
      port     = 8055
      protocol = "TCP"
    }
  }

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  lifecycle {
    ignore_changes = [image_registry_credential]
  }

  diagnostics {
    log_analytics {
      log_type      = "ContainerInsights"
      workspace_id  = azurerm_log_analytics_workspace.main.workspace_id
      workspace_key = azurerm_log_analytics_workspace.main.primary_shared_key
      metadata = {
        "pod-uuid" = "directus-${var.environment}"
        "node-name" = "directus-node"
      }
    }
  }

}

## Deploy Worker

resource "azurerm_container_group" "worker" {
  name                = "DBR-${var.environment}-Workers-Worker-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  ip_address_type = "Private"
  subnet_ids       = [azurerm_subnet.private_subnet[0].id]

  container {
    name   = "worker"
    image  = "${data.azurerm_container_registry.acr.login_server}/worker:development-latest"
    cpu    = "1"
    memory = "2"

    ports {
      port     = 8000
      protocol = "TCP"
    }

    volume {
      name       = "uploads-volume"
      mount_path = "/code/server/uploads"
      share_name = azurerm_storage_share.uploads.name
      storage_account_name = azurerm_storage_account.api-server-storage.name
      storage_account_key  = azurerm_storage_account.api-server-storage.primary_access_key
    }

    volume {
      name       = "trankit-cache-volume"
      mount_path = "/code/server/trankit_cache"
      share_name = azurerm_storage_share.trankit.name
      storage_account_name = azurerm_storage_account.api-server-storage.name
      storage_account_key  = azurerm_storage_account.api-server-storage.primary_access_key
    }
  }



  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  lifecycle {
    ignore_changes = [image_registry_credential]
  }


  diagnostics {
    log_analytics {
      log_type      = "ContainerInsights"
      workspace_id  = azurerm_log_analytics_workspace.main.workspace_id
      workspace_key = azurerm_log_analytics_workspace.main.primary_shared_key
      metadata = {
        "pod-uuid" = "worker-${var.environment}"
        "node-name" = "worker-node"
      }
    }
  }

}


# deploy api-server 

resource "azurerm_container_group" "api_server" {
  name                = "DBR-${var.environment}-Workers-ApiServer-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  ip_address_type = "Private"
  subnet_ids       = [azurerm_subnet.private_subnet[0].id]

  container {
    name   = "api-server"
    image  = "${data.azurerm_container_registry.acr.login_server}/api-server:development-latest"
    cpu    = "1"
    memory = "2"

    ports {
      port     = 8000
      protocol = "TCP"
    }

    volume {
      name       = "uploads-volume"
      mount_path = "/code/server/uploads"
      share_name = azurerm_storage_share.uploads.name
      storage_account_name = azurerm_storage_account.api-server-storage.name
      storage_account_key  = azurerm_storage_account.api-server-storage.primary_access_key
    }

    volume {
      name       = "trankit-cache-volume"
      mount_path = "/code/server/trankit_cache"
      share_name = azurerm_storage_share.trankit.name
      storage_account_name = azurerm_storage_account.api-server-storage.name
      storage_account_key  = azurerm_storage_account.api-server-storage.primary_access_key
    }
  }

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  lifecycle {
    ignore_changes = [image_registry_credential]
  }

  diagnostics {
    log_analytics {
      log_type      = "ContainerInsights"
      workspace_id  = azurerm_log_analytics_workspace.main.workspace_id
      workspace_key = azurerm_log_analytics_workspace.main.primary_shared_key
      metadata = {
        "pod-uuid" = "api-server-${var.environment}"
        "node-name" = "api-server-node"
      }
    }
  }

}

# Log Analytics Workspace for centralized logging
# Log Analytics Workspace for centralized logging
resource "azurerm_log_analytics_workspace" "main" {
  name                = "DBR-${var.environment}-Monitoring-Main-LAW"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}


resource "azurerm_storage_account" "api-server-storage" {
  name                     = "dbrdevbackendstorage"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_share" "uploads" {
  name                 = "uploads"
  storage_account_name = azurerm_storage_account.api-server-storage.name
  quota               = 500  # GB
}

resource "azurerm_storage_share" "trankit" {
  name                 = "trankit-cache"
  storage_account_name = azurerm_storage_account.api-server-storage.name
  quota               = 500  # GB
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
    version = "1"
  }

  sku {
    name     = "Standard"
  }
}

## params

data "azurerm_client_config" "current" {}

# Azure Key Vault
# Update Key Vault with proper access policies
resource "azurerm_key_vault" "DBR-dev-Backend-RuntimeConfig-KeyVault" {
  name                        = "DBR-${var.environment}-RuntimeCfg-KV"
  location                    = "westeurope"
  resource_group_name         = azurerm_resource_group.rg.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  purge_protection_enabled    = true
  
  # Enable RBAC - this is important for App Gateway to access certificates
  enable_rbac_authorization   = true

  # Required for certificate management
  soft_delete_retention_days  = 7
}

# Access policy for the deployment principal
resource "azurerm_key_vault_access_policy" "deployer" {
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  certificate_permissions = [
    "Backup",
    "Create",
    "Delete",
    "DeleteIssuers",
    "Get",
    "GetIssuers",
    "Import",
    "List",
    "ListIssuers",
    "ManageContacts",
    "ManageIssuers",
    "Purge",
    "Recover",
    "Restore",
    "SetIssuers",
    "Update"
  ]

  secret_permissions = [
    "Backup",
    "Delete",
    "Get",
    "List",
    "Purge",
    "Recover",
    "Restore",
    "Set"
  ]

  key_permissions = [
    "Backup",
    "Create",
    "Delete",
    "Get",
    "Import",
    "List",
    "Purge",
    "Recover",
    "Restore",
    "Update"
  ]
}

## Role assignment for the deployment principal (Terraform)
resource "azurerm_role_assignment" "deployer_keyvault_admin" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Role assignment for App Gateway managed identity
resource "azurerm_user_assigned_identity" "appgw_identity" {
  name                = "DBR-${var.environment}-appgw-identity"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

# App Gateway needs to read secrets
resource "azurerm_role_assignment" "appgw_keyvault_secrets" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.appgw_identity.principal_id
}

# App Gateway needs to read certificates
resource "azurerm_role_assignment" "appgw_keyvault_certificates" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Certificates Officer"
  principal_id         = azurerm_user_assigned_identity.appgw_identity.principal_id
}

#  DNS Zone
resource "azurerm_dns_zone" "dev_zone" {
  name                = "dbr-dev.azure.com"
  resource_group_name = azurerm_resource_group.rg.name
}

#  A records pointing to Application Gateway IP
resource "azurerm_dns_a_record" "admin" {
  name                = "admin"
  zone_name           = azurerm_dns_zone.dev_zone.name
  resource_group_name = azurerm_resource_group.rg.name
  ttl                 = 300
  target_resource_id  = azurerm_public_ip.appgw.id
}

resource "azurerm_dns_a_record" "api" {
  name                = "api"
  zone_name           = azurerm_dns_zone.dev_zone.name
  resource_group_name = azurerm_resource_group.rg.name
  ttl                 = 300
  target_resource_id  = azurerm_public_ip.appgw.id
}

resource "azurerm_dns_a_record" "app" {
  name                = "app"
  zone_name           = azurerm_dns_zone.dev_zone.name
  resource_group_name = azurerm_resource_group.rg.name
  ttl                 = 300
  target_resource_id  = azurerm_public_ip.appgw.id
}

resource "azurerm_dns_a_record" "dashboard" {
  name                = "dashboard"
  zone_name           = azurerm_dns_zone.dev_zone.name
  resource_group_name = azurerm_resource_group.rg.name
  ttl                 = 300
  target_resource_id  = azurerm_public_ip.appgw.id
}