import {
  users, type User, type InsertUser,
  dealerships, type Dealership, type InsertDealership,
  vehicles, type Vehicle, type InsertVehicle,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  personas, type Persona, type InsertPersona,
  apiKeys, type ApiKey, type InsertApiKey
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, asc, isNull, sql } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
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
}

export const storage = new DatabaseStorage();
