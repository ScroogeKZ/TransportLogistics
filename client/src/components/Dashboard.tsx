import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { Truck, DollarSign, Clock, Calculator } from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const { t } = useLanguage();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery({
    queryKey: ["/api/dashboard/monthly-stats"],
  });

  const { data: statusStats, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/dashboard/status-stats"],
  });

  const { data: recentRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/transportation-requests"],
  });

  if (statsLoading || monthlyLoading || statusLoading || requestsLoading) {
    return <div>Loading...</div>;
  }

  const lineChartData = {
    labels: monthlyStats?.map((item: any) => item.month) || [],
    datasets: [
      {
        label: t("total_transportations"),
        data: monthlyStats?.map((item: any) => item.count) || [],
        borderColor: "hsl(207, 90%, 54%)",
        backgroundColor: "hsla(207, 90%, 54%, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutChartData = {
    labels: statusStats?.map((item: any) => item.status) || [],
    datasets: [
      {
        data: statusStats?.map((item: any) => item.count) || [],
        backgroundColor: [
          "hsl(142, 76%, 36%)", // Green for approved
          "hsl(207, 90%, 54%)", // Blue for in progress
          "hsl(32, 95%, 44%)", // Orange for waiting
          "hsl(0, 84%, 60%)", // Red for rejected
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("total_transportations")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalTransportations || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <Truck className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-green-600">+12%</span>
              <span className="text-sm text-gray-600 ml-2">с прошлого месяца</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("total_expenses")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₸ {stats?.totalExpenses?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-green-600">+8%</span>
              <span className="text-sm text-gray-600 ml-2">с прошлого месяца</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("active_requests")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeRequests || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="text-orange-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-orange-600">3 ожидают</span>
              <span className="text-sm text-gray-600 ml-2">одобрения</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("average_cost")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₸ {stats?.averageCost?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calculator className="text-gray-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-red-600">-5%</span>
              <span className="text-sm text-gray-600 ml-2">с прошлого месяца</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("transportations_by_month")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("request_status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recent_requests")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Направление
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Груз
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стоимость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests?.slice(0, 5).map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.requestNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.fromCity} → {request.toCity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.cargoType}, {request.weight} тонн
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₸ {request.estimatedCost?.toLocaleString() || "—"}
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
