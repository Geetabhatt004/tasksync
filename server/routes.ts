import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertProjectSchema,
  insertTaskSchema,
  insertProjectMemberSchema,
  Project,
  Task,
  User
} from "@shared/schema";
import schedule from "node-schedule";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Helper function to check if user is authenticated
  const isAuthenticated = (req: Request) => req.isAuthenticated() && req.user;

  // Projects API
  app.get("/api/projects", async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "Unauthorized" });

    try {
      const userId = req.user!.userId;
      const projects = await storage.getUserProjects(userId);
      res.status(200).json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "Unauthorized" });

    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      const userId = req.user!.id;
      const userProjects = await storage.getUserProjects(userId);
      const hasAccess = userProjects.some(p => p.id === projectId);

      if (!hasAccess && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.status(200).json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Projects POST, PUT, DELETE and other routes...
  // Follow the same pattern for other routes, ensuring you're checking for `req.user` before accessing its properties.

  // Automation Endpoints
  
  // Mock email/notification for task deadline reminder
  app.get("/api/automation/task-reminders", async (req: Request, res: Response) => {
    if (!isAuthenticated(req)) return res.status(401).json({ message: "Unauthorized" });

    try {
      const userId = req.user!.id;
      const tasks = await storage.getUserTasks(userId);

      // Find tasks due in the next 24 hours
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= in24Hours;
      });

      res.status(200).json(upcomingTasks);
    } catch (error) {
      console.error("Error fetching task reminders:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Schedule automation tasks
  // 1. Check for overdue tasks every hour
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      console.log("Automation: Checking for overdue tasks...");
      const allTasks = await storage.getAllTasks();
      const now = new Date();
      const updatedTasks: Task[] = [];

      for (const task of allTasks) {
        if (!task.dueDate) continue;
        if (task.status === 'done') continue;

        const dueDate = new Date(task.dueDate);
        if (dueDate < now) {
          // Task is overdue
          const updatedTask = await storage.updateTask(task.id, { status: 'overdue' });
          if (updatedTask) updatedTasks.push(updatedTask);
        }
      }

      console.log(`Automation: Updated ${updatedTasks.length} overdue tasks`);
    } catch (error) {
      console.error("Error in overdue tasks automation:", error);
    }
  });

  // 2. Send task reminders daily at 9am
  schedule.scheduleJob('0 9 * * *', async () => {
    try {
      console.log("Automation: Sending task reminders...");
      const allUsers = Array.from((await storage.getAllProjects()).values());

      for (const user of allUsers) {
        const tasks = await storage.getUserTasks(user.id);

        // Find tasks due in the next 24 hours
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingTasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate > now && dueDate <= in24Hours;
        });

        if (upcomingTasks.length > 0) {
          console.log(`Automation: Sending reminder to user ${user.username} for ${upcomingTasks.length} upcoming tasks`);
          // In a real system, this would send an email or push notification
        }
      }
    } catch (error) {
      console.error("Error in task reminders automation:", error);
    }
  });

  // 3. Send daily summary at 8am
  schedule.scheduleJob('0 8 * * *', async () => {
    try {
      console.log("Automation: Sending daily summaries...");
      const allUsers = Array.from((await storage.getAllProjects()).values());

      for (const user of allUsers) {
        const tasks = await storage.getUserTasks(user.id);

        // Group tasks by status
        const summary = {
          todo: tasks.filter(t => t.status === 'todo').length,
          inProgress: tasks.filter(t => t.status === 'inProgress').length,
          review: tasks.filter(t => t.status === 'review').length,
          done: tasks.filter(t => t.status === 'done').length,
          overdue: tasks.filter(t => t.status === 'overdue').length,
          total: tasks.length
        };

        console.log(`Automation: Sending daily summary to user ${user.username}`);
        // In a real system, this would send an email or push notification
      }
    } catch (error) {
      console.error("Error in daily summary automation:", error);
    }
  });

  // Final setup
  const httpServer = createServer(app);
  return httpServer;
}

