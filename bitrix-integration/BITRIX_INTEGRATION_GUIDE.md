# Руководство по интеграции с Битрикс24

## Обзор

Данное руководство описывает процесс интеграции системы управления транспортными запросами с Битрикс24. Интеграция позволяет:

- Автоматически создавать задачи для транспортных запросов
- Синхронизировать данные перевозчиков с контактами CRM
- Получать уведомления об изменениях статусов
- Отслеживать прогресс выполнения запросов

## Варианты интеграции

### 1. Локальное приложение (Рекомендуется)

Установка модуля непосредственно в Битрикс24.

**Преимущества:**
- Полная интеграция с функциями Битрикс24
- Доступ к API задач, CRM, уведомлений
- Настройка ролей и доступов

**Недостатки:**
- Требует доступа к серверу Битрикс24

### 2. Внешнее приложение

Создание приложения в Битрикс24 Marketplace.

**Преимущества:**
- Не требует доступа к серверу
- Легкое развертывание

**Недостатки:**
- Ограниченные возможности интеграции
- Зависимость от REST API

### 3. Webhook интеграция

Использование webhooks для синхронизации данных.

**Преимущества:**
- Простая настройка
- Работает с любой версией Битрикс24

**Недостатки:**
- Односторонняя синхронизация
- Требует дополнительную настройку

## Установка локального модуля

### Шаг 1: Подготовка файлов

1. Скопируйте файлы модуля в папку:
   ```
   /bitrix/modules/transport.registry/
   ```

2. Создайте структуру папок:
   ```
   /bitrix/modules/transport.registry/
   ├── include.php
   ├── install/
   │   ├── index.php
   │   └── unstep.php
   ├── lib/
   │   └── controller.php
   └── options.php
   ```

### Шаг 2: Создание файла модуля

Создайте файл `/bitrix/modules/transport.registry/include.php`:

```php
<?php
$module_id = 'transport.registry';
$module_version = '1.0.0';
$module_version_date = '2025-07-07';
$module_name = 'Транспортный реестр';
$module_description = 'Модуль интеграции с системой управления транспортными запросами';

require_once(__DIR__ . '/lib/controller.php');
```

### Шаг 3: Файл установки

Создайте файл `/bitrix/modules/transport.registry/install/index.php`:

```php
<?php
class transport_registry extends CModule
{
    public $MODULE_ID = 'transport.registry';
    public $MODULE_NAME = 'Транспортный реестр';
    public $MODULE_DESCRIPTION = 'Модуль интеграции с системой управления транспортными запросами';
    public $MODULE_VERSION = '1.0.0';
    public $MODULE_VERSION_DATE = '2025-07-07';
    
    public function DoInstall()
    {
        global $APPLICATION;
        
        // Регистрируем модуль
        RegisterModule($this->MODULE_ID);
        
        // Создаем пользовательские поля
        $this->InstallUserFields();
        
        // Создаем агентов
        $this->InstallAgents();
        
        $APPLICATION->IncludeAdminFile(
            'Установка модуля ' . $this->MODULE_NAME,
            __DIR__ . '/step.php'
        );
    }
    
    public function DoUninstall()
    {
        global $APPLICATION;
        
        // Удаляем агентов
        $this->UnInstallAgents();
        
        // Удаляем пользовательские поля
        $this->UnInstallUserFields();
        
        // Удаляем модуль
        UnRegisterModule($this->MODULE_ID);
        
        $APPLICATION->IncludeAdminFile(
            'Удаление модуля ' . $this->MODULE_NAME,
            __DIR__ . '/unstep.php'
        );
    }
    
    private function InstallUserFields()
    {
        // Пользовательские поля для задач
        $fields = [
            'UF_TRANSPORT_REQUEST_ID' => [
                'ENTITY_ID' => 'TASKS_TASK',
                'FIELD_NAME' => 'UF_TRANSPORT_REQUEST_ID',
                'USER_TYPE_ID' => 'string',
                'FIELD_TITLE' => 'ID транспортного запроса'
            ],
            'UF_REQUEST_STATUS' => [
                'ENTITY_ID' => 'TASKS_TASK',
                'FIELD_NAME' => 'UF_REQUEST_STATUS',
                'USER_TYPE_ID' => 'string',
                'FIELD_TITLE' => 'Статус запроса'
            ]
        ];
        
        $userField = new CUserTypeEntity();
        foreach ($fields as $field) {
            $userField->Add($field);
        }
        
        // Пользовательские поля для контактов CRM
        $crmFields = [
            'UF_TRANSPORT_RATING' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_TRANSPORT_RATING',
                'USER_TYPE_ID' => 'double',
                'FIELD_TITLE' => 'Рейтинг перевозчика'
            ],
            'UF_PRICE_RANGE' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_PRICE_RANGE',
                'USER_TYPE_ID' => 'string',
                'FIELD_TITLE' => 'Диапазон цен'
            ],
            'UF_CARRIER_ID' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_CARRIER_ID',
                'USER_TYPE_ID' => 'string',
                'FIELD_TITLE' => 'ID перевозчика'
            ]
        ];
        
        foreach ($crmFields as $field) {
            $userField->Add($field);
        }
    }
    
    private function InstallAgents()
    {
        // Агент для синхронизации данных
        CAgent::AddAgent(
            'TransportRegistrySync::SyncData();',
            'transport.registry',
            'N',
            300, // каждые 5 минут
            '',
            'Y',
            '',
            30
        );
    }
    
    private function UnInstallUserFields()
    {
        $fields = [
            'UF_TRANSPORT_REQUEST_ID',
            'UF_REQUEST_STATUS',
            'UF_TRANSPORT_RATING',
            'UF_PRICE_RANGE',
            'UF_CARRIER_ID'
        ];
        
        foreach ($fields as $fieldName) {
            $userField = CUserTypeEntity::GetList(
                [],
                ['FIELD_NAME' => $fieldName]
            )->Fetch();
            
            if ($userField) {
                $entity = new CUserTypeEntity();
                $entity->Delete($userField['ID']);
            }
        }
    }
    
    private function UnInstallAgents()
    {
        CAgent::RemoveAgent('TransportRegistrySync::SyncData();', 'transport.registry');
    }
}
```

### Шаг 4: Настройка webhook'ов

1. Скопируйте файл `webhook-handler.php` в корень сайта
2. Настройте webhook в системе транспортных запросов:
   ```
   URL: https://your-bitrix24.com/webhook-handler.php
   Secret: your-webhook-secret
   ```

### Шаг 5: Настройка модуля

1. Войдите в административную панель Битрикс24
2. Перейдите в "Marketplace" → "Установленные решения"
3. Найдите модуль "Транспортный реестр"
4. Нажмите "Настроить"
5. Заполните настройки:
   - API ключ
   - ID пользователей для разных ролей
   - ID рабочей группы

## Настройка внешнего приложения

### Шаг 1: Регистрация приложения

1. Перейдите в "Приложения" → "Разработчикам"
2. Нажмите "Добавить приложение"
3. Выберите "Локальное приложение"
4. Заполните данные:
   - Название: "Транспортный реестр"
   - Код: "transport_registry"
   - Путь: `/local/apps/transport_registry/`

### Шаг 2: Настройка прав доступа

Установите следующие права для приложения:
- `tasks` - для работы с задачами
- `crm` - для работы с контактами
- `im` - для отправки уведомлений
- `user` - для работы с пользователями

### Шаг 3: Создание интерфейса

1. Создайте файл `/local/apps/transport_registry/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Транспортный реестр</title>
    <script src="//api.bitrix24.com/api/v1/"></script>
    <script src="rest-api-client.js"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="app-container">
        <h1>Транспортные запросы</h1>
        <div id="transport-requests"></div>
        
        <div class="actions">
            <button onclick="bitrixIntegration.loadTransportRequests()">
                Обновить
            </button>
        </div>
    </div>
</body>
</html>
```

2. Скопируйте файл `rest-api-client.js` в папку приложения

## Использование

### Основные функции

1. **Просмотр запросов**: Все транспортные запросы отображаются в виде карточек
2. **Создание задач**: Для каждого запроса можно создать задачу в Битрикс24
3. **Синхронизация контактов**: Перевозчики автоматически добавляются в CRM
4. **Уведомления**: Изменения статусов запросов отправляются ответственным

### Рабочий процесс

1. Новый транспортный запрос создается в системе
2. Автоматически создается задача в Битрикс24
3. Задача назначается соответствующему сотруднику
4. При изменении статуса запроса обновляется задача
5. Отправляются уведомления ответственным

## Настройка ролей

### Пользователи и роли

Настройте соответствие между ролями в системе и пользователями Битрикс24:

- **Прораб** → Создает запросы
- **Логист** → Обрабатывает запросы (ID пользователя в настройках)
- **Менеджер** → Согласовывает запросы
- **Финансист** → Обрабатывает финансовые аспекты
- **Директор** → Финальное утверждение

### Рабочие группы

Создайте рабочие группы для:
- Транспортного отдела
- Логистики
- Финансов

## Мониторинг и отладка

### Логирование

Включите логирование в настройках модуля для отслеживания:
- API запросов
- Создания задач
- Синхронизации данных
- Ошибок интеграции

### Проверка работы

Регулярно проверяйте:
- Синхронизацию данных
- Создание задач
- Отправку уведомлений
- Работу webhook'ов

## Устранение проблем

### Частые ошибки

1. **Ошибка API**: Проверьте корректность API ключа
2. **Не создаются задачи**: Проверьте права доступа модуля
3. **Не работают уведомления**: Проверьте настройки пользователей
4. **Не синхронизируются контакты**: Проверьте права доступа к CRM

### Диагностика

Для диагностики проблем:
1. Проверьте логи Битрикс24
2. Проверьте логи системы транспортных запросов
3. Убедитесь в корректности настроек webhook'ов
4. Проверьте права доступа пользователей

## Безопасность

### Рекомендации

1. Используйте HTTPS для всех запросов
2. Регулярно обновляйте API ключи
3. Ограничьте доступ к webhook'ам
4. Настройте проверку подписей
5. Логируйте все важные операции

### Права доступа

Настройте минимально необходимые права для:
- Модуля интеграции
- Пользователей системы
- API ключей

---

**Поддержка**: Для получения технической поддержки обращайтесь к разработчикам модуля.