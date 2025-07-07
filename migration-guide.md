# Миграция данных в Google Cloud

## Подготовка данных

### 1. Экспорт данных из текущей базы

```bash
# Экспорт всех данных
pg_dump $DATABASE_URL > backup.sql

# Экспорт только данных (без схемы)
pg_dump --data-only $DATABASE_URL > data_only.sql

# Экспорт конкретных таблиц
pg_dump --table=users --table=transportation_requests $DATABASE_URL > specific_tables.sql
```

### 2. Подготовка данных для Cloud SQL

```bash
# Создайте резервную копию
mkdir -p backups
pg_dump $DATABASE_URL > backups/full_backup_$(date +%Y%m%d_%H%M%S).sql

# Проверьте целостность
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transportation_requests;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM carriers;"
```

## Импорт в Cloud SQL

### 1. Создание Cloud SQL instance

```bash
# Создайте instance
gcloud sql instances create transport-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=europe-west1 \
    --storage-type=SSD \
    --storage-size=20GB \
    --backup \
    --backup-start-time=03:00

# Создайте базу данных
gcloud sql databases create transport_registry --instance=transport-db

# Создайте пользователя
gcloud sql users create transport_user \
    --instance=transport-db \
    --password=YOUR_SECURE_PASSWORD
```

### 2. Импорт данных

```bash
# Загрузите backup в Cloud Storage
gsutil cp backup.sql gs://your-bucket/backup.sql

# Импортируйте данные
gcloud sql import sql transport-db gs://your-bucket/backup.sql \
    --database=transport_registry
```

### 3. Альтернативный способ - через Cloud Shell

```bash
# Подключитесь к Cloud SQL
gcloud sql connect transport-db --user=transport_user --database=transport_registry

# Выполните миграции
\i backup.sql
```

## Проверка миграции

### 1. Проверка данных

```sql
-- Проверьте количество записей
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'transportation_requests', COUNT(*) FROM transportation_requests
UNION ALL
SELECT 
    'carriers', COUNT(*) FROM carriers
UNION ALL
SELECT 
    'routes', COUNT(*) FROM routes
UNION ALL
SELECT 
    'shipments', COUNT(*) FROM shipments;

-- Проверьте структуру
\dt+

-- Проверьте индексы
\di+
```

### 2. Тестирование API

```bash
# Получите connection string
CONNECTION_STRING="postgresql://transport_user:YOUR_PASSWORD@/transport_registry?host=/cloudsql/PROJECT_ID:europe-west1:transport-db"

# Протестируйте подключение
DATABASE_URL=$CONNECTION_STRING npm run build
DATABASE_URL=$CONNECTION_STRING npm start
```

## Настройка production окружения

### 1. Переменные окружения

```bash
# Создайте файл .env.production
cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=postgresql://transport_user:YOUR_PASSWORD@/transport_registry?host=/cloudsql/PROJECT_ID:europe-west1:transport-db
SESSION_SECRET=$(openssl rand -hex 32)
PORT=8080
EOF
```

### 2. Оптимизация производительности

```sql
-- Создайте индексы для производительности
CREATE INDEX IF NOT EXISTS idx_transport_requests_status ON transportation_requests(status);
CREATE INDEX IF NOT EXISTS idx_transport_requests_created_by ON transportation_requests(created_by_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_created_at ON transportation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_carriers_active ON carriers(is_active);
CREATE INDEX IF NOT EXISTS idx_shipments_request_id ON shipments(request_id);
CREATE INDEX IF NOT EXISTS idx_tracking_points_shipment_id ON tracking_points(shipment_id);
```

### 3. Настройка мониторинга

```bash
# Включите мониторинг
gcloud services enable monitoring.googleapis.com

# Настройте алерты
gcloud alpha monitoring policies create --policy-from-file=monitoring-policy.yaml
```

## Rollback план

### 1. Создание snapshot

```bash
# Создайте snapshot перед миграцией
gcloud sql backups create --instance=transport-db --description="Pre-migration backup"
```

### 2. Restore процедура

```bash
# Если что-то пошло не так
gcloud sql backups list --instance=transport-db
gcloud sql backups restore BACKUP_ID --restore-instance=transport-db
```

## Мониторинг после миграции

### 1. Проверка производительности

```bash
# Мониторинг CPU и памяти
gcloud monitoring metrics list --filter="resource.type=gce_instance"

# Проверка логов
gcloud app logs tail -s default
```

### 2. Проверка базы данных

```sql
-- Проверка активных соединений
SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';

-- Проверка производительности запросов
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## Финальная проверка

```bash
# Проверьте все основные функции
curl -X GET https://your-app.appspot.com/api/auth/user
curl -X GET https://your-app.appspot.com/api/transportation-requests
curl -X GET https://your-app.appspot.com/api/carriers
curl -X GET https://your-app.appspot.com/api/dashboard/stats
```

---

**Важно**: Всегда создавайте резервные копии перед миграцией и тестируйте на staging окружении!