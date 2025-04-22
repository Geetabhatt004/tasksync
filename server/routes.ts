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

  // Projects API
  app.get("/api/projects", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const userId = req.user!.id;
      const projects = await storage.getUserProjects(userId);
      res.status(200).json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
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

  app.post("/api/projects", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...validatedData,
        ownerId: req.user!.id
      });
      
      // Add owner as a project member
      await storage.addMemberToProject({
        projectId: project.id,
        userId: req.user!.id
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is the owner
      if (project.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(projectId, validatedData);
      
      res.status(200).json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is the owner
      if (project.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Delete all tasks in the project
      const tasks = await storage.getProjectTasks(projectId);
      for (const task of tasks) {
        await storage.deleteTask(task.id);
      }
      
      // Delete the project
      await storage.deleteProject(projectId);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Project Members API
  app.get("/api/projects/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
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
      
      const members = await storage.getProjectMembers(projectId);
      res.status(200).json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/projects/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is the owner
      if (project.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already a member
      const members = await storage.getProjectMembers(projectId);
      if (members.some(m => m.id === userId)) {
        return res.status(400).json({ message: "User is already a member of this project" });
      }
      
      // Add user to project
      const membership = await storage.addMemberToProject({
        projectId,
        userId
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is the owner
      if (project.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Prevent removing the owner
      if (userId === project.ownerId) {
        return res.status(400).json({ message: "Cannot remove the project owner" });
      }
      
      // Remove user from project
      const success = await storage.removeProjectMember(projectId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "User is not a member of this project" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Tasks API
  app.get("/api/projects/:id/tasks", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
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
      
      const tasks = await storage.getProjectTasks(projectId);
      res.status(200).json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tasks", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const userId = req.user!.id;
      const tasks = await storage.getUserTasks(userId);
      res.status(200).json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/projects/:id/tasks", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
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
      
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        projectId
      });
      
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to the task's project
      const userId = req.user!.id;
      const userProjects = await storage.getUserProjects(userId);
      const hasAccess = userProjects.some(p => p.id === task.projectId);
      
      if (!hasAccess && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(taskId, validatedData);
      
      res.status(200).json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to the task's project
      const userId = req.user!.id;
      const userProjects = await storage.getUserProjects(userId);
      const hasAccess = userProjects.some(p => p.id === task.projectId);
      
      if (!hasAccess && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteTask(taskId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all users for admin and task assignment
  app.get("/api/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Regular users can only see this for task assignment
      const users = Array.from((await storage.getAllProjects()).values()).map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }));
      
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Automation Endpoints
  
  // Mock email/notification for task deadline reminder
  app.get("/api/automation/task-reminders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
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
  
  // Check for overdue tasks and update their status
  app.get("/api/automation/update-overdue", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
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
      
      res.status(200).json(updatedTasks);
    } catch (error) {
      console.error("Error updating overdue tasks:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get daily task summary for a user
  app.get("/api/automation/daily-summary", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const userId = req.user!.id;
      const tasks = await storage.getUserTasks(userId);
      
      // Group tasks by status
      const summary = {
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'inProgress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
        overdue: tasks.filter(t => t.status === 'overdue').length,
        dueSoon: 0,
        total: tasks.length
      };
      
      // Find tasks due in the next 48 hours
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      summary.dueSoon = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= in48Hours && task.status !== 'done';
      }).length;
      
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error generating daily summary:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
