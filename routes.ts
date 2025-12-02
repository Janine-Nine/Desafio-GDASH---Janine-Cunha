import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken, authMiddleware } from "./auth";
import { insightsGenerator } from "./insights";
import { generateCSV, generateXLSX } from "./export";
import { insertUserSchema, loginSchema, insertWeatherLogSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== AUTH ROUTES ====================
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.message });
      }

      const { email, password } = result.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      await storage.updateUserLastLogin(user.id);
      const token = generateToken(user);

      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== USER ROUTES ====================
  
  // Get all users
  app.get("/api/users", authMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create user
  app.post("/api/users", authMiddleware, async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.message });
      }

      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await hashPassword(result.data.password);
      const user = await storage.createUser({
        ...result.data,
        password: hashedPassword
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user
  app.patch("/api/users/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== WEATHER ROUTES ====================
  
  // Get all weather logs
  app.get("/api/weather/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const logs = limit 
        ? await storage.getRecentWeatherLogs(limit)
        : await storage.getAllWeatherLogs();
      
      res.json(logs);
    } catch (error) {
      console.error("Get weather logs error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create weather log (from worker)
  app.post("/api/weather/logs", async (req, res) => {
    try {
      const result = insertWeatherLogSchema.safeParse(req.body);
      
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.message });
      }

      const log = await storage.createWeatherLog(result.data);
      
      // Generate insights automatically
      const recentLogs = await storage.getRecentWeatherLogs(24);
      const insights = insightsGenerator.generateInsights(recentLogs);
      
      // Store only new insights (avoid duplicates)
      for (const insight of insights.slice(0, 1)) {
        await storage.createInsight({
          ...insight,
          timestamp: new Date()
        });
      }
      
      res.status(201).json(log);
    } catch (error) {
      console.error("Create weather log error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Export weather data as CSV
  app.get("/api/weather/export.csv", async (req, res) => {
    try {
      const logs = await storage.getAllWeatherLogs();
      const csv = generateCSV(logs);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=weather_data.csv");
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Export weather data as XLSX
  app.get("/api/weather/export.xlsx", async (req, res) => {
    try {
      const logs = await storage.getAllWeatherLogs();
      const xlsx = generateXLSX(logs);
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=weather_data.xlsx");
      res.send(xlsx);
    } catch (error) {
      console.error("Export XLSX error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== INSIGHTS ROUTES ====================
  
  // Get all insights
  app.get("/api/insights", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const insights = limit
        ? await storage.getRecentInsights(limit)
        : await storage.getAllInsights();
      
      res.json(insights);
    } catch (error) {
      console.error("Get insights error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate new insights
  app.post("/api/insights/generate", authMiddleware, async (req, res) => {
    try {
      const recentLogs = await storage.getRecentWeatherLogs(48);
      const insights = insightsGenerator.generateInsights(recentLogs);
      
      const savedInsights = [];
      for (const insight of insights) {
        const saved = await storage.createInsight({
          ...insight,
          timestamp: new Date()
        });
        savedInsights.push(saved);
      }
      
      res.json(savedInsights);
    } catch (error) {
      console.error("Generate insights error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get energy efficiency analysis
  app.get("/api/insights/efficiency", async (req, res) => {
    try {
      const recentLogs = await storage.getRecentWeatherLogs(24);
      const analysis = insightsGenerator.analyzeEnergyEfficiency(recentLogs);
      res.json(analysis);
    } catch (error) {
      console.error("Get efficiency error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== SEED DEFAULT USER ====================
  
  // Create default admin user if not exists
  const defaultEmail = "admin@gdash.com";
  const existingAdmin = await storage.getUserByEmail(defaultEmail);
  
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("123456");
    await storage.createUser({
      name: "Admin User",
      email: defaultEmail,
      password: hashedPassword,
      role: "Admin",
      status: "Active"
    });
    console.log("✅ Default admin user created: admin@gdash.com / 123456");
  }

  return httpServer;
}
