import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

// Dealership/Store schema
export const dealerships = pgTable("dealerships", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealershipSchema = createInsertSchema(dealerships).pick({
  name: true,
  location: true,
  contactEmail: true,
  contactPhone: true,
});

// Vehicle inventory schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  dealershipId: integer("dealership_id").notNull().references(() => dealerships.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  trim: text("trim"),
  exteriorColor: text("exterior_color"),
  interiorColor: text("interior_color"),
  vin: text("vin").notNull().unique(),
  mileage: integer("mileage"),
  price: integer("price"),
  features: text("features").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  dealershipId: true,
  make: true,
  model: true,
  year: true,
  trim: true,
  exteriorColor: true,
  interiorColor: true,
  vin: true,
  mileage: true,
  price: true,
  features: true,
  isActive: true,
});

// Conversation status enum
export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "waiting",
  "escalated",
  "completed"
]);

// Conversation schema
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  dealershipId: integer("dealership_id").notNull().references(() => dealerships.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  status: conversationStatusEnum("status").notNull().default("active"),
  campaignContext: text("campaign_context"),
  inventoryContext: text("inventory_context"),
  escalatedToUserId: integer("escalated_to_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  dealershipId: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  status: true,
  campaignContext: true,
  inventoryContext: true,
  escalatedToUserId: true,
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  content: text("content").notNull(),
  isFromCustomer: boolean("is_from_customer").notNull(),
  channel: text("channel").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  isFromCustomer: true,
  channel: true,
  metadata: true,
});

// Persona config schema
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  dealershipId: integer("dealership_id").notNull().references(() => dealerships.id),
  name: text("name").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  arguments: jsonb("arguments").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPersonaSchema = createInsertSchema(personas).pick({
  dealershipId: true,
  name: true,
  promptTemplate: true,
  arguments: true,
  isDefault: true,
});

// API key schema for authentication
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  dealershipId: integer("dealership_id").notNull().references(() => dealerships.id),
  key: text("key").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  dealershipId: true,
  key: true,
  description: true,
  isActive: true,
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  escalatedConversations: many(conversations),
}));

export const dealershipsRelations = relations(dealerships, ({ many }) => ({
  vehicles: many(vehicles),
  conversations: many(conversations),
  personas: many(personas),
  apiKeys: many(apiKeys),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  dealership: one(dealerships, {
    fields: [vehicles.dealershipId],
    references: [dealerships.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  dealership: one(dealerships, {
    fields: [conversations.dealershipId],
    references: [dealerships.id],
  }),
  escalatedTo: one(users, {
    fields: [conversations.escalatedToUserId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const personasRelations = relations(personas, ({ one }) => ({
  dealership: one(dealerships, {
    fields: [personas.dealershipId],
    references: [dealerships.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  dealership: one(dealerships, {
    fields: [apiKeys.dealershipId],
    references: [dealerships.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dealership = typeof dealerships.$inferSelect;
export type InsertDealership = z.infer<typeof insertDealershipSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
