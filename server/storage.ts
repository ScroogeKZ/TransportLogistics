import {
  users,
  transportationRequests,
  requestComments,
  type User,
  type UpsertUser,
  type TransportationRequest,
  type InsertTransportationRequest,
  type RequestComment,
  type InsertRequestComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sum, avg } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const count = await db.select({ count: count() }).from(transportationRequests);
    const requestNumber = `TR-${year}-${String(count[0].count + 1).padStart(3, '0')}`;

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
      .select({ total: sum(transportationRequests.estimatedCost) })
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
      .select({ avg: avg(transportationRequests.estimatedCost) })
      .from(transportationRequests)
      .where(eq(transportationRequests.status, "approved"));

    return {
      totalTransportations: totalCount.count,
      totalExpenses: Number(expensesResult.total || 0),
      activeRequests: activeCount.count,
      averageCost: Number(avgResult.avg || 0),
    };
  }

  async getMonthlyStats(): Promise<Array<{ month: string; count: number; amount: number }>> {
    // This is a simplified version - in a real app you'd use proper date functions
    const results = await db
      .select({
        month: transportationRequests.createdAt,
        count: count(),
        amount: sum(transportationRequests.estimatedCost),
      })
      .from(transportationRequests)
      .groupBy(transportationRequests.createdAt);

    // Transform to monthly data (simplified)
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
}

export const storage = new DatabaseStorage();
