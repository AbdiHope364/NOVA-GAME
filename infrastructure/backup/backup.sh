#!/bin/bash
set -euo pipefail

# ==============================================================================
# NOVA Gaming Platform - PostgreSQL Automated Backup Script
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-nova}"
POSTGRES_DB="${POSTGRES_DB:-nova_gaming}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "[$(date -Iseconds)] 🔄 Starting PostgreSQL database backup for '${POSTGRES_DB}' on host '${POSTGRES_HOST}'..."

# Run pg_dump and pipe through gzip
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -F p \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  | gzip -9 > "${BACKUP_FILE}"

# Verify backup was created and is non-empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "[$(date -Iseconds)] ❌ ERROR: Backup file '${BACKUP_FILE}' is empty or failed to generate!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Verify gzip archive integrity
gzip -t "${BACKUP_FILE}"
FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo "[$(date -Iseconds)] ✅ Backup completed successfully: ${BACKUP_FILE} (${FILESIZE})"

# Enforce 14-day retention policy: purge archives older than 14 days
echo "[$(date -Iseconds)] 🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "backup_${POSTGRES_DB}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -vf {} \;

echo "[$(date -Iseconds)] 🏁 Backup procedure completed."
