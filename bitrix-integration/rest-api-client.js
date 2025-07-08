/**
 * REST API клиент для интеграции с системой транспортных запросов
 * Для использования в Битрикс24
 */

class TransportRegistryAPI {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Выполнить HTTP запрос
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Получить список транспортных запросов
     */
    async getTransportRequests(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/transportation-requests?${params}`);
    }

    /**
     * Получить конкретный транспортный запрос
     */
    async getTransportRequest(id) {
        return await this.request(`/transportation-requests/${id}`);
    }

    /**
     * Создать новый транспортный запрос
     */
    async createTransportRequest(data) {
        return await this.request('/transportation-requests', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Обновить транспортный запрос
     */
    async updateTransportRequest(id, data) {
        return await this.request(`/transportation-requests/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * Получить список перевозчиков
     */
    async getCarriers() {
        return await this.request('/carriers');
    }

    /**
     * Создать нового перевозчика
     */
    async createCarrier(data) {
        return await this.request('/carriers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Получить статистику по дашборду
     */
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    /**
     * Получить отчеты по перевозкам
     */
    async getMonthlyStats() {
        return await this.request('/dashboard/monthly-stats');
    }

    /**
     * Получить статистику по статусам
     */
    async getStatusStats() {
        return await this.request('/dashboard/status-stats');
    }

    /**
     * Получить активные отправления
     */
    async getShipments() {
        return await this.request('/shipments');
    }

    /**
     * Получить точки отслеживания для отправления
     */
    async getTrackingPoints(shipmentId) {
        return await this.request(`/shipments/${shipmentId}/tracking`);
    }

    /**
     * Добавить точку отслеживания
     */
    async addTrackingPoint(shipmentId, data) {
        return await this.request(`/shipments/${shipmentId}/tracking`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Получить маршруты
     */
    async getRoutes() {
        return await this.request('/routes');
    }

    /**
     * Создать новый маршрут
     */
    async createRoute(data) {
        return await this.request('/routes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

/**
 * Битрикс24 интеграция
 */
class BitrixTransportIntegration {
    constructor(transportApi) {
        this.transportApi = transportApi;
        this.init();
    }

    init() {
        // Инициализация Битрикс24 приложения
        BX24.init(() => {
            console.log('Битрикс24 приложение инициализировано');
            this.bindEvents();
        });
    }

    bindEvents() {
        // Обработчики событий Битрикс24
        BX24.bind('app:ready', () => {
            this.loadTransportRequests();
        });

        // Обработчик создания задачи
        BX24.bind('task:add', (data) => {
            this.handleTaskCreated(data);
        });

        // Обработчик обновления задачи
        BX24.bind('task:update', (data) => {
            this.handleTaskUpdated(data);
        });
    }

    /**
     * Загрузить транспортные запросы в интерфейс
     */
    async loadTransportRequests() {
        try {
            const requests = await this.transportApi.getTransportRequests();
            this.displayRequests(requests);
        } catch (error) {
            console.error('Ошибка загрузки запросов:', error);
            this.showError('Не удалось загрузить транспортные запросы');
        }
    }

    /**
     * Отобразить запросы в интерфейсе
     */
    displayRequests(requests) {
        const container = document.getElementById('transport-requests');
        
        if (!container) return;

        container.innerHTML = '';

        requests.forEach(request => {
            const requestElement = this.createRequestElement(request);
            container.appendChild(requestElement);
        });
    }

    /**
     * Создать HTML элемент для запроса
     */
    createRequestElement(request) {
        const div = document.createElement('div');
        div.className = 'transport-request-card';
        div.innerHTML = `
            <div class="request-header">
                <h3>${request.requestNumber}</h3>
                <span class="status status-${request.status}">${this.getStatusName(request.status)}</span>
            </div>
            <div class="request-content">
                <p><strong>Маршрут:</strong> ${request.fromCity} → ${request.toCity}</p>
                <p><strong>Груз:</strong> ${request.cargoType}</p>
                <p><strong>Вес:</strong> ${request.weight} кг</p>
                <p><strong>Срочность:</strong> ${request.urgency}</p>
                ${request.estimatedCost ? `<p><strong>Стоимость:</strong> ${request.estimatedCost} тг</p>` : ''}
            </div>
            <div class="request-actions">
                <button onclick="bitrixIntegration.createTaskForRequest(${request.id})">
                    Создать задачу
                </button>
                <button onclick="bitrixIntegration.viewRequestDetails(${request.id})">
                    Подробности
                </button>
            </div>
        `;

        return div;
    }

    /**
     * Получить название статуса
     */
    getStatusName(status) {
        const statusNames = {
            'created': 'Создан',
            'logistics': 'У логиста',
            'manager': 'У менеджера',
            'finance': 'В финансах',
            'approved': 'Одобрен',
            'rejected': 'Отклонен',
            'completed': 'Завершен'
        };

        return statusNames[status] || status;
    }

    /**
     * Создать задачу для транспортного запроса
     */
    async createTaskForRequest(requestId) {
        try {
            const request = await this.transportApi.getTransportRequest(requestId);
            
            const taskData = {
                TITLE: `Транспортный запрос ${request.requestNumber}`,
                DESCRIPTION: this.formatRequestDescription(request),
                RESPONSIBLE_ID: this.getResponsibleUserId(request.status),
                PRIORITY: request.urgency === 'срочная' ? 2 : 1,
                UF_TRANSPORT_REQUEST_ID: request.id,
                UF_REQUEST_STATUS: request.status
            };

            BX24.callMethod('tasks.task.add', {
                fields: taskData
            }, (result) => {
                if (result.error()) {
                    console.error('Ошибка создания задачи:', result.error());
                    this.showError('Не удалось создать задачу');
                } else {
                    this.showSuccess('Задача создана успешно');
                    console.log('Задача создана:', result.data());
                }
            });

        } catch (error) {
            console.error('Ошибка создания задачи:', error);
            this.showError('Не удалось создать задачу');
        }
    }

    /**
     * Показать детали запроса
     */
    async viewRequestDetails(requestId) {
        try {
            const request = await this.transportApi.getTransportRequest(requestId);
            
            BX24.openModal({
                title: `Транспортный запрос ${request.requestNumber}`,
                content: this.formatRequestDetails(request),
                buttons: [
                    {
                        text: 'Создать задачу',
                        className: 'ui-btn ui-btn-primary',
                        events: {
                            click: () => {
                                this.createTaskForRequest(requestId);
                                BX24.closeModal();
                            }
                        }
                    },
                    {
                        text: 'Закрыть',
                        className: 'ui-btn ui-btn-default',
                        events: {
                            click: () => BX24.closeModal()
                        }
                    }
                ]
            });

        } catch (error) {
            console.error('Ошибка загрузки деталей:', error);
            this.showError('Не удалось загрузить детали запроса');
        }
    }

    /**
     * Форматировать описание запроса
     */
    formatRequestDescription(request) {
        let description = `Транспортный запрос ${request.requestNumber}\n\n`;
        description += `Маршрут: ${request.fromCity} → ${request.toCity}\n`;
        description += `Адрес отправления: ${request.fromAddress}\n`;
        description += `Адрес назначения: ${request.toAddress}\n`;
        description += `Тип груза: ${request.cargoType}\n`;
        description += `Вес: ${request.weight} кг\n`;
        description += `Габариты: ${request.width}×${request.length}×${request.height} м\n`;
        description += `Срочность: ${request.urgency}\n`;
        
        if (request.description) {
            description += `Описание: ${request.description}\n`;
        }
        
        if (request.estimatedCost) {
            description += `Предварительная стоимость: ${request.estimatedCost} тг\n`;
        }
        
        return description;
    }

    /**
     * Форматировать детали запроса для модального окна
     */
    formatRequestDetails(request) {
        return `
            <div class="request-details">
                <div class="detail-row">
                    <strong>Номер запроса:</strong> ${request.requestNumber}
                </div>
                <div class="detail-row">
                    <strong>Статус:</strong> ${this.getStatusName(request.status)}
                </div>
                <div class="detail-row">
                    <strong>Маршрут:</strong> ${request.fromCity} → ${request.toCity}
                </div>
                <div class="detail-row">
                    <strong>Адрес отправления:</strong> ${request.fromAddress}
                </div>
                <div class="detail-row">
                    <strong>Адрес назначения:</strong> ${request.toAddress}
                </div>
                <div class="detail-row">
                    <strong>Тип груза:</strong> ${request.cargoType}
                </div>
                <div class="detail-row">
                    <strong>Вес:</strong> ${request.weight} кг
                </div>
                <div class="detail-row">
                    <strong>Габариты:</strong> ${request.width}×${request.length}×${request.height} м
                </div>
                <div class="detail-row">
                    <strong>Срочность:</strong> ${request.urgency}
                </div>
                ${request.description ? `<div class="detail-row"><strong>Описание:</strong> ${request.description}</div>` : ''}
                ${request.estimatedCost ? `<div class="detail-row"><strong>Стоимость:</strong> ${request.estimatedCost} тг</div>` : ''}
                <div class="detail-row">
                    <strong>Создан:</strong> ${new Date(request.createdAt).toLocaleDateString('ru-RU')}
                </div>
            </div>
        `;
    }

    /**
     * Определить ответственного пользователя
     */
    getResponsibleUserId(status) {
        // Здесь должно быть получение настроек из Битрикс24
        const userMappings = {
            'created': 1,
            'logistics': 2,
            'manager': 3,
            'finance': 4
        };

        return userMappings[status] || 1;
    }

    /**
     * Обработка создания задачи
     */
    handleTaskCreated(data) {
        console.log('Задача создана:', data);
        // Дополнительная логика обработки
    }

    /**
     * Обработка обновления задачи
     */
    handleTaskUpdated(data) {
        console.log('Задача обновлена:', data);
        // Дополнительная логика обработки
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        BX24.showNotification(message, 'error');
    }

    /**
     * Показать успех
     */
    showSuccess(message) {
        BX24.showNotification(message, 'success');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Настройки API (должны быть получены из настроек Битрикс24)
    const apiBaseUrl = 'https://your-transport-app.appspot.com/api';
    const apiKey = 'your-api-key';

    // Создание экземпляров
    const transportApi = new TransportRegistryAPI(apiBaseUrl, apiKey);
    const bitrixIntegration = new BitrixTransportIntegration(transportApi);

    // Глобальная переменная для доступа из HTML
    window.bitrixIntegration = bitrixIntegration;
});