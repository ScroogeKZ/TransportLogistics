import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Clock, User, DollarSign } from "lucide-react";

interface RequestModalProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestModal({ request, open, onOpenChange }: RequestModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: comments } = useQuery({
    queryKey: ["/api/transportation-requests", request?.id, "comments"],
    enabled: !!request?.id,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/transportation-requests/${request.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transportation-requests"] });
      onOpenChange(false);
      toast({
        title: "Успех",
        description: "Заявка обновлена",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заявку",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      return await apiRequest("POST", `/api/transportation-requests/${request.id}/comments`, {
        comment: commentText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/transportation-requests", request.id, "comments"],
      });
      setComment("");
      toast({
        title: "Успех",
        description: "Комментарий добавлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить комментарий",
        variant: "destructive",
      });
    },
  });

  if (!request) return null;

  const handleApprove = () => {
    let newStatus = "approved";
    
    // Determine next status based on current status and user role
    if (request.status === "created" && user?.role === "логист") {
      newStatus = "logistics";
    } else if (request.status === "logistics" && user?.role === "руководитель") {
      newStatus = "manager";
    } else if (request.status === "manager" && user?.role === "финансовый") {
      newStatus = "finance";
    } else if (request.status === "finance" && user?.role === "финансовый") {
      newStatus = "approved";
    }

    updateRequestMutation.mutate({ status: newStatus });
  };

  const handleReject = () => {
    updateRequestMutation.mutate({ status: "rejected" });
  };

  const getWorkflowSteps = () => {
    const steps = [
      { key: "created", label: "Создана", role: "Прораб", icon: User },
      { key: "logistics", label: "У логиста", role: "Логист", icon: Clock },
      { key: "manager", label: "У руководителя", role: "Руководитель", icon: User },
      { key: "finance", label: "У финансового", role: "Финансовый", icon: DollarSign },
      { key: "approved", label: "Одобрена", role: "", icon: Check },
    ];

    return steps.map((step, index) => {
      const isCompleted = getStepStatus(step.key, request.status) === "completed";
      const isCurrent = getStepStatus(step.key, request.status) === "current";
      const Icon = step.icon;

      return (
        <div key={step.key} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              isCompleted
                ? "bg-green-500 text-white"
                : isCurrent
                ? "bg-yellow-500 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="ml-2 text-sm">
            <div className={`font-medium ${isCurrent ? "text-gray-900" : "text-gray-500"}`}>
              {step.label}
            </div>
            <div className="text-gray-400">{step.role}</div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-px mx-4 ${
                isCompleted ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      );
    });
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder = ["created", "logistics", "manager", "finance", "approved"];
    const stepIndex = statusOrder.indexOf(stepKey);
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const canApprove = () => {
    if (user?.role === "генеральный") return true;
    if (user?.role === "логист" && request.status === "created") return true;
    if (user?.role === "руководитель" && request.status === "logistics") return true;
    if (user?.role === "финансовый" && request.status === "manager") return true;
    return false;
  };

  const canReject = () => {
    return ["руководитель", "финансовый", "генеральный"].includes(user?.role || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Детали заявки {request.requestNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workflow Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Статус обработки
            </h4>
            <div className="flex items-center space-x-4">
              {getWorkflowSteps()}
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Основная информация
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Маршрут:</span>
                  <span className="font-medium">
                    {request.fromCity} → {request.toCity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Тип груза:</span>
                  <span className="font-medium">{request.cargoType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Вес:</span>
                  <span className="font-medium">{request.weight} тонн</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Создал:</span>
                  <span className="font-medium">
                    {request.createdBy?.firstName || "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Логистика
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Стоимость:</span>
                  <span className="font-medium">
                    {request.estimatedCost
                      ? `₸ ${request.estimatedCost.toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Перевозчик:</span>
                  <span className="font-medium">{request.carrier || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Тип транспорта:</span>
                  <span className="font-medium">{request.transportType || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Срочность:</span>
                  <Badge variant="secondary">{t(request.urgency || "normal")}</Badge>
                </div>
              </div>
            </div>
          </div>

          {request.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Описание
              </h4>
              <p className="text-sm text-gray-700">{request.description}</p>
            </div>
          )}

          <Separator />

          {/* Comments Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Комментарии
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments?.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">
                      {comment.user?.firstName || "Unknown"} ({t(comment.user?.role || "unknown")})
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Добавить комментарий..."
                className="mb-2"
              />
              <Button
                onClick={() => addCommentMutation.mutate(comment)}
                disabled={!comment.trim() || addCommentMutation.isPending}
                size="sm"
              >
                {addCommentMutation.isPending ? "Добавление..." : "Добавить комментарий"}
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          {canReject() && (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateRequestMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              {t("reject")}
            </Button>
          )}
          {canApprove() && (
            <Button
              onClick={handleApprove}
              disabled={updateRequestMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              {t("approve")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
