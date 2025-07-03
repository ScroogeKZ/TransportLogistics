import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Truck,
  Plus,
  FileText,
  Users,
  Download,
  LogOut,
  Building2,
  Route,
  Calculator,
  MapPin,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();

  if (!user) return null;

  const navigation = [
    {
      name: t("dashboard"),
      href: "/",
      icon: BarChart3,
      current: location === "/",
    },
    {
      name: t("transportation_requests"),
      href: "/requests",
      icon: Truck,
      current: location === "/requests",
    },
    {
      name: t("create_request"),
      href: "/create",
      icon: Plus,
      current: location === "/create",
      roles: ["прораб", "логист", "руководитель", "финансовый", "генеральный"],
    },
    {
      name: "Перевозчики",
      href: "/carriers",
      icon: Building2,
      current: location === "/carriers",
      roles: ["логист", "руководитель", "финансовый", "генеральный"],
    },
    {
      name: "Маршруты",
      href: "/routes",
      icon: Route,
      current: location === "/routes",
      roles: ["логист", "руководитель", "финансовый", "генеральный"],
    },
    {
      name: "Калькулятор",
      href: "/calculator",
      icon: Calculator,
      current: location === "/calculator",
      roles: ["логист", "руководитель", "финансовый", "генеральный"],
    },
    {
      name: "Отслеживание",
      href: "/tracking",
      icon: MapPin,
      current: location === "/tracking",
      roles: ["логист", "руководитель", "финансовый", "генеральный"],
    },
    {
      name: t("reports"),
      href: "/reports",
      icon: FileText,
      current: location === "/reports",
      roles: ["руководитель", "финансовый", "генеральный"],
    },
    {
      name: t("user_management"),
      href: "/users",
      icon: Users,
      current: location === "/users",
      roles: ["генеральный"],
    },
    {
      name: "Супер Юзер",
      href: "/super-admin",
      icon: Users,
      current: location === "/super-admin",
      roles: ["супер_юзер"],
    },
  ];

  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes((user as any)?.role)
  );

  const languageFlags: Record<Language, string> = {
    ru: "🇷🇺",
    kz: "🇰🇿",
    en: "🇺🇸",
  };

  const languageNames: Record<Language, string> = {
    ru: "Русский",
    kz: "Қазақша",
    en: "English",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("transport_registry")}
            </h1>
            <span className="text-sm text-gray-500">
              {t("logistics_system")}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Language Switcher */}
            <Select
              value={language}
              onValueChange={(value: Language) => setLanguage(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {languageFlags[language]} {languageNames[language]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                <SelectItem value="kz">🇰🇿 Қазақша</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
              </SelectContent>
            </Select>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {(user as any)?.firstName || (user as any)?.email || "Пользователь"}
                </p>
                <p className="text-xs text-gray-500">
                  {t((user as any)?.role)}
                </p>
              </div>
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                {((user as any)?.firstName?.[0] || (user as any)?.email?.[0] || "П").toUpperCase()}
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200 fixed left-0">
          <nav className="p-6">
            <div className="space-y-2">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                        item.current
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Быстрые действия
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-3" />
                {t("export_data")}
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6">{children}</main>
      </div>
    </div>
  );
}
