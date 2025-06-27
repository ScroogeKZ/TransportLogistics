import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  FileText,
  Truck,
  DollarSign
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("all");

  const { data: requests = [] } = useQuery({
    queryKey: ["/api/transportation-requests"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: monthlyStats = [] } = useQuery({
    queryKey: ["/api/dashboard/monthly-stats"],
  });

  // Фильтрация данных по датам и типу отчета
  const filteredRequests = (requests as any[]).filter((request: any) => {
    const requestDate = new Date(request.createdAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    if (fromDate && requestDate < fromDate) return false;
    if (toDate && requestDate > toDate) return false;
    if (reportType !== "all" && request.status !== reportType) return false;

    return true;
  }) || [];

  // Данные для графика затрат по месяцам
  const expenseChartData = {
    labels: (monthlyStats as any[]).map((item: any) => item.month),
    datasets: [
      {
        label: "Затраты (₸)",
        data: (monthlyStats as any[]).map((item: any) => item.amount),
        backgroundColor: "hsla(207, 90%, 54%, 0.8)",
        borderColor: "hsl(207, 90%, 54%)",
        borderWidth: 2,
      },
    ],
  };

  // Данные для графика количества перевозок
  const volumeChartData = {
    labels: (monthlyStats as any[]).map((item: any) => item.month),
    datasets: [
      {
        label: "Количество перевозок",
        data: (monthlyStats as any[]).map((item: any) => item.count),
        borderColor: "hsl(142, 76%, 36%)",
        backgroundColor: "hsla(142, 76%, 36%, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const exportReport = () => {
    const csvContent = [
      ["Номер заявки", "Маршрут", "Тип груза", "Вес", "Стоимость", "Статус", "Дата создания"],
      ...filteredRequests.map((request: any) => [
        request.requestNumber,
        `${request.fromCity} → ${request.toCity}`,
        request.cargoType,
        request.weight,
        request.estimatedCost || 0,
        request.status,
        new Date(request.createdAt).toLocaleDateString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transport_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Отчеты</h1>
          <p className="text-gray-600">Аналитика и отчеты по перевозкам</p>
        </div>
        <Button onClick={exportReport} className="mt-4 lg:mt-0">
          <Download className="w-4 h-4 mr-2" />
          Экспорт отчета
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата с
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата по
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип отчета
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="approved">Одобренные</SelectItem>
                  <SelectItem value="rejected">Отклоненные</SelectItem>
                  <SelectItem value="created">В обработке</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setReportType("all");
                }}
              >
                Очистить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Сводка по фильтрованным данным */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего заявок</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRequests.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Общий вес (тонн)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRequests.reduce((sum: number, req: any) => sum + (req.weight || 0), 0).toFixed(1)}
                </p>
              </div>
              <Truck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Общая стоимость</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₸ {filteredRequests.reduce((sum: number, req: any) => sum + (req.estimatedCost || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Средняя стоимость</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₸ {filteredRequests.length > 0 
                    ? Math.round(filteredRequests.reduce((sum: number, req: any) => sum + (req.estimatedCost || 0), 0) / filteredRequests.length).toLocaleString()
                    : 0
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Затраты по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Bar data={expenseChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Объем перевозок</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Line data={volumeChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Детальная таблица */}
      <Card>
        <CardHeader>
          <CardTitle>Детальный отчет</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер заявки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Маршрут
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип груза
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Вес (тонн)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стоимость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.requestNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.fromCity} → {request.toCity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.cargoType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.weight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.estimatedCost ? `₸ ${request.estimatedCost.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {t(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}