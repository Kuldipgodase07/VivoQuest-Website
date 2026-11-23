output "api_service_url" {
  description = "Cloud Run API Service URL"
  value       = google_cloud_run_v2_service.api_service.uri
}

output "worker_service_name" {
  description = "Cloud Run Worker Service Name"
  value       = google_cloud_run_v2_service.worker_service.name
}

output "redis_host" {
  description = "Memorystore Redis Instance Host"
  value       = google_redis_instance.redis_cache.host
}

output "reports_bucket_name" {
  description = "Cloud Storage Bucket for Report Exports"
  value       = google_storage_bucket.reports_bucket.name
}

output "tasks_queue_id" {
  description = "Cloud Tasks Queue Identifier"
  value       = google_cloud_tasks_queue.default_queue.id
}

output "psc_atlas_endpoint_ip" {
  description = "Private Service Connect Endpoint IP for MongoDB Atlas"
  value       = google_compute_address.psc_atlas_ip.address
}
