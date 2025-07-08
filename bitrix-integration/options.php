<?php
/**
 * Настройки модуля интеграции с транспортным реестром
 */

use Bitrix\Main\Loader;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;

if (!$USER->IsAdmin()) {
    return;
}

$module_id = 'transport.registry';

Loader::includeModule($module_id);

$tabControl = new CAdminTabControl('tabControl', [
    [
        'DIV' => 'edit1',
        'TAB' => 'Основные настройки',
        'TITLE' => 'Настройки интеграции'
    ],
    [
        'DIV' => 'edit2',
        'TAB' => 'Пользователи',
        'TITLE' => 'Назначение ответственных'
    ],
    [
        'DIV' => 'edit3',
        'TAB' => 'Уведомления',
        'TITLE' => 'Настройки уведомлений'
    ]
]);

// Обработка сохранения настроек
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['save'] && check_bitrix_sessid()) {
    $options = [
        'api_base_url',
        'api_key',
        'webhook_secret',
        'work_group_id',
        'logist_user_id',
        'manager_user_id',
        'finance_user_id',
        'director_user_id',
        'enable_notifications',
        'notification_chat_id',
        'sync_carriers',
        'auto_create_tasks',
        'task_deadline_days'
    ];
    
    foreach ($options as $option) {
        if (isset($_POST[$option])) {
            Option::set($module_id, $option, $_POST[$option]);
        }
    }
    
    LocalRedirect($APPLICATION->GetCurPage() . '?mid=' . urlencode($module_id) . '&lang=' . urlencode(LANGUAGE_ID) . '&saved=Y');
}

// Получение текущих значений
$api_base_url = Option::get($module_id, 'api_base_url', 'https://your-transport-app.appspot.com/api');
$api_key = Option::get($module_id, 'api_key', '');
$webhook_secret = Option::get($module_id, 'webhook_secret', '');
$work_group_id = Option::get($module_id, 'work_group_id', '');
$logist_user_id = Option::get($module_id, 'logist_user_id', '1');
$manager_user_id = Option::get($module_id, 'manager_user_id', '1');
$finance_user_id = Option::get($module_id, 'finance_user_id', '1');
$director_user_id = Option::get($module_id, 'director_user_id', '1');
$enable_notifications = Option::get($module_id, 'enable_notifications', 'Y');
$notification_chat_id = Option::get($module_id, 'notification_chat_id', '');
$sync_carriers = Option::get($module_id, 'sync_carriers', 'Y');
$auto_create_tasks = Option::get($module_id, 'auto_create_tasks', 'Y');
$task_deadline_days = Option::get($module_id, 'task_deadline_days', '7');

// Получение списка пользователей для выбора
$users = [];
$userResult = CUser::GetList(($by = 'name'), ($order = 'asc'), ['ACTIVE' => 'Y']);
while ($user = $userResult->Fetch()) {
    $users[$user['ID']] = $user['NAME'] . ' ' . $user['LAST_NAME'] . ' (' . $user['LOGIN'] . ')';
}

// Получение списка рабочих групп
$workGroups = [];
if (CModule::IncludeModule('socialnetwork')) {
    $groupResult = CSocNetGroup::GetList([], ['ACTIVE' => 'Y']);
    while ($group = $groupResult->Fetch()) {
        $workGroups[$group['ID']] = $group['NAME'];
    }
}

?>

<form method="post" action="<?= $APPLICATION->GetCurPage() ?>?mid=<?= urlencode($module_id) ?>&amp;lang=<?= LANGUAGE_ID ?>">
    <?= bitrix_sessid_post(); ?>
    
    <?php $tabControl->Begin(); ?>
    
    <?php $tabControl->BeginNextTab(); ?>
    
    <tr>
        <td width="40%">URL API системы транспортных запросов:</td>
        <td width="60%">
            <input type="text" name="api_base_url" value="<?= htmlspecialcharsbx($api_base_url) ?>" size="50" />
            <br><small>Базовый URL API (например: https://your-app.appspot.com/api)</small>
        </td>
    </tr>
    
    <tr>
        <td>API ключ:</td>
        <td>
            <input type="text" name="api_key" value="<?= htmlspecialcharsbx($api_key) ?>" size="50" />
            <br><small>Ключ для доступа к API системы транспортных запросов</small>
        </td>
    </tr>
    
    <tr>
        <td>Секретный ключ webhook:</td>
        <td>
            <input type="text" name="webhook_secret" value="<?= htmlspecialcharsbx($webhook_secret) ?>" size="50" />
            <br><small>Секретный ключ для проверки подписи webhook'ов</small>
        </td>
    </tr>
    
    <tr>
        <td>Рабочая группа для задач:</td>
        <td>
            <select name="work_group_id">
                <option value="">Не выбрана</option>
                <?php foreach ($workGroups as $id => $name): ?>
                    <option value="<?= $id ?>" <?= ($work_group_id == $id) ? 'selected' : '' ?>>
                        <?= htmlspecialcharsbx($name) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <br><small>Рабочая группа, в которой будут создаваться задачи</small>
        </td>
    </tr>
    
    <tr>
        <td>Автоматически создавать задачи:</td>
        <td>
            <input type="checkbox" name="auto_create_tasks" value="Y" <?= ($auto_create_tasks === 'Y') ? 'checked' : '' ?> />
            <br><small>Автоматически создавать задачи для новых транспортных запросов</small>
        </td>
    </tr>
    
    <tr>
        <td>Срок выполнения задач (дней):</td>
        <td>
            <input type="number" name="task_deadline_days" value="<?= htmlspecialcharsbx($task_deadline_days) ?>" min="1" max="30" />
            <br><small>Количество дней для срока выполнения создаваемых задач</small>
        </td>
    </tr>
    
    <tr>
        <td>Синхронизировать перевозчиков:</td>
        <td>
            <input type="checkbox" name="sync_carriers" value="Y" <?= ($sync_carriers === 'Y') ? 'checked' : '' ?> />
            <br><small>Автоматически синхронизировать данные перевозчиков с CRM</small>
        </td>
    </tr>
    
    <?php $tabControl->BeginNextTab(); ?>
    
    <tr>
        <td>Ответственный логист:</td>
        <td>
            <select name="logist_user_id">
                <?php foreach ($users as $id => $name): ?>
                    <option value="<?= $id ?>" <?= ($logist_user_id == $id) ? 'selected' : '' ?>>
                        <?= htmlspecialcharsbx($name) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <br><small>Пользователь, ответственный за обработку запросов в статусе "Создан"</small>
        </td>
    </tr>
    
    <tr>
        <td>Ответственный менеджер:</td>
        <td>
            <select name="manager_user_id">
                <?php foreach ($users as $id => $name): ?>
                    <option value="<?= $id ?>" <?= ($manager_user_id == $id) ? 'selected' : '' ?>>
                        <?= htmlspecialcharsbx($name) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <br><small>Пользователь, ответственный за согласование запросов</small>
        </td>
    </tr>
    
    <tr>
        <td>Ответственный финансист:</td>
        <td>
            <select name="finance_user_id">
                <?php foreach ($users as $id => $name): ?>
                    <option value="<?= $id ?>" <?= ($finance_user_id == $id) ? 'selected' : '' ?>>
                        <?= htmlspecialcharsbx($name) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <br><small>Пользователь, ответственный за финансовую обработку запросов</small>
        </td>
    </tr>
    
    <tr>
        <td>Директор:</td>
        <td>
            <select name="director_user_id">
                <?php foreach ($users as $id => $name): ?>
                    <option value="<?= $id ?>" <?= ($director_user_id == $id) ? 'selected' : '' ?>>
                        <?= htmlspecialcharsbx($name) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <br><small>Пользователь с правами директора для финального утверждения</small>
        </td>
    </tr>
    
    <?php $tabControl->BeginNextTab(); ?>
    
    <tr>
        <td>Включить уведомления:</td>
        <td>
            <input type="checkbox" name="enable_notifications" value="Y" <?= ($enable_notifications === 'Y') ? 'checked' : '' ?> />
            <br><small>Отправлять уведомления о создании и изменении запросов</small>
        </td>
    </tr>
    
    <tr>
        <td>ID чата для уведомлений:</td>
        <td>
            <input type="text" name="notification_chat_id" value="<?= htmlspecialcharsbx($notification_chat_id) ?>" size="20" />
            <br><small>ID группового чата для отправки уведомлений (опционально)</small>
        </td>
    </tr>
    
    <?php $tabControl->Buttons(); ?>
    
    <input type="submit" name="save" value="Сохранить" class="adm-btn-save" />
    <input type="reset" name="reset" value="Отменить" />
    
    <?php $tabControl->End(); ?>
</form>

<script>
// Тестирование подключения к API
function testApiConnection() {
    const apiUrl = document.querySelector('input[name="api_base_url"]').value;
    const apiKey = document.querySelector('input[name="api_key"]').value;
    
    if (!apiUrl || !apiKey) {
        alert('Заполните URL API и ключ');
        return;
    }
    
    fetch(apiUrl + '/dashboard/stats', {
        headers: {
            'Authorization': 'Bearer ' + apiKey
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Подключение к API успешно!');
        } else {
            alert('Ошибка подключения: ' + response.status);
        }
    })
    .catch(error => {
        alert('Ошибка подключения: ' + error.message);
    });
}
</script>

<div style="margin-top: 20px;">
    <h3>Тестирование</h3>
    <button onclick="testApiConnection()" class="adm-btn">Проверить подключение к API</button>
    
    <h3 style="margin-top: 20px;">Справка</h3>
    <ul>
        <li><strong>URL API:</strong> Адрес вашей системы транспортных запросов</li>
        <li><strong>API ключ:</strong> Ключ для авторизации запросов к API</li>
        <li><strong>Webhook secret:</strong> Секретный ключ для безопасной передачи данных</li>
        <li><strong>Рабочая группа:</strong> Группа в Битрикс24 для организации работы</li>
    </ul>
    
    <h3>URL для webhook'ов</h3>
    <code>
        <?= $_SERVER['HTTP_HOST'] ?>/webhook-handler.php
    </code>
    <br><small>Укажите этот URL в настройках webhook'ов системы транспортных запросов</small>
</div>

<?php if ($_GET['saved'] === 'Y'): ?>
<script>
BX.ready(function() {
    BX.admin.notify('Настройки сохранены', BX.admin.notify.TYPE_SUCCESS);
});
</script>
<?php endif; ?>