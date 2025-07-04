import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Edit, Check, X, Package, Truck, Calendar, MapPin, Weight, Ruler } from "lucide-react";
import RequestModal from "./RequestModal";
import { cities, cargoTypes, transportTypes, urgencyLevels, carriers } from "@/lib/i18n";

export default function RequestsList() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/transportation-requests"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/transportation-requests/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Заявка успешно обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transportation-requests"] });
      setEditDialogOpen(false);
      setEditingRequest(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заявку",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка заявок...</div>;
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

  const filteredRequests = (requests as any[]).filter((request: any) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  const handleView = (request: any) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleEdit = (request: any) => {
    setEditingRequest({ ...request });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingRequest) {
      updateRequestMutation.mutate({
        id: editingRequest.id,
        data: {
          fromCity: editingRequest.fromCity,
          fromAddress: editingRequest.fromAddress,
          toCity: editingRequest.toCity,
          toAddress: editingRequest.toAddress,
          cargoType: editingRequest.cargoType,
          weight: editingRequest.weight,
          width: editingRequest.width,
          length: editingRequest.length,
          height: editingRequest.height,
          description: editingRequest.description,
          estimatedCost: editingRequest.estimatedCost,
          transportType: editingRequest.transportType,
          urgency: editingRequest.urgency,
          carrier: editingRequest.carrier,
        }
      });
    }
  };

  const handleApprove = (request: any) => {
    let nextStatus = "";
    if (request.status === "created") nextStatus = "logistics";
    else if (request.status === "logistics") nextStatus = "manager";
    else if (request.status === "manager") nextStatus = "finance";
    else if (request.status === "finance") nextStatus = "approved";

    updateRequestMutation.mutate({
      id: request.id,
      data: { status: nextStatus }
    });
  };

  const handleReject = (request: any) => {
    updateRequestMutation.mutate({
      id: request.id,
      data: { status: "rejected" }
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      created: "Создана",
      logistics: "У логиста",
      manager: "У руководителя", 
      finance: "У фин. директора",
      approved: "Одобрена",
      rejected: "Отклонена"
    };
    return statusMap[status] || status;
  };

  const getCityLabel = (cityValue: string) => {
    const city = cities.find(c => c.value === cityValue);
    return city ? city.label[language] : cityValue;
  };

  const getCargoTypeLabel = (cargoValue: string) => {
    const cargo = cargoTypes.find(c => c.value === cargoValue);
    return cargo ? cargo.label[language] : cargoValue;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Заявки на перевозку</h1>
            <p className="text-gray-600 mt-1">
              Всего заявок: {filteredRequests.length} из {(requests as any[]).length}
            </p>
          </div>
          <div className="flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="created">Создана</SelectItem>
                <SelectItem value="logistics">У логиста</SelectItem>
                <SelectItem value="manager">У руководителя</SelectItem>
                <SelectItem value="finance">У фин. директора</SelectItem>
                <SelectItem value="approved">Одобрена</SelectItem>
                <SelectItem value="rejected">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Заявки в виде карточек */}
        <div className="grid gap-6">
          {filteredRequests.map((request: any) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Основная информация */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.requestNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Создано: {new Date(request.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <Badge 
                        variant={request.status === "approved" ? "default" : 
                                request.status === "rejected" ? "destructive" : "secondary"}
                        className="ml-4"
                      >
                        {getStatusText(request.status)}
                      </Badge>
                    </div>

                    {/* Маршрут */}
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{getCityLabel(request.fromCity)}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-medium">{getCityLabel(request.toCity)}</span>
                    </div>

                    {/* Груз */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <div className="text-sm">
                          <p className="font-medium">{getCargoTypeLabel(request.cargoType)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Weight className="h-4 w-4 text-gray-500" />
                        <div className="text-sm">
                          <p className="font-medium">{request.weight} кг</p>
                        </div>
                      </div>

                      {(request.width || request.length || request.height) && (
                        <div className="flex items-center space-x-2">
                          <Ruler className="h-4 w-4 text-gray-500" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {request.width || "—"} × {request.length || "—"} × {request.height || "—"} м
                            </p>
                          </div>
                        </div>
                      )}

                      {request.estimatedCost && (
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">
                            <p className="font-medium text-green-600">
                              ₸ {Number(request.estimatedCost).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Транспорт и срочность */}
                    {(request.transportType || request.urgency) && (
                      <div className="flex items-center space-x-4 text-sm">
                        {request.transportType && (
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span>{request.transportType}</span>
                          </div>
                        )}
                        {request.urgency && request.urgency !== "normal" && (
                          <Badge variant="outline" className="text-xs">
                            {request.urgency === "urgent" ? "Срочно" : request.urgency === "express" ? "Экспресс" : request.urgency}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex flex-row lg:flex-col gap-2 lg:w-auto w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(request)}
                      className="flex-1 lg:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Просмотр
                    </Button>
                    
                    {canEdit(request) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(request)}
                        className="flex-1 lg:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Изменить
                      </Button>
                    )}
                    
                    {canApprove(request) && (
                      <div className="flex gap-2 flex-1 lg:flex-none">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="flex-1 lg:flex-none"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Одобрить
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(request)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Заявки не найдены</h3>
                <p className="text-gray-600">
                  {statusFilter === "all" 
                    ? "Пока нет заявок на перевозку" 
                    : `Нет заявок со статусом "${getStatusText(statusFilter)}"`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать заявку {editingRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          
          {editingRequest && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Город отправления</label>
                  <Select 
                    value={editingRequest.fromCity} 
                    onValueChange={(value) => setEditingRequest({...editingRequest, fromCity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Адрес отправления</label>
                  <Input
                    value={editingRequest.fromAddress || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, fromAddress: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Город назначения</label>
                  <Select 
                    value={editingRequest.toCity} 
                    onValueChange={(value) => setEditingRequest({...editingRequest, toCity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Адрес назначения</label>
                  <Input
                    value={editingRequest.toAddress || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, toAddress: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Тип груза</label>
                  <Select 
                    value={editingRequest.cargoType} 
                    onValueChange={(value) => setEditingRequest({...editingRequest, cargoType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cargoTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Вес (кг)</label>
                  <Input
                    type="number"
                    value={editingRequest.weight || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, weight: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Ширина (м)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingRequest.width || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, width: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Длина (м)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingRequest.length || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, length: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Высота (м)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingRequest.height || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, height: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Стоимость (₸)</label>
                  <Input
                    type="number"
                    value={editingRequest.estimatedCost || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, estimatedCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateRequestMutation.isPending}>
                  {updateRequestMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RequestModal 
        request={selectedRequest} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}