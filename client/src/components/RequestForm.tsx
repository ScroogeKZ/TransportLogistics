import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertTransportationRequestSchema } from "@shared/schema";
import { cities, cargoTypes, transportTypes, urgencyLevels, carriers } from "@/lib/i18n";
import { z } from "zod";

const formSchema = z.object({
  fromCity: z.string().min(1, "Выберите город отправления"),
  fromAddress: z.string().min(1, "Введите адрес отправления"),
  toCity: z.string().min(1, "Выберите город назначения"),
  toAddress: z.string().min(1, "Введите адрес назначения"),
  cargoType: z.string().min(1, "Выберите тип груза"),
  weight: z.string().min(1, "Введите вес груза"),
  width: z.string().optional(),
  length: z.string().optional(),
  height: z.string().optional(),
  description: z.string().optional(),
  estimatedCost: z.string().optional(),
  transportType: z.string().optional(),
  urgency: z.string().default("normal"),
  carrier: z.string().optional(),
});

export default function RequestForm() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromCity: "",
      fromAddress: "",
      toCity: "",
      toAddress: "",
      cargoType: "",
      weight: "",
      width: "",
      length: "",
      height: "",
      description: "",
      estimatedCost: "",
      transportType: "",
      urgency: "normal",
      carrier: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        fromCity: data.fromCity,
        fromAddress: data.fromAddress,
        toCity: data.toCity,
        toAddress: data.toAddress,
        cargoType: data.cargoType,
        weight: data.weight,
        width: data.width,
        length: data.length,
        height: data.height,
        description: data.description,
        estimatedCost: data.estimatedCost,
        transportType: data.transportType,
        urgency: data.urgency,
        carrier: data.carrier,
      };
      return await apiRequest("POST", "/api/transportation-requests", payload);
    },
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Заявка успешно создана",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transportation-requests"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать заявку",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Form data:", data);
    createRequestMutation.mutate(data);
  };

  const canEditLogistics = (user as any)?.role !== "прораб";

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">{t("create_transportation_request")}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Route Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Маршрут</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("departure_point")} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder="Выберите город" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.value} value={city.value}>
                                {city.label[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("destination_point")} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder="Выберите город" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.value} value={city.value}>
                                {city.label[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Адрес отправления *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Введите адрес..." 
                            className="h-10 sm:h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Адрес назначения *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Введите адрес..." 
                            className="h-10 sm:h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Cargo Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Информация о грузе</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cargoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("cargo_type")} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder="Выберите тип груза" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cargoTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("weight")} (тонн) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            step="0.1" 
                            className="h-10 sm:h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("urgency")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder="Выберите срочность" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {urgencyLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Ширина (см)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="h-10 sm:h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Длина (см)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="h-10 sm:h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Высота (см)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="h-10 sm:h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Описание груза</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Дополнительная информация о грузе..."
                          className="resize-none min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logistics fields (conditional) */}
                {canEditLogistics && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t("transport_type")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 sm:h-11">
                                <SelectValue placeholder="Выберите тип транспорта" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {transportTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label[language]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="carrier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t("carrier")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 sm:h-11">
                                <SelectValue placeholder="Выберите перевозчика" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carriers.map((carrier) => (
                                <SelectItem key={carrier.value} value={carrier.value}>
                                  {carrier.label[language]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t("estimated_cost")} (₸)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-10 sm:h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.reset()}
                  className="w-full sm:w-auto"
                >
                  Очистить
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRequestMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createRequestMutation.isPending ? "Создание..." : "Создать заявку"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}