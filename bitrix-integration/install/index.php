<?php
/**
 * Установочный файл модуля для Битрикс24
 */

class transport_registry extends CModule
{
    public $MODULE_ID = 'transport.registry';
    public $MODULE_NAME = 'Транспортный реестр';
    public $MODULE_DESCRIPTION = 'Модуль интеграции с системой управления транспортными запросами';
    public $MODULE_VERSION = '1.0.0';
    public $MODULE_VERSION_DATE = '2025-07-07';
    public $PARTNER_NAME = 'Transport Solutions';
    public $PARTNER_URI = 'https://transport-registry.kz';
    
    public function __construct()
    {
        $arModuleVersion = [];
        include(__DIR__ . '/version.php');
        
        if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion)) {
            $this->MODULE_VERSION = $arModuleVersion['VERSION'];
            $this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
        }
    }
    
    public function DoInstall()
    {
        global $APPLICATION;
        
        if ($this->IsVersionD7()) {
            // Проверяем необходимые модули
            if (!$this->CheckModules()) {
                return false;
            }
            
            // Регистрируем модуль
            RegisterModule($this->MODULE_ID);
            
            // Создаем пользовательские поля
            $this->InstallUserFields();
            
            // Создаем агентов
            $this->InstallAgents();
            
            // Создаем обработчики событий
            $this->InstallEvents();
            
            // Создаем типы активности для CRM
            $this->InstallCrmActivityTypes();
            
            $APPLICATION->IncludeAdminFile(
                'Установка модуля ' . $this->MODULE_NAME,
                __DIR__ . '/step.php'
            );
        } else {
            $APPLICATION->ThrowException('Модуль работает только с Битрикс24 D7');
        }
        
        return true;
    }
    
    public function DoUninstall()
    {
        global $APPLICATION;
        
        // Удаляем типы активности
        $this->UnInstallCrmActivityTypes();
        
        // Удаляем обработчики событий
        $this->UnInstallEvents();
        
        // Удаляем агентов
        $this->UnInstallAgents();
        
        // Удаляем пользовательские поля (опционально)
        if ($_REQUEST['save_data'] !== 'Y') {
            $this->UnInstallUserFields();
        }
        
        // Удаляем модуль
        UnRegisterModule($this->MODULE_ID);
        
        $APPLICATION->IncludeAdminFile(
            'Удаление модуля ' . $this->MODULE_NAME,
            __DIR__ . '/unstep.php'
        );
        
        return true;
    }
    
    private function IsVersionD7()
    {
        return CheckVersion(SM_VERSION, '14.00.00');
    }
    
    private function CheckModules()
    {
        $requiredModules = ['tasks', 'crm', 'im'];
        
        foreach ($requiredModules as $moduleId) {
            if (!CModule::IncludeModule($moduleId)) {
                global $APPLICATION;
                $APPLICATION->ThrowException("Не установлен модуль {$moduleId}");
                return false;
            }
        }
        
        return true;
    }
    
    private function InstallUserFields()
    {
        // Пользовательские поля для задач
        $taskFields = [
            'UF_TRANSPORT_REQUEST_ID' => [
                'ENTITY_ID' => 'TASKS_TASK',
                'FIELD_NAME' => 'UF_TRANSPORT_REQUEST_ID',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => 'UF_TRANSPORT_REQUEST_ID',
                'SORT' => 500,
                'MULTIPLE' => 'N',
                'MANDATORY' => 'N',
                'SHOW_FILTER' => 'Y',
                'SHOW_IN_LIST' => 'Y',
                'EDIT_IN_LIST' => 'N',
                'IS_SEARCHABLE' => 'Y',
                'SETTINGS' => [
                    'SIZE' => 20,
                    'ROWS' => 1,
                    'REGEXP' => '',
                    'MIN_LENGTH' => 0,
                    'MAX_LENGTH' => 255,
                    'DEFAULT_VALUE' => ''
                ],
                'EDIT_FORM_LABEL' => [
                    'ru' => 'ID транспортного запроса',
                    'en' => 'Transport Request ID'
                ],
                'LIST_COLUMN_LABEL' => [
                    'ru' => 'ID запроса',
                    'en' => 'Request ID'
                ],
                'LIST_FILTER_LABEL' => [
                    'ru' => 'ID транспортного запроса',
                    'en' => 'Transport Request ID'
                ]
            ],
            'UF_REQUEST_STATUS' => [
                'ENTITY_ID' => 'TASKS_TASK',
                'FIELD_NAME' => 'UF_REQUEST_STATUS',
                'USER_TYPE_ID' => 'enumeration',
                'XML_ID' => 'UF_REQUEST_STATUS',
                'SORT' => 501,
                'MULTIPLE' => 'N',
                'MANDATORY' => 'N',
                'SHOW_FILTER' => 'Y',
                'SHOW_IN_LIST' => 'Y',
                'EDIT_IN_LIST' => 'Y',
                'IS_SEARCHABLE' => 'Y',
                'SETTINGS' => [
                    'DISPLAY' => 'LIST',
                    'LIST_HEIGHT' => 5
                ],
                'EDIT_FORM_LABEL' => [
                    'ru' => 'Статус запроса',
                    'en' => 'Request Status'
                ],
                'LIST_COLUMN_LABEL' => [
                    'ru' => 'Статус',
                    'en' => 'Status'
                ],
                'LIST_FILTER_LABEL' => [
                    'ru' => 'Статус запроса',
                    'en' => 'Request Status'
                ]
            ]
        ];
        
        // Пользовательские поля для контактов CRM
        $crmFields = [
            'UF_TRANSPORT_RATING' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_TRANSPORT_RATING',
                'USER_TYPE_ID' => 'double',
                'XML_ID' => 'UF_TRANSPORT_RATING',
                'SORT' => 500,
                'MULTIPLE' => 'N',
                'MANDATORY' => 'N',
                'SHOW_FILTER' => 'Y',
                'SHOW_IN_LIST' => 'Y',
                'EDIT_IN_LIST' => 'Y',
                'IS_SEARCHABLE' => 'Y',
                'SETTINGS' => [
                    'PRECISION' => 1,
                    'SIZE' => 10,
                    'MIN_VALUE' => 0,
                    'MAX_VALUE' => 5,
                    'DEFAULT_VALUE' => 0
                ],
                'EDIT_FORM_LABEL' => [
                    'ru' => 'Рейтинг перевозчика',
                    'en' => 'Carrier Rating'
                ],
                'LIST_COLUMN_LABEL' => [
                    'ru' => 'Рейтинг',
                    'en' => 'Rating'
                ]
            ],
            'UF_PRICE_RANGE' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_PRICE_RANGE',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => 'UF_PRICE_RANGE',
                'SORT' => 501,
                'MULTIPLE' => 'N',
                'MANDATORY' => 'N',
                'SHOW_FILTER' => 'Y',
                'SHOW_IN_LIST' => 'Y',
                'EDIT_IN_LIST' => 'Y',
                'IS_SEARCHABLE' => 'Y',
                'SETTINGS' => [
                    'SIZE' => 50,
                    'ROWS' => 1,
                    'MAX_LENGTH' => 255
                ],
                'EDIT_FORM_LABEL' => [
                    'ru' => 'Диапазон цен',
                    'en' => 'Price Range'
                ],
                'LIST_COLUMN_LABEL' => [
                    'ru' => 'Цены',
                    'en' => 'Prices'
                ]
            ],
            'UF_CARRIER_ID' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_CARRIER_ID',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => 'UF_CARRIER_ID',
                'SORT' => 502,
                'MULTIPLE' => 'N',
                'MANDATORY' => 'N',
                'SHOW_FILTER' => 'N',
                'SHOW_IN_LIST' => 'N',
                'EDIT_IN_LIST' => 'N',
                'IS_SEARCHABLE' => 'Y',
                'SETTINGS' => [
                    'SIZE' => 20,
                    'ROWS' => 1,
                    'MAX_LENGTH' => 50
                ],
                'EDIT_FORM_LABEL' => [
                    'ru' => 'ID перевозчика',
                    'en' => 'Carrier ID'
                ]
            ],
            'UF_TRANSPORT_TYPES' => [
                'ENTITY_ID' => 'CRM_CONTACT',
                'FIELD_NAME' => 'UF_TRANSPORT_TYPES',
                'USER_TYPE_ID' => 'string',
                'XML_ID' => 'UF_TRANSPORT_TYPES',
                'SORT' => 503,
                'MULTIPLE' => 'Y',
                'MANDATORY' => 'N',
                'SHOW_FILTER' => 'Y',
                'SHOW_IN_LIST' => 'Y',
                'EDIT_IN_LIST' => 'Y',
                'IS_SEARCHABLE' => 'Y',
                'SETTINGS' => [
                    'SIZE' => 30,
                    'ROWS' => 1,
                    'MAX_LENGTH' => 100
                ],
                'EDIT_FORM_LABEL' => [
                    'ru' => 'Типы транспорта',
                    'en' => 'Transport Types'
                ],
                'LIST_COLUMN_LABEL' => [
                    'ru' => 'Транспорт',
                    'en' => 'Transport'
                ]
            ]
        ];
        
        $userField = new CUserTypeEntity();
        
        // Создаем поля для задач
        foreach ($taskFields as $field) {
            $existing = CUserTypeEntity::GetList(
                [],
                ['ENTITY_ID' => $field['ENTITY_ID'], 'FIELD_NAME' => $field['FIELD_NAME']]
            )->Fetch();
            
            if (!$existing) {
                $fieldId = $userField->Add($field);
                
                // Добавляем значения для поля статуса
                if ($field['FIELD_NAME'] === 'UF_REQUEST_STATUS' && $fieldId) {
                    $this->AddEnumValues($fieldId);
                }
            }
        }
        
        // Создаем поля для CRM
        foreach ($crmFields as $field) {
            $existing = CUserTypeEntity::GetList(
                [],
                ['ENTITY_ID' => $field['ENTITY_ID'], 'FIELD_NAME' => $field['FIELD_NAME']]
            )->Fetch();
            
            if (!$existing) {
                $userField->Add($field);
            }
        }
    }
    
    private function AddEnumValues($fieldId)
    {
        $enum = new CUserFieldEnum();
        
        $values = [
            ['VALUE' => 'created', 'DEF' => 'N', 'SORT' => 100, 'XML_ID' => 'created'],
            ['VALUE' => 'logistics', 'DEF' => 'N', 'SORT' => 200, 'XML_ID' => 'logistics'],
            ['VALUE' => 'manager', 'DEF' => 'N', 'SORT' => 300, 'XML_ID' => 'manager'],
            ['VALUE' => 'finance', 'DEF' => 'N', 'SORT' => 400, 'XML_ID' => 'finance'],
            ['VALUE' => 'approved', 'DEF' => 'N', 'SORT' => 500, 'XML_ID' => 'approved'],
            ['VALUE' => 'rejected', 'DEF' => 'N', 'SORT' => 600, 'XML_ID' => 'rejected'],
            ['VALUE' => 'completed', 'DEF' => 'N', 'SORT' => 700, 'XML_ID' => 'completed']
        ];
        
        foreach ($values as $value) {
            $value['USER_FIELD_ID'] = $fieldId;
            $enum->Add($value);
        }
    }
    
    private function InstallAgents()
    {
        // Агент для синхронизации данных
        CAgent::AddAgent(
            'TransportRegistrySync::SyncData();',
            $this->MODULE_ID,
            'N',
            300, // каждые 5 минут
            '',
            'Y',
            '',
            30
        );
        
        // Агент для проверки статусов
        CAgent::AddAgent(
            'TransportRegistrySync::CheckStatuses();',
            $this->MODULE_ID,
            'N',
            600, // каждые 10 минут
            '',
            'Y',
            '',
            30
        );
    }
    
    private function InstallEvents()
    {
        $eventManager = \Bitrix\Main\EventManager::getInstance();
        
        // События задач
        $eventManager->registerEventHandler(
            'tasks',
            'OnTaskAdd',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnTaskAdd'
        );
        
        $eventManager->registerEventHandler(
            'tasks',
            'OnTaskUpdate',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnTaskUpdate'
        );
        
        // События CRM
        $eventManager->registerEventHandler(
            'crm',
            'OnAfterCrmContactAdd',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnContactAdd'
        );
        
        $eventManager->registerEventHandler(
            'crm',
            'OnAfterCrmContactUpdate',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnContactUpdate'
        );
    }
    
    private function InstallCrmActivityTypes()
    {
        if (!CModule::IncludeModule('crm')) {
            return;
        }
        
        // Создаем тип активности для транспортных запросов
        $activityType = [
            'NAME' => 'Транспортный запрос',
            'PROVIDER_ID' => 'TRANSPORT_REQUEST',
            'PROVIDER_TYPE_ID' => 'TRANSPORT',
            'DESCRIPTION' => 'Активность по транспортному запросу'
        ];
        
        // Здесь должна быть логика создания типа активности
        // В зависимости от версии Битрикс24
    }
    
    private function UnInstallUserFields()
    {
        $fields = [
            'UF_TRANSPORT_REQUEST_ID',
            'UF_REQUEST_STATUS',
            'UF_TRANSPORT_RATING',
            'UF_PRICE_RANGE',
            'UF_CARRIER_ID',
            'UF_TRANSPORT_TYPES'
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
        CAgent::RemoveAgent('TransportRegistrySync::SyncData();', $this->MODULE_ID);
        CAgent::RemoveAgent('TransportRegistrySync::CheckStatuses();', $this->MODULE_ID);
    }
    
    private function UnInstallEvents()
    {
        $eventManager = \Bitrix\Main\EventManager::getInstance();
        
        $eventManager->unRegisterEventHandler(
            'tasks',
            'OnTaskAdd',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnTaskAdd'
        );
        
        $eventManager->unRegisterEventHandler(
            'tasks',
            'OnTaskUpdate',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnTaskUpdate'
        );
        
        $eventManager->unRegisterEventHandler(
            'crm',
            'OnAfterCrmContactAdd',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnContactAdd'
        );
        
        $eventManager->unRegisterEventHandler(
            'crm',
            'OnAfterCrmContactUpdate',
            $this->MODULE_ID,
            'TransportRegistryEvents',
            'OnContactUpdate'
        );
    }
    
    private function UnInstallCrmActivityTypes()
    {
        // Логика удаления типов активности
    }
}
?>