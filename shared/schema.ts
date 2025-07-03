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
  boolean,
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

// Carriers table
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address").notNull(),
  transportTypes: text("transport_types").array(),
  rating: integer("rating").default(5),
  priceRange: varchar("price_range"),
  notes: text("notes"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Routes table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  fromCity: varchar("from_city").notNull(),
  toCity: varchar("to_city").notNull(),
  distance: integer("distance").notNull(), // in km
  estimatedTime: integer("estimated_time").notNull(), // in hours
  tollCost: decimal("toll_cost", { precision: 10, scale: 2 }),
  fuelCost: decimal("fuel_cost", { precision: 10, scale: 2 }),
  isOptimized: integer("is_optimized").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Route points table
export const routePoints = pgTable("route_points", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  sequence: integer("sequence").notNull(),
  city: varchar("city").notNull(),
  address: text("address"),
  type: varchar("type").notNull(), // pickup, delivery, warehouse
  timeWindow: varchar("time_window"),
  coordinates: text("coordinates"), // JSON string with lat/lng
  priority: integer("priority").default(1),
});

// Shipments tracking table
export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  driverName: varchar("driver_name").notNull(),
  driverPhone: varchar("driver_phone"),
  vehicleNumber: varchar("vehicle_number").notNull(),
  carrierId: integer("carrier_id"),
  routeId: integer("route_id"),
  status: varchar("status").notNull().default("in_transit"), // in_transit, loading, unloading, delayed, completed
  currentLocation: varchar("current_location"),
  progress: integer("progress").default(0), // percentage
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tracking points table
export const trackingPoints = pgTable("tracking_points", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  location: varchar("location").notNull(),
  coordinates: text("coordinates"), // JSON string with lat/lng
  speed: integer("speed").default(0),
  fuelLevel: integer("fuel_level"),
  status: varchar("status").notNull(),
  notes: text("notes"),
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

// New types for additional tables
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = typeof carriers.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

export type RoutePoint = typeof routePoints.$inferSelect;
export type InsertRoutePoint = typeof routePoints.$inferInsert;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

export type TrackingPoint = typeof trackingPoints.$inferSelect;
export type InsertTrackingPoint = typeof trackingPoints.$inferInsert;

// New schemas
export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackingPointSchema = createInsertSchema(trackingPoints).omit({
  id: true,
  timestamp: true,
});
