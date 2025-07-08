<?php
/**
 * Модуль интеграции с системой управления транспортными запросами
 * для Битрикс24
 */

use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Engine\ActionFilter;
use Bitrix\Main\Error;
use Bitrix\Main\Result;
use Bitrix\Main\Web\HttpClient;
use Bitrix\Main\Web\Json;

class TransportRegistryController extends Controller
{
    private const API_BASE_URL = 'https://your-transport-app.appspot.com/api';
    private const MODULE_ID = 'transport.registry';
    
    /**
     * Получить список транспортных запросов
     */
    public function getTransportRequestsAction()
    {
        $apiKey = \COption::GetOptionString(self::MODULE_ID, 'api_key', '');
        if (empty($apiKey)) {
            $this->addError(new Error('API ключ не настроен'));
            return null;
        }
        
        $httpClient = new HttpClient();
        $httpClient->setHeader('Authorization', 'Bearer ' . $apiKey);
        
        $response = $httpClient->get(self::API_BASE_URL . '/transportation-requests');
        
        if ($response === false) {
            $this->addError(new Error('Ошибка подключения к API'));
            return null;
        }
        
        $data = Json::decode($response);
        
        return [
            'requests' => $data,
            'total' => count($data)
        ];
    }
    
    /**
     * Создать новый транспортный запрос
     */
    public function createTransportRequestAction(array $requestData)
    {
        $apiKey = \COption::GetOptionString(self::MODULE_ID, 'api_key', '');
        if (empty($apiKey)) {
            $this->addError(new Error('API ключ не настроен'));
            return null;
        }
        
        // Валидация данных
        $required = ['fromCity', 'toCity', 'cargoType', 'weight'];
        foreach ($required as $field) {
            if (empty($requestData[$field])) {
                $this->addError(new Error("Поле {$field} обязательно для заполнения"));
                return null;
            }
        }
        
        $httpClient = new HttpClient();
        $httpClient->setHeader('Authorization', 'Bearer ' . $apiKey);
        $httpClient->setHeader('Content-Type', 'application/json');
        
        $response = $httpClient->post(
            self::API_BASE_URL . '/transportation-requests',
            Json::encode($requestData)
        );
        
        if ($response === false) {
            $this->addError(new Error('Ошибка создания запроса'));
            return null;
        }
        
        $data = Json::decode($response);
        
        // Создаем задачу в Битрикс24
        $this->createBitrixTask($data);
        
        return $data;
    }
    
    /**
     * Обновить статус транспортного запроса
     */
    public function updateRequestStatusAction(int $requestId, string $status)
    {
        $apiKey = \COption::GetOptionString(self::MODULE_ID, 'api_key', '');
        
        $httpClient = new HttpClient();
        $httpClient->setHeader('Authorization', 'Bearer ' . $apiKey);
        $httpClient->setHeader('Content-Type', 'application/json');
        
        $response = $httpClient->patch(
            self::API_BASE_URL . "/transportation-requests/{$requestId}",
            Json::encode(['status' => $status])
        );
        
        if ($response === false) {
            $this->addError(new Error('Ошибка обновления статуса'));
            return null;
        }
        
        return Json::decode($response);
    }
    
    /**
     * Синхронизировать данные перевозчиков
     */
    public function syncCarriersAction()
    {
        $apiKey = \COption::GetOptionString(self::MODULE_ID, 'api_key', '');
        
        $httpClient = new HttpClient();
        $httpClient->setHeader('Authorization', 'Bearer ' . $apiKey);
        
        $response = $httpClient->get(self::API_BASE_URL . '/carriers');
        
        if ($response === false) {
            $this->addError(new Error('Ошибка получения данных перевозчиков'));
            return null;
        }
        
        $carriers = Json::decode($response);
        
        // Синхронизируем с контактами Битрикс24
        $this->syncCarriersWithContacts($carriers);
        
        return [
            'synced' => count($carriers),
            'carriers' => $carriers
        ];
    }
    
    /**
     * Создать задачу в Битрикс24 для нового транспортного запроса
     */
    private function createBitrixTask(array $requestData)
    {
        if (!\CModule::IncludeModule('tasks')) {
            return false;
        }
        
        $taskData = [
            'TITLE' => "Транспортный запрос {$requestData['requestNumber']}",
            'DESCRIPTION' => $this->formatRequestDescription($requestData),
            'RESPONSIBLE_ID' => $this->getResponsibleUserId($requestData['status']),
            'PRIORITY' => $requestData['urgency'] === 'срочная' ? 2 : 1,
            'GROUP_ID' => \COption::GetOptionString(self::MODULE_ID, 'work_group_id', 0),
            'UF_TRANSPORT_REQUEST_ID' => $requestData['id'],
            'UF_REQUEST_STATUS' => $requestData['status']
        ];
        
        $task = new \CTasks();
        $taskId = $task->Add($taskData);
        
        if ($taskId) {
            // Добавляем комментарий с деталями
            $this->addTaskComment($taskId, $requestData);
        }
        
        return $taskId;
    }
    
    /**
     * Форматировать описание запроса для задачи
     */
    private function formatRequestDescription(array $requestData)
    {
        $description = "Новый транспортный запрос:\n\n";
        $description .= "Маршрут: {$requestData['fromCity']} → {$requestData['toCity']}\n";
        $description .= "Тип груза: {$requestData['cargoType']}\n";
        $description .= "Вес: {$requestData['weight']} кг\n";
        $description .= "Срочность: {$requestData['urgency']}\n";
        
        if (!empty($requestData['description'])) {
            $description .= "Описание: {$requestData['description']}\n";
        }
        
        $description .= "\nСсылка на систему: " . self::API_BASE_URL . "/requests/{$requestData['id']}";
        
        return $description;
    }
    
    /**
     * Определить ответственного пользователя по статусу
     */
    private function getResponsibleUserId(string $status)
    {
        $userMappings = [
            'created' => \COption::GetOptionString(self::MODULE_ID, 'logist_user_id', 1),
            'logistics' => \COption::GetOptionString(self::MODULE_ID, 'manager_user_id', 1),
            'manager' => \COption::GetOptionString(self::MODULE_ID, 'finance_user_id', 1),
            'finance' => \COption::GetOptionString(self::MODULE_ID, 'director_user_id', 1)
        ];
        
        return $userMappings[$status] ?? 1;
    }
    
    /**
     * Синхронизировать перевозчиков с контактами
     */
    private function syncCarriersWithContacts(array $carriers)
    {
        if (!\CModule::IncludeModule('crm')) {
            return false;
        }
        
        foreach ($carriers as $carrier) {
            // Проверяем, есть ли уже такой контакт
            $existingContact = \CCrmContact::GetList(
                [],
                ['NAME' => $carrier['name']],
                false,
                false,
                ['ID']
            )->Fetch();
            
            $contactData = [
                'NAME' => $carrier['name'],
                'COMPANY_TITLE' => $carrier['name'],
                'PHONE' => [['VALUE' => $carrier['phone'], 'VALUE_TYPE' => 'WORK']],
                'EMAIL' => [['VALUE' => $carrier['email'], 'VALUE_TYPE' => 'WORK']],
                'ADDRESS' => $carrier['address'],
                'COMMENTS' => $carrier['notes'],
                'UF_TRANSPORT_RATING' => $carrier['rating'],
                'UF_PRICE_RANGE' => $carrier['priceRange']
            ];
            
            if ($existingContact) {
                // Обновляем существующий контакт
                $contact = new \CCrmContact();
                $contact->Update($existingContact['ID'], $contactData);
            } else {
                // Создаем новый контакт
                $contact = new \CCrmContact();
                $contact->Add($contactData);
            }
        }
    }
    
    /**
     * Добавить комментарий к задаче
     */
    private function addTaskComment(int $taskId, array $requestData)
    {
        if (!\CModule::IncludeModule('forum')) {
            return false;
        }
        
        $comment = "Детали транспортного запроса:\n";
        $comment .= "Габариты: {$requestData['width']}×{$requestData['length']}×{$requestData['height']} м\n";
        $comment .= "Адрес отправления: {$requestData['fromAddress']}\n";
        $comment .= "Адрес назначения: {$requestData['toAddress']}\n";
        
        if (!empty($requestData['estimatedCost'])) {
            $comment .= "Предварительная стоимость: {$requestData['estimatedCost']} тг\n";
        }
        
        \CTaskComments::Add($taskId, [
            'POST_MESSAGE' => $comment,
            'AUTHOR_ID' => 1
        ]);
    }
}

/**
 * Настройки модуля
 */
class TransportRegistrySettings
{
    public static function getTabsDefinition()
    {
        return [
            [
                'DIV' => 'edit1',
                'TAB' => 'Основные настройки',
                'TITLE' => 'Настройки интеграции с системой транспортных запросов'
            ]
        ];
    }
    
    public static function getOptionsDefinition()
    {
        return [
            'api_key' => [
                'TYPE' => 'STRING',
                'DEFAULT' => '',
                'TITLE' => 'API ключ для доступа к системе'
            ],
            'work_group_id' => [
                'TYPE' => 'STRING',
                'DEFAULT' => '0',
                'TITLE' => 'ID рабочей группы для задач'
            ],
            'logist_user_id' => [
                'TYPE' => 'STRING',
                'DEFAULT' => '1',
                'TITLE' => 'ID пользователя-логиста'
            ],
            'manager_user_id' => [
                'TYPE' => 'STRING',
                'DEFAULT' => '1',
                'TITLE' => 'ID пользователя-менеджера'
            ],
            'finance_user_id' => [
                'TYPE' => 'STRING',
                'DEFAULT' => '1',
                'TITLE' => 'ID пользователя из финансового отдела'
            ],
            'director_user_id' => [
                'TYPE' => 'STRING',
                'DEFAULT' => '1',
                'TITLE' => 'ID директора'
            ]
        ];
    }
}