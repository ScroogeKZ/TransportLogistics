# Развертывание в Yandex Cloud

Этот каталог содержит все файлы, необходимые для развертывания системы управления транспортными запросами в Yandex Cloud.

## 🚀 Быстрый старт

1. **Установите Yandex Cloud CLI**:
   ```bash
   curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
   ```

2. **Авторизуйтесь в Yandex Cloud**:
   ```bash
   yc init
   ```

3. **Подготовьте переменные окружения**:
   ```bash
   cp .env.example .env
   # Отредактируйте .env файл
   ```

4. **Запустите автоматическое развертывание**:
   ```bash
   chmod +x yandex-cloud-deploy.sh
   ./yandex-cloud-deploy.sh
   ```

## 📁 Структура файлов

```
yandex-cloud-deployment/
├── Dockerfile                      # Docker образ для контейнера
├── docker-compose.yml             # Локальная разработка
├── yandex-cloud-deploy.sh          # Скрипт автоматического развертывания
├── package.json                    # Зависимости для облачной версии
├── init-db.sql                     # Инициализация базы данных
├── health-check.js                 # Скрипт проверки работоспособности
├── .env.example                    # Пример переменных окружения
├── nginx/
│   └── nginx.conf                  # Конфигурация Nginx
├── terraform/
│   ├── main.tf                     # Основная конфигурация Terraform
│   ├── variables.tf                # Переменные Terraform
│   └── terraform.tfvars.example    # Пример переменных
└── YANDEX_CLOUD_DEPLOYMENT_GUIDE.md # Подробное руководство
```

## 🛠️ Варианты развертывания

### 1. Автоматическое развертывание (Рекомендуется)
```bash
./yandex-cloud-deploy.sh
```

### 2. Развертывание с Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Заполните terraform.tfvars
terraform init
terraform plan
terraform apply
```

### 3. Ручное развертывание
Следуйте инструкциям в `YANDEX_CLOUD_DEPLOYMENT_GUIDE.md`

## 🔧 Необходимые ресурсы

- **Serverless Container** - для запуска приложения
- **Container Registry** - для хранения Docker образов
- **Managed PostgreSQL** - база данных (опционально)
- **Service Account** - для доступа к ресурсам
- **API Gateway** - для кастомного домена (опционально)

## 💰 Примерная стоимость

- Serverless Container: ~500-1500 ₽/месяц
- Container Registry: ~100-300 ₽/месяц
- Managed PostgreSQL: ~1000-2000 ₽/месяц
- Трафик: ~200-500 ₽/месяц
- **Всего**: ~1800-4300 ₽/месяц

## 🔍 Проверка работоспособности

```bash
# Проверка состояния контейнера
yc serverless container get --name transport-container

# Просмотр логов
yc serverless container revision logs --container-name transport-container

# Запуск health check
node health-check.js
```

## 🚨 Устранение неполадок

### Частые проблемы:
1. **Ошибка авторизации** - проверьте `yc config list`
2. **Проблемы с базой данных** - проверьте `DATABASE_URL`
3. **Контейнер не запускается** - проверьте логи
4. **Превышение лимитов** - увеличьте квоты

### Полезные команды:
```bash
# Список контейнеров
yc serverless container list

# Информация о контейнере
yc serverless container get --name transport-container

# Обновление контейнера
yc serverless container revision deploy --container-name transport-container --image ...

# Откат к предыдущей версии
yc serverless container revision list --container-name transport-container
```

## 📊 Мониторинг

```bash
# Просмотр метрик
yc monitoring metric list

# Создание алертов
yc monitoring alert create --name "High Error Rate" --query "..."

# Настройка дашборда
yc monitoring dashboard create --config-file dashboard.json
```

## 🔐 Безопасность

- Используйте сильные пароли для базы данных
- Ограничьте доступ по IP через Security Groups
- Регулярно обновляйте зависимости
- Используйте HTTPS для всех соединений
- Храните секреты в переменных окружения

## 📚 Дополнительные ресурсы

- [Документация Yandex Cloud](https://cloud.yandex.ru/docs)
- [Serverless Containers](https://cloud.yandex.ru/docs/serverless-containers)
- [Container Registry](https://cloud.yandex.ru/docs/container-registry)
- [Managed PostgreSQL](https://cloud.yandex.ru/docs/managed-postgresql)

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте логи приложения
2. Изучите документацию
3. Обратитесь в техническую поддержку Yandex Cloud

---

**Важно**: Всегда тестируйте в staging окружении перед развертыванием в production!