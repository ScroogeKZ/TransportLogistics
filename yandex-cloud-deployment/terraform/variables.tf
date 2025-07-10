# Переменные для Terraform конфигурации

variable "yandex_cloud_id" {
  description = "Yandex Cloud ID"
  type        = string
}

variable "yandex_folder_id" {
  description = "Yandex Cloud folder ID"
  type        = string
}

variable "yandex_zone" {
  description = "Yandex Cloud zone"
  type        = string
  default     = "ru-central1-a"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "transport-registry"
}

variable "database_url" {
  description = "PostgreSQL database connection URL"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Secret key for session encryption"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "ssl_certificate_id" {
  description = "Certificate Manager certificate ID for HTTPS"
  type        = string
  default     = ""
}

variable "create_managed_database" {
  description = "Whether to create managed PostgreSQL database"
  type        = bool
  default     = false
}

variable "database_password" {
  description = "Password for managed database user"
  type        = string
  sensitive   = true
  default     = ""
}

variable "container_memory" {
  description = "Memory limit for serverless container (MB)"
  type        = number
  default     = 1024
}

variable "container_cores" {
  description = "Number of CPU cores for serverless container"
  type        = number
  default     = 1
}

variable "container_execution_timeout" {
  description = "Execution timeout for serverless container (seconds)"
  type        = string
  default     = "60s"
}

variable "environment" {
  description = "Environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "enable_logging" {
  description = "Enable logging for serverless container"
  type        = bool
  default     = true
}

variable "log_group_retention_period" {
  description = "Log retention period in days"
  type        = number
  default     = 7
}

variable "monitoring_enabled" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "backup_enabled" {
  description = "Enable database backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "allowed_ips" {
  description = "List of allowed IP addresses (CIDR notation)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "max_concurrent_requests" {
  description = "Maximum number of concurrent requests"
  type        = number
  default     = 10
}

variable "scale_policy" {
  description = "Auto-scaling policy"
  type = object({
    min_instances = number
    max_instances = number
  })
  default = {
    min_instances = 1
    max_instances = 10
  }
}