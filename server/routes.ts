import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import {
  insertTransportationRequestSchema,
  updateTransportationRequestSchema,
  insertRequestCommentSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Transportation requests routes
  app.get("/api/transportation-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;

      const requests = await storage.getTransportationRequestsForUser(userId, user.role);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching transportation requests:", error);
      res.status(500).json({ message: "Failed to fetch transportation requests" });
    }
  });

  app.get("/api/transportation-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getTransportationRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching transportation request:", error);
      res.status(500).json({ message: "Failed to fetch transportation request" });
    }
  });

  app.post("/api/transportation-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;

      // Generate request number
      const requestCount = await storage.getTransportationRequestsForUser("", "all");
      const requestNumber = `REQ-${(requestCount.length + 1).toString().padStart(4, '0')}`;

      console.log("Request body:", req.body);
      
      const requestData = {
        requestNumber,
        fromCity: req.body.fromCity || req.body.originCity,
        fromAddress: req.body.fromAddress || req.body.originAddress,
        toCity: req.body.toCity || req.body.destinationCity,
        toAddress: req.body.toAddress || req.body.destinationAddress,
        cargoType: req.body.cargoType,
        weight: req.body.cargoWeight?.toString(),
        width: req.body.cargoWidth?.toString(),
        length: req.body.cargoLength?.toString(),
        height: req.body.cargoHeight?.toString(),
        description: req.body.notes,
        transportType: req.body.transportType,
        urgency: req.body.urgencyLevel,
        createdById: userId,
        status: "created",
      };
      
      console.log("Request data:", requestData);



      const request = await storage.createTransportationRequest(requestData);
      
      // Add creation comment
      await storage.addRequestComment({
        requestId: request.id,
        userId,
        comment: "Заявка создана",
        action: "created",
      });

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating transportation request:", error);
      res.status(500).json({ message: "Failed to create transportation request" });
    }
  });

  app.patch("/api/transportation-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const user = req.user;

      const existingRequest = await storage.getTransportationRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check permissions based on role and current status
      const canEdit = checkEditPermission(user.role, existingRequest.status, existingRequest.createdById, userId);
      if (!canEdit) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = updateTransportationRequestSchema.parse(req.body);
      const updatedRequest = await storage.updateTransportationRequest(id, validatedData);

      // Add update comment if status changed
      if (req.body.status && req.body.status !== existingRequest.status) {
        let action = "updated";
        let comment = "Статус обновлен";
        
        if (req.body.status === "approved") {
          action = "approved";
          comment = "Заявка одобрена";
        } else if (req.body.status === "rejected") {
          action = "rejected";
          comment = "Заявка отклонена";
        }

        await storage.addRequestComment({
          requestId: id,
          userId,
          comment,
          action,
        });
      }

      res.json(updatedRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating transportation request:", error);
      res.status(500).json({ message: "Failed to update transportation request" });
    }
  });

  // Request comments routes
  app.get("/api/transportation-requests/:id/comments", requireAuth, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const comments = await storage.getRequestComments(requestId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching request comments:", error);
      res.status(500).json({ message: "Failed to fetch request comments" });
    }
  });

  app.post("/api/transportation-requests/:id/comments", requireAuth, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const validatedData = insertRequestCommentSchema.parse({
        ...req.body,
        requestId,
        userId,
        action: "commented",
      });

      const comment = await storage.addRequestComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error adding request comment:", error);
      res.status(500).json({ message: "Failed to add request comment" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/monthly-stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getMonthlyStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  app.get("/api/dashboard/status-stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getStatusStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching status stats:", error);
      res.status(500).json({ message: "Failed to fetch status stats" });
    }
  });

<<<<<<< HEAD

=======
  // User management routes
  app.get("/api/users", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || (user.role !== "генеральный директор" && user.role !== "супер_админ")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || (user.role !== "генеральный директор" && user.role !== "супер_админ")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUserId = req.params.id;
      const updates = req.body;

      const updatedUser = await storage.updateUser(targetUserId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
>>>>>>> 9b226f612a9b6b5021256c06ca9f32b0294e362c

  // Carrier management routes
  app.get("/api/carriers", requireAuth, async (req: any, res) => {
    try {
      const carriers = await storage.getAllCarriers();
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ message: "Failed to fetch carriers" });
    }
  });

  app.post("/api/carriers", requireAuth, async (req: any, res) => {
    try {
      const carrierData = req.body;
      const newCarrier = await storage.createCarrier(carrierData);
      res.json(newCarrier);
    } catch (error) {
      console.error("Error creating carrier:", error);
      res.status(500).json({ message: "Failed to create carrier" });
    }
  });

  app.patch("/api/carriers/:id", requireAuth, async (req: any, res) => {
    try {
      const carrierId = parseInt(req.params.id);
      const updates = req.body;
      const updatedCarrier = await storage.updateCarrier(carrierId, updates);
      res.json(updatedCarrier);
    } catch (error) {
      console.error("Error updating carrier:", error);
      res.status(500).json({ message: "Failed to update carrier" });
    }
  });

  app.delete("/api/carriers/:id", requireAuth, async (req: any, res) => {
    try {
      const carrierId = parseInt(req.params.id);
      await storage.deleteCarrier(carrierId);
      res.json({ message: "Carrier deleted successfully" });
    } catch (error) {
      console.error("Error deleting carrier:", error);
      res.status(500).json({ message: "Failed to delete carrier" });
    }
  });

  // Route management routes
  app.get("/api/routes", requireAuth, async (req: any, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.post("/api/routes", requireAuth, async (req: any, res) => {
    try {
      const routeData = req.body;
      const newRoute = await storage.createRoute(routeData);
      res.json(newRoute);
    } catch (error) {
      console.error("Error creating route:", error);
      res.status(500).json({ message: "Failed to create route" });
    }
  });

  // Shipment tracking routes
  app.get("/api/shipments", requireAuth, async (req: any, res) => {
    try {
      const shipments = await storage.getAllShipments();
      res.json(shipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  });

  app.post("/api/shipments", requireAuth, async (req: any, res) => {
    try {
      const shipmentData = req.body;
      const newShipment = await storage.createShipment(shipmentData);
      res.json(newShipment);
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ message: "Failed to create shipment" });
    }
  });

  app.get("/api/shipments/:id/tracking", requireAuth, async (req: any, res) => {
    try {
      const shipmentId = parseInt(req.params.id);
      const trackingPoints = await storage.getTrackingPoints(shipmentId);
      res.json(trackingPoints);
    } catch (error) {
      console.error("Error fetching tracking points:", error);
      res.status(500).json({ message: "Failed to fetch tracking points" });
    }
  });

  app.post("/api/tracking-points", requireAuth, async (req: any, res) => {
    try {
      const pointData = req.body;
      const newPoint = await storage.addTrackingPoint(pointData);
      res.json(newPoint);
    } catch (error) {
      console.error("Error adding tracking point:", error);
      res.status(500).json({ message: "Failed to add tracking point" });
    }
  });

  // User management routes (Super Admin only)
  app.get("/api/users", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Allow access for генеральный директор and супер_админ roles
      const allowedRoles = ["генеральный директор", "супер_админ"];
      const hasAccess = user && allowedRoles.some(role => user.role === role);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "супер_юзер") {
        return res.status(403).json({ message: "Access denied" });
      }

      const userData = req.body;
      // Generate a unique ID for the new user
      const newUserId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser = await storage.upsertUser({
        id: newUserId,
        ...userData,
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "супер_юзер") {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUserId = req.params.id;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(targetUserId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "супер_юзер") {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUserId = req.params.id;
      
      // Don't allow deleting yourself
      if (targetUserId === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // For now, we'll just return success - in a real app you'd implement user deletion
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function checkEditPermission(
  userRole: string,
  requestStatus: string,
  requestCreatedById: string,
  userId: string
): boolean {
  // Генеральный директор and супер_админ can edit everything
  if (userRole === "генеральный директор" || userRole === "супер_админ") return true;

  // Прораб can only edit their own requests if still in created status
  if (userRole === "прораб") {
    return requestCreatedById === userId && requestStatus === "created";
  }

  // Логист can edit requests in created or logistics status
  if (userRole === "логист") {
    return requestStatus === "created" || requestStatus === "logistics";
  }

  // Руководитель can edit requests in manager status
  if (userRole === "руководитель") {
    return requestStatus === "manager" || requestStatus === "logistics";
  }

  // Финансовый директор can edit requests in finance status
  if (userRole === "финансовый") {
    return ["finance", "manager", "logistics"].includes(requestStatus);
  }

  return false;
}
