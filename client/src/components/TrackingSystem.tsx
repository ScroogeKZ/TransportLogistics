import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Truck, 
  Clock, 
  Route, 
  AlertTriangle, 
  CheckCircle, 
  Navigation,
  Phone,
  MessageSquare,
  Fuel,
  Gauge
} from "lucide-react";

interface TrackingPoint {
  id: string;
  timestamp: string;
  location: string;
  status: string;
  coordinates: { lat: number; lng: number };
  speed: number;
  fuelLevel: number;
  notes?: string;
}

interface ActiveShipment {
  id: string;
  requestNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  route: string;
  status: "in_transit" | "loading" | "unloading" | "delayed" | "completed";
  currentLocation: string;
  progress: number;
  estimatedArrival: string;
  lastUpdate: string;
  trackingPoints: TrackingPoint[];
}

const mockShipments: ActiveShipment[] = [
  {
    id: "1",
    requestNumber: "TR-2025-001",
    driverName: "Иванов Сергей",
    driverPhone: "+7 (777) 123-45-67",
    vehicleNumber: "123 ABC 02",
    route: "Алматы → Астана",
    status: "in_transit",
    currentLocation: "Караганда",
    progress: 65,
    estimatedArrival: "2025-01-03 14:00",
    lastUpdate: "2025-01-03 10:30",
    trackingPoints: [
      {
        id: "1",
        timestamp: "2025-01-03 06:00",
        location: "Алматы - Склад отправления",
        status: "loading",
        coordinates: { lat: 43.2220, lng: 76.8512 },
        speed: 0,
        fuelLevel: 95,
        notes: "Погрузка завершена"
      },
      {
        id: "2",
        timestamp: "2025-01-03 08:30",
        location: "Балхаш",
        status: "in_transit",
        coordinates: { lat: 46.8500, lng: 74.9833 },
        speed: 85,
        fuelLevel: 80,
      },
      {
        id: "3",
        timestamp: "2025-01-03 10:30",
        location: "Караганда",
        status: "in_transit",
        coordinates: { lat: 49.8069, lng: 73.0819 },
        speed: 0,
        fuelLevel: 65,
        notes: "Остановка для отдыха"
      },
    ],
  },
  {
    id: "2",
    requestNumber: "TR-2025-002",
    driverName: "Петров Александр",
    driverPhone: "+7 (777) 234-56-78",
    vehicleNumber: "456 DEF 02",
    route: "Шымкент → Алматы",
    status: "delayed",
    currentLocation: "Тараз",
    progress: 45,
    estimatedArrival: "2025-01-03 18:00",
    lastUpdate: "2025-01-03 09:15",
    trackingPoints: [
      {
        id: "1",
        timestamp: "2025-01-03 05:00",
        location: "Шымкент - Склад отправления",
        status: "loading",
        coordinates: { lat: 42.3000, lng: 69.5999 },
        speed: 0,
        fuelLevel: 100,
      },
      {
        id: "2",
        timestamp: "2025-01-03 09:15",
        location: "Тараз",
        status: "delayed",
        coordinates: { lat: 42.9000, lng: 71.3667 },
        speed: 0,
        fuelLevel: 75,
        notes: "Техническая неисправность"
      },
    ],
  },
];

export default function TrackingSystem() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<ActiveShipment | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "loading":
      case "unloading":
        return "bg-yellow-100 text-yellow-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "in_transit":
        return <Truck className="w-3 h-3" />;
      case "loading":
      case "unloading":
        return <Clock className="w-3 h-3" />;
      case "delayed":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <MapPin className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Доставлено";
      case "in_transit":
        return "В пути";
      case "loading":
        return "Погрузка";
      case "unloading":
        return "Разгрузка";
      case "delayed":
        return "Задержка";
      default:
        return "Неизвестно";
    }
  };

  const filteredShipments = mockShipments.filter(shipment =>
    shipment.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Система отслеживания</h1>
          <p className="text-gray-600 mt-1">
            Мониторинг активных перевозок в реальном времени
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            Карта
          </Button>
          <Button>
            <Navigation className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Активные ({mockShipments.length})</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="map">Карта</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Поиск по номеру заявки, водителю или номеру авто..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid gap-4">
            {filteredShipments.map((shipment) => (
              <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shipment.requestNumber}
                        </h3>
                        <Badge className={getStatusColor(shipment.status)}>
                          {getStatusIcon(shipment.status)}
                          <span className="ml-1">{getStatusText(shipment.status)}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Водитель:</span>
                          <p className="font-medium">{shipment.driverName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Транспорт:</span>
                          <p className="font-medium">{shipment.vehicleNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Маршрут:</span>
                          <p className="font-medium">{shipment.route}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Текущее местоположение:</span>
                          <p className="font-medium">{shipment.currentLocation}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Прогресс доставки</span>
                          <span className="text-sm font-medium">{shipment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${shipment.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Прибытие: {shipment.estimatedArrival}
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          Обновлено: {shipment.lastUpdate}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => setSelectedShipment(shipment)}>
                        Детали
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p>Завершенные перевозки</p>
                <p className="text-sm">Здесь будут отображаться завершенные перевозки</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Интерактивная карта отслеживания</p>
                  <p className="text-sm">Здесь будет отображаться карта с активными перевозками</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Детальная информация о перевозке */}
      {selectedShipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              История перемещения - {selectedShipment.requestNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedShipment.trackingPoints.map((point, index) => (
                <div key={point.id} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                    <span className="text-xs font-medium text-blue-600">
                      {selectedShipment.trackingPoints.length - index}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{point.location}</span>
                      <Badge variant="outline" className={getStatusColor(point.status)}>
                        {getStatusIcon(point.status)}
                        <span className="ml-1">{getStatusText(point.status)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{point.timestamp}</span>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {point.speed} км/ч
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        {point.fuelLevel}%
                      </div>
                    </div>
                    {point.notes && (
                      <p className="text-sm text-gray-600 mt-1">{point.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}