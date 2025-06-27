import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import { Eye, Edit, Check } from "lucide-react";
import RequestModal from "./RequestModal";

export default function RequestsList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/transportation-requests"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "created":
      case "logistics":
        return "bg-yellow-100 text-yellow-800";
      case "manager":
      case "finance":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canEdit = (request: any) => {
    if (user?.role === "генеральный") return true;
    if (user?.role === "прораб") {
      return request.createdById === user.id && request.status === "created";
    }
    if (user?.role === "логист") {
      return ["created", "logistics"].includes(request.status);
    }
    if (user?.role === "руководитель") {
      return ["logistics", "manager"].includes(request.status);
    }
    if (user?.role === "финансовый") {
      return ["manager", "finance"].includes(request.status);
    }
    return false;
  };

  const canApprove = (request: any) => {
    if (user?.role === "генеральный") return true;
    if (user?.role === "логист" && request.status === "created") return true;
    if (user?.role === "руководитель" && request.status === "logistics") return true;
    if (user?.role === "финансовый" && request.status === "manager") return true;
    return false;
  };

  const handleView = (request: any) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("transportation_requests")}</CardTitle>
          <div className="flex space-x-4">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="created">Создана</SelectItem>
                <SelectItem value="logistics">У логиста</SelectItem>
                <SelectItem value="manager">У руководителя</SelectItem>
                <SelectItem value="finance">У финансового директора</SelectItem>
                <SelectItem value="approved">Одобрена</SelectItem>
                <SelectItem value="rejected">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID заявки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Маршрут
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
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests?.map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.requestNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Создатель: {request.createdBy?.firstName || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.fromCity} → {request.toCity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.cargoType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.weight} тонн
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {t(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.estimatedCost
                          ? `₸ ${request.estimatedCost.toLocaleString()}`
                          : "—"}
                      </div>
                      {request.estimatedCost && request.weight && (
                        <div className="text-sm text-gray-500">
                          ₸ {(request.estimatedCost / request.weight).toLocaleString()}/тонна
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit(request) && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canApprove(request) && (
                        <Button variant="ghost" size="sm">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Показано <span className="font-medium">1</span> -{" "}
              <span className="font-medium">{requests?.length || 0}</span> из{" "}
              <span className="font-medium">{requests?.length || 0}</span> результатов
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Предыдущая
              </Button>
              <Button variant="outline" size="sm">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Следующая
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RequestModal
        request={selectedRequest}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
