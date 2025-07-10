#!/bin/bash

# Скрипт развертывания в Yandex Cloud
# Поддерживает развертывание через Container Registry и Serverless Containers

set -e

echo "🚀 Развертывание в Yandex Cloud..."

# Проверка наличия yc CLI
if ! command -v yc &> /dev/null; then
    echo "❌ Ошибка: yc CLI не установлен"
    echo "Установите Yandex Cloud CLI: https://cloud.yandex.ru/docs/cli/quickstart"
    exit 1
fi

# Проверка авторизации
if ! yc config list | grep -q "token:"; then
    echo "❌ Ошибка: Не авторизован в Yandex Cloud"
    echo "Выполните: yc init"
    exit 1
fi

# Получение конфигурации
FOLDER_ID=$(yc config get folder-id)
if [ -z "$FOLDER_ID" ]; then
    echo "❌ Ошибка: Folder ID не настроен"
    exit 1
fi

echo "📋 Folder ID: $FOLDER_ID"

# Переменные
PROJECT_NAME="transport-registry"
REGISTRY_NAME="transport-registry"
IMAGE_NAME="transport-app"
CONTAINER_NAME="transport-container"
SERVICE_ACCOUNT_NAME="transport-service-account"

# Запрос параметров у пользователя
echo "🔐 Настройка переменных окружения..."
read -p "Введите URL базы данных PostgreSQL: " DATABASE_URL
read -s -p "Введите секрет для сессий: " SESSION_SECRET
echo

# Создание Container Registry
echo "📦 Создание Container Registry..."
if ! yc container registry get --name $REGISTRY_NAME &> /dev/null; then
    yc container registry create --name $REGISTRY_NAME
    echo "✅ Container Registry создан"
else
    echo "✅ Container Registry уже существует"
fi

# Получение ID реестра
REGISTRY_ID=$(yc container registry get --name $REGISTRY_NAME --format json | jq -r '.id')
echo "📦 Registry ID: $REGISTRY_ID"

# Создание сервисного аккаунта
echo "👤 Создание сервисного аккаунта..."
if ! yc iam service-account get --name $SERVICE_ACCOUNT_NAME &> /dev/null; then
    yc iam service-account create --name $SERVICE_ACCOUNT_NAME --description "Service account for transport registry"
    echo "✅ Сервисный аккаунт создан"
else
    echo "✅ Сервисный аккаунт уже существует"
fi

# Получение ID сервисного аккаунта
SERVICE_ACCOUNT_ID=$(yc iam service-account get --name $SERVICE_ACCOUNT_NAME --format json | jq -r '.id')

# Назначение ролей
echo "🔑 Назначение ролей..."
yc resource-manager folder add-access-binding $FOLDER_ID \
    --role serverless.containers.invoker \
    --service-account-id $SERVICE_ACCOUNT_ID

yc resource-manager folder add-access-binding $FOLDER_ID \
    --role container-registry.images.puller \
    --service-account-id $SERVICE_ACCOUNT_ID

# Сборка и загрузка Docker образа
echo "🏗️  Сборка Docker образа..."
docker build -t cr.yandex/$REGISTRY_ID/$IMAGE_NAME:latest .

echo "📤 Загрузка образа в Container Registry..."
docker push cr.yandex/$REGISTRY_ID/$IMAGE_NAME:latest

# Создание Serverless Container
echo "🚀 Создание Serverless Container..."
if yc serverless container get --name $CONTAINER_NAME &> /dev/null; then
    echo "🔄 Обновление существующего контейнера..."
    yc serverless container revision deploy \
        --container-name $CONTAINER_NAME \
        --image cr.yandex/$REGISTRY_ID/$IMAGE_NAME:latest \
        --cores 1 \
        --memory 1GB \
        --concurrency 10 \
        --execution-timeout 60s \
        --service-account-id $SERVICE_ACCOUNT_ID \
        --environment DATABASE_URL="$DATABASE_URL" \
        --environment SESSION_SECRET="$SESSION_SECRET" \
        --environment NODE_ENV=production \
        --environment PORT=8080
else
    echo "✨ Создание нового контейнера..."
    yc serverless container create --name $CONTAINER_NAME
    
    yc serverless container revision deploy \
        --container-name $CONTAINER_NAME \
        --image cr.yandex/$REGISTRY_ID/$IMAGE_NAME:latest \
        --cores 1 \
        --memory 1GB \
        --concurrency 10 \
        --execution-timeout 60s \
        --service-account-id $SERVICE_ACCOUNT_ID \
        --environment DATABASE_URL="$DATABASE_URL" \
        --environment SESSION_SECRET="$SESSION_SECRET" \
        --environment NODE_ENV=production \
        --environment PORT=8080
fi

# Получение URL контейнера
CONTAINER_URL=$(yc serverless container get --name $CONTAINER_NAME --format json | jq -r '.url')

echo "✅ Развертывание завершено!"
echo "🌐 URL приложения: $CONTAINER_URL"
echo ""
echo "📋 Информация о ресурсах:"
echo "- Container Registry: $REGISTRY_ID"
echo "- Serverless Container: $CONTAINER_NAME"
echo "- Service Account: $SERVICE_ACCOUNT_ID"
echo ""
echo "🔧 Для управления ресурсами используйте:"
echo "- yc serverless container list"
echo "- yc container registry list"
echo "- yc iam service-account list"

# Проверка работоспособности
echo "🏥 Проверка работоспособности..."
sleep 10
if curl -f "$CONTAINER_URL/api/auth/user" &> /dev/null; then
    echo "✅ Приложение работает корректно"
else
    echo "⚠️  Проверьте логи: yc serverless container revision logs --container-name $CONTAINER_NAME"
fi