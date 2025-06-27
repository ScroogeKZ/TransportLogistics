import { useState, useEffect } from "react";

export type Language = "ru" | "kz" | "en";

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Header
    "transport_registry": "Реестр Перевозок",
    "logistics_system": "Логистическая Система",
    "user_role": "Роль пользователя",
    
    // Navigation
    "dashboard": "Дашборд",
    "transportation_requests": "Заявки на перевозку",
    "create_request": "Создать заявку",
    "reports": "Отчеты",
    "user_management": "Управление пользователями",
    "export_data": "Экспорт данных",
    
    // Dashboard
    "total_transportations": "Всего перевозок",
    "total_expenses": "Общие расходы",
    "active_requests": "Активные заявки",
    "average_cost": "Средняя стоимость",
    "transportations_by_month": "Перевозки по месяцам",
    "request_status": "Статус заявок",
    "recent_requests": "Последние заявки",
    
    // Roles
    "прораб": "Прораб",
    "логист": "Логист",
    "руководитель": "Руководитель СМТ",
    "финансовый": "Финансовый директор",
    "генеральный": "Генеральный директор",
    
    // Request Form
    "create_transportation_request": "Создать заявку на перевозку",
    "departure_point": "Пункт отправления",
    "destination_point": "Пункт назначения",
    "cargo_type": "Тип груза",
    "cargo_weight": "Вес груза (тонн)",
    "cargo_description": "Описание груза",
    "estimated_cost": "Предполагаемая стоимость (₸)",
    "transport_type": "Тип транспорта",
    "urgency": "Срочность",
    "carrier": "Перевозчик",
    "cancel": "Отмена",
    "create": "Создать заявку",
    
    // Statuses
    "created": "Создана",
    "logistics": "У логиста",
    "manager": "У руководителя",
    "finance": "У финансового директора",
    "approved": "Одобрена",
    "rejected": "Отклонена",
    "completed": "Завершена",
    
    // Actions
    "view": "Просмотр",
    "edit": "Редактировать",
    "approve": "Одобрить",
    "reject": "Отклонить",
    "close": "Закрыть",
  },
  kz: {
    // Header
    "transport_registry": "Тасымал Тізілімі",
    "logistics_system": "Логистикалық Жүйе",
    "user_role": "Пайдаланушы рөлі",
    
    // Navigation
    "dashboard": "Басқару панелі",
    "transportation_requests": "Тасымал өтініштері",
    "create_request": "Өтініш жасау",
    "reports": "Есептер",
    "user_management": "Пайдаланушыларды басқару",
    "export_data": "Деректерді экспорттау",
    
    // Dashboard
    "total_transportations": "Барлық тасымалдар",
    "total_expenses": "Жалпы шығындар",
    "active_requests": "Белсенді өтініштер",
    "average_cost": "Орташа құн",
    "transportations_by_month": "Айлық тасымалдар",
    "request_status": "Өтініш мәртебесі",
    "recent_requests": "Соңғы өтініштер",
    
    // Roles
    "прораб": "Прораб",
    "логист": "Логист",
    "руководитель": "СМТ басшысы",
    "финансовый": "Қаржы директоры",
    "генеральный": "Бас директор",
    
    // Request Form
    "create_transportation_request": "Тасымал өтінішін жасау",
    "departure_point": "Жөнелту нүктесі",
    "destination_point": "Тағайындау нүктесі",
    "cargo_type": "Жүк түрі",
    "cargo_weight": "Жүк салмағы (тонна)",
    "cargo_description": "Жүк сипаттамасы",
    "estimated_cost": "Болжамды құн (₸)",
    "transport_type": "Көлік түрі",
    "urgency": "Жеделдік",
    "carrier": "Тасымалдаушы",
    "cancel": "Болдырмау",
    "create": "Өтініш жасау",
    
    // Statuses
    "created": "Жасалған",
    "logistics": "Логистте",
    "manager": "Басшыда",
    "finance": "Қаржы директорында",
    "approved": "Мақұлданған",
    "rejected": "Қабылданбаған",
    "completed": "Аяқталған",
    
    // Actions
    "view": "Қарау",
    "edit": "Өңдеу",
    "approve": "Мақұлдау",
    "reject": "Қабылдамау",
    "close": "Жабу",
  },
  en: {
    // Header
    "transport_registry": "Transportation Registry",
    "logistics_system": "Logistics System",
    "user_role": "User Role",
    
    // Navigation
    "dashboard": "Dashboard",
    "transportation_requests": "Transportation Requests",
    "create_request": "Create Request",
    "reports": "Reports",
    "user_management": "User Management",
    "export_data": "Export Data",
    
    // Dashboard
    "total_transportations": "Total Transportations",
    "total_expenses": "Total Expenses",
    "active_requests": "Active Requests",
    "average_cost": "Average Cost",
    "transportations_by_month": "Transportations by Month",
    "request_status": "Request Status",
    "recent_requests": "Recent Requests",
    
    // Roles
    "прораб": "Foreman",
    "логист": "Logistician",
    "руководитель": "SMT Manager",
    "финансовый": "Financial Director",
    "генеральный": "General Director",
    
    // Request Form
    "create_transportation_request": "Create Transportation Request",
    "departure_point": "Departure Point",
    "destination_point": "Destination Point",
    "cargo_type": "Cargo Type",
    "cargo_weight": "Cargo Weight (tons)",
    "cargo_description": "Cargo Description",
    "estimated_cost": "Estimated Cost (₸)",
    "transport_type": "Transport Type",
    "urgency": "Urgency",
    "carrier": "Carrier",
    "cancel": "Cancel",
    "create": "Create Request",
    
    // Statuses
    "created": "Created",
    "logistics": "With Logistician",
    "manager": "With Manager",
    "finance": "With Financial Director",
    "approved": "Approved",
    "rejected": "Rejected",
    "completed": "Completed",
    
    // Actions
    "view": "View",
    "edit": "Edit",
    "approve": "Approve",
    "reject": "Reject",
    "close": "Close",
  },
};

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "ru";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return {
    language,
    setLanguage,
    t,
  };
}
