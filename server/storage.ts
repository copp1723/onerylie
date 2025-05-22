import {
  users, type User, type InsertUser,
  dealerships, type Dealership, type InsertDealership,
  vehicles, type Vehicle, type InsertVehicle,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  personas, type Persona, type InsertPersona,
  apiKeys, type ApiKey, type InsertApiKey,
  promptVariants, type PromptVariant, type InsertPromptVariant,
  promptExperiments, type PromptExperiment, type InsertPromptExperiment,
  experimentVariants, type ExperimentVariant, type InsertExperimentVariant,
  promptMetrics, type PromptMetrics, type InsertPromptMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, asc, isNull, sql, or } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  upsertUser(user: Partial<InsertUser>): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dealership operations
  getDealership(id: number): Promise<Dealership | undefined>;
  getDealerships(): Promise<Dealership[]>;
  createDealership(dealership: InsertDealership): Promise<Dealership>;
  updateDealership(id: number, dealership: Partial<InsertDealership>): Promise<Dealership | undefined>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByVin(vin: string): Promise<Vehicle | undefined>;
  getVehiclesByDealership(dealershipId: number): Promise<Vehicle[]>;
  searchVehicles(dealershipId: number, query: string): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  
  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByDealership(dealershipId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationStatus(id: number, status: string): Promise<Conversation | undefined>;
  escalateConversation(id: number, userId: number): Promise<Conversation | undefined>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Persona operations
  getPersona(id: number): Promise<Persona | undefined>;
  getPersonasByDealership(dealershipId: number): Promise<Persona[]>;
  getDefaultPersonaForDealership(dealershipId: number): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  updatePersona(id: number, persona: Partial<InsertPersona>): Promise<Persona | undefined>;
  
  // API Key operations
  verifyApiKey(key: string): Promise<ApiKey | undefined>;
  generateApiKey(dealershipId: number, description?: string): Promise<ApiKey>;
  getApiKeysByDealership(dealershipId: number): Promise<ApiKey[]>;
  updateApiKeyStatus(id: number, isActive: boolean): Promise<ApiKey | undefined>;
  
  // A/B Testing - Prompt Variant operations
  getPromptVariant(id: number): Promise<PromptVariant | undefined>;
  getPromptVariantsByDealership(dealershipId: number, includeInactive?: boolean): Promise<PromptVariant[]>;
  createPromptVariant(variant: InsertPromptVariant): Promise<PromptVariant>;
  updatePromptVariant(id: number, variant: Partial<InsertPromptVariant>): Promise<PromptVariant | undefined>;
  setControlVariant(id: number, dealershipId: number): Promise<PromptVariant | undefined>;
  
  // A/B Testing - Experiment operations
  getPromptExperiment(id: number): Promise<PromptExperiment | undefined>;
  getPromptExperimentWithVariants(id: number): Promise<any | undefined>; // Returns experiment with variants
  getPromptExperiments(dealershipId: number): Promise<PromptExperiment[]>;
  getActivePromptExperiments(dealershipId: number): Promise<PromptExperiment[]>;
  createPromptExperiment(experiment: InsertPromptExperiment): Promise<PromptExperiment>;
  updatePromptExperiment(id: number, experiment: Partial<InsertPromptExperiment>): Promise<PromptExperiment | undefined>;
  
  // A/B Testing - Experiment Variant operations
  addVariantToExperiment(experimentId: number, variantId: number, trafficAllocation: number): Promise<ExperimentVariant>;
  removeVariantFromExperiment(experimentId: number, variantId: number): Promise<boolean>;
  updateVariantTrafficAllocation(experimentId: number, variantId: number, trafficAllocation: number): Promise<ExperimentVariant | undefined>;
  
  // A/B Testing - Metrics operations
  getPromptMetrics(variantId: number): Promise<PromptMetrics[]>;
  getPromptMetricsByConversation(conversationId: number): Promise<PromptMetrics | undefined>;
  createPromptMetric(metric: InsertPromptMetrics): Promise<PromptMetrics>;
  updatePromptMetric(id: number, metric: Partial<InsertPromptMetrics>): Promise<PromptMetrics | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id.toString()));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert operation");
    }

    // Using string ID for Replit Auth
    const [existingUser] = await db.select().from(users).where(eq(users.id, userData.id.toString()));
    
    if (existingUser) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          username: userData.username,
          password: userData.password,
        })
        .where(eq(users.id, userData.id.toString()))
        .returning();
      
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name || "Rylie User",
          username: userData.username || userData.id.toString(),
          password: userData.password || "replit-auth", // Required by schema
          role: userData.role || 'user', // Default role
          created_at: new Date()
        })
        .returning();
      
      return newUser;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Dealership operations
  async getDealership(id: number): Promise<Dealership | undefined> {
    const [dealership] = await db.select().from(dealerships).where(eq(dealerships.id, id));
    return dealership;
  }
  
  async getDealerships(): Promise<Dealership[]> {
    return await db.select().from(dealerships).orderBy(dealerships.name);
  }
  
  async createDealership(dealership: InsertDealership): Promise<Dealership> {
    const [newDealership] = await db.insert(dealerships).values(dealership).returning();
    return newDealership;
  }
  
  async updateDealership(id: number, dealership: Partial<InsertDealership>): Promise<Dealership | undefined> {
    const [updatedDealership] = await db
      .update(dealerships)
      .set(dealership)
      .where(eq(dealerships.id, id))
      .returning();
    return updatedDealership;
  }
  
  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }
  
  async getVehicleByVin(vin: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vin, vin));
    return vehicle;
  }
  
  async getVehiclesByDealership(dealershipId: number): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(and(
        eq(vehicles.dealershipId, dealershipId),
        eq(vehicles.isActive, true)
      ))
      .orderBy(desc(vehicles.createdAt));
  }
  
  async searchVehicles(dealershipId: number, query: string): Promise<Vehicle[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(vehicles)
      .where(and(
        eq(vehicles.dealershipId, dealershipId),
        eq(vehicles.isActive, true),
        sql`(
          ${vehicles.make} ILIKE ${searchTerm} OR
          ${vehicles.model} ILIKE ${searchTerm} OR
          ${vehicles.vin} ILIKE ${searchTerm} OR
          ${vehicles.trim} ILIKE ${searchTerm} OR
          ${vehicles.exteriorColor} ILIKE ${searchTerm}
        )`
      ))
      .orderBy(desc(vehicles.createdAt));
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }
  
  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({ ...vehicle, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }
  
  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  
  async getConversationsByDealership(dealershipId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.dealershipId, dealershipId))
      .orderBy(desc(conversations.updatedAt));
  }
  
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }
  
  async updateConversationStatus(id: number, status: string): Promise<Conversation | undefined> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }
  
  async escalateConversation(id: number, userId: number): Promise<Conversation | undefined> {
    const [escalatedConversation] = await db
      .update(conversations)
      .set({ 
        status: "escalated", 
        escalatedToUserId: userId,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return escalatedConversation;
  }
  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }
  
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update the conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
      
    return newMessage;
  }
  
  // Persona operations
  async getPersona(id: number): Promise<Persona | undefined> {
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona;
  }
  
  async getPersonasByDealership(dealershipId: number): Promise<Persona[]> {
    return await db
      .select()
      .from(personas)
      .where(eq(personas.dealershipId, dealershipId))
      .orderBy(personas.name);
  }
  
  async getDefaultPersonaForDealership(dealershipId: number): Promise<Persona | undefined> {
    const [persona] = await db
      .select()
      .from(personas)
      .where(and(
        eq(personas.dealershipId, dealershipId),
        eq(personas.isDefault, true)
      ));
    return persona;
  }
  
  async createPersona(persona: InsertPersona): Promise<Persona> {
    // If this is set as default, unset any existing defaults
    if (persona.isDefault) {
      await db
        .update(personas)
        .set({ isDefault: false })
        .where(and(
          eq(personas.dealershipId, persona.dealershipId),
          eq(personas.isDefault, true)
        ));
    }
    
    const [newPersona] = await db.insert(personas).values(persona).returning();
    return newPersona;
  }
  
  async updatePersona(id: number, persona: Partial<InsertPersona>): Promise<Persona | undefined> {
    // If this is being set as default, unset any existing defaults
    if (persona.isDefault) {
      const [currentPersona] = await db
        .select()
        .from(personas)
        .where(eq(personas.id, id));
      
      if (currentPersona) {
        await db
          .update(personas)
          .set({ isDefault: false })
          .where(and(
            eq(personas.dealershipId, currentPersona.dealershipId),
            eq(personas.isDefault, true),
            sql`${personas.id} != ${id}`
          ));
      }
    }
    
    const [updatedPersona] = await db
      .update(personas)
      .set({ ...persona, updatedAt: new Date() })
      .where(eq(personas.id, id))
      .returning();
    return updatedPersona;
  }
  
  // API Key operations
  async verifyApiKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.key, key),
        eq(apiKeys.isActive, true)
      ));
    
    if (apiKey) {
      // Update last used timestamp
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, apiKey.id));
    }
    
    return apiKey;
  }
  
  async generateApiKey(dealershipId: number, description?: string): Promise<ApiKey> {
    // Generate a cryptographically secure random API key
    const randomKey = randomBytes(32).toString('hex');
    const key = `ryk_${randomKey}`;
    
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        dealershipId,
        key,
        description: description || `API Key for Dealership ${dealershipId}`,
        isActive: true
      })
      .returning();
    
    return apiKey;
  }
  
  async getApiKeysByDealership(dealershipId: number): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.dealershipId, dealershipId))
      .orderBy(desc(apiKeys.createdAt));
  }
  
  async updateApiKeyStatus(id: number, isActive: boolean): Promise<ApiKey | undefined> {
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set({ isActive })
      .where(eq(apiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  // A/B Testing - Prompt Variant operations
  async getPromptVariant(id: number): Promise<PromptVariant | undefined> {
    const [variant] = await db.select().from(promptVariants).where(eq(promptVariants.id, id));
    return variant;
  }

  async getPromptVariantsByDealership(dealershipId: number, includeInactive: boolean = false): Promise<PromptVariant[]> {
    let query = db.select().from(promptVariants).where(eq(promptVariants.dealershipId, dealershipId));
    
    if (!includeInactive) {
      query = query.where(eq(promptVariants.isActive, true));
    }
    
    return await query.orderBy(desc(promptVariants.isControl), desc(promptVariants.createdAt));
  }

  async createPromptVariant(variant: InsertPromptVariant): Promise<PromptVariant> {
    // If this variant is set as control, make sure no other variant for this dealership is set as control
    if (variant.isControl) {
      await db.update(promptVariants)
        .set({ isControl: false })
        .where(
          and(
            eq(promptVariants.dealershipId, variant.dealershipId),
            eq(promptVariants.isControl, true)
          )
        );
    }
    
    const [newVariant] = await db.insert(promptVariants).values(variant).returning();
    return newVariant;
  }

  async updatePromptVariant(id: number, variant: Partial<InsertPromptVariant>): Promise<PromptVariant | undefined> {
    // If this variant is being set as control, make sure no other variant for this dealership is set as control
    if (variant.isControl) {
      const [existingVariant] = await db.select().from(promptVariants).where(eq(promptVariants.id, id));
      
      if (existingVariant) {
        await db.update(promptVariants)
          .set({ isControl: false })
          .where(
            and(
              eq(promptVariants.dealershipId, existingVariant.dealershipId),
              eq(promptVariants.isControl, true),
              sql`${promptVariants.id} != ${id}`
            )
          );
      }
    }
    
    const [updatedVariant] = await db.update(promptVariants)
      .set({
        ...variant,
        updatedAt: new Date()
      })
      .where(eq(promptVariants.id, id))
      .returning();
    return updatedVariant;
  }

  async setControlVariant(id: number, dealershipId: number): Promise<PromptVariant | undefined> {
    // Clear any existing control variants
    await db.update(promptVariants)
      .set({ isControl: false })
      .where(
        and(
          eq(promptVariants.dealershipId, dealershipId),
          eq(promptVariants.isControl, true)
        )
      );
    
    // Set the new control variant
    const [controlVariant] = await db.update(promptVariants)
      .set({ 
        isControl: true,
        updatedAt: new Date()
      })
      .where(eq(promptVariants.id, id))
      .returning();
    
    return controlVariant;
  }

  // A/B Testing - Experiment operations
  async getPromptExperiment(id: number): Promise<PromptExperiment | undefined> {
    const [experiment] = await db.select().from(promptExperiments).where(eq(promptExperiments.id, id));
    return experiment;
  }

  async getPromptExperimentWithVariants(id: number): Promise<any | undefined> {
    const [experiment] = await db.select().from(promptExperiments).where(eq(promptExperiments.id, id));
    
    if (!experiment) {
      return undefined;
    }
    
    // Get all variants for this experiment
    const experimentVariantsWithData = await db.select({
      assignment: experimentVariants,
      variant: promptVariants
    })
    .from(experimentVariants)
    .innerJoin(
      promptVariants,
      eq(experimentVariants.variantId, promptVariants.id)
    )
    .where(eq(experimentVariants.experimentId, id));
    
    const variants = experimentVariantsWithData.map(item => ({
      id: item.variant.id,
      name: item.variant.name,
      promptTemplate: item.variant.promptTemplate,
      isControl: item.variant.isControl,
      trafficAllocation: item.assignment.trafficAllocation
    }));
    
    return {
      ...experiment,
      variants
    };
  }

  async getPromptExperiments(dealershipId: number): Promise<PromptExperiment[]> {
    return await db.select()
      .from(promptExperiments)
      .where(eq(promptExperiments.dealershipId, dealershipId))
      .orderBy(desc(promptExperiments.createdAt));
  }

  async getActivePromptExperiments(dealershipId: number): Promise<PromptExperiment[]> {
    const now = new Date();
    
    return await db.select()
      .from(promptExperiments)
      .where(
        and(
          eq(promptExperiments.dealershipId, dealershipId),
          eq(promptExperiments.isActive, true),
          lte(promptExperiments.startDate, now),
          or(
            isNull(promptExperiments.endDate),
            gte(promptExperiments.endDate, now)
          )
        )
      )
      .orderBy(desc(promptExperiments.createdAt));
  }

  async createPromptExperiment(experiment: InsertPromptExperiment): Promise<PromptExperiment> {
    const [newExperiment] = await db.insert(promptExperiments).values(experiment).returning();
    return newExperiment;
  }

  async updatePromptExperiment(id: number, experiment: Partial<InsertPromptExperiment>): Promise<PromptExperiment | undefined> {
    const [updatedExperiment] = await db.update(promptExperiments)
      .set(experiment)
      .where(eq(promptExperiments.id, id))
      .returning();
    return updatedExperiment;
  }

  // A/B Testing - Experiment Variant operations
  async addVariantToExperiment(experimentId: number, variantId: number, trafficAllocation: number): Promise<ExperimentVariant> {
    const [experimentVariant] = await db.insert(experimentVariants)
      .values({
        experimentId,
        variantId,
        trafficAllocation
      })
      .returning();
    return experimentVariant;
  }

  async removeVariantFromExperiment(experimentId: number, variantId: number): Promise<boolean> {
    const result = await db.delete(experimentVariants)
      .where(
        and(
          eq(experimentVariants.experimentId, experimentId),
          eq(experimentVariants.variantId, variantId)
        )
      );
    
    return result.rowCount > 0;
  }

  async updateVariantTrafficAllocation(experimentId: number, variantId: number, trafficAllocation: number): Promise<ExperimentVariant | undefined> {
    const [updatedVariant] = await db.update(experimentVariants)
      .set({ trafficAllocation })
      .where(
        and(
          eq(experimentVariants.experimentId, experimentId),
          eq(experimentVariants.variantId, variantId)
        )
      )
      .returning();
    return updatedVariant;
  }

  // A/B Testing - Metrics operations
  async getPromptMetrics(variantId: number): Promise<PromptMetrics[]> {
    return await db.select()
      .from(promptMetrics)
      .where(eq(promptMetrics.variantId, variantId))
      .orderBy(desc(promptMetrics.createdAt));
  }

  async getPromptMetricsByConversation(conversationId: number): Promise<PromptMetrics | undefined> {
    const [metric] = await db.select()
      .from(promptMetrics)
      .where(eq(promptMetrics.conversationId, conversationId));
    return metric;
  }

  async createPromptMetric(metric: InsertPromptMetrics): Promise<PromptMetrics> {
    const [newMetric] = await db.insert(promptMetrics).values(metric).returning();
    return newMetric;
  }

  async updatePromptMetric(id: number, metric: Partial<InsertPromptMetrics>): Promise<PromptMetrics | undefined> {
    const [updatedMetric] = await db.update(promptMetrics)
      .set(metric)
      .where(eq(promptMetrics.id, id))
      .returning();
    return updatedMetric;
  }
}

export const storage = new DatabaseStorage();
