import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Route, MapPin, Navigation, Clock, Fuel, Calculator, CheckCircle } from "lucide-react";

interface RoutePoint {
  id: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  type: "pickup" | "delivery" | "warehouse";
  timeWindow?: string;
  priority: number;
}

interface OptimizedRoute {
  id: string;
  name: string;
  points: RoutePoint[];
  totalDistance: number;
  estimatedTime: number;
  fuelCost: number;
  efficiency: number;
}



export default function RouteOptimization() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [optimizationCriteria, setOptimizationCriteria] = useState("distance");

  const { data: routesData = [], isLoading } = useQuery({
    queryKey: ["/api/routes"],
  });

  const createRouteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/routes", "POST", data),
    onSuccess: () => {
      toast({
        title: "Маршрут создан",
        description: "Новый маршрут успешно добавлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать маршрут",
        variant: "destructive",
      });
    },
  });

  const handleOptimizeRoute = (routeId: number) => {
    // Имитация оптимизации маршрута
    toast({
      title: "Маршрут оптимизирован",
      description: "Маршрут был успешно оптимизирован по выбранным критериям",
    });
  };

  const handleCreateRoute = () => {
    const newRoute = {
      name: "Новый маршрут",
      fromCity: "Алматы",
      toCity: "Астана",
      distance: 1248,
      estimatedTime: 18,
      tollCost: 18720,
      fuelCost: 87500,
    };
    createRouteMutation.mutate(newRoute);
  };

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case "warehouse":
        return "bg-blue-100 text-blue-800";
      case "delivery":
        return "bg-green-100 text-green-800";
      case "pickup":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case "warehouse":
        return <MapPin className="w-3 h-3" />;
      case "delivery":
        return <CheckCircle className="w-3 h-3" />;
      case "pickup":
        return <Navigation className="w-3 h-3" />;
      default:
        return <MapPin className="w-3 h-3" />;
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Оптимизация маршрутов</h1>
          <p className="text-gray-600 mt-1">
            Планирование и оптимизация логистических маршрутов
          </p>
        </div>
        <Button onClick={handleCreateRoute}>
          <Route className="w-4 h-4 mr-2" />
          Создать маршрут
        </Button>
      </div>

      {/* Панель управления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Параметры оптимизации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Критерий оптимизации
              </label>
              <Select value={optimizationCriteria} onValueChange={setOptimizationCriteria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Минимальное расстояние</SelectItem>
                  <SelectItem value="time">Минимальное время</SelectItem>
                  <SelectItem value="fuel">Минимальный расход топлива</SelectItem>
                  <SelectItem value="cost">Минимальная стоимость</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип транспорта
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Грузовик</SelectItem>
                  <SelectItem value="trailer">Полуприцеп</SelectItem>
                  <SelectItem value="van">Фургон</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Максимальная загрузка (кг)
              </label>
              <Input type="number" placeholder="5000" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Navigation className="w-4 h-4 mr-2" />
                Оптимизировать
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список маршрутов */}
      {isLoading ? (
        <div>Загрузка маршрутов...</div>
      ) : (
        <div className="grid gap-4">
          {(routesData as any[]).map((route: any) => (
          <Card key={route.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {route.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Route className="w-4 h-4" />
                      {route.totalDistance} км
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {route.estimatedTime} ч
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-4 h-4" />
                      {route.fuelCost.toLocaleString()} ₸
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${getEfficiencyColor(route.efficiency)}`}>
                        Эффективность: {route.efficiency}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Редактировать
                  </Button>
                  <Button size="sm">
                    Запустить
                  </Button>
                </div>
              </div>

              {/* Точки маршрута */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-2">Точки маршрута:</h4>
                <div className="flex flex-wrap gap-2">
                  {route.points.map((point, index) => (
                    <div
                      key={point.id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-medium">
                        {index + 1}
                      </span>
                      <Badge variant="outline" className={getRouteTypeColor(point.type)}>
                        {getRouteTypeIcon(point.type)}
                        <span className="ml-1">
                          {point.type === "warehouse" && "Склад"}
                          {point.type === "delivery" && "Доставка"}
                          {point.type === "pickup" && "Забор"}
                        </span>
                      </Badge>
                      <span className="font-medium">{point.city}</span>
                      <span className="text-gray-600">{point.address}</span>
                      {point.timeWindow && (
                        <Badge variant="secondary" className="text-xs">
                          {point.timeWindow}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Карта маршрута */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Карта маршрута
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p>Интерактивная карта маршрута</p>
              <p className="text-sm">Здесь будет отображаться карта с построенным маршрутом</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}