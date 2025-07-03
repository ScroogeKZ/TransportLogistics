import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Building2, UserPlus, Edit, Phone, Mail, MapPin, Truck, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Carrier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  transportTypes: string[];
  rating: number;
  priceRange: string;
  notes: string;
}

const carrierSchema = z.object({
  name: z.string().min(1, "Название компании обязательно"),
  contactPerson: z.string().min(1, "Контактное лицо обязательно"),
  phone: z.string().min(1, "Телефон обязателен"),
  email: z.string().email("Неверный email").optional(),
  address: z.string().min(1, "Адрес обязателен"),
  transportTypes: z.array(z.string()).min(1, "Выберите хотя бы один тип транспорта"),
  rating: z.number().min(1).max(5),
  priceRange: z.string().min(1, "Укажите ценовой диапазон"),
  notes: z.string().optional(),
});

const transportTypes = [
  "Грузовик",
  "Полуприцеп",
  "Рефрижератор",
  "Тентованный",
  "Открытый",
  "Специальный",
];



export default function CarrierManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: carriersData = [], isLoading } = useQuery({
    queryKey: ["/api/carriers"],
  });

  const createCarrierMutation = useMutation({
    mutationFn: (data: z.infer<typeof carrierSchema>) =>
      apiRequest("/api/carriers", "POST", data),
    onSuccess: () => {
      toast({
        title: "Перевозчик добавлен",
        description: "Перевозчик успешно добавлен в базу данных",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      setModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить перевозчика",
        variant: "destructive",
      });
    },
  });

  const updateCarrierMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<z.infer<typeof carrierSchema>> }) =>
      apiRequest(`/api/carriers/${id}`, "PATCH", data),
    onSuccess: () => {
      toast({
        title: "Перевозчик обновлен",
        description: "Информация о перевозчике успешно обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      setSelectedCarrier(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить перевозчика",
        variant: "destructive",
      });
    },
  });

  const deleteCarrierMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/carriers/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Перевозчик удален",
        description: "Перевозчик успешно удален из базы данных",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить перевозчика",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof carrierSchema>>({
    resolver: zodResolver(carrierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      transportTypes: [],
      rating: 5,
      priceRange: "",
      notes: "",
    },
  });

  const carriers = (carriersData as Carrier[]).filter((carrier: Carrier) =>
    carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carrier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: z.infer<typeof carrierSchema>) => {
    if (selectedCarrier) {
      updateCarrierMutation.mutate({ id: selectedCarrier.id, data });
    } else {
      createCarrierMutation.mutate(data);
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    form.reset({
      name: carrier.name,
      contactPerson: carrier.contactPerson,
      phone: carrier.phone,
      email: carrier.email || "",
      address: carrier.address,
      transportTypes: carrier.transportTypes || [],
      rating: carrier.rating,
      priceRange: carrier.priceRange || "",
      notes: carrier.notes || "",
    });
    setModalOpen(true);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleDelete = (id: number) => {
    if (confirm("Вы уверены, что хотите удалить этого перевозчика?")) {
      deleteCarrierMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление перевозчиками</h1>
          <p className="text-gray-600 mt-1">
            База данных транспортных компаний и перевозчиков
          </p>
        </div>
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedCarrier(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Добавить перевозчика
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCarrier ? "Редактировать перевозчика" : "Добавить нового перевозчика"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название компании</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Контактное лицо</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Рейтинг (1-5)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 звезда</SelectItem>
                            <SelectItem value="2">2 звезды</SelectItem>
                            <SelectItem value="3">3 звезды</SelectItem>
                            <SelectItem value="4">4 звезды</SelectItem>
                            <SelectItem value="5">5 звезд</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ценовой диапазон</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="150-300 тенге/км" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примечания</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Добавить</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Поиск по названию или контактному лицу..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {carriers.map((carrier) => (
          <Card key={carrier.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {carrier.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getRatingStars(carrier.rating)}
                      <span className="text-sm text-gray-600 ml-1">
                        ({carrier.rating}/5)
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {carrier.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {carrier.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {carrier.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      {carrier.contactPerson}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Типы транспорта:</span>
                    <div className="flex gap-1">
                      {carrier.transportTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-green-600">
                      {carrier.priceRange}
                    </span>
                    {carrier.notes && (
                      <span className="text-gray-600">
                        {carrier.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(carrier)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleCall(carrier.phone)}>
                    Позвонить
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(carrier.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}