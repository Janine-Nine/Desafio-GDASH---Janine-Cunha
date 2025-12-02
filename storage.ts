import { 
  users, 
  weatherLogs, 
  insights,
  type User, 
  type InsertUser,
  type WeatherLog,
  type InsertWeatherLog,
  type Insight,
  type InsertInsight
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Weather log operations
  createWeatherLog(log: InsertWeatherLog): Promise<WeatherLog>;
  getAllWeatherLogs(): Promise<WeatherLog[]>;
  getRecentWeatherLogs(limit: number): Promise<WeatherLog[]>;

  // Insight operations
  createInsight(insight: InsertInsight): Promise<Insight>;
  getAllInsights(): Promise<Insight[]>;
  getRecentInsights(limit: number): Promise<Insight[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Weather log operations
  async createWeatherLog(log: InsertWeatherLog): Promise<WeatherLog> {
    const [weatherLog] = await db
      .insert(weatherLogs)
      .values(log)
      .returning();
    return weatherLog;
  }

  async getAllWeatherLogs(): Promise<WeatherLog[]> {
    return await db.select().from(weatherLogs).orderBy(desc(weatherLogs.timestamp));
  }

  async getRecentWeatherLogs(limit: number): Promise<WeatherLog[]> {
    return await db
      .select()
      .from(weatherLogs)
      .orderBy(desc(weatherLogs.timestamp))
      .limit(limit);
  }

  // Insight operations
  async createInsight(insight: InsertInsight): Promise<Insight> {
    const [newInsight] = await db
      .insert(insights)
      .values(insight)
      .returning();
    return newInsight;
  }

  async getAllInsights(): Promise<Insight[]> {
    return await db.select().from(insights).orderBy(desc(insights.timestamp));
  }

  async getRecentInsights(limit: number): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .orderBy(desc(insights.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
