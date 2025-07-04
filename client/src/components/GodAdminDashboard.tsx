import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Crown,
  Settings,
  Zap,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";

const roleOptions = [
  { value: "прораб", label: "Прораб", color: "bg-blue-100 text-blue-800" },
  { value: "логист", label: "Логист", color: "bg-green-100 text-green-800" },
  { value: "руководитель", label: "Руководитель СМТ", color: "bg-purple-100 text-purple-800" },
  { value: "финансовый", label: "Финансовый директор", color: "bg-yellow-100 text-yellow-800" },
  { value: "генеральный директор", label: "Генеральный директор", color: "bg-red-100 text-red-800" },
  { value: "супер_админ", label: "БОГ АДМИН", color: "bg-black text-white" },
];

const statusOptions = [
  { value: "created", label: "Создан", color: "bg-gray-100 text-gray-800" },
  { value: "logistics", label: "В логистике", color: "bg-blue-100 text-blue-800" },
  { value: "manager", label: "У руководителя", color: "bg-purple-100 text-purple-800" },
  { value: "finance", label: "В финансах", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Одобрен", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Отклонён", color: "bg-red-100 text-red-800" },
  { value: "completed", label: "Завершён", color: "bg-emerald-100 text-emerald-800" },
];

export default function GodAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editingCarrier, setEditingCarrier] = useState<any>(null);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [newUser, setNewUser] = useState({ email: "", firstName: "", lastName: "", role: "прораб" });
  const [newCarrier, setNewCarrier] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "", transportTypes: [], rating: 5, priceRange: "", notes: "" });
  const [newRoute, setNewRoute] = useState({ name: "", fromCity: "", toCity: "", distance: 0, estimatedTime: 0, tollCost: 0, fuelCost: 0 });

  // Queries for all data
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

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/shipments"],
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mutations for CRUD operations
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Пользователь обновлён", description: "Изменения сохранены успешно" });
      setEditingUser(null);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      const response = await fetch(`/api/transportation-requests/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transportation-requests"] });
      toast({ title: "Заявка обновлена", description: "Изменения сохранены успешно" });
      setEditingRequest(null);
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/transportation-requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transportation-requests"] });
      toast({ title: "Заявка удалена", description: "Заявка была удалена из системы" });
    },
  });

  const createCarrierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create carrier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевозчик создан", description: "Новый перевозчик добавлен в систему" });
      setNewCarrier({ name: "", contactPerson: "", phone: "", email: "", address: "", transportTypes: [], rating: 5, priceRange: "", notes: "" });
    },
  });

  const updateCarrierMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      const response = await fetch(`/api/carriers/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update carrier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевозчик обновлён", description: "Изменения сохранены успешно" });
      setEditingCarrier(null);
    },
  });

  const deleteCarrierMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/carriers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete carrier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевозчик удалён", description: "Перевозчик был удалён из системы" });
    },
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create route");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Маршрут создан", description: "Новый маршрут добавлен в систему" });
      setNewRoute({ name: "", fromCity: "", toCity: "", distance: 0, estimatedTime: 0, tollCost: 0, fuelCost: 0 });
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      const response = await fetch(`/api/routes/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update route");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Маршрут обновлён", description: "Изменения сохранены успешно" });
      setEditingRoute(null);
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/routes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete route");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Маршрут удалён", description: "Маршрут был удалён из системы" });
    },
  });

  const getRoleColor = (role: string) => {
    return roleOptions.find(opt => opt.value === role)?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(opt => opt.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  if (usersLoading || requestsLoading || carriersLoading || routesLoading || shipmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных БОГ АДМИНКИ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-red-900 to-black text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <Crown className="h-12 w-12 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold">БОГ АДМИН ПАНЕЛЬ</h1>
            <p className="text-red-200">Полный контроль над системой транспортировок</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заявок</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{requests.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Перевозчиков</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{carriers.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Маршрутов</CardTitle>
            <Route className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{routes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Пользователи</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Заявки</span>
          </TabsTrigger>
          <TabsTrigger value="carriers" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Перевозчики</span>
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center space-x-2">
            <Route className="h-4 w-4" />
            <span>Маршруты</span>
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Отправления</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Управление пользователями</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {roleOptions.find(r => r.value === user.role)?.label || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Управление заявками</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№ заявки</TableHead>
                      <TableHead>Откуда</TableHead>
                      <TableHead>Куда</TableHead>
                      <TableHead>Груз</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Создана</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono">{request.requestNumber}</TableCell>
                        <TableCell>{request.fromCity}</TableCell>
                        <TableCell>{request.toCity}</TableCell>
                        <TableCell>{request.cargoType}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {statusOptions.find(s => s.value === request.status)?.label || request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRequest(request)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRequestMutation.mutate(request.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carriers Tab */}
        <TabsContent value="carriers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Управление перевозчиками</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить перевозчика
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Новый перевозчик</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Название</Label>
                        <Input
                          value={newCarrier.name}
                          onChange={(e) => setNewCarrier({...newCarrier, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Контактное лицо</Label>
                        <Input
                          value={newCarrier.contactPerson}
                          onChange={(e) => setNewCarrier({...newCarrier, contactPerson: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Телефон</Label>
                        <Input
                          value={newCarrier.phone}
                          onChange={(e) => setNewCarrier({...newCarrier, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={newCarrier.email}
                          onChange={(e) => setNewCarrier({...newCarrier, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Адрес</Label>
                        <Input
                          value={newCarrier.address}
                          onChange={(e) => setNewCarrier({...newCarrier, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Рейтинг (1-5)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={newCarrier.rating}
                          onChange={(e) => setNewCarrier({...newCarrier, rating: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ценовая категория</Label>
                        <Select value={newCarrier.priceRange} onValueChange={(value) => setNewCarrier({...newCarrier, priceRange: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="низкая">Низкая</SelectItem>
                            <SelectItem value="средняя">Средняя</SelectItem>
                            <SelectItem value="высокая">Высокая</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Примечания</Label>
                        <Textarea
                          value={newCarrier.notes}
                          onChange={(e) => setNewCarrier({...newCarrier, notes: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => createCarrierMutation.mutate(newCarrier)}
                      disabled={createCarrierMutation.isPending}
                    >
                      {createCarrierMutation.isPending ? "Создание..." : "Создать перевозчика"}
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Контакт</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Рейтинг</TableHead>
                      <TableHead>Цена</TableHead>
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
                          <div className="flex items-center">
                            {"⭐".repeat(carrier.rating)}
                            <span className="ml-1">({carrier.rating})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{carrier.priceRange}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCarrier(carrier)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCarrierMutation.mutate(carrier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Route className="h-5 w-5" />
                  <span>Управление маршрутами</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить маршрут
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новый маршрут</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Название маршрута</Label>
                        <Input
                          value={newRoute.name}
                          onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Откуда</Label>
                          <Input
                            value={newRoute.fromCity}
                            onChange={(e) => setNewRoute({...newRoute, fromCity: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Куда</Label>
                          <Input
                            value={newRoute.toCity}
                            onChange={(e) => setNewRoute({...newRoute, toCity: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Расстояние (км)</Label>
                          <Input
                            type="number"
                            value={newRoute.distance}
                            onChange={(e) => setNewRoute({...newRoute, distance: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Время (часы)</Label>
                          <Input
                            type="number"
                            value={newRoute.estimatedTime}
                            onChange={(e) => setNewRoute({...newRoute, estimatedTime: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Стоимость дорог (тенге)</Label>
                          <Input
                            type="number"
                            value={newRoute.tollCost}
                            onChange={(e) => setNewRoute({...newRoute, tollCost: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Стоимость топлива (тенге)</Label>
                          <Input
                            type="number"
                            value={newRoute.fuelCost}
                            onChange={(e) => setNewRoute({...newRoute, fuelCost: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => createRouteMutation.mutate(newRoute)}
                      disabled={createRouteMutation.isPending}
                    >
                      {createRouteMutation.isPending ? "Создание..." : "Создать маршрут"}
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Маршрут</TableHead>
                      <TableHead>Расстояние</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Стоимость</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.name}</TableCell>
                        <TableCell>{route.fromCity} → {route.toCity}</TableCell>
                        <TableCell>{route.distance} км</TableCell>
                        <TableCell>{route.estimatedTime} ч</TableCell>
                        <TableCell>{parseFloat(route.tollCost || "0") + parseFloat(route.fuelCost || "0")} ₸</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRoute(route)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRouteMutation.mutate(route.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Отслеживание отправлений</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID заявки</TableHead>
                      <TableHead>Водитель</TableHead>
                      <TableHead>Автомобиль</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Местоположение</TableHead>
                      <TableHead>Прогресс</TableHead>
                      <TableHead>Создано</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{shipment.requestId}</TableCell>
                        <TableCell>{shipment.driverName}</TableCell>
                        <TableCell className="font-mono">{shipment.vehicleNumber}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{shipment.currentLocation}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${shipment.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{shipment.progress || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(shipment.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя</Label>
                  <Input
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия</Label>
                  <Input
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Роль</Label>
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
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => updateUserMutation.mutate({
                id: editingUser.id,
                updates: {
                  firstName: editingUser.firstName,
                  lastName: editingUser.lastName,
                  email: editingUser.email,
                  role: editingUser.role
                }
              })}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Откуда</Label>
                  <Input
                    value={editingRequest.fromCity}
                    onChange={(e) => setEditingRequest({...editingRequest, fromCity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Куда</Label>
                  <Input
                    value={editingRequest.toCity}
                    onChange={(e) => setEditingRequest({...editingRequest, toCity: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Тип груза</Label>
                <Input
                  value={editingRequest.cargoType}
                  onChange={(e) => setEditingRequest({...editingRequest, cargoType: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Стоимость</Label>
                  <Input
                    value={editingRequest.estimatedCost || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, estimatedCost: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Перевозчик</Label>
                  <Input
                    value={editingRequest.carrier || ""}
                    onChange={(e) => setEditingRequest({...editingRequest, carrier: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => updateRequestMutation.mutate({
                id: editingRequest.id,
                updates: {
                  fromCity: editingRequest.fromCity,
                  toCity: editingRequest.toCity,
                  cargoType: editingRequest.cargoType,
                  status: editingRequest.status,
                  estimatedCost: editingRequest.estimatedCost,
                  carrier: editingRequest.carrier
                }
              })}
              disabled={updateRequestMutation.isPending}
            >
              {updateRequestMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}