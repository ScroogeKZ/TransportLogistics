import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Trash2
} from "lucide-react";

const roleOptions = [
  { value: "прораб", label: "Прораб" },
  { value: "логист", label: "Логист" },
  { value: "руководитель", label: "Руководитель СМТ" },
  { value: "финансовый", label: "Финансовый директор" },
  { value: "генеральный", label: "Генеральный директор" },
  { value: "супер_юзер", label: "Супер Юзер" },
];

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries with proper typing
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

  const getRoleLabel = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role);
    return option ? option.label : role;
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
          <h1 className="text-3xl font-bold">Супер Юзер Панель</h1>
          <p className="text-gray-600">Полное управление системой</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-sm font-medium text-red-500">Супер Юзер</span>
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
            <CardTitle className="text-sm font-medium">Запросы</CardTitle>
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
          <TabsTrigger value="requests">Запросы</TabsTrigger>
          <TabsTrigger value="carriers">Перевозчики</TabsTrigger>
          <TabsTrigger value="system">Система</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Управление пользователями</h2>
            <Button>
              <Users className="w-4 h-4 mr-2" />
              Добавить пользователя
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Фамилия</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'супер_юзер' ? 'destructive' : 'secondary'}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Управление запросами</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>Маршрут</TableHead>
                    <TableHead>Груз</TableHead>
                    <TableHead>Вес</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono">{request.requestNumber}</TableCell>
                      <TableCell>{request.fromCity} → {request.toCity}</TableCell>
                      <TableCell>{request.cargoType}</TableCell>
                      <TableCell>{request.weight}</TableCell>
                      <TableCell>
                        <Badge>{request.status}</Badge>
                      </TableCell>
                      <TableCell>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
            <h2 className="text-xl font-semibold">Управление перевозчиками</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Контакт</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carriers.map((carrier: any) => (
                    <TableRow key={carrier.id}>
                      <TableCell>{carrier.id}</TableCell>
                      <TableCell>{carrier.name}</TableCell>
                      <TableCell>{carrier.contactPerson}</TableCell>
                      <TableCell>{carrier.phone}</TableCell>
                      <TableCell>{carrier.email}</TableCell>
                      <TableCell>{carrier.rating}/5</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Системная информация</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  База данных
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Статус: <Badge className="bg-green-100 text-green-800">Активна</Badge></div>
                  <div>Пользователи: {users.length}</div>
                  <div>Запросы: {requests.length}</div>
                  <div>Перевозчики: {carriers.length}</div>
                  <div>Маршруты: {routes.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Активность системы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Всего транспортировок: {dashboardStats.totalTransportations || 0}</div>
                  <div>Активные запросы: {dashboardStats.activeRequests || 0}</div>
                  <div>Общие расходы: {dashboardStats.totalExpenses || 0} ₸</div>
                  <div>Средняя стоимость: {dashboardStats.averageCost || 0} ₸</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}