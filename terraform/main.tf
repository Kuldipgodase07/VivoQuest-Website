terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.25"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.25"
    }
  }
  backend "gcs" {
    bucket = "vq-terraform-state-asia-south1"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.primary_region
}

provider "google-beta" {
  project = var.project_id
  region  = var.primary_region
}

# ==============================================================================
# 1. Organization Policy: Restrict Data & Resources to India (asia-south1 & asia-south2)
# ==============================================================================
resource "google_project_organization_policy" "resource_location_restriction" {
  project    = var.project_id
  constraint = "constraints/gcp.resourceLocations"

  list_policy {
    allow {
      values = [
        "in:asia-south1-locations",
        "in:asia-south2-locations"
      ]
    }
  }
}

# ==============================================================================
# 2. KMS Keyring & Keys (CMEK and Field-Level Encryption)
# ==============================================================================
resource "google_kms_key_ring" "vivoquest_keyring" {
  name     = "vivoquest-keyring-${var.environment}"
  location = var.primary_region
}

resource "google_kms_crypto_key" "storage_cmek_key" {
  name            = "storage-cmek-key"
  key_ring        = google_kms_key_ring.vivoquest_keyring.id
  rotation_period = "31536000s" # 1 year rotation per Section 2 & 9
}

resource "google_kms_crypto_key" "field_encryption_key" {
  name            = "field-encryption-key"
  key_ring        = google_kms_key_ring.vivoquest_keyring.id
  rotation_period = "31536000s" # 1 year rotation
}

# ==============================================================================
# 3. VPC Network, Subnets, Serverless Connector & Private Service Connect (PSC)
# ==============================================================================
resource "google_compute_network" "vpc_network" {
  name                    = "vivoquest-vpc-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet_primary" {
  name          = "subnet-${var.primary_region}"
  ip_cidr_range = "10.10.0.0/20"
  region        = var.primary_region
  network       = google_compute_network.vpc_network.id

  private_ip_google_access = true
}

resource "google_compute_subnetwork" "subnet_dr" {
  name          = "subnet-${var.dr_region}"
  ip_cidr_range = "10.20.0.0/20"
  region        = var.dr_region
  network       = google_compute_network.vpc_network.id

  private_ip_google_access = true
}

# Serverless VPC Access Connector for Cloud Run
resource "google_vpc_access_connector" "serverless_connector" {
  name          = "vq-vpc-conn-${var.environment}"
  region        = var.primary_region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc_network.name
  min_instances = 2
  max_instances = 10
}

# Private Service Connect (PSC) Forwarding Rule to MongoDB Atlas
resource "google_compute_address" "psc_atlas_ip" {
  name         = "psc-atlas-ip-${var.environment}"
  subnetwork   = google_compute_subnetwork.subnet_primary.id
  address_type = "INTERNAL"
  region       = var.primary_region
}

resource "google_compute_forwarding_rule" "psc_atlas_endpoint" {
  name                  = "psc-atlas-endpoint-${var.environment}"
  region                = var.primary_region
  network               = google_compute_network.vpc_network.id
  ip_address            = google_compute_address.psc_atlas_ip.id
  load_balancing_scheme = ""
  target                = var.mongodb_atlas_psc_target
}

# Cloud Router and Cloud NAT for outbound API calls (e.g. SMS DLT, Payment Gateways)
resource "google_compute_router" "router" {
  name    = "vq-router-${var.environment}"
  region  = var.primary_region
  network = google_compute_network.vpc_network.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "vq-nat-${var.environment}"
  router                             = google_compute_router.router.name
  region                             = var.primary_region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# ==============================================================================
# 4. Google Cloud Storage (CMEK encrypted, 30-day lifecycle)
# ==============================================================================
resource "google_storage_bucket" "reports_bucket" {
  name                        = "vq-${var.environment}-reports-${var.primary_region}"
  location                    = var.primary_region
  uniform_bucket_level_access = true

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage_cmek_key.id
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 30 # 30-day TTL for generated report jobs
    }
  }
}

# ==============================================================================
# 5. Memorystore for Redis (Standard HA Tier with failover)
# ==============================================================================
resource "google_redis_instance" "redis_cache" {
  name               = "vivoquest-redis-${var.environment}"
  tier               = "STANDARD_HA"
  memory_size_gb     = 5
  region             = var.primary_region
  authorized_network = google_compute_network.vpc_network.id
  redis_version      = "REDIS_7_0"
  display_name       = "VivoQuest Session, Idempotency & Rate Limit Cache"
}

# ==============================================================================
# 6. Service Accounts & Least Privilege IAM
# ==============================================================================
resource "google_service_account" "api_sa" {
  account_id   = "vq-api-sa-${var.environment}"
  display_name = "VivoQuest Cloud Run API Service Account"
}

resource "google_service_account" "worker_sa" {
  account_id   = "vq-worker-sa-${var.environment}"
  display_name = "VivoQuest Cloud Run Worker Service Account"
}

# ==============================================================================
# 7. Secret Manager for Credentials & Gateway Keys
# ==============================================================================
resource "google_secret_manager_secret" "mongodb_uri" {
  secret_id = "mongodb-atlas-uri-${var.environment}"
  replication {
    user_managed {
      replicas {
        location = var.primary_region
      }
    }
  }
}

resource "google_secret_manager_secret" "razorpay_secrets" {
  secret_id = "razorpay-secrets-${var.environment}"
  replication {
    user_managed {
      replicas {
        location = var.primary_region
      }
    }
  }
}

resource "google_secret_manager_secret" "stripe_secrets" {
  secret_id = "stripe-secrets-${var.environment}"
  replication {
    user_managed {
      replicas {
        location = var.primary_region
      }
    }
  }
}

# ==============================================================================
# 8. Cloud Tasks & Pub/Sub Queues for Asynchronous Work
# ==============================================================================
resource "google_cloud_tasks_queue" "default_queue" {
  name     = "vivoquest-tasks-${var.environment}"
  location = var.primary_region

  rate_limits {
    max_dispatches_per_second = 500
    max_concurrent_dispatches = 100
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "1s"
    max_backoff        = "60s"
    max_doublings      = 4
    max_retry_duration = "3600s"
  }
}

resource "google_pubsub_topic" "events_topic" {
  name = "vivoquest-events-${var.environment}"
}

resource "google_pubsub_subscription" "events_sub" {
  name  = "vivoquest-events-sub-${var.environment}"
  topic = google_pubsub_topic.events_topic.name

  ack_deadline_seconds = 60
}

# ==============================================================================
# 9. Cloud Run Services: API & Worker
# ==============================================================================
resource "google_cloud_run_v2_service" "api_service" {
  name     = "vivoquest-api-${var.environment}"
  location = var.primary_region

  template {
    service_account = google_service_account.api_sa.email

    scaling {
      min_instance_count = var.environment == "prod" ? 3 : 1
      max_instance_count = 100
    }

    vpc_access {
      connector = google_vpc_access_connector.serverless_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }
      env {
        name  = "PORT"
        value = "8080"
      }
      env {
        name  = "APP_MODE"
        value = "api"
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.primary_region
      }
      env {
        name  = "GCS_REPORTS_BUCKET"
        value = google_storage_bucket.reports_bucket.name
      }
      env {
        name  = "REDIS_HOST"
        value = google_redis_instance.redis_cache.host
      }
      env {
        name  = "REDIS_PORT"
        value = tostring(google_redis_instance.redis_cache.port)
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_v2_service" "worker_service" {
  name     = "vivoquest-worker-${var.environment}"
  location = var.primary_region

  template {
    service_account = google_service_account.worker_sa.email

    scaling {
      min_instance_count = 1
      max_instance_count = 30
    }

    vpc_access {
      connector = google_vpc_access_connector.serverless_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }
      env {
        name  = "APP_MODE"
        value = "worker"
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.primary_region
      }
      env {
        name  = "GCS_REPORTS_BUCKET"
        value = google_storage_bucket.reports_bucket.name
      }
    }
  }
}

# ==============================================================================
# 10. Cloud Armor WAF & External Application Load Balancer
# ==============================================================================
resource "google_compute_security_policy" "cloud_armor_waf" {
  name = "vivoquest-waf-${var.environment}"

  # Default allow
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow"
  }

  # Rate limiting rule: 500 requests per minute per IP
  rule {
    action   = "rate_based_ban"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 500
        interval_sec = 60
      }
      ban_duration_sec = 600
    }
    description = "Rate limiting threshold protection"
  }

  # OWASP SQLi Protection Preconfigured Rule
  rule {
    action   = "deny(403)"
    priority = "2000"
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})"
      }
    }
    description = "Block OWASP SQLi injection attempts"
  }

  # OWASP XSS Protection Preconfigured Rule
  rule {
    action   = "deny(403)"
    priority = "3000"
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('xss-v33-stable', {'sensitivity': 1})"
      }
    }
    description = "Block OWASP Cross-Site Scripting (XSS) attempts"
  }
}

# ==============================================================================
# 11. Monitoring, Alerting & CERT-In Log Retention
# ==============================================================================
# Cloud Logging Bucket retained for 180 days (CERT-In Direction)
resource "google_logging_project_bucket_config" "cert_in_log_bucket" {
  project        = var.project_id
  location       = var.primary_region
  retention_days = 180
  bucket_id      = "cert-in-audit-logs-${var.environment}"
}

# Alert: Latency p95 > 300ms
resource "google_monitoring_alert_policy" "latency_alert" {
  display_name = "VivoQuest API Latency p95 High (>300ms)"
  combiner     = "OR"
  conditions {
    display_name = "Cloud Run Latency Condition"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_latencies\" AND resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_v2_service.api_service.name}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 300
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }
}
