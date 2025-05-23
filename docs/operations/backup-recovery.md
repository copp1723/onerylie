# Backup and Recovery Strategy

This document outlines the backup procedures, retention policies, and recovery processes for the Rylie AI platform.

## Database Backup Strategy

### Daily Full Backups

Automatic daily full backups are performed for the PostgreSQL database. These backups should be scheduled during off-peak hours, preferably between 2:00 AM and 4:00 AM local time.

#### Procedure for Manual Backup

```bash
# Format date for backup filename
BACKUP_DATE=$(date +%Y-%m-%d)

# Create backup directory if it doesn't exist
mkdir -p /backups/database

# Create full database backup
pg_dump --format=custom --file=/backups/database/rylie_full_${BACKUP_DATE}.dump $DATABASE_URL

# Compress the backup
gzip /backups/database/rylie_full_${BACKUP_DATE}.dump
```

### Point-in-Time Recovery (PITR)

In addition to daily backups, the PostgreSQL server should be configured for continuous WAL (Write-Ahead Log) archiving to enable point-in-time recovery.

#### WAL Configuration

1. Edit postgresql.conf:
   ```
   wal_level = replica
   archive_mode = on
   archive_command = 'cp %p /backups/wal/%f'
   ```

2. Schedule regular WAL archive backups to cloud storage.

### Backup Retention Policy

| Backup Type | Retention Period |
|-------------|-----------------|
| Daily Full Backups | 14 days |
| Weekly Full Backups | 3 months |
| Monthly Full Backups | 1 year |
| WAL Archives | 14 days |

### Backup Verification

All backups should be automatically verified for integrity. A restore test should be performed on a weekly basis to ensure backups are valid and can be successfully restored.

#### Backup Verification Script

```bash
#!/bin/bash
# Verify the latest backup
LATEST_BACKUP=$(ls -t /backups/database/rylie_full_*.dump.gz | head -1)
echo "Verifying backup: $LATEST_BACKUP"

# Create a temporary database
TEMP_DB="verify_restore_$(date +%s)"
createdb $TEMP_DB

# Restore to temporary database
gunzip -c $LATEST_BACKUP | pg_restore --dbname=$TEMP_DB --no-owner

# Run validation queries
psql -d $TEMP_DB -c "SELECT COUNT(*) FROM users;"
psql -d $TEMP_DB -c "SELECT COUNT(*) FROM conversations;"
psql -d $TEMP_DB -c "SELECT COUNT(*) FROM messages;"

# Drop temporary database
dropdb $TEMP_DB
```

## Application Data Backup

### Configuration Files

All configuration files should be backed up whenever changes are made. These files should be stored in version control as well as in the backup system.

| File Type | Backup Frequency | Retention |
|-----------|-----------------|-----------|
| Environment Variables | On change | Indefinite |
| Configuration Files | On change | Indefinite |
| SSL Certificates | On renewal | Previous 2 versions |

## Recovery Procedures

### Database Recovery

#### Full Database Restore

```bash
# Stop application services
systemctl stop rylie-api

# Restore database from full backup
gunzip -c /backups/database/rylie_full_20XX-XX-XX.dump.gz | pg_restore --clean --if-exists --dbname=$DATABASE_URL

# Start application services
systemctl start rylie-api
```

#### Point-in-Time Recovery

```bash
# Stop application services
systemctl stop rylie-api

# Create recovery.conf in PostgreSQL data directory
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /backups/wal/%f %p'
recovery_target_time = '2023-05-01 15:30:00'
EOF

# Start PostgreSQL in recovery mode
systemctl start postgresql

# After recovery completes, remove recovery.conf and restart
rm /var/lib/postgresql/data/recovery.conf
systemctl restart postgresql

# Start application services
systemctl start rylie-api
```

### Disaster Recovery

In the event of a complete system failure, follow these steps:

1. **Infrastructure Provisioning**:
   - Provision new database server
   - Provision new application server
   - Restore network configuration

2. **Database Restoration**:
   - Restore the latest full backup
   - Apply WAL archives if available for PITR

3. **Application Restoration**:
   - Deploy the latest stable application code
   - Restore configuration files
   - Restore environment variables

4. **Verification**:
   - Verify database integrity
   - Verify application functionality
   - Perform health checks

## Recovery Testing

Recovery procedures should be tested quarterly to ensure their effectiveness. These tests should be performed in a separate environment that mirrors production.

### Recovery Testing Checklist

- [ ] Full database restore from backup
- [ ] Point-in-time recovery test
- [ ] Application config restoration
- [ ] Functionality verification
- [ ] Performance testing after recovery

## Recovery Time Objectives (RTO)

| Scenario | RTO |
|----------|-----|
| Single table data corruption | 30 minutes |
| Full database corruption | 2 hours |
| Complete system failure | 4 hours |

## Recovery Point Objectives (RPO)

| Scenario | RPO |
|----------|-----|
| Database data | 1 hour (maximum data loss) |
| Configuration files | No loss (version controlled) |
| User uploads | 24 hours |

## Backup Monitoring and Alerting

Backup processes should be monitored, and alerts should be configured for:

- Backup failures
- Backup size anomalies
- Backup duration anomalies
- Backup verification failures

### Monitoring Script Example

```bash
#!/bin/bash
# Monitor for missing daily backups
TODAY=$(date +%Y-%m-%d)
BACKUP_PATH="/backups/database/rylie_full_${TODAY}.dump.gz"

if [ ! -f "$BACKUP_PATH" ]; then
    echo "WARNING: Today's backup not found at $BACKUP_PATH"
    exit 1
fi

BACKUP_SIZE=$(stat -c%s "$BACKUP_PATH")
if [ "$BACKUP_SIZE" -lt 1000000 ]; then
    echo "WARNING: Backup file is suspiciously small ($BACKUP_SIZE bytes)"
    exit 1
fi

echo "Backup check passed: $BACKUP_PATH ($BACKUP_SIZE bytes)"
exit 0
```

## Responsibility Matrix

| Task | Primary Responsible | Secondary Responsible |
|------|---------------------|----------------------|
| Database Backups | Database Administrator | DevOps Engineer |
| Backup Verification | DevOps Engineer | Database Administrator |
| Recovery Testing | System Reliability Engineer | Database Administrator |
| Disaster Recovery | System Reliability Engineer | CTO |

## Cloud Storage Integration

All backups should be replicated to cloud storage for additional redundancy.

### AWS S3 Integration

```bash
#!/bin/bash
# Sync backups to S3
aws s3 sync /backups/database s3://rylie-backups/database/ --exclude "*" --include "*.dump.gz"
aws s3 sync /backups/wal s3://rylie-backups/wal/ --exclude "*" --include "*.gz"
```

### Multi-Region Replication

Critical backups should be replicated across multiple regions for disaster recovery purposes.

## Conclusion

This backup and recovery strategy ensures business continuity and minimizes data loss in case of failures. It should be reviewed annually and updated as needed based on changing system requirements and operational experience.