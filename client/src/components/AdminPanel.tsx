import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Shield, 
  Database,
  Activity,
  FileText,
  Truck,
  Route,
  MapPin,
  BarChart3,
  Edit,
  Trash2,
  Plus,
  Building2,
  Settings,
  Eye
} from "lucide-react";

const roleOptions = [
  { value: "прораб", label: "Прораб" },
  { value: "логист", label: "Логист" },
  { value: "руководитель", label: "Руководитель СМТ" },
  { value: "финансовый", label: "Финансовый директор" },
  { value: "генеральный", label: "Генеральный директор" },
  { value: "супер_юзер", label: "Супер Юзер" },
];

const statusOptions = [
  { value: "created", label: "Создана" },
  { value: "logistics", label: "В логистике" },
  { value: "manager", label: "У руководителя" },
  { value: "finance", label: "В финансах" },
  { value: "approved", label: "Одобрена" },
  { value: "rejected", label: "Отклонена" },
  { value: "completed", label: "Завершена" },
];

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface EditRequestForm {
  fromCity: string;
  fromAddress: string;
  toCity: string;
  toAddress: string;
  cargoType: string;
  weight: string;
  status: string;
  estimatedCost: string;
  transportType: string;
  carrier: string;
}

interface NewCarrierForm {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  transportTypes: string;
  rating: number;
  priceRange: string;
  notes: string;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [newCarrier, setNewCarrier] = useState<NewCarrierForm>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    transportTypes: "",
    rating: 5,
    priceRange: "",
    notes: ""
  });

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/transportation-requests"],
  });

  const { data: carriers = [], isLoading: carriersLoading } = useQuery<any[]>({
    queryKey: ["/api/carriers"],
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery<any[]>({
    queryKey: ["/api/routes"],
  });

  const { data: dashboardStats = {} } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditUserForm> }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Пользователь обновлен", description: "Данные пользователя успешно изменены" });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить пользователя", variant: "destructive" });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EditRequestForm> }) => {
      const res = await fetch(`/api/transportation-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transportation-requests"] });
      toast({ title: "Заявка обновлена", description: "Заявка успешно изменена" });
      setEditingRequest(null);
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить заявку", variant: "destructive" });
    },
  });

  const createCarrierMutation = useMutation({
    mutationFn: async (data: NewCarrierForm) => {
      const carrierData = {
        ...data,
        transportTypes: data.transportTypes.split(",").map(t => t.trim()),
      };
      const res = await fetch("/api/carriers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carrierData),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create carrier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевозчик создан", description: "Новый перевозчик успешно добавлен" });
      setNewCarrier({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        transportTypes: "",
        rating: 5,
        priceRange: "",
        notes: ""
      });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать перевозчика", variant: "destructive" });
    },
  });

  const deleteCarrierMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/carriers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete carrier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевозчик удален", description: "Перевозчик успешно удален" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить перевозчика", variant: "destructive" });
    },
  });

  const getRoleLabel = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role);
    return option ? option.label : role;
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      created: "bg-blue-100 text-blue-800",
      logistics: "bg-yellow-100 text-yellow-800",
      manager: "bg-purple-100 text-purple-800",
      finance: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (usersLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Административная панель</h1>
          <p className="text-gray-600">Полное управление системой перевозок</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-sm font-medium text-red-500">Супер Администратор</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заявки</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Перевозчики</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carriers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Маршруты</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="requests">Заявки</TabsTrigger>
          <TabsTrigger value="carriers">Перевозчики</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Управление пользователями</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Управление заявками</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Маршрут</TableHead>
                    <TableHead>Груз</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Стоимость</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.requestNumber}</TableCell>
                      <TableCell>{request.fromCity} → {request.toCity}</TableCell>
                      <TableCell>{request.cargoType}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.estimatedCost || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRequest(request)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carriers Tab */}
        <TabsContent value="carriers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Управление перевозчиками</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить перевозчика
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Новый перевозчик</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={newCarrier.name}
                      onChange={(e) => setNewCarrier({...newCarrier, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Контактное лицо</Label>
                    <Input
                      id="contactPerson"
                      value={newCarrier.contactPerson}
                      onChange={(e) => setNewCarrier({...newCarrier, contactPerson: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={newCarrier.phone}
                      onChange={(e) => setNewCarrier({...newCarrier, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCarrier.email}
                      onChange={(e) => setNewCarrier({...newCarrier, email: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Адрес</Label>
                    <Input
                      id="address"
                      value={newCarrier.address}
                      onChange={(e) => setNewCarrier({...newCarrier, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transportTypes">Типы транспорта (через запятую)</Label>
                    <Input
                      id="transportTypes"
                      value={newCarrier.transportTypes}
                      onChange={(e) => setNewCarrier({...newCarrier, transportTypes: e.target.value})}
                      placeholder="Грузовик, Фура, Спецтехника"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceRange">Ценовой диапазон</Label>
                    <Input
                      id="priceRange"
                      value={newCarrier.priceRange}
                      onChange={(e) => setNewCarrier({...newCarrier, priceRange: e.target.value})}
                      placeholder="10000-50000 тенге"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Примечания</Label>
                    <Input
                      id="notes"
                      value={newCarrier.notes}
                      onChange={(e) => setNewCarrier({...newCarrier, notes: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createCarrierMutation.mutate(newCarrier)}
                  disabled={createCarrierMutation.isPending}
                  className="w-full"
                >
                  {createCarrierMutation.isPending ? "Создание..." : "Создать перевозчика"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Контактное лицо</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Типы транспорта</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carriers.map((carrier) => (
                    <TableRow key={carrier.id}>
                      <TableCell className="font-medium">{carrier.name}</TableCell>
                      <TableCell>{carrier.contactPerson}</TableCell>
                      <TableCell>{carrier.phone}</TableCell>
                      <TableCell>
                        {Array.isArray(carrier.transportTypes) 
                          ? carrier.transportTypes.join(", ") 
                          : carrier.transportTypes}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {carrier.rating}/5 ⭐
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCarrierMutation.mutate(carrier.id)}
                          disabled={deleteCarrierMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Общая статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Всего перевозок:</span>
                  <span className="font-bold">{dashboardStats.totalTransportations || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Общие расходы:</span>
                  <span className="font-bold">{dashboardStats.totalExpenses || 0} ₸</span>
                </div>
                <div className="flex justify-between">
                  <span>Активные заявки:</span>
                  <span className="font-bold">{dashboardStats.activeRequests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Средняя стоимость:</span>
                  <span className="font-bold">{dashboardStats.averageCost || 0} ₸</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Системная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Зарегистрированных пользователей:</span>
                  <span className="font-bold">{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Активных перевозчиков:</span>
                  <span className="font-bold">{carriers.filter(c => c.isActive).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Настроенных маршрутов:</span>
                  <span className="font-bold">{routes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Статус системы:</span>
                  <Badge className="bg-green-100 text-green-800">Активна</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => updateUserMutation.mutate({
                  id: editingUser.id,
                  data: {
                    firstName: editingUser.firstName,
                    lastName: editingUser.lastName,
                    email: editingUser.email,
                    role: editingUser.role,
                  }
                })}
                disabled={updateUserMutation.isPending}
                className="w-full"
              >
                {updateUserMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Request Dialog */}
      {editingRequest && (
        <Dialog open={!!editingRequest} onOpenChange={() => setEditingRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать заявку #{editingRequest.requestNumber}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromCity">Город отправления</Label>
                <Input
                  id="fromCity"
                  value={editingRequest.fromCity}
                  onChange={(e) => setEditingRequest({...editingRequest, fromCity: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="toCity">Город назначения</Label>
                <Input
                  id="toCity"
                  value={editingRequest.toCity}
                  onChange={(e) => setEditingRequest({...editingRequest, toCity: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="fromAddress">Адрес отправления</Label>
                <Input
                  id="fromAddress"
                  value={editingRequest.fromAddress}
                  onChange={(e) => setEditingRequest({...editingRequest, fromAddress: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="toAddress">Адрес назначения</Label>
                <Input
                  id="toAddress"
                  value={editingRequest.toAddress}
                  onChange={(e) => setEditingRequest({...editingRequest, toAddress: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cargoType">Тип груза</Label>
                <Input
                  id="cargoType"
                  value={editingRequest.cargoType}
                  onChange={(e) => setEditingRequest({...editingRequest, cargoType: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="weight">Вес</Label>
                <Input
                  id="weight"
                  value={editingRequest.weight}
                  onChange={(e) => setEditingRequest({...editingRequest, weight: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Статус</Label>
                <Select
                  value={editingRequest.status}
                  onValueChange={(value) => setEditingRequest({...editingRequest, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedCost">Стоимость</Label>
                <Input
                  id="estimatedCost"
                  value={editingRequest.estimatedCost || ""}
                  onChange={(e) => setEditingRequest({...editingRequest, estimatedCost: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="transportType">Тип транспорта</Label>
                <Input
                  id="transportType"
                  value={editingRequest.transportType || ""}
                  onChange={(e) => setEditingRequest({...editingRequest, transportType: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="carrier">Перевозчик</Label>
                <Input
                  id="carrier"
                  value={editingRequest.carrier || ""}
                  onChange={(e) => setEditingRequest({...editingRequest, carrier: e.target.value})}
                />
              </div>
            </div>
            <Button
              onClick={() => updateRequestMutation.mutate({
                id: editingRequest.id,
                data: {
                  fromCity: editingRequest.fromCity,
                  fromAddress: editingRequest.fromAddress,
                  toCity: editingRequest.toCity,
                  toAddress: editingRequest.toAddress,
                  cargoType: editingRequest.cargoType,
                  weight: editingRequest.weight,
                  status: editingRequest.status,
                  estimatedCost: editingRequest.estimatedCost,
                  transportType: editingRequest.transportType,
                  carrier: editingRequest.carrier,
                }
              })}
              disabled={updateRequestMutation.isPending}
              className="w-full"
            >
              {updateRequestMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}