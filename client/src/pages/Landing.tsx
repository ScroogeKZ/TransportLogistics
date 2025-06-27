import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, BarChart3, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Реестр Перевозок
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Логистическая система для Казахстана
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90"
          >
            Войти в систему
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Truck className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Управление перевозками</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Создавайте и отслеживайте заявки на перевозку грузов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Ролевая система</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                5 ролей с различными уровнями доступа и полномочий
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Аналитика</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Подробные отчеты и статистика по перевозкам
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Globe className="w-12 h-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Мультиязычность</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Поддержка казахского, русского и английского языков
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Workflow процесс одобрения
          </h2>
          <div className="flex items-center justify-center space-x-4 overflow-x-auto">
            <div className="flex items-center flex-col min-w-0">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mb-2">
                1
              </div>
              <p className="text-sm font-medium text-center">Прораб</p>
              <p className="text-xs text-gray-500 text-center">Создает заявку</p>
            </div>
            <div className="w-8 h-px bg-gray-300 hidden md:block"></div>
            <div className="flex items-center flex-col min-w-0">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-2">
                2
              </div>
              <p className="text-sm font-medium text-center">Логист</p>
              <p className="text-xs text-gray-500 text-center">Добавляет цену</p>
            </div>
            <div className="w-8 h-px bg-gray-300 hidden md:block"></div>
            <div className="flex items-center flex-col min-w-0">
              <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center mb-2">
                3
              </div>
              <p className="text-sm font-medium text-center">Руководитель</p>
              <p className="text-xs text-gray-500 text-center">Одобряет заявку</p>
            </div>
            <div className="w-8 h-px bg-gray-300 hidden md:block"></div>
            <div className="flex items-center flex-col min-w-0">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mb-2">
                4
              </div>
              <p className="text-sm font-medium text-center">Финансовый</p>
              <p className="text-xs text-gray-500 text-center">Финальное одобрение</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
