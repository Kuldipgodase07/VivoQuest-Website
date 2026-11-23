variable "org_id" {
  description = "Google Cloud Organization ID"
  type        = string
  default     = "123456789012"
}

variable "billing_account" {
  description = "Google Cloud Billing Account ID"
  type        = string
  default     = "012345-6789AB-CDEF01"
}

variable "environment" {
  description = "Deployment environment (dev, stage, prod)"
  type        = string
  default     = "dev"
}

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "vq-dev"
}

variable "primary_region" {
  description = "Primary Google Cloud Region (Mumbai)"
  type        = string
  default     = "asia-south1"
}

variable "dr_region" {
  description = "Disaster Recovery Google Cloud Region (Delhi)"
  type        = string
  default     = "asia-south2"
}

variable "container_image" {
  description = "Container image URI in Artifact Registry"
  type        = string
  default     = "asia-south1-docker.pkg.dev/vq-dev/vivoquest/api:latest"
}

variable "domain_name" {
  description = "Custom domain name for the API"
  type        = string
  default     = "api.dev.vivoquest.in"
}

variable "mongodb_atlas_psc_target" {
  description = "Private Service Connect service attachment from MongoDB Atlas"
  type        = string
  default     = "projects/mongodb-atlas/regions/asia-south1/serviceAttachments/atlas-psc-sa"
}
