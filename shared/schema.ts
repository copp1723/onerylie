import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb, foreignKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Dealership/Store schema first since it's referenced by users
export const dealerships = pgTable("dealerships", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  domain: text("domain"),
  handoverEmail: text("handover_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDealershipSchema = createInsertSchema(dealerships).pick({
  name: true,
  location: true,
  contactEmail: true,
  contactPhone: true,
  domain: true,
  handoverEmail: true,
});

// User schema for Replit Auth
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  name: text("name"),
  username: text("username"),
  password: text("password"),
  role: text("role").notNull().default("user"),
  dealershipId: integer("dealership_id").references(() => dealerships.id),
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  name: true,
  username: true,
  password: true,
  role: true,
  dealershipId: true,
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);



// Vehicle inventory schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  dealershipId: integer("dealership_id").notNull().references(() => dealerships.id),
  stockNumber: text("stock_number"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  trim: text("trim"),
  exteriorColor: text("exterior_color"),
  interiorColor: text("interior_color"),
  vin: text("vin").notNull().unique(),
  mileage: integer("mileage"),
  price: integer("price"),
  msrp: integer("msrp"),
  bodyStyle: text("body_style"),
  transmission: text("transmission"),
  engine: text("engine"),
  fuelType: text("fuel_type"),
  drivetrain: text("drivetrain"),
  features: text("features").array(),
  description: text("description"),
  images: text("images").array(),
  status: text("status").default('active'),
  isActive: boolean("is_active").notNull().default(true),
  url: text("url"),
  doors: integer("doors"),
  advertiserName: text("advertiser_name"),
  imageType: text("image_type"),
  vehicleType: text("vehicle_type"),
  condition: text("condition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for searching by dealership and active status (common filtering)
    dealershipIdIdx: index("vehicles_dealership_id_idx").on(table.dealershipId),
    // Index for vehicle searching by make/model/year (common search pattern)
    makeModelYearIdx: index("vehicles_make_model_year_idx").on(table.make, table.model, table.year),
    // Index for price range searches
    priceIdx: index("vehicles_price_idx").on(table.price),
    // Index for active status filtering
    isActiveIdx: index("vehicles_is_active_idx").on(table.isActive)
  };
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  dealershipId: true,
  stockNumber: true,
  make: true,
  model: true,
  year: true,
  trim: true,
  exteriorColor: true,
  interiorColor: true,
  vin: true,
  mileage: true,
  price: true,
  msrp: true,
  bodyStyle: true,
  transmission: true,
  engine: true,
  fuelType: true,
  drivetrain: true,
  features: true,
  description: true,
  images: true,
  status: true,
  isActive: true,
  url: true,
  doors: true,
  advertiserName: true,
  imageType: true,
  vehicleType: true,
  condition: true,
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
}, (table) => {
  return {
    // Index for filtering conversations by dealership (very common query)
    dealershipIdIdx: index("conversations_dealership_id_idx").on(table.dealershipId),
    // Index for filtering by conversation status (active, waiting, escalated)
    statusIdx: index("conversations_status_idx").on(table.status),
    // Index for searching by customer (phone or email lookups)
    customerContactIdx: index("conversations_customer_contact_idx").on(
      table.customerPhone, 
      table.customerEmail
    ),
    // Index for finding conversations handled by specific users
    escalatedToUserIdIdx: index("conversations_escalated_user_idx").on(table.escalatedToUserId),
    // Index for date-based queries (recent/time-based filtering)
    createdAtIdx: index("conversations_created_at_idx").on(table.createdAt)
  };
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
}, (table) => {
  return {
    // Index for retrieving all messages in a conversation (very common operation)
    conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
    // Index for searching messages by channel
    channelIdx: index("messages_channel_idx").on(table.channel),
    // Index for filtering messages by sender type
    senderTypeIdx: index("messages_sender_type_idx").on(table.isFromCustomer),
    // Compound index for finding messages in a conversation in chronological order
    conversationTimeIdx: index("messages_conversation_time_idx").on(
      table.conversationId, 
      table.createdAt
    )
  };
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  isFromCustomer: true,
  channel: true,
  metadata: true,
});

// Lead handover dossier schema
export const handoverDossiers = pgTable("handover_dossiers", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  dealershipId: integer("dealership_id").notNull().references(() => dealerships.id),
  customerName: text("customer_name").notNull(),
  customerContact: text("customer_contact"),
  conversationSummary: text("conversation_summary").notNull(),
  customerInsights: jsonb("customer_insights").notNull(), // Array of { key, value, confidence }
  vehicleInterests: jsonb("vehicle_interests").notNull(), // Array of vehicle specifications/interests
  suggestedApproach: text("suggested_approach"),
  urgency: text("urgency").notNull(), // "low", "medium", "high"
  escalationReason: text("escalation_reason").notNull(),
  fullConversationHistory: jsonb("full_conversation_history").notNull(),
  isEmailSent: boolean("is_email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHandoverDossierSchema = createInsertSchema(handoverDossiers).pick({
  conversationId: true,
  dealershipId: true,
  customerName: true,
  customerContact: true,
  conversationSummary: true,
  customerInsights: true,
  vehicleInterests: true,
  suggestedApproach: true,
  urgency: true,
  escalationReason: true,
  fullConversationHistory: true,
  isEmailSent: true,
  emailSentAt: true,
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
}, (table) => {
  return {
    // Index for dealership-specific persona lookup
    dealershipIdIdx: index("personas_dealership_id_idx").on(table.dealershipId),
    // Index for finding default personas
    isDefaultIdx: index("personas_is_default_idx").on(table.isDefault),
    // Index for name-based searches
    nameIdx: index("personas_name_idx").on(table.name)
  };
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
}, (table) => {
  return {
    // Index for fast key lookup during API authentication
    keyIdx: index("api_keys_key_idx").on(table.key),
    // Index for dealership-specific key management
    dealershipIdIdx: index("api_keys_dealership_id_idx").on(table.dealershipId),
    // Index for filtering active keys
    isActiveIdx: index("api_keys_is_active_idx").on(table.isActive)
  };
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  dealershipId: true,
  key: true,
  description: true,
  isActive: true,
});

// A/B Testing schemas
export const promptVariants = pgTable("prompt_variants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  isControl: boolean("is_control").default(false),
  isActive: boolean("is_active").default(true),
  dealershipId: integer("dealership_id").references(() => dealerships.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPromptVariantSchema = createInsertSchema(promptVariants).pick({
  name: true,
  description: true,
  promptTemplate: true,
  isControl: true,
  isActive: true,
  dealershipId: true,
});

export const promptMetrics = pgTable("prompt_metrics", {
  id: serial("id").primaryKey(),
  variantId: integer("variant_id").notNull().references(() => promptVariants.id),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  messageId: integer("message_id").notNull().references(() => messages.id),
  responseTime: integer("response_time_ms"), // Response generation time in ms
  tokensUsed: integer("tokens_used"), // Number of tokens used
  customerMessageLength: integer("customer_message_length"), // Length of customer message
  assistantResponseLength: integer("assistant_response_length"), // Length of assistant response
  wasEscalated: boolean("was_escalated").default(false), // Whether the conversation was escalated
  wasSuccessful: boolean("was_successful"), // Whether the prompt was considered successful (manual rating)
  customerRating: integer("customer_rating"), // Optional customer rating (1-5)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromptMetricsSchema = createInsertSchema(promptMetrics).pick({
  variantId: true,
  conversationId: true,
  messageId: true,
  responseTime: true,
  tokensUsed: true,
  customerMessageLength: true,
  assistantResponseLength: true,
  wasEscalated: true,
  wasSuccessful: true,
  customerRating: true,
});

export const promptExperiments = pgTable("prompt_experiments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dealershipId: integer("dealership_id").references(() => dealerships.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  conclusionNotes: text("conclusion_notes"),
});

export const insertPromptExperimentSchema = createInsertSchema(promptExperiments).pick({
  name: true,
  description: true,
  dealershipId: true,
  startDate: true,
  endDate: true,
  isActive: true,
  conclusionNotes: true,
});

export const experimentVariants = pgTable("experiment_variants", {
  id: serial("id").primaryKey(),
  experimentId: integer("experiment_id").notNull().references(() => promptExperiments.id),
  variantId: integer("variant_id").notNull().references(() => promptVariants.id),
  trafficAllocation: integer("traffic_allocation").default(50), // Percentage of traffic (0-100)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExperimentVariantSchema = createInsertSchema(experimentVariants).pick({
  experimentId: true,
  variantId: true,
  trafficAllocation: true,
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
  promptVariants: many(promptVariants),
  promptExperiments: many(promptExperiments),
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

// A/B Testing relations
export const promptVariantsRelations = relations(promptVariants, ({ many, one }) => ({
  metrics: many(promptMetrics),
  experimentVariants: many(experimentVariants),
  dealership: one(dealerships, {
    fields: [promptVariants.dealershipId],
    references: [dealerships.id]
  })
}));

export const promptMetricsRelations = relations(promptMetrics, ({ one }) => ({
  variant: one(promptVariants, {
    fields: [promptMetrics.variantId],
    references: [promptVariants.id]
  }),
  conversation: one(conversations, {
    fields: [promptMetrics.conversationId],
    references: [conversations.id]
  }),
  message: one(messages, {
    fields: [promptMetrics.messageId],
    references: [messages.id]
  })
}));

export const promptExperimentsRelations = relations(promptExperiments, ({ many, one }) => ({
  experimentVariants: many(experimentVariants),
  dealership: one(dealerships, {
    fields: [promptExperiments.dealershipId],
    references: [dealerships.id]
  })
}));

export const experimentVariantsRelations = relations(experimentVariants, ({ one }) => ({
  experiment: one(promptExperiments, {
    fields: [experimentVariants.experimentId],
    references: [promptExperiments.id]
  }),
  variant: one(promptVariants, {
    fields: [experimentVariants.variantId],
    references: [promptVariants.id]
  })
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

export type HandoverDossier = typeof handoverDossiers.$inferSelect;
export type InsertHandoverDossier = z.infer<typeof insertHandoverDossierSchema>;

// Define customer insight type for the handover dossier
export type CustomerInsight = {
  key: string;
  value: string;
  confidence: number;
};

// Define vehicle interest type for the handover dossier
export type VehicleInterest = {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  confidence: number;
};

// Define conversation history message type
export type ConversationHistoryMessage = {
  role: 'customer' | 'assistant';
  content: string;
  timestamp: Date;
};

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// A/B Testing type exports
export type PromptVariant = typeof promptVariants.$inferSelect;
export type InsertPromptVariant = z.infer<typeof insertPromptVariantSchema>;

export type PromptMetrics = typeof promptMetrics.$inferSelect;
export type InsertPromptMetrics = z.infer<typeof insertPromptMetricsSchema>;

export type PromptExperiment = typeof promptExperiments.$inferSelect;
export type InsertPromptExperiment = z.infer<typeof insertPromptExperimentSchema>;

export type ExperimentVariant = typeof experimentVariants.$inferSelect;
export type InsertExperimentVariant = z.infer<typeof insertExperimentVariantSchema>;
