# Terraform конфигурация для Yandex Cloud
terraform {
  required_providers {
    yandex = {
      source  = "yandex-cloud/yandex"
      version = "~> 0.84"
    }
  }
}

# Конфигурация провайдера
provider "yandex" {
  zone = var.yandex_zone
}

# Переменные
variable "yandex_zone" {
  description = "Yandex Cloud zone"
  type        = string
  default     = "ru-central1-a"
}

variable "folder_id" {
  description = "Yandex Cloud folder ID"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL database URL"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret key"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# Сервисный аккаунт
resource "yandex_iam_service_account" "transport_service_account" {
  name        = "transport-service-account"
  description = "Service account for transport registry application"
  folder_id   = var.folder_id
}

# Роли для сервисного аккаунта
resource "yandex_resourcemanager_folder_iam_binding" "container_invoker" {
  folder_id = var.folder_id
  role      = "serverless.containers.invoker"
  members   = ["serviceAccount:${yandex_iam_service_account.transport_service_account.id}"]
}

resource "yandex_resourcemanager_folder_iam_binding" "container_puller" {
  folder_id = var.folder_id
  role      = "container-registry.images.puller"
  members   = ["serviceAccount:${yandex_iam_service_account.transport_service_account.id}"]
}

# Container Registry
resource "yandex_container_registry" "transport_registry" {
  name      = "transport-registry"
  folder_id = var.folder_id
}

# Serverless Container
resource "yandex_serverless_container" "transport_container" {
  name               = "transport-container"
  folder_id          = var.folder_id
  description        = "Transport Registry Application"
  memory             = 1024
  execution_timeout  = "60s"
  cores              = 1
  core_fraction      = 100
  service_account_id = yandex_iam_service_account.transport_service_account.id
  
  image {
    url = "${yandex_container_registry.transport_registry.name}/transport-app:latest"
    environment = {
      NODE_ENV       = "production"
      PORT           = "8080"
      DATABASE_URL   = var.database_url
      SESSION_SECRET = var.session_secret
    }
  }
}

# Managed PostgreSQL кластер (опционально)
resource "yandex_mdb_postgresql_cluster" "transport_postgres" {
  count       = var.create_managed_db ? 1 : 0
  name        = "transport-postgres"
  folder_id   = var.folder_id
  environment = "PRODUCTION"
  
  config {
    version = "15"
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id       = "network-ssd"
      disk_size          = 20
    }
  }
  
  host {
    zone      = var.yandex_zone
    name      = "pg-host-1"
    assign_public_ip = true
  }
  
  database {
    name  = "transport_registry"
    owner = "transport_user"
  }
  
  user {
    name     = "transport_user"
    password = var.db_password
    permission {
      database_name = "transport_registry"
    }
  }
}

variable "create_managed_db" {
  description = "Create managed PostgreSQL database"
  type        = bool
  default     = false
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = ""
}

# API Gateway для кастомного домена
resource "yandex_api_gateway" "transport_gateway" {
  count       = var.domain_name != "" ? 1 : 0
  name        = "transport-gateway"
  folder_id   = var.folder_id
  description = "API Gateway for transport registry"
  
  spec = yamlencode({
    openapi = "3.0.0"
    info = {
      title   = "Transport Registry API"
      version = "1.0.0"
    }
    paths = {
      "/{proxy+}" = {
        "x-yc-apigateway-any-method" = {
          "x-yc-apigateway-integration" = {
            type = "serverless_containers"
            container_id = yandex_serverless_container.transport_container.id
            service_account_id = yandex_iam_service_account.transport_service_account.id
          }
        }
      }
    }
  })
}

# Вывод результатов
output "container_url" {
  description = "URL of the deployed container"
  value       = yandex_serverless_container.transport_container.url
}

output "registry_id" {
  description = "Container Registry ID"
  value       = yandex_container_registry.transport_registry.id
}

output "service_account_id" {
  description = "Service Account ID"
  value       = yandex_iam_service_account.transport_service_account.id
}

output "gateway_url" {
  description = "API Gateway URL"
  value       = var.domain_name != "" ? yandex_api_gateway.transport_gateway[0].domain : ""
}

output "database_info" {
  description = "Database connection info"
  value = var.create_managed_db ? {
    host     = yandex_mdb_postgresql_cluster.transport_postgres[0].host[0].fqdn
    port     = 6432
    database = "transport_registry"
    user     = "transport_user"
  } : null
}