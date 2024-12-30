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

  security_rule {
    name                       = "AllowAppGatewayHealthProbes"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["8000", "8055", "5173"]
    source_address_prefixes    = ["10.0.10.0/24"]
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
    source_address_prefix      = "Internet"
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

  route {
    name                   = "to-appgw"
    address_prefix         = "10.0.10.0/24"  # App Gateway subnet
    next_hop_type         = "VnetLocal"
  }

  route {
    name                   = "to-internet"
    address_prefix         = "0.0.0.0/0"
    next_hop_type         = "Internet"
  }
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

# Private DNS Zone for internal services
resource "azurerm_private_dns_zone" "internal" {
  name                = "dembrane.internal"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "internal" {
  name                  = "internal-dns-link"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.internal.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = true
}

# DNS A record for RabbitMQ
resource "azurerm_private_dns_a_record" "rabbitmq" {
  name                = "rabbitmq"
  zone_name           = azurerm_private_dns_zone.internal.name
  resource_group_name = azurerm_resource_group.rg.name
  ttl                 = 300
  records             = [azurerm_container_group.rabbitmq.ip_address]
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
# Certificate will be imported manually to Key Vault
# The Application Gateway will use the imported certificate

# WAF Policy for App Gateway
resource "azurerm_web_application_firewall_policy" "main" {
  name                = "DBR-${var.environment}-waf-policy"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  policy_settings {
    enabled                     = true
    mode                       = "Prevention"
    request_body_check         = true
    file_upload_limit_in_mb    = 100
    max_request_body_size_in_kb = 128
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
  }
}

# App Gateway will use its built-in certificate management

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
    name     = "WAF_v2"
    tier     = "WAF_v2"
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

  # Reference the certificate that will be imported manually to Key Vault
  ssl_certificate {
    name                = "wildcard-cert-v2"
    key_vault_secret_id = "https://dbr-dev-runtimecfg-kv.vault.azure.net/secrets/wildcard-dev-dembrane-com-v2"
  }

  firewall_policy_id = azurerm_web_application_firewall_policy.main.id

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
    probe_name           = "directus-probe"
  }

  backend_http_settings {
    name                  = "api-settings"
    cookie_based_affinity = "Disabled"
    port                  = 8000
    protocol             = "Http"
    request_timeout      = 60
    probe_name           = "api-probe"
  }

  backend_http_settings {
    name                  = "frontend-settings"
    cookie_based_affinity = "Disabled"
    port                  = 5173
    protocol             = "Http"
    request_timeout      = 60
    probe_name           = "frontend-probe"
  }

  # Health probes
  probe {
    name                = "directus-probe"
    protocol            = "Http"
    path                = "/"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3
    host                = "directus.dev.dembrane.com"
    pick_host_name_from_backend_http_settings = false
  }

  probe {
    name                = "api-probe"
    protocol            = "Http"
    path                = "/api/health"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3
    host                = "api.dev.dembrane.com"
    pick_host_name_from_backend_http_settings = false
  }

  probe {
    name                = "frontend-probe"
    protocol            = "Http"
    path                = "/"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3
    pick_host_name_from_backend_http_settings = false
    host                = "app.dev.dembrane.com"
  }

  # HTTP to HTTPS redirect configurations - one for each domain
  redirect_configuration {
    name                 = "directus-http-to-https"
    redirect_type        = "Permanent"
    include_path         = true
    include_query_string = true
    target_listener_name = "directus-listener"
  }

  redirect_configuration {
    name                 = "api-http-to-https"
    redirect_type        = "Permanent"
    include_path         = true
    include_query_string = true
    target_listener_name = "api-listener"
  }

  redirect_configuration {
    name                 = "app-http-to-https"
    redirect_type        = "Permanent"
    include_path         = true
    include_query_string = true
    target_listener_name = "participant-frontend-listener"
  }

  redirect_configuration {
    name                 = "admin-http-to-https"
    redirect_type        = "Permanent"
    include_path         = true
    include_query_string = true
    target_listener_name = "dashboard-frontend-listener"
  }

  # HTTP listeners for each domain
  http_listener {
    name                           = "directus-http-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "http-80"
    protocol                      = "Http"
    host_name                     = "directus.dev.dembrane.com"
  }

  http_listener {
    name                           = "api-http-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "http-80"
    protocol                      = "Http"
    host_name                     = "api.dev.dembrane.com"
  }

  http_listener {
    name                           = "app-http-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "http-80"
    protocol                      = "Http"
    host_name                     = "app.dev.dembrane.com"
  }

  http_listener {
    name                           = "admin-http-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "http-80"
    protocol                      = "Http"
    host_name                     = "admin.dev.dembrane.com"
  }

  # HTTP to HTTPS redirect rules - each rule uses its corresponding redirect configuration
  request_routing_rule {
    name                        = "directus-http-to-https-rule"
    priority                   = 1
    rule_type                  = "Basic"
    http_listener_name         = "directus-http-listener"
    redirect_configuration_name = "directus-http-to-https"
  }

  request_routing_rule {
    name                        = "api-http-to-https-rule"
    priority                   = 2
    rule_type                  = "Basic"
    http_listener_name         = "api-http-listener"
    redirect_configuration_name = "api-http-to-https"
  }

  request_routing_rule {
    name                        = "app-http-to-https-rule"
    priority                   = 3
    rule_type                  = "Basic"
    http_listener_name         = "app-http-listener"
    redirect_configuration_name = "app-http-to-https"
  }

  request_routing_rule {
    name                        = "admin-http-to-https-rule"
    priority                   = 4
    rule_type                  = "Basic"
    http_listener_name         = "admin-http-listener"
    redirect_configuration_name = "admin-http-to-https"
  }

  # HTTPS listeners
  http_listener {
    name                           = "directus-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert-v2"
    host_name                     = "directus.dev.dembrane.com"
  }

  http_listener {
    name                           = "api-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert-v2"
    host_name                     = "api.dev.dembrane.com"
  }

  http_listener {
    name                           = "participant-frontend-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert-v2"
    host_name                     = "app.dev.dembrane.com"
  }

  http_listener {
    name                           = "dashboard-frontend-listener"
    frontend_ip_configuration_name = "frontend-ip-config"
    frontend_port_name            = "https-443"
    protocol                      = "Https"
    ssl_certificate_name          = "wildcard-cert-v2"
    host_name                     = "admin.dev.dembrane.com"
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

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_identity.id]
  }

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
    secure_environment_variables = {
      RABBITMQ_DEFAULT_USER = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.rabbitmq_user.versionless_id})"
      RABBITMQ_DEFAULT_PASS = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.rabbitmq_password.versionless_id})"
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

    environment_variables = {
      VITE_USE_PARTICIPANT_ROUTER = "1"
      VITE_API_BASE_URL = "https://api.dev.dembrane.com/api"
      VITE_PARTICIPANT_BASE_URL = "https://app.dev.dembrane.com"
      VITE_BUILD_VERSION = "dev"
      VITE_DIRECTUS_PUBLIC_URL = "https://directus.dev.dembrane.com"
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

    environment_variables = {
      VITE_USE_PARTICIPANT_ROUTER = "0"
      VITE_API_BASE_URL = "https://api.dev.dembrane.com/api"
      VITE_ADMIN_BASE_URL = "https://admin.dev.dembrane.com"
      VITE_BUILD_VERSION = "dev"
      VITE_DIRECTUS_PUBLIC_URL = "https://directus.dev.dembrane.com"
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

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.directus_identity.id]
  }

  container {
    name   = "directus"
    image  = "${data.azurerm_container_registry.acr.login_server}/directus:development-latest"
    cpu    = "1"
    memory = "2"
    ports {
      port     = 8055
      protocol = "TCP"
    }

    environment_variables = {
      SESSION_COOKIE_NAME = "directus_session_token"
      PORT = "8055"
      TELEMETRY = "false"
      CORS_ENABLED = "true"
      CORS_ORIGIN = "*"
      CORS_CREDENTIALS = "true"
      SESSION_COOKIE_DOMAIN = "dev.dembrane.com"
      SESSION_COOKIE_SAME_SITE = "lax"
      SESSION_COOKIE_SECURE = "true"
      WEBSOCKETS_ENABLED = "true"
      EMAIL_TRANSPORT = "smtp"
      AUTH_PROVIDERS = "google"
      AUTH_GOOGLE_DRIVER = "openid"
      AUTH_GOOGLE_ISSUER_URL = "https://accounts.google.com"
      AUTH_GOOGLE_IDENTIFIER_KEY = "email"
      AUTH_GOOGLE_FIRST_NAME_KEY = "given_name"
      AUTH_GOOGLE_LAST_NAME_KEY = "family_name"
      AUTH_GOOGLE_ICON = "google"
      AUTH_GOOGLE_LABEL = "Google"
      AUTH_GOOGLE_ALLOW_PUBLIC_REGISTRATION = "true"
      AUTH_GOOGLE_DEFAULT_ROLE_ID = "2446660a-ab6c-4801-ad69-5711030cba83"
      AUTH_GOOGLE_REDIRECT_ALLOW_LIST = "${azurerm_key_vault_secret.admin_base_url.value}/en-US/projects,${azurerm_key_vault_secret.admin_base_url.value}/nl-NL/projects"
      USER_REGISTER_URL_ALLOW_LIST = "${azurerm_key_vault_secret.admin_base_url.value}/verify-email"
      PASSWORD_RESET_URL_ALLOW_LIST = "${azurerm_key_vault_secret.admin_base_url.value}/password-reset"
      USER_INVITE_URL_ALLOW_LIST = "${azurerm_key_vault_secret.admin_base_url.value}/invite"
      ADMIN_EMAIL = "admin@dembrane.com"
    }

    secure_environment_variables = {
      PUBLIC_URL = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_public_url.versionless_id})"
      SECRET = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_secret.versionless_id})"
      ADMIN_TOKEN = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_admin_token.versionless_id})"
      DB_CLIENT = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_db_client.versionless_id})"
      DB_HOST = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_db_host.versionless_id})"
      DB_PORT = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_db_port.versionless_id})"
      DB_USER = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_db_user.versionless_id})"
      DB_PASSWORD = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_db_password.versionless_id})"
      DB_DATABASE = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_db_database.versionless_id})"
      REDIS_ENABLED = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_redis_enabled.versionless_id})"
      REDIS = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_redis_url.versionless_id})"
      # SMTP settings
      EMAIL_FROM = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_smtp_from.versionless_id})"
      EMAIL_SMTP_HOST = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_smtp_host.versionless_id})"
      EMAIL_SMTP_PORT = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_smtp_port.versionless_id})"
      EMAIL_SMTP_USER = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_smtp_user.versionless_id})"
      EMAIL_SMTP_PASSWORD = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_smtp_password.versionless_id})"
      # Admin credentials
      ADMIN_PASSWORD = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_admin_password.versionless_id})"
      # Auth settings
      AUTH_GOOGLE_CLIENT_ID = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_auth_google_client_id.versionless_id})"
      AUTH_GOOGLE_CLIENT_SECRET = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_auth_google_client_secret.versionless_id})"
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

# Worker managed identity
resource "azurerm_user_assigned_identity" "worker_identity" {
  name                = "DBR-${var.environment}-worker-identity"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

resource "azurerm_role_assignment" "worker_secret_access" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.worker_identity.principal_id
}

resource "azurerm_container_group" "worker" {
  name                = "DBR-${var.environment}-Workers-Worker-ACI"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.worker_identity.id]
  }

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

    secure_environment_variables = {
      DIRECTUS_PUBLIC_URL     = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_public_url.versionless_id})"
      DIRECTUS_TOKEN          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_admin_token.versionless_id})"
      DIRECTUS_SECRET         = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_secret.versionless_id})"
      ADMIN_BASE_URL          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.admin_base_url.versionless_id})"
      PARTICIPANT_BASE_URL    = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.participant_base_url.versionless_id})"
      OPENAI_API_KEY          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.openai_api_key.versionless_id})"
      ANTHROPIC_API_KEY       = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.anthropic_api_key.versionless_id})"
    }

    environment_variables = {
      DIRECTUS_SESSION_COOKIE_NAME = "directus_session_token"
      BUILD_VERSION               = "dev"
      RABBITMQ_URL                = "amqp://${azurerm_key_vault_secret.rabbitmq_user.value}:${azurerm_key_vault_secret.rabbitmq_password.value}@rabbitmq.dembrane.internal:5672"
      REDIS_URL                   = "redis://${azurerm_redis_cache.basic_redis.hostname}:${azurerm_redis_cache.basic_redis.ssl_port}"
      DISABLE_REDACTION           = "1"
      DISABLE_SENTRY              = "0"
      SERVE_API_DOCS              = "0"
      DATABASE_URL               = "postgresql+psycopg://dembrane:dembrane@${azurerm_cosmosdb_postgresql_cluster.cosmo.name}:5432/dembrane"
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

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.api_server_identity.id]
  }

  container {
    name   = "api-server"
    image  = "${data.azurerm_container_registry.acr.login_server}/api-server:development-latest"
    cpu    = "1"
    memory = "2"

    secure_environment_variables = {
      DIRECTUS_PUBLIC_URL           = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_public_url.versionless_id})"
      DIRECTUS_TOKEN               = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_admin_token.versionless_id})"
      DIRECTUS_SECRET             = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.directus_secret.versionless_id})"
      ADMIN_BASE_URL              = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.admin_base_url.versionless_id})"
      PARTICIPANT_BASE_URL        = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.participant_base_url.versionless_id})"
      OPENAI_API_KEY             = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.openai_api_key.versionless_id})"
      ANTHROPIC_API_KEY          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.anthropic_api_key.versionless_id})"
    }

    environment_variables = {
      DIRECTUS_SESSION_COOKIE_NAME = "directus_session_token"
      BUILD_VERSION               = "dev"
      RABBITMQ_URL               = "amqp://${azurerm_key_vault_secret.rabbitmq_user.value}:${azurerm_key_vault_secret.rabbitmq_password.value}@rabbitmq.dembrane.internal:5672"
      REDIS_URL                  = "redis://${azurerm_redis_cache.basic_redis.hostname}:${azurerm_redis_cache.basic_redis.ssl_port}"
      DISABLE_REDACTION          = "1"
      DISABLE_SENTRY             = "0"
      SERVE_API_DOCS             = "0"
      DATABASE_URL               = "postgresql+psycopg://dembrane:dembrane@${azurerm_cosmosdb_postgresql_cluster.cosmo.name}:5432/dembrane"
    }

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

# Enable container insights
resource "azurerm_log_analytics_solution" "container_insights" {
  solution_name         = "ContainerInsights"
  location              = azurerm_resource_group.rg.location
  resource_group_name   = azurerm_resource_group.rg.name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/ContainerInsights"
  }
}

# Create an Azure Dashboard for container monitoring
resource "azurerm_dashboard" "container_dashboard" {
  name                = "DBR-${var.environment}-ContainerMonitoring-Dashboard"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  dashboard_properties = <<DASHBOARD
{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${azurerm_log_analytics_workspace.main.id}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "value": "exclusive-part-id",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P1D",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "ContainerLog\n| where TimeGenerated > ago(1h)\n| project TimeGenerated, ContainerID, LogEntry\n| order by TimeGenerated desc\n| take 100",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "AnalyticsGrid",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Container Logs (Last 100)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "Log Analytics",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {}
          }
        },
        "1": {
          "position": {
            "x": 6,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${azurerm_log_analytics_workspace.main.id}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "value": "exclusive-part-id2",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P1D",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "Perf\n| where ObjectName == 'Container'\n| where CounterName == 'cpuUsageNanoCores'\n| summarize AvgCPU = avg(CounterValue) by bin(TimeGenerated, 5m), ContainerID\n| render timechart",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "CPU Usage by Container",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "Log Analytics",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {}
          }
        },
        "2": {
          "position": {
            "x": 0,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${azurerm_log_analytics_workspace.main.id}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "value": "exclusive-part-id3",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P1D",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "Perf\n| where ObjectName == 'Container'\n| where CounterName == 'memoryUsageBytes'\n| summarize AvgMemory = avg(CounterValue) by bin(TimeGenerated, 5m), ContainerID\n| render timechart",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Line",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Memory Usage by Container",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "Log Analytics",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {}
          }
        }
      }
    }
  },
  "metadata": {
    "model": {
      "timeRange": {
        "value": {
          "relative": {
            "duration": 24,
            "timeUnit": 1
          }
        },
        "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
      },
      "filterLocale": {
        "value": "en-us"
      },
      "filters": {
        "value": {
          "MsPortalFx_TimeRange": {
            "model": {
              "format": "utc",
              "granularity": "auto",
              "relative": "24h"
            },
            "displayCache": {
              "name": "UTC Time",
              "value": "Past 24 hours"
            },
            "filteredPartIds": [
              "StartboardPart-LogsDashboardPart-1",
              "StartboardPart-LogsDashboardPart-2",
              "StartboardPart-LogsDashboardPart-3"
            ]
          }
        }
      }
    }
  }
}
DASHBOARD
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

# DNS Zone
# TODO: Ops team needs to add the following NS records in the parent domain (dembrane.com) to delegate the dev subdomain:
# dev.dembrane.com NS ns1-09.azure-dns.com
# dev.dembrane.com NS ns2-09.azure-dns.net
# dev.dembrane.com NS ns3-09.azure-dns.org
# dev.dembrane.com NS ns4-09.azure-dns.info
# This delegation is required for Let's Encrypt DNS validation to work properly.
resource "azurerm_dns_zone" "dev_zone" {
  name                = "dev.dembrane.com"
  resource_group_name = azurerm_resource_group.rg.name
}

#  A records pointing to Application Gateway IP
resource "azurerm_dns_a_record" "directus" {
  name                = "directus"
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

resource "azurerm_dns_a_record" "admin" {
  name                = "admin"
  zone_name           = azurerm_dns_zone.dev_zone.name
  resource_group_name = azurerm_resource_group.rg.name
  ttl                 = 300
  target_resource_id  = azurerm_public_ip.appgw.id
}



### VARS

# rabbitmq

# Create secrets for RabbitMQ credentials
resource "azurerm_key_vault_secret" "rabbitmq_user" {
  name         = "rabbitmq-default-user"
  value        = "dembrane"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "rabbitmq_password" {
  name         = "rabbitmq-default-password"
  value        = "dembrane"  # Initial value, should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_user_assigned_identity" "container_identity" {
  name                = "DBR-${var.environment}-rabbitmq-identity"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

# Grant the container identity access to Key Vault secrets
resource "azurerm_role_assignment" "container_secret_access" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.container_identity.principal_id
}

# directus

resource "azurerm_key_vault_secret" "directus_public_url" {
  name         = "directus-public-url"
  value        = "https://directus.dev.dembrane.com"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_admin_token" {
  name         = "directus-admin-token"
  value        = "initial-token-value"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_secret" {
  name         = "directus-secret"
  value        = "initial-secret-value"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_db_client" {
  name         = "directus-db-client"
  value        = "postgres"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_db_host" {
  name         = "directus-db-host"
  value        = azurerm_cosmosdb_postgresql_cluster.cosmo.name
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_db_port" {
  name         = "directus-db-port"
  value        = "5432"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_db_user" {
  name         = "directus-db-user"
  value        = "dembrane"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_db_password" {
  name         = "directus-db-password"
  value        = "1n1t14l_p@ssw0rd"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_db_database" {
  name         = "directus-db-database"
  value        = "dembrane"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_redis_enabled" {
  name         = "directus-redis-enabled"
  value        = "true"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_key_vault_secret" "directus_redis_url" {
  name         = "directus-redis-url"
  value        = "redis://${azurerm_redis_cache.basic_redis.hostname}:${azurerm_redis_cache.basic_redis.ssl_port}"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

# Email settings
resource "azurerm_key_vault_secret" "directus_smtp_from" {
  name         = "directus-smtp-from"
  value        = ""  # Will be set post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_smtp_host" {
  name         = "directus-smtp-host"
  value        = ""  # Will be set post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_smtp_port" {
  name         = "directus-smtp-port"
  value        = ""  # Will be set post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_smtp_user" {
  name         = "directus-smtp-user"
  value        = ""  # Will be set post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_smtp_password" {
  name         = "directus-smtp-password"
  value        = ""  # Will be set post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

# Admin credentials
resource "azurerm_key_vault_secret" "directus_admin_password" {
  name         = "directus-admin-password"
  value        = ""  # Will be set post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

# Auth settings
resource "azurerm_key_vault_secret" "directus_auth_google_client_id" {
  name         = "directus-auth-google-client-id"
  value        = "initial-google-client-id"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "directus_auth_google_client_secret" {
  name         = "directus-auth-google-client-secret"
  value        = "initial-google-client-secret"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "admin_base_url" {
  name         = "admin-base-url"
  value        = "https://admin.dev.dembrane.com"  # Example value
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id

}

resource "azurerm_key_vault_secret" "participant_base_url" {
  name         = "participant-base-url"
  value        = "https://app.dev.dembrane.com"  # Example value
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id

}

resource "azurerm_key_vault_secret" "openai_api_key" {
  name         = "openai-api-key"
  value        = "initial-openai-key"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "anthropic_api_key" {
  name         = "anthropic-api-key"
  value        = "initial-anthropic-key"  # Should be changed post-deployment
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  value        = "postgresql+psycopg://dembrane:dembrane@${azurerm_cosmosdb_postgresql_cluster.cosmo.name}.postgres.cosmos.azure.com:5432/dembrane?sslmode=require"
  key_vault_id = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
}

resource "azurerm_user_assigned_identity" "api_server_identity" {
  name                = "DBR-${var.environment}-api-server-identity"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

resource "azurerm_role_assignment" "api_server_secret_access" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.api_server_identity.principal_id
}

# Directus managed identity
resource "azurerm_user_assigned_identity" "directus_identity" {
  name                = "DBR-${var.environment}-directus-identity"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

resource "azurerm_role_assignment" "directus_secret_access" {
  scope                = azurerm_key_vault.DBR-dev-Backend-RuntimeConfig-KeyVault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.directus_identity.principal_id
}

# worker envs
