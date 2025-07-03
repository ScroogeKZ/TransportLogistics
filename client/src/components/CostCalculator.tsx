import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Fuel, Clock, Route, DollarSign, TrendingUp } from "lucide-react";

interface CostCalculation {
  distance: number;
  fuelCost: number;
  driverCost: number;
  tollCost: number;
  insuranceCost: number;
  maintenanceCost: number;
  otherCosts: number;
  totalCost: number;
  pricePerKm: number;
  margin: number;
  finalPrice: number;
}

export default function CostCalculator() {
  const { t } = useLanguage();
  const [distance, setDistance] = useState<number>(0);
  const [transportType, setTransportType] = useState<string>("");
  const [cargoWeight, setCargoWeight] = useState<number>(0);
  const [fuelPrice, setFuelPrice] = useState<number>(280);
  const [driverRate, setDriverRate] = useState<number>(8000);
  const [margin, setMargin] = useState<number>(20);
  const [calculation, setCalculation] = useState<CostCalculation | null>(null);

  const transportTypes = [
    { value: "truck", label: "Грузовик", consumption: 25, capacity: 5000 },
    { value: "trailer", label: "Полуприцеп", consumption: 35, capacity: 20000 },
    { value: "van", label: "Фургон", consumption: 12, capacity: 1500 },
    { value: "special", label: "Спецтехника", consumption: 40, capacity: 10000 },
  ];

  const calculateCost = () => {
    if (!distance || !transportType) return;

    const transport = transportTypes.find(t => t.value === transportType);
    if (!transport) return;

    // Базовые расчеты
    const fuelConsumption = (distance / 100) * transport.consumption;
    const fuelCost = fuelConsumption * fuelPrice;
    const driverCost = Math.ceil(distance / 500) * driverRate;
    const tollCost = distance * 15; // примерно 15 тенге за км
    const insuranceCost = distance * 5; // страховка
    const maintenanceCost = distance * 8; // техобслуживание
    const otherCosts = distance * 3; // прочие расходы

    const totalCost = fuelCost + driverCost + tollCost + insuranceCost + maintenanceCost + otherCosts;
    const pricePerKm = totalCost / distance;
    const finalPrice = totalCost * (1 + margin / 100);

    setCalculation({
      distance,
      fuelCost,
      driverCost,
      tollCost,
      insuranceCost,
      maintenanceCost,
      otherCosts,
      totalCost,
      pricePerKm,
      margin,
      finalPrice,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Калькулятор стоимости</h1>
          <p className="text-gray-600 mt-1">
            Расчет стоимости транспортировки и логистических услуг
          </p>
        </div>
      </div>

      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="simple">Быстрый расчет</TabsTrigger>
          <TabsTrigger value="detailed">Детальный расчет</TabsTrigger>
          <TabsTrigger value="compare">Сравнение</TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Форма расчета */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Параметры расчета
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="distance">Расстояние (км)</Label>
                    <Input
                      id="distance"
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(Number(e.target.value))}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Вес груза (кг)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(Number(e.target.value))}
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="transport">Тип транспорта</Label>
                  <Select value={transportType} onValueChange={setTransportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип транспорта" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} (до {type.capacity} кг)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuel">Цена топлива (₸/л)</Label>
                    <Input
                      id="fuel"
                      type="number"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin">Наценка (%)</Label>
                    <Input
                      id="margin"
                      type="number"
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                    />
                  </div>
                </div>

                <Button onClick={calculateCost} className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  Рассчитать стоимость
                </Button>
              </CardContent>
            </Card>

            {/* Результаты расчета */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Результат расчета
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calculation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Топливо:</span>
                        <span className="font-medium">{formatCurrency(calculation.fuelCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Водитель:</span>
                        <span className="font-medium">{formatCurrency(calculation.driverCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Платные дороги:</span>
                        <span className="font-medium">{formatCurrency(calculation.tollCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Страхование:</span>
                        <span className="font-medium">{formatCurrency(calculation.insuranceCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Обслуживание:</span>
                        <span className="font-medium">{formatCurrency(calculation.maintenanceCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Прочие расходы:</span>
                        <span className="font-medium">{formatCurrency(calculation.otherCosts)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Себестоимость:</span>
                        <span>{formatCurrency(calculation.totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>За километр:</span>
                        <span>{formatCurrency(calculation.pricePerKm)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold text-green-600">
                        <span>Итого к оплате:</span>
                        <span>{formatCurrency(calculation.finalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Наценка {calculation.margin}%:</span>
                        <span>{formatCurrency(calculation.finalPrice - calculation.totalCost)}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">Рентабельность</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Прибыль составляет {((calculation.finalPrice - calculation.totalCost) / calculation.totalCost * 100).toFixed(1)}% от себестоимости
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-2" />
                    <p>Введите параметры для расчета стоимости</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Детальный расчет</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-2" />
                <p>Функция детального расчета в разработке</p>
                <p className="text-sm">Здесь будет более подробный расчет с учетом всех факторов</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Сравнение вариантов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-2" />
                <p>Функция сравнения в разработке</p>
                <p className="text-sm">Здесь можно будет сравнить различные варианты перевозки</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}