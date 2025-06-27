import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("прораб"), // прораб, логист, руководитель, финансовый, генеральный
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transportation requests table
export const transportationRequests = pgTable("transportation_requests", {
  id: serial("id").primaryKey(),
  requestNumber: varchar("request_number").notNull().unique(),
  
  // Basic information (filled by Прораб)
  fromCity: varchar("from_city").notNull(),
  toCity: varchar("to_city").notNull(),
  cargoType: varchar("cargo_type").notNull(),
  weight: varchar("weight").notNull(),
  description: text("description"),
  
  // Logistics information (filled by Логист)
  estimatedCost: varchar("estimated_cost"),
  transportType: varchar("transport_type"), // truck, trailer, special
  urgency: varchar("urgency").default("normal"), // normal, urgent, express
  carrier: varchar("carrier"),
  
  // Status and workflow
  status: varchar("status").notNull().default("created"), // created, logistics, manager, finance, approved, rejected, completed
  currentApproverId: varchar("current_approver_id"),
  
  // Metadata
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Request comments/history table
export const requestComments = pgTable("request_comments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  userId: varchar("user_id").notNull(),
  comment: text("comment").notNull(),
  action: varchar("action"), // created, approved, rejected, updated, commented
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  createdRequests: many(transportationRequests, {
    relationName: "createdBy",
  }),
  comments: many(requestComments),
}));

export const transportationRequestsRelations = relations(
  transportationRequests,
  ({ one, many }) => ({
    createdBy: one(users, {
      fields: [transportationRequests.createdById],
      references: [users.id],
      relationName: "createdBy",
    }),
    currentApprover: one(users, {
      fields: [transportationRequests.currentApproverId],
      references: [users.id],
      relationName: "currentApprover",
    }),
    comments: many(requestComments),
  }),
);

export const requestCommentsRelations = relations(requestComments, ({ one }) => ({
  request: one(transportationRequests, {
    fields: [requestComments.requestId],
    references: [transportationRequests.id],
  }),
  user: one(users, {
    fields: [requestComments.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTransportationRequest = typeof transportationRequests.$inferInsert;
export type TransportationRequest = typeof transportationRequests.$inferSelect;

export type InsertRequestComment = typeof requestComments.$inferInsert;
export type RequestComment = typeof requestComments.$inferSelect;

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransportationRequestSchema = createInsertSchema(transportationRequests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRequestCommentSchema = createInsertSchema(requestComments).omit({
  id: true,
  createdAt: true,
});

export const updateTransportationRequestSchema = insertTransportationRequestSchema.partial();
