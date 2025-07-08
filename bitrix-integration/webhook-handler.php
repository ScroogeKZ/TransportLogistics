<?php
/**
 * Обработчик webhook'ов для синхронизации данных между системами
 */

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

use Bitrix\Main\Web\Json;
use Bitrix\Main\Application;

class TransportWebhookHandler
{
    private const ALLOWED_EVENTS = [
        'request.created',
        'request.updated',
        'request.status_changed',
        'carrier.created',
        'carrier.updated',
        'shipment.status_changed'
    ];
    
    public function handleWebhook()
    {
        $request = Application::getInstance()->getContext()->getRequest();
        
        // Проверяем метод запроса
        if (!$request->isPost()) {
            http_response_code(405);
            echo Json::encode(['error' => 'Method not allowed']);
            return;
        }
        
        // Получаем данные
        $input = file_get_contents('php://input');
        $data = Json::decode($input);
        
        if (!$data || !isset($data['event']) || !isset($data['data'])) {
            http_response_code(400);
            echo Json::encode(['error' => 'Invalid payload']);
            return;
        }
        
        // Проверяем подпись (для безопасности)
        if (!$this->verifySignature($input)) {
            http_response_code(401);
            echo Json::encode(['error' => 'Invalid signature']);
            return;
        }
        
        // Обрабатываем событие
        $result = $this->processEvent($data['event'], $data['data']);
        
        if ($result) {
            http_response_code(200);
            echo Json::encode(['status' => 'success']);
        } else {
            http_response_code(500);
            echo Json::encode(['error' => 'Processing failed']);
        }
    }
    
    /**
     * Проверка подписи webhook'а
     */
    private function verifySignature(string $payload): bool
    {
        $secret = \COption::GetOptionString('transport.registry', 'webhook_secret', '');
        
        if (empty($secret)) {
            return false;
        }
        
        $headers = getallheaders();
        $signature = $headers['X-Transport-Signature'] ?? '';
        
        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        
        return hash_equals($expectedSignature, $signature);
    }
    
    /**
     * Обработка события
     */
    private function processEvent(string $event, array $data): bool
    {
        if (!in_array($event, self::ALLOWED_EVENTS)) {
            return false;
        }
        
        switch ($event) {
            case 'request.created':
                return $this->handleRequestCreated($data);
            case 'request.updated':
                return $this->handleRequestUpdated($data);
            case 'request.status_changed':
                return $this->handleRequestStatusChanged($data);
            case 'carrier.created':
                return $this->handleCarrierCreated($data);
            case 'carrier.updated':
                return $this->handleCarrierUpdated($data);
            case 'shipment.status_changed':
                return $this->handleShipmentStatusChanged($data);
            default:
                return false;
        }
    }
    
    /**
     * Обработка создания нового запроса
     */
    private function handleRequestCreated(array $data): bool
    {
        if (!\CModule::IncludeModule('tasks')) {
            return false;
        }
        
        // Создаем задачу
        $taskData = [
            'TITLE' => "Новый транспортный запрос {$data['requestNumber']}",
            'DESCRIPTION' => $this->formatRequestDescription($data),
            'RESPONSIBLE_ID' => $this->getResponsibleUserId($data['status']),
            'PRIORITY' => $data['urgency'] === 'срочная' ? 2 : 1,
            'GROUP_ID' => \COption::GetOptionString('transport.registry', 'work_group_id', 0),
            'UF_TRANSPORT_REQUEST_ID' => $data['id'],
            'UF_REQUEST_STATUS' => $data['status']
        ];
        
        $task = new \CTasks();
        $taskId = $task->Add($taskData);
        
        if ($taskId) {
            // Отправляем уведомление
            $this->sendNotification($data, 'created');
            return true;
        }
        
        return false;
    }
    
    /**
     * Обработка обновления запроса
     */
    private function handleRequestUpdated(array $data): bool
    {
        if (!\CModule::IncludeModule('tasks')) {
            return false;
        }
        
        // Ищем задачу по ID запроса
        $taskData = \CTasks::GetList(
            [],
            ['UF_TRANSPORT_REQUEST_ID' => $data['id']],
            false,
            false,
            ['ID', 'TITLE', 'RESPONSIBLE_ID']
        )->Fetch();
        
        if (!$taskData) {
            return false;
        }
        
        // Обновляем задачу
        $updateData = [
            'TITLE' => "Транспортный запрос {$data['requestNumber']} (обновлен)",
            'DESCRIPTION' => $this->formatRequestDescription($data),
            'UF_REQUEST_STATUS' => $data['status']
        ];
        
        $task = new \CTasks();
        $result = $task->Update($taskData['ID'], $updateData);
        
        if ($result) {
            // Добавляем комментарий об обновлении
            $this->addTaskComment($taskData['ID'], "Запрос обновлен: " . date('d.m.Y H:i'));
            return true;
        }
        
        return false;
    }
    
    /**
     * Обработка изменения статуса запроса
     */
    private function handleRequestStatusChanged(array $data): bool
    {
        if (!\CModule::IncludeModule('tasks')) {
            return false;
        }
        
        $taskData = \CTasks::GetList(
            [],
            ['UF_TRANSPORT_REQUEST_ID' => $data['id']],
            false,
            false,
            ['ID', 'RESPONSIBLE_ID']
        )->Fetch();
        
        if (!$taskData) {
            return false;
        }
        
        // Меняем ответственного в зависимости от статуса
        $newResponsible = $this->getResponsibleUserId($data['status']);
        
        $updateData = [
            'RESPONSIBLE_ID' => $newResponsible,
            'UF_REQUEST_STATUS' => $data['status']
        ];
        
        $task = new \CTasks();
        $result = $task->Update($taskData['ID'], $updateData);
        
        if ($result) {
            // Добавляем комментарий о смене статуса
            $statusNames = [
                'created' => 'Создан',
                'logistics' => 'В обработке у логиста',
                'manager' => 'На согласовании у менеджера',
                'finance' => 'В финансовом отделе',
                'approved' => 'Одобрен',
                'rejected' => 'Отклонен',
                'completed' => 'Завершен'
            ];
            
            $statusName = $statusNames[$data['status']] ?? $data['status'];
            $this->addTaskComment($taskData['ID'], "Статус изменен на: {$statusName}");
            
            // Отправляем уведомление новому ответственному
            $this->sendNotification($data, 'status_changed');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Обработка создания нового перевозчика
     */
    private function handleCarrierCreated(array $data): bool
    {
        if (!\CModule::IncludeModule('crm')) {
            return false;
        }
        
        $contactData = [
            'NAME' => $data['name'],
            'COMPANY_TITLE' => $data['name'],
            'PHONE' => [['VALUE' => $data['phone'], 'VALUE_TYPE' => 'WORK']],
            'EMAIL' => [['VALUE' => $data['email'], 'VALUE_TYPE' => 'WORK']],
            'ADDRESS' => $data['address'],
            'COMMENTS' => $data['notes'],
            'UF_TRANSPORT_RATING' => $data['rating'],
            'UF_PRICE_RANGE' => $data['priceRange'],
            'UF_CARRIER_ID' => $data['id']
        ];
        
        $contact = new \CCrmContact();
        $contactId = $contact->Add($contactData);
        
        return $contactId !== false;
    }
    
    /**
     * Обработка обновления перевозчика
     */
    private function handleCarrierUpdated(array $data): bool
    {
        if (!\CModule::IncludeModule('crm')) {
            return false;
        }
        
        $existingContact = \CCrmContact::GetList(
            [],
            ['UF_CARRIER_ID' => $data['id']],
            false,
            false,
            ['ID']
        )->Fetch();
        
        if (!$existingContact) {
            return false;
        }
        
        $contactData = [
            'NAME' => $data['name'],
            'COMPANY_TITLE' => $data['name'],
            'PHONE' => [['VALUE' => $data['phone'], 'VALUE_TYPE' => 'WORK']],
            'EMAIL' => [['VALUE' => $data['email'], 'VALUE_TYPE' => 'WORK']],
            'ADDRESS' => $data['address'],
            'COMMENTS' => $data['notes'],
            'UF_TRANSPORT_RATING' => $data['rating'],
            'UF_PRICE_RANGE' => $data['priceRange']
        ];
        
        $contact = new \CCrmContact();
        $result = $contact->Update($existingContact['ID'], $contactData);
        
        return $result !== false;
    }
    
    /**
     * Обработка изменения статуса отгрузки
     */
    private function handleShipmentStatusChanged(array $data): bool
    {
        if (!\CModule::IncludeModule('tasks')) {
            return false;
        }
        
        $taskData = \CTasks::GetList(
            [],
            ['UF_TRANSPORT_REQUEST_ID' => $data['requestId']],
            false,
            false,
            ['ID']
        )->Fetch();
        
        if (!$taskData) {
            return false;
        }
        
        $statusNames = [
            'pending' => 'Ожидает отгрузки',
            'in_transit' => 'В пути',
            'delivered' => 'Доставлено',
            'delayed' => 'Задержка',
            'cancelled' => 'Отменено'
        ];
        
        $statusName = $statusNames[$data['status']] ?? $data['status'];
        $comment = "Статус отгрузки: {$statusName}";
        
        if (!empty($data['location'])) {
            $comment .= "\nТекущее местоположение: {$data['location']}";
        }
        
        if (!empty($data['estimatedArrival'])) {
            $comment .= "\nОжидаемое время прибытия: {$data['estimatedArrival']}";
        }
        
        $this->addTaskComment($taskData['ID'], $comment);
        
        return true;
    }
    
    /**
     * Отправка уведомления
     */
    private function sendNotification(array $data, string $type): bool
    {
        if (!\CModule::IncludeModule('im')) {
            return false;
        }
        
        $responsible = $this->getResponsibleUserId($data['status']);
        
        $messages = [
            'created' => "Создан новый транспортный запрос {$data['requestNumber']}",
            'status_changed' => "Изменен статус запроса {$data['requestNumber']}"
        ];
        
        $message = $messages[$type] ?? 'Обновление по транспортному запросу';
        
        \CIMMessenger::Add([
            'TO_USER_ID' => $responsible,
            'FROM_USER_ID' => 1,
            'MESSAGE' => $message,
            'MESSAGE_TYPE' => \IM_MESSAGE_PRIVATE
        ]);
        
        return true;
    }
    
    /**
     * Форматирование описания запроса
     */
    private function formatRequestDescription(array $data): string
    {
        $description = "Транспортный запрос {$data['requestNumber']}\n\n";
        $description .= "Маршрут: {$data['fromCity']} → {$data['toCity']}\n";
        $description .= "Тип груза: {$data['cargoType']}\n";
        $description .= "Вес: {$data['weight']} кг\n";
        $description .= "Габариты: {$data['width']}×{$data['length']}×{$data['height']} м\n";
        $description .= "Срочность: {$data['urgency']}\n";
        
        if (!empty($data['description'])) {
            $description .= "Описание: {$data['description']}\n";
        }
        
        if (!empty($data['estimatedCost'])) {
            $description .= "Стоимость: {$data['estimatedCost']} тг\n";
        }
        
        return $description;
    }
    
    /**
     * Получение ID ответственного пользователя
     */
    private function getResponsibleUserId(string $status): int
    {
        $userMappings = [
            'created' => \COption::GetOptionString('transport.registry', 'logist_user_id', 1),
            'logistics' => \COption::GetOptionString('transport.registry', 'manager_user_id', 1),
            'manager' => \COption::GetOptionString('transport.registry', 'finance_user_id', 1),
            'finance' => \COption::GetOptionString('transport.registry', 'director_user_id', 1)
        ];
        
        return (int)($userMappings[$status] ?? 1);
    }
    
    /**
     * Добавление комментария к задаче
     */
    private function addTaskComment(int $taskId, string $comment): bool
    {
        if (!\CModule::IncludeModule('forum')) {
            return false;
        }
        
        return \CTaskComments::Add($taskId, [
            'POST_MESSAGE' => $comment,
            'AUTHOR_ID' => 1
        ]);
    }
}

// Обработка запроса
$handler = new TransportWebhookHandler();
$handler->handleWebhook();