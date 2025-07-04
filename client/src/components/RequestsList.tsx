import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Eye, Edit, Check, X, Package, Truck, Calendar, MapPin, Weight, Ruler, Star } from "lucide-react";
import RequestModal from "./RequestModal";
import { cities, cargoTypes } from "@/lib/i18n";

export default function RequestsList() {
  const { user } = useAuth();
  const { language } = useLanguage();
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
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заявку",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

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

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "approved":
        return "from-emerald-500 to-green-600";
      case "rejected":
        return "from-red-500 to-rose-600";
      case "created":
        return "from-amber-500 to-orange-600";
      case "logistics":
        return "from-blue-500 to-indigo-600";
      case "manager":
        return "from-purple-500 to-violet-600";
      case "finance":
        return "from-teal-500 to-cyan-600";
      default:
        return "from-gray-500 to-slate-600";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Современный заголовок с градиентом */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    Заявки на перевозку
                  </h1>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <p className="text-white/90 text-sm font-medium">
                        Всего заявок: {filteredRequests.length} из {(requests as any[]).length}
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <p className="text-white/90 text-sm font-medium">
                        Роль: {user?.role}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-52 bg-white/20 backdrop-blur-sm border-white/30 text-white">
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
            </div>
            {/* Декоративные элементы */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Современные карточки заявок */}
          <div className="grid gap-8">
            {filteredRequests.map((request: any) => (
              <Card key={request.id} className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusGradient(request.status)}`}></div>
                
                <CardContent className="relative p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Основная информация */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {request.requestNumber}
                            </h3>
                            {request.urgency === "urgent" && (
                              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>Создано: {new Date(request.createdAt).toLocaleDateString("ru-RU")}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={request.status === "approved" ? "default" : 
                                  request.status === "rejected" ? "destructive" : "secondary"}
                          className="px-4 py-2 text-sm font-medium rounded-full shadow-md"
                        >
                          {getStatusText(request.status)}
                        </Badge>
                      </div>

                      {/* Маршрут с градиентом */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-gray-900">{getCityLabel(request.fromCity)}</span>
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                            <span className="font-semibold text-gray-900">{getCityLabel(request.toCity)}</span>
                          </div>
                        </div>
                        {(request.fromAddress || request.toAddress) && (
                          <div className="mt-2 text-sm text-gray-600 ml-8">
                            {request.fromAddress && <p>Откуда: {request.fromAddress}</p>}
                            {request.toAddress && <p>Куда: {request.toAddress}</p>}
                          </div>
                        )}
                      </div>

                      {/* Информация о грузе */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                          <div className="flex items-center space-x-2 mb-2">
                            <Package className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Тип груза</span>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">{getCargoTypeLabel(request.cargoType)}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center space-x-2 mb-2">
                            <Weight className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Вес</span>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">{request.weight} кг</p>
                        </div>

                        {(request.width || request.length || request.height) && (
                          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <Ruler className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Габариты</span>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {request.width || "—"} × {request.length || "—"} × {request.height || "—"} м
                            </p>
                          </div>
                        )}

                        {request.estimatedCost && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Стоимость</span>
                            </div>
                            <p className="font-bold text-amber-700 text-sm">
                              ₸ {Number(request.estimatedCost).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Дополнительная информация */}
                      {(request.transportType || request.urgency !== "normal") && (
                        <div className="flex items-center space-x-4 text-sm">
                          {request.transportType && (
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                              <Truck className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-700">{request.transportType}</span>
                            </div>
                          )}
                          {request.urgency !== "normal" && (
                            <Badge variant="outline" className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                              {request.urgency === "urgent" ? "Срочно" : "Экспресс"}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Действия */}
                    <div className="flex flex-row lg:flex-col gap-3 lg:w-auto w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(request)}
                        className="flex-1 lg:flex-none bg-white/60 backdrop-blur-sm hover:bg-white border-gray-200 shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </Button>
                      
                      {canEdit(request) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(request)}
                          className="flex-1 lg:flex-none bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
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
                            className="flex-1 lg:flex-none bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Одобрить
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request)}
                            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg"
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
              <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Заявки не найдены</h3>
                    <p className="text-gray-600">
                      {statusFilter === "all" 
                        ? "Пока нет заявок на перевозку" 
                        : `Нет заявок со статусом "${getStatusText(statusFilter)}"`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Редактировать заявку {editingRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          
          {editingRequest && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Город отправления</label>
                  <Select 
                    value={editingRequest.fromCity} 
                    onValueChange={(value) => setEditingRequest({...editingRequest, fromCity: value})}
                  >
                    <SelectTrigger className="bg-white/80 border-gray-200">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Адрес отправления</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    value={editingRequest.fromAddress || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, fromAddress: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Город назначения</label>
                  <Select 
                    value={editingRequest.toCity} 
                    onValueChange={(value) => setEditingRequest({...editingRequest, toCity: value})}
                  >
                    <SelectTrigger className="bg-white/80 border-gray-200">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Адрес назначения</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    value={editingRequest.toAddress || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, toAddress: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Тип груза</label>
                  <Select 
                    value={editingRequest.cargoType} 
                    onValueChange={(value) => setEditingRequest({...editingRequest, cargoType: value})}
                  >
                    <SelectTrigger className="bg-white/80 border-gray-200">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Вес (кг)</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    type="number"
                    value={editingRequest.weight || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, weight: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ширина (м)</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    type="number"
                    step="0.1"
                    value={editingRequest.width || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, width: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Длина (м)</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    type="number"
                    step="0.1"
                    value={editingRequest.length || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, length: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Высота (м)</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    type="number"
                    step="0.1"
                    value={editingRequest.height || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, height: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Стоимость (₸)</label>
                  <Input
                    className="bg-white/80 border-gray-200"
                    type="number"
                    value={editingRequest.estimatedCost || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, estimatedCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={updateRequestMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
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