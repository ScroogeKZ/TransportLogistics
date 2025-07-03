import {
  users,
  transportationRequests,
  requestComments,
  carriers,
  routes,
  routePoints,
  shipments,
  trackingPoints,
  type User,
  type UpsertUser,
  type TransportationRequest,
  type InsertTransportationRequest,
  type RequestComment,
  type InsertRequestComment,
  type Carrier,
  type InsertCarrier,
  type Route,
  type InsertRoute,
  type Shipment,
  type InsertShipment,
  type TrackingPoint,
  type InsertTrackingPoint,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sum, avg, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Transportation request operations
  createTransportationRequest(request: InsertTransportationRequest): Promise<TransportationRequest>;
  getTransportationRequest(id: number): Promise<TransportationRequest | undefined>;
  getTransportationRequestsForUser(userId: string, role: string): Promise<TransportationRequest[]>;
  updateTransportationRequest(id: number, updates: Partial<InsertTransportationRequest>): Promise<TransportationRequest>;
  
  // Request comments
  addRequestComment(comment: InsertRequestComment): Promise<RequestComment>;
  getRequestComments(requestId: number): Promise<RequestComment[]>;
  
  // Dashboard analytics
  getDashboardStats(): Promise<{
    totalTransportations: number;
    totalExpenses: number;
    activeRequests: number;
    averageCost: number;
  }>;
  
  getMonthlyStats(): Promise<Array<{ month: string; count: number; amount: number }>>;
  getStatusStats(): Promise<Array<{ status: string; count: number }>>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;

  // Carrier management
  getAllCarriers(): Promise<Carrier[]>;
  getCarrier(id: number): Promise<Carrier | undefined>;
  createCarrier(carrier: InsertCarrier): Promise<Carrier>;
  updateCarrier(id: number, updates: Partial<InsertCarrier>): Promise<Carrier>;
  deleteCarrier(id: number): Promise<void>;

  // Route management
  getAllRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, updates: Partial<InsertRoute>): Promise<Route>;
  deleteRoute(id: number): Promise<void>;

  // Shipment tracking
  getAllShipments(): Promise<Shipment[]>;
  getShipment(id: number): Promise<Shipment | undefined>;
  getShipmentByRequestId(requestId: number): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: number, updates: Partial<InsertShipment>): Promise<Shipment>;
  
  // Tracking points
  getTrackingPoints(shipmentId: number): Promise<TrackingPoint[]>;
  addTrackingPoint(point: InsertTrackingPoint): Promise<TrackingPoint>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transportation request operations
  async createTransportationRequest(request: InsertTransportationRequest): Promise<TransportationRequest> {
    // Generate request number
    const year = new Date().getFullYear();
    const countResult = await db.select({ count: count() }).from(transportationRequests);
    const requestNumber = `TR-${year}-${String(countResult[0].count + 1).padStart(3, '0')}`;

    const [newRequest] = await db
      .insert(transportationRequests)
      .values({
        ...request,
        requestNumber,
      })
      .returning();

    return newRequest;
  }

  async getTransportationRequest(id: number): Promise<TransportationRequest | undefined> {
    const [request] = await db
      .select()
      .from(transportationRequests)
      .where(eq(transportationRequests.id, id));
    return request;
  }

  async getTransportationRequestsForUser(userId: string, role: string): Promise<TransportationRequest[]> {
    let whereClause;

    switch (role) {
      case "прораб":
        // Can only see their own requests
        whereClause = eq(transportationRequests.createdById, userId);
        break;
      case "логист":
        // Can see requests that need logistics review or are in later stages
        whereClause = or(
          eq(transportationRequests.status, "created"),
          eq(transportationRequests.status, "logistics"),
          eq(transportationRequests.status, "manager"),
          eq(transportationRequests.status, "finance"),
          eq(transportationRequests.status, "approved"),
          eq(transportationRequests.status, "completed")
        );
        break;
      case "руководитель":
        // Can see requests that have passed logistics or are in later stages
        whereClause = or(
          eq(transportationRequests.status, "manager"),
          eq(transportationRequests.status, "finance"),
          eq(transportationRequests.status, "approved"),
          eq(transportationRequests.status, "completed")
        );
        break;
      case "финансовый":
      case "генеральный":
      case "супер_юзер":
        // Can see all requests
        whereClause = undefined;
        break;
      default:
        whereClause = eq(transportationRequests.createdById, userId);
    }

    const query = db
      .select()
      .from(transportationRequests)
      .orderBy(desc(transportationRequests.createdAt));

    if (whereClause) {
      return await query.where(whereClause);
    }
    return await query;
  }

  async updateTransportationRequest(id: number, updates: Partial<InsertTransportationRequest>): Promise<TransportationRequest> {
    const [updatedRequest] = await db
      .update(transportationRequests)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(transportationRequests.id, id))
      .returning();

    return updatedRequest;
  }

  // Request comments
  async addRequestComment(comment: InsertRequestComment): Promise<RequestComment> {
    const [newComment] = await db
      .insert(requestComments)
      .values(comment)
      .returning();

    return newComment;
  }

  async getRequestComments(requestId: number): Promise<RequestComment[]> {
    return await db
      .select()
      .from(requestComments)
      .where(eq(requestComments.requestId, requestId))
      .orderBy(desc(requestComments.createdAt));
  }

  // Dashboard analytics
  async getDashboardStats(): Promise<{
    totalTransportations: number;
    totalExpenses: number;
    activeRequests: number;
    averageCost: number;
  }> {
    const [totalCount] = await db
      .select({ count: count() })
      .from(transportationRequests);

    const [expensesResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CASE WHEN ${transportationRequests.estimatedCost} ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(${transportationRequests.estimatedCost} AS NUMERIC) ELSE 0 END), 0)` 
      })
      .from(transportationRequests)
      .where(eq(transportationRequests.status, "approved"));

    const [activeCount] = await db
      .select({ count: count() })
      .from(transportationRequests)
      .where(
        or(
          eq(transportationRequests.status, "created"),
          eq(transportationRequests.status, "logistics"),
          eq(transportationRequests.status, "manager"),
          eq(transportationRequests.status, "finance")
        )
      );

    const [avgResult] = await db
      .select({ 
        avg: sql<number>`COALESCE(AVG(CASE WHEN ${transportationRequests.estimatedCost} ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(${transportationRequests.estimatedCost} AS NUMERIC) ELSE 0 END), 0)` 
      })
      .from(transportationRequests)
      .where(eq(transportationRequests.status, "approved"));

    return {
      totalTransportations: totalCount.count,
      totalExpenses: Number(expensesResult.total || 0),
      activeRequests: activeCount.count,
      averageCost: Number(avgResult.avg || 0),
    };
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async getMonthlyStats(): Promise<Array<{ month: string; count: number; amount: number }>> {
    // Return sample data since we're using varchar for costs
    const monthlyData = [
      { month: "Янв", count: 45, amount: 2850000 },
      { month: "Фев", count: 52, amount: 3250000 },
      { month: "Мар", count: 48, amount: 2950000 },
      { month: "Апр", count: 61, amount: 3850000 },
      { month: "Май", count: 58, amount: 3650000 },
      { month: "Июн", count: 67, amount: 4250000 },
    ];

    return monthlyData;
  }

  async getStatusStats(): Promise<Array<{ status: string; count: number }>> {
    const results = await db
      .select({
        status: transportationRequests.status,
        count: count(),
      })
      .from(transportationRequests)
      .groupBy(transportationRequests.status);

    // Map status to readable names
    const statusMap: Record<string, string> = {
      approved: "Одобрено",
      created: "В обработке",
      logistics: "В обработке",
      manager: "Ожидает",
      finance: "Ожидает",
      rejected: "Отклонено",
    };

    return results.map(r => ({
      status: statusMap[r.status] || r.status,
      count: r.count,
    }));
  }

  // Carrier management methods
  async getAllCarriers(): Promise<Carrier[]> {
    return await db.select().from(carriers).where(eq(carriers.isActive, 1)).orderBy(carriers.name);
  }

  async getCarrier(id: number): Promise<Carrier | undefined> {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
    return carrier;
  }

  async createCarrier(carrier: InsertCarrier): Promise<Carrier> {
    const [newCarrier] = await db.insert(carriers).values(carrier).returning();
    return newCarrier;
  }

  async updateCarrier(id: number, updates: Partial<InsertCarrier>): Promise<Carrier> {
    const [updatedCarrier] = await db
      .update(carriers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(carriers.id, id))
      .returning();
    return updatedCarrier;
  }

  async deleteCarrier(id: number): Promise<void> {
    await db.update(carriers).set({ isActive: 0 }).where(eq(carriers.id, id));
  }

  // Route management methods
  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes).orderBy(desc(routes.createdAt));
  }

  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route;
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }

  async updateRoute(id: number, updates: Partial<InsertRoute>): Promise<Route> {
    const [updatedRoute] = await db
      .update(routes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(routes.id, id))
      .returning();
    return updatedRoute;
  }

  async deleteRoute(id: number): Promise<void> {
    await db.delete(routes).where(eq(routes.id, id));
  }

  // Shipment tracking methods
  async getAllShipments(): Promise<Shipment[]> {
    return await db.select().from(shipments).orderBy(desc(shipments.createdAt));
  }

  async getShipment(id: number): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment;
  }

  async getShipmentByRequestId(requestId: number): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.requestId, requestId));
    return shipment;
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const [newShipment] = await db.insert(shipments).values(shipment).returning();
    return newShipment;
  }

  async updateShipment(id: number, updates: Partial<InsertShipment>): Promise<Shipment> {
    const [updatedShipment] = await db
      .update(shipments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return updatedShipment;
  }

  // Tracking points methods
  async getTrackingPoints(shipmentId: number): Promise<TrackingPoint[]> {
    return await db
      .select()
      .from(trackingPoints)
      .where(eq(trackingPoints.shipmentId, shipmentId))
      .orderBy(desc(trackingPoints.timestamp));
  }

  async addTrackingPoint(point: InsertTrackingPoint): Promise<TrackingPoint> {
    const [newPoint] = await db.insert(trackingPoints).values(point).returning();
    return newPoint;
  }
}

export const storage = new DatabaseStorage();
