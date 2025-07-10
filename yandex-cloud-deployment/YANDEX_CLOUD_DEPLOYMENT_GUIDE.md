# Руководство по развертыванию в Yandex Cloud

## Обзор

Это руководство поможет вам развернуть систему управления транспортными запросами в Yandex Cloud с использованием Serverless Containers.

## Предварительные требования

1. **Аккаунт Yandex Cloud** с настроенным биллингом
2. **Yandex Cloud CLI** версии 0.84 или выше
3. **Docker** для сборки образов
4. **Terraform** (опционально, для автоматизации)
5. **PostgreSQL база данных** (Managed Database или внешняя)

## Шаг 1: Настройка Yandex Cloud CLI

### Установка CLI
```bash
# Linux/macOS
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Windows (PowerShell)
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')
```

### Инициализация
```bash
# Авторизация и настройка
yc init

# Проверка настроек
yc config list
```

## Шаг 2: Подготовка базы данных

### Вариант A: Managed Database Service (рекомендуется)

```bash
# Создание PostgreSQL кластера
yc managed-postgresql cluster create \
  --name transport-postgres \
  --environment production \
  --version 15 \
  --resource-preset s2.micro \
  --disk-size 20GB \
  --disk-type network-ssd \
  --user name=transport_user,password=YOUR_SECURE_PASSWORD \
  --database name=transport_registry,owner=transport_user \
  --host zone-id=ru-central1-a,assign-public-ip=true
```

### Вариант B: Внешняя база данных

Если у вас уже есть PostgreSQL, получите строку подключения:
```
postgresql://username:password@host:port/database
```

## Шаг 3: Автоматическое развертывание

### Быстрое развертывание
```bash
# Клонируйте репозиторий
cd yandex-cloud-deployment

# Сделайте скрипт исполняемым
chmod +x yandex-cloud-deploy.sh

# Запустите развертывание
./yandex-cloud-deploy.sh
```

Скрипт автоматически:
- Создаст Container Registry
- Соберет и загрузит Docker образ
- Настроит сервисный аккаунт
- Создаст Serverless Container
- Настроит переменные окружения

## Шаг 4: Развертывание с Terraform

### Подготовка
```bash
cd terraform

# Скопируйте файл переменных
cp terraform.tfvars.example terraform.tfvars

# Отредактируйте terraform.tfvars
nano terraform.tfvars
```

### Заполните terraform.tfvars
```hcl
yandex_cloud_id  = "your-cloud-id"
yandex_folder_id = "your-folder-id"
database_url     = "postgresql://..."
session_secret   = "your-session-secret"
domain_name      = "transport.yourcompany.com"  # опционально
```

### Выполните развертывание
```bash
# Инициализация Terraform
terraform init

# Планирование
terraform plan

# Применение
terraform apply
```

## Шаг 5: Настройка домена (опционально)

### Создание сертификата
```bash
# Создание сертификата Let's Encrypt
yc certificate-manager certificate request \
  --name transport-cert \
  --domains transport.yourcompany.com
```

### Настройка DNS
Добавьте CNAME запись в DNS:
```
transport.yourcompany.com. CNAME d5d123...execute-api.ru-central1.amazonaws.com.
```

## Шаг 6: Настройка мониторинга

### Включение логирования
```bash
# Создание лог-группы
yc logging group create --name transport-logs

# Настройка логирования в контейнере
yc serverless container revision deploy \
  --container-name transport-container \
  --log-group-id <LOG_GROUP_ID>
```

### Настройка алертов
```bash
# Создание алерта для ошибок
yc monitoring alert create \
  --name "Transport App Errors" \
  --query 'errors{service="transport-registry"}' \
  --threshold 10 \
  --comparison greater
```

## Шаг 7: Настройка CI/CD

### GitHub Actions
Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Yandex Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Yandex Cloud CLI
      run: |
        curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
        echo "$HOME/yandex-cloud/bin" >> $GITHUB_PATH
    
    - name: Configure YC CLI
      run: |
        yc config set token ${{ secrets.YC_TOKEN }}
        yc config set cloud-id ${{ secrets.YC_CLOUD_ID }}
        yc config set folder-id ${{ secrets.YC_FOLDER_ID }}
    
    - name: Build and Deploy
      run: |
        cd yandex-cloud-deployment
        ./yandex-cloud-deploy.sh
```

### GitLab CI
Создайте файл `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2

deploy:
  stage: deploy
  image: registry.yandex.net/yc/yandex-cloud-cli:latest
  script:
    - yc config set token $YC_TOKEN
    - yc config set cloud-id $YC_CLOUD_ID
    - yc config set folder-id $YC_FOLDER_ID
    - cd yandex-cloud-deployment
    - ./yandex-cloud-deploy.sh
  only:
    - main
```

## Шаг 8: Масштабирование и оптимизация

### Настройка автомасштабирования
```bash
# Обновление конфигурации контейнера
yc serverless container revision deploy \
  --container-name transport-container \
  --memory 2GB \
  --cores 2 \
  --concurrency 20 \
  --execution-timeout 120s
```

### Оптимизация производительности
```bash
# Настройка зон доступности
yc serverless container revision deploy \
  --container-name transport-container \
  --zone-replication-count 3
```

## Шаг 9: Безопасность

### Настройка Security Groups
```bash
# Создание группы безопасности
yc vpc security-group create \
  --name transport-security-group \
  --rule "direction=ingress,port=443,protocol=tcp,v4-cidrs=0.0.0.0/0" \
  --rule "direction=ingress,port=80,protocol=tcp,v4-cidrs=0.0.0.0/0"
```

### Ограничение доступа по IP
```bash
# Обновление правил безопасности
yc serverless container revision deploy \
  --container-name transport-container \
  --security-group-id <SECURITY_GROUP_ID>
```

## Шаг 10: Резервное копирование

### Настройка бэкапов базы данных
```bash
# Создание расписания бэкапов
yc managed-postgresql cluster update transport-postgres \
  --backup-window-start "03:00" \
  --backup-retain-period-days 7
```

### Экспорт данных
```bash
# Создание бэкапа
yc managed-postgresql cluster backup transport-postgres
```

## Управление и мониторинг

### Полезные команды
```bash
# Просмотр логов
yc serverless container revision logs --container-name transport-container

# Статистика использования
yc serverless container revision list --container-name transport-container

# Обновление образа
yc serverless container revision deploy \
  --container-name transport-container \
  --image cr.yandex/registry-id/transport-app:latest
```

### Мониторинг ресурсов
```bash
# Просмотр метрик
yc monitoring metric list --folder-id $FOLDER_ID

# Создание дашборда
yc monitoring dashboard create --config-file dashboard.json
```

## Стоимость

Примерная стоимость при средней нагрузке:
- **Serverless Container**: ~500-1500 рублей/месяц
- **Managed PostgreSQL**: ~1000-2000 рублей/месяц
- **Container Registry**: ~100-300 рублей/месяц
- **Трафик**: ~200-500 рублей/месяц

## Устранение неполадок

### Частые проблемы

1. **Ошибка авторизации**: Проверьте токен и права доступа
2. **Проблемы с сетью**: Проверьте security groups
3. **Ошибки базы данных**: Проверьте строку подключения
4. **Превышение лимитов**: Увеличьте квоты в консоли

### Диагностика
```bash
# Проверка статуса контейнера
yc serverless container get --name transport-container

# Просмотр логов ошибок
yc serverless container revision logs --container-name transport-container --filter level=ERROR

# Тестирование подключения
curl -v https://your-container-url/api/auth/user
```

## Откат изменений

### Быстрый откат
```bash
# Получение списка ревизий
yc serverless container revision list --container-name transport-container

# Откат к предыдущей версии
yc serverless container revision deploy \
  --container-name transport-container \
  --revision-id <PREVIOUS_REVISION_ID>
```

## Поддержка

Для получения поддержки:
1. Проверьте логи приложения
2. Изучите документацию Yandex Cloud
3. Обратитесь в техническую поддержку

---

**Важно**: Всегда тестируйте развертывание в тестовой среде перед продакшеном!