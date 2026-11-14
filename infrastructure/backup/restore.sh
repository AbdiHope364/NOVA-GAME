#!/bin/bash
set -euo pipefail

# ==============================================================================
# NOVA Gaming Platform - PostgreSQL Database Restore Script
# ==============================================================================
# Usage:
#   ./restore.sh [path_to_backup.sql.gz]
# If no argument is provided, the script restores the latest available backup.

BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-nova}"
POSTGRES_DB="${POSTGRES_DB:-nova_gaming}"

TARGET_BACKUP="${1:-}"

if [ -z "${TARGET_BACKUP}" ]; then
  # Find latest backup in directory
  TARGET_BACKUP=$(find "${BACKUP_DIR}" -type f -name "backup_${POSTGRES_DB}_*.sql.gz" | sort -r | head -n 1)
fi

if [ -z "${TARGET_BACKUP}" ] || [ ! -f "${TARGET_BACKUP}" ]; then
  echo "❌ ERROR: No backup file found to restore in '${BACKUP_DIR}'!"
  exit 1
fi

echo "⚠️  WARNING: You are about to RESTORE '${TARGET_BACKUP}' into database '${POSTGRES_DB}' on '${POSTGRES_HOST}'."
echo "This will replace all current tables and data in '${POSTGRES_DB}'."

if [ "${FORCE_RESTORE:-0}" != "1" ]; then
  read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
  if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore aborted by user."
    exit 0
  fi
fi

echo "[$(date -Iseconds)] 🔄 Terminating active connections to '${POSTGRES_DB}'..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" || true

echo "[$(date -Iseconds)] 📥 Restoring database from archive '${TARGET_BACKUP}'..."
gunzip -c "${TARGET_BACKUP}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -v ON_ERROR_STOP=1

echo "[$(date -Iseconds)] ✅ Database restore verified and completed successfully!"
