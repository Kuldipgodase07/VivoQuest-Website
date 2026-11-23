# VivoQuest Production Architecture

## System Topography

```
                    +---------------------------+
                    |    Client Devices / PWA   |
                    | (React 18 + Offline-first)|
                    +-------------+-------------+
                                  |
                                  v
                    +-------------+-------------+
                    |   NGINX Ingress Gateway   |
                    +-------------+-------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------+-----------+                   +-----------+-----------+
|   Node.js Backend     |                   |  FastAPI AI/ML Engine |
| Express, JWT, Sockets |<----------------->| Caregiver Matching    |
+-----------+-----------+                   | Clinical Triage       |
            |                               +-----------------------+
            v
+-----------+-----------+
| PostgreSQL 16 + Redis |
| Clinical DB & Caching |
+-----------------------+
```
