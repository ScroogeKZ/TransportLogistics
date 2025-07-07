# Руководство по развертыванию в Google Cloud

## Обзор

Это руководство поможет вам развернуть систему управления транспортными запросами в Google Cloud Platform (GCP).

## Предварительные требования

1. **Google Cloud Account**: Убедитесь, что у вас есть аккаунт Google Cloud
2. **gcloud CLI**: Установите Google Cloud CLI
3. **Node.js**: Версия 20 или выше
4. **PostgreSQL**: База данных (можно использовать Cloud SQL)

## Шаг 1: Настройка Google Cloud CLI

```bash
# Установите gcloud CLI (если еще не установлен)
# Для Windows: скачайте с https://cloud.google.com/sdk/docs/install
# Для macOS: brew install google-cloud-sdk
# Для Linux: curl https://sdk.cloud.google.com | bash

# Авторизуйтесь
gcloud auth login

# Создайте новый проект или выберите существующий
gcloud projects create transport-registry-kz --name="Transport Registry Kazakhstan"
gcloud config set project transport-registry-kz

# Включите необходимые API
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## Шаг 2: Настройка базы данных

### Вариант A: Cloud SQL (рекомендуется)

```bash
# Создайте Cloud SQL instance
gcloud sql instances create transport-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=europe-west1 \
    --storage-type=SSD \
    --storage-size=10GB

# Создайте базу данных
gcloud sql databases create transport_registry --instance=transport-db

# Создайте пользователя
gcloud sql users create transport_user \
    --instance=transport-db \
    --password=YOUR_SECURE_PASSWORD

# Получите строку подключения
gcloud sql instances describe transport-db --format="value(connectionName)"
```

### Вариант B: Внешняя база данных

Если у вас уже есть PostgreSQL база данных, получите строку подключения в формате:
```
postgresql://username:password@host:port/database
```

## Шаг 3: Подготовка переменных окружения

Создайте файл `.env.production`:

```bash
DATABASE_URL=postgresql://transport_user:YOUR_PASSWORD@/transport_registry?host=/cloudsql/PROJECT_ID:europe-west1:transport-db
SESSION_SECRET=your-very-secure-random-session-secret-here
```

## Шаг 4: Развертывание

### Автоматическое развертывание

```bash
# Запустите скрипт развертывания
./deploy.sh
```

### Ручное развертывание

```bash
# Создайте App Engine приложение
gcloud app create --region=europe-west1

# Соберите приложение
npm run build

# Развертывание
gcloud app deploy --set-env-vars DATABASE_URL="$DATABASE_URL",SESSION_SECRET="$SESSION_SECRET"
```

## Шаг 5: Настройка базы данных

После развертывания выполните миграции:

```bash
# Подключитесь к Cloud SQL
gcloud sql connect transport-db --user=transport_user

# Или используйте Cloud Shell для выполнения миграций
gcloud app deploy --set-env-vars DATABASE_URL="$DATABASE_URL",SESSION_SECRET="$SESSION_SECRET"
```

## Шаг 6: Проверка развертывания

```bash
# Получите URL приложения
gcloud app describe --format="value(defaultHostname)"

# Откройте в браузере
gcloud app browse
```

## Управление

### Просмотр логов

```bash
# Просмотр логов в реальном времени
gcloud app logs tail -s default

# Просмотр логов за определенный период
gcloud app logs read --limit=50
```

### Обновление приложения

```bash
# Пересоберите и разверните
npm run build
gcloud app deploy
```

### Масштабирование

```bash
# Настройте автоматическое масштабирование в app.yaml
# Или используйте команды gcloud
gcloud app versions list
gcloud app instances list
```

## Безопасность

### Настройка HTTPS

App Engine автоматически обеспечивает HTTPS. Для кастомного домена:

```bash
# Добавьте кастомный домен
gcloud app domain-mappings create your-domain.com
```

### Управление доступом

```bash
# Ограничьте доступ к приложению
gcloud app firewall-rules create 1000 --action=allow --source-range=YOUR_IP_RANGE
```

## Мониторинг

### Cloud Monitoring

```bash
# Включите мониторинг
gcloud services enable monitoring.googleapis.com

# Настройте алерты через Cloud Console
```

### Резервное копирование

```bash
# Автоматическое резервное копирование Cloud SQL
gcloud sql backups create --instance=transport-db
```

## Устранение неполадок

### Общие проблемы

1. **Ошибка подключения к БД**: Проверьте строку подключения DATABASE_URL
2. **Ошибка 500**: Проверьте логи приложения
3. **Медленная работа**: Увеличьте ресурсы в app.yaml

### Полезные команды

```bash
# Проверка статуса приложения
gcloud app describe

# Просмотр версий
gcloud app versions list

# Откат к предыдущей версии
gcloud app versions migrate VERSION_ID

# Удаление старых версий
gcloud app versions delete VERSION_ID
```

## Стоимость

Примерная стоимость для малого/среднего использования:
- App Engine: ~$20-50/месяц
- Cloud SQL: ~$15-30/месяц
- Трафик: ~$5-10/месяц

## Поддержка

Для получения поддержки:
1. Проверьте логи: `gcloud app logs tail -s default`
2. Изучите документацию: https://cloud.google.com/appengine/docs
3. Обратитесь в поддержку Google Cloud

---

**Важно**: Всегда тестируйте развертывание на staging окружении перед продакшеном!