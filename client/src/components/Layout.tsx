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
  Shield,
  Building2,
  Route,
  Calculator,
  MapPin,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      roles: ["прораб", "логист", "руководитель", "финансовый", "генеральный", "супер_админ", "супер_юзер"],
    },
    {
      name: "Перевозчики",
      href: "/carriers",
      icon: Building2,
      current: location === "/carriers",
      roles: ["логист", "руководитель", "финансовый", "генеральный директор", "супер_админ"],
    },
    {
      name: "Маршруты",
      href: "/routes",
      icon: Route,
      current: location === "/routes",
      roles: ["логист", "руководитель", "финансовый", "генеральный директор", "супер_админ"],
    },
    {
      name: "Калькулятор",
      href: "/calculator",
      icon: Calculator,
      current: location === "/calculator",
      roles: ["логист", "руководитель", "финансовый", "генеральный директор", "супер_админ"],
    },
    {
      name: "Отслеживание",
      href: "/tracking",
      icon: MapPin,
      current: location === "/tracking",
      roles: ["логист", "руководитель", "финансовый", "генеральный директор", "супер_админ"],
    },
    {
      name: t("reports"),
      href: "/reports",
      icon: FileText,
      current: location === "/reports",
      roles: ["руководитель", "финансовый", "генеральный директор", "супер_админ"],
    },
    {
      name: t("user_management"),
      href: "/users",
      icon: Users,
      current: location === "/users",
      roles: ["генеральный директор", "супер_админ"],
    },
    {
      name: "БОГ АДМИН",
      href: "/super-admin",
      icon: Shield,
      current: location === "/super-admin",
      roles: ["супер_админ"],
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {t("transport_registry")}
              </h1>
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {t("logistics_system")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* Language Switcher - Hidden on small screens */}
            <Select
              value={language}
              onValueChange={(value: Language) => setLanguage(value)}
            >
              <SelectTrigger className="w-24 sm:w-40 text-xs sm:text-sm">
                <SelectValue>
                  <span className="hidden sm:inline">{languageFlags[language]} {languageNames[language]}</span>
                  <span className="sm:hidden">{languageFlags[language]}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                <SelectItem value="kz">🇰🇿 Қазақша</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
              </SelectContent>
            </Select>

            {/* User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right hidden sm:block">
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

            {/* Logout - Icon only on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="p-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex pt-16 sm:pt-20">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white shadow-sm min-h-screen border-r border-gray-200 fixed left-0 top-16 sm:top-20">
          <nav className="p-4 lg:p-6">
            <div className="space-y-1 lg:space-y-2">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors cursor-pointer ${
                        item.current
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                      <span className="text-sm lg:text-base truncate">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Быстрые действия
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Download className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="truncate">{t("export_data")}</span>
              </Button>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
        )}
        
        {/* Mobile Sidebar */}
        <aside className={`md:hidden fixed top-16 left-0 w-80 max-w-[85vw] bg-white shadow-lg min-h-screen border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <nav className="p-4">
            {/* User Info on Mobile */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-lg font-medium">
                  {((user as any)?.firstName?.[0] || (user as any)?.email?.[0] || "П").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {(user as any)?.firstName || (user as any)?.email || "Пользователь"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t((user as any)?.role)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
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
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base">{item.name}</span>
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
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Download className="w-4 h-4 mr-3" />
                {t("export_data")}
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
