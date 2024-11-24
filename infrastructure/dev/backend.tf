#note: the storage account itself is not in this tf state. It is created manually in the Azure portal. -dt

terraform {
  backend "azurerm" {
    resource_group_name  = "DBR-prod-CICD-OrchestrationResourches-RG"
    storage_account_name = "dembranetfstate"
    container_name       = "dbr-dev-cicd-tfstate-container"
    key                  = "terraform.tfstate"
  }
}

