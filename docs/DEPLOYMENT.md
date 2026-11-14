# NOVA Gaming Platform - Production Deployment & Operations Manual

This guide covers setting up, securing, deploying, monitoring, and operating the NOVA Gaming platform on a public production Virtual Private Server (VPS) running Ubuntu 22.04 / 24.04 LTS.

---

## 1. Production Architecture Overview

```
                          [ Internet / Mobile Players ]
                                       │
                                       ▼ (HTTPS / WSS)
                 ┌───────────────────────────────────────────┐
                 │         Caddy Reverse Proxy (443)         │
                 │   - Automatic Let's Encrypt TLS           │
                 │   - Zstd / Gzip Compression               │
                 │   - Static Asset Caching (1yr Immutable)  │
                 │   - WebSocket Upgrades (/socket.io/*)     │
                 └──────────────┬────────────────────────────┘
                                │ (HTTP / WS internal proxy)
                 ┌──────────────▼────────────────────────────┐
                 │       Public Frontend Network             │
                 │   ┌───────────────────────────────────┐   │
                 │   │  nova-api Replicas (Node 20)      │   │
                 │   │  - Auth, Wallet, PvP Matchmaking  │   │
                 │   │  - Pure Rules Engine Validation   │   │
                 │   │  - Socket.IO Redis Adapter Sync   │   │
                 │   │  - Crash Distributed Leader       │   │
                 │   └─────────────────┬─────────────────┘   │
                 └─────────────────────┼─────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        │                 Private Internal Network                     │
        │           (Strictly unreachable from Internet)               │
        │                                                             │
        │   ┌───────────────────────────┐ ┌───────────────────────┐   │
        │   │  PostgreSQL 16 Database   │ │  Redis 7 Cluster Sync │   │
        │   │  - Append-Only Ledger     │ │  - Socket Pub/Sub     │   │
        │   │  - CHECK (balance >= 0)   │ │  - Leader Lock TTL    │   │
        │   └─────────────┬─────────────┘ └───────────────────────┘   │
        │                 │                                           │
        │   ┌─────────────▼─────────────┐                             │
        │   │  Nightly Backup Service   │                             │
        │   │  - pg_dump gzip to volume │                             │
        │   │  - 14-Day Purge Retention │                             │
        │   └───────────────────────────┘                             │
        └─────────────────────────────────────────────────────────────┘
```

---

## 2. Server Provisioning & OS Hardening

### 2.1. Recommended Specifications
- **CPU**: 2+ vCPUs (x86_64 or ARM64)
- **RAM**: 4 GB RAM minimum (8 GB recommended for heavy traffic)
- **Disk**: 50 GB NVMe SSD
- **OS**: Ubuntu 22.04 or 24.04 LTS

### 2.2. SSH Key Hardening
Log in as root and disable password authentication:

```bash
# Update packages
apt update && apt upgrade -y

# Configure SSH for key-only authentication
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2.3. Firewall Configuration (UFW)
Expose only SSH, HTTP, and HTTPS. Keep all database and cache ports closed to the outside world:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy LetEncrypt challenge & redirect)'
ufw allow 443/tcp comment 'HTTPS (Secure Web & WebSockets)'
ufw enable
```

### 2.4. Unattended Security Updates
```bash
apt install -y unattended-upgrades fail2ban
dpkg-reconfigure --priority=low unattended-upgrades
systemctl enable fail2ban && systemctl start fail2ban
```

### 2.5. Install Docker Engine & Compose
```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
```

---

## 3. DNS Configuration

Configure DNS A/AAAA records with your domain registrar:

| Type | Name | Target | Purpose |
|------|------|--------|---------|
| A | `@` (novagame.et) | `<SERVER_PUBLIC_IP>` | Main Player Web Application & API |
| A | `admin` (admin.novagame.et) | `<SERVER_PUBLIC_IP>` | Administrative Portal Subdomain |

*Note: Allow up to 10 minutes for DNS propagation.*

---

## 4. First-Time Platform Deployment

### 4.1. Clone Repository & Prepare Directory
```bash
mkdir -p /opt/nova-gaming
cd /opt/nova-gaming
git clone https://github.com/your-org/nova-gaming.git .
```

### 4.2. Create Production Environment File
Copy the provided `.env.example` to `.env`:

```bash
cp .env.example .env
nano .env
```

Set strong credentials:
- `JWT_SECRET`: Random 64-character alphanumeric string (`openssl rand -hex 32`).
- `POSTGRES_PASSWORD`: Strong database password.
- `INITIAL_ADMIN_PASSWORD`: Secure initial superadmin password.
- `DOMAIN`: Your actual registered domain (e.g., `novagame.et`).
- `GEO_ALLOWED_COUNTRIES`: `ET` (to restrict access to Ethiopian networks) or leave blank.

### 4.3. Run Initial Database Migrations & Seed
```bash
# 1. Start database and cache dependencies
docker compose -f docker-compose.prod.yml up -d postgres redis

# 2. Wait 10 seconds for PostgreSQL to become healthy
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U nova -d nova_gaming

# 3. Apply baseline Prisma PostgreSQL migration
docker compose -f docker-compose.prod.yml run --rm api \
  npx prisma migrate deploy --schema=packages/database/prisma/schema.postgresql.prisma

# 4. Seed game configs and initial admin account
docker compose -f docker-compose.prod.yml run --rm api \
  node --loader tsx packages/database/prisma/seed.ts
```

### 4.4. Start Complete Application Stack
```bash
docker compose -f docker-compose.prod.yml up -d
```

Verify that all containers are healthy:
```bash
docker compose -f docker-compose.prod.yml ps
curl -i https://novagame.et/healthz
curl -i https://novagame.et/readyz
```

---

## 5. Routine Operations & Updates

### 5.1. Deploying a New Code Release
When new commits merge to `main`, the GitHub Actions workflow automatically builds images, runs migrations, and triggers rolling updates. To update manually:

```bash
cd /opt/nova-gaming
git pull origin main

# Record previous tag for safety
docker inspect --format='{{.Config.Image}}' nova-api > .rollback_tag

# Build / pull updated images
docker compose -f docker-compose.prod.yml build

# Apply any new database migrations
docker compose -f docker-compose.prod.yml run --rm api \
  npx prisma migrate deploy --schema=packages/database/prisma/schema.postgresql.prisma

# Zero-downtime rolling restart
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

### 5.2. Instant Rollback Procedure
If a deployment exhibits regressions:

```bash
cd /opt/nova-gaming

# Revert to previous image tag recorded during deployment
PREV_IMAGE=$(cat .rollback_tag)
echo "Rolling back to ${PREV_IMAGE}..."

docker tag ${PREV_IMAGE} nova-api:latest
docker compose -f docker-compose.prod.yml up -d
```

### 5.3. Viewing Real-Time Logs
```bash
# Follow logs across all API instances
docker compose -f docker-compose.prod.yml logs -f api

# Follow proxy access and TLS certificates
docker compose -f docker-compose.prod.yml logs -f proxy

# View database and backup logs
docker compose -f docker-compose.prod.yml logs -f postgres backup
```

---

## 6. Backup & Disaster Recovery

### 6.1. Automated Nightly Backups
The `backup` container runs nightly at 02:00 UTC, outputting compressed `.sql.gz` archives to the mounted Docker volume `postgres_backups`. Archives older than 14 days are purged automatically.

To run an on-demand manual backup:
```bash
docker compose -f docker-compose.prod.yml exec backup /scripts/backup.sh
```

### 6.2. Listing Available Backups
```bash
docker compose -f docker-compose.prod.yml exec backup ls -lh /backups
```

### 6.3. Restoring from a Backup
To restore the database from a backup archive:

```bash
# Restore latest backup
docker compose -f docker-compose.prod.yml exec -e FORCE_RESTORE=1 backup /scripts/restore.sh

# Or restore a specific historical archive:
docker compose -f docker-compose.prod.yml exec -e FORCE_RESTORE=1 backup \
  /scripts/restore.sh /backups/backup_nova_gaming_2026-11-01_020000.sql.gz
```

---

## 7. Performance Benchmarking & Load Testing

To simulate 500 concurrent WebSocket players and 100 simultaneous matches:

```bash
node tests/load/dama-socket-load.js https://novagame.et
```
The test suite outputs P50/P90/P95 latency percentiles, error rates, and connection stability metrics.
