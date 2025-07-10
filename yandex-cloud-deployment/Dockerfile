# Dockerfile для развертывания в Yandex Cloud
FROM node:20-alpine

# Установка необходимых пакетов
RUN apk add --no-cache \
    postgresql-client \
    curl \
    ca-certificates

# Создание пользователя приложения
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production && npm cache clean --force

# Копирование исходного кода
COPY . .

# Установка правильных прав доступа
RUN chown -R nextjs:nodejs /app
USER nextjs

# Сборка приложения
RUN npm run build

# Открытие порта
EXPOSE 8080

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/auth/user || exit 1

# Запуск приложения
CMD ["npm", "start"]