#!/usr/bin/env bash
# Daily PostgreSQL backup: pg_dump → gzip → local prune → rsync to Dreamhost
# Deployed to ~/scripts/backup-db.sh on the Mac Mini (symlinked from this repo file).
# Scheduled by ~/Library/LaunchAgents/com.jfunk.db-backup.plist at 02:00 daily.
set -euo pipefail

# Absolute path — launchd does not source ~/.zprofile
PG_DUMP=/opt/homebrew/opt/postgresql@16/bin/pg_dump

BACKUP_DIR="$HOME/backups/db"
LOG_FILE="$HOME/logs/backup-db.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

REMOTE_USER="jfunkshell"
REMOTE_HOST="ssh.houseoffunk.net"
REMOTE_PATH="~/backups/my-collections/"
SSH_KEY="$HOME/.ssh/id_ed25519_dreamhost"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log "=== Backup started ==="

dump_db() {
  local env_file=$1 label=$2
  local db_url out
  db_url=$(grep '^DATABASE_URL=' "$env_file" | cut -d= -f2-)
  out="$BACKUP_DIR/${label}_${TIMESTAMP}.sql.gz"
  log "Dumping $label ..."
  "$PG_DUMP" "$db_url" | gzip > "$out"
  log "Done: $out ($(du -sh "$out" | cut -f1))"
}

dump_db /Users/jfunk/Sites/my-collections/packages/api/.env          my_collections
dump_db /Users/jfunk/Sites/my-collections-stage/packages/api/.env    my_collections_stage

log "Pruning backups older than ${RETENTION_DAYS} days ..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

log "rsyncing to Dreamhost ..."
rsync -az --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new" \
  "$BACKUP_DIR/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

log "=== Backup complete ==="
