import { 
  users, User, InsertUser,
  projects, Project, InsertProject,
  tasks, Task, InsertTask,
  projectMembers, ProjectMember, InsertProjectMember
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getProjectTasks(projectId: number): Promise<Task[]>;
  getUserTasks(userId: number): Promise<Task[]>;
  getTasksByStatus(projectId: number, status: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Project members operations
  addMemberToProject(projectMember: InsertProjectMember): Promise<ProjectMember>;
  getProjectMembers(projectId: number): Promise<User[]>;
  removeProjectMember(projectId: number, userId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private projectMembers: Map<number, ProjectMember>;
  
  private userId: number;
  private projectId: number;
  private taskId: number;
  private membershipId: number;
  
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.projectMembers = new Map();
    
    this.userId = 1;
    this.projectId = 1;
    this.taskId = 1;
    this.membershipId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    
    // Add sample data
    this.seedSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    // Get projects owned by the user
    const ownedProjects = Array.from(this.projects.values())
      .filter(project => project.ownerId === userId);
    
    // Get project memberships for the user
    const memberProjectIds = Array.from(this.projectMembers.values())
      .filter(membership => membership.userId === userId)
      .map(membership => membership.projectId);
    
    // Get projects the user is a member of
    const memberProjects = Array.from(this.projects.values())
      .filter(project => memberProjectIds.includes(project.id));
    
    // Combine and deduplicate
    return [...new Set([...ownedProjects, ...memberProjects])];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
  }

  async getUserTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assigneeId === userId);
  }

  async getTasksByStatus(projectId: number, status: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId && task.status === status);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const createdAt = new Date();
    const task: Task = { ...insertTask, id, createdAt };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...data };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Project members operations
  async addMemberToProject(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const id = this.membershipId++;
    const membership: ProjectMember = { ...insertMember, id };
    this.projectMembers.set(id, membership);
    return membership;
  }

  async getProjectMembers(projectId: number): Promise<User[]> {
    const memberIds = Array.from(this.projectMembers.values())
      .filter(membership => membership.projectId === projectId)
      .map(membership => membership.userId);
    
    return Array.from(this.users.values())
      .filter(user => memberIds.includes(user.id));
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const membershipToRemove = Array.from(this.projectMembers.values())
      .find(membership => membership.projectId === projectId && membership.userId === userId);
    
    if (!membershipToRemove) return false;
    
    return this.projectMembers.delete(membershipToRemove.id);
  }

  // Helper method to seed some initial data
  private seedSampleData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "$2a$10$xVNkOIxUSGgGnNWr0GVEAu1ECKbKK9oR5xRJm0fQrXt5RgO47Rxdi", // "password"
      email: "admin@taskflow.com",
      name: "Admin User",
      role: "admin"
    };
    this.createUser(adminUser);
    
    // Create a sample user
    const sampleUser: InsertUser = {
      username: "alexmorgan",
      password: "$2a$10$xVNkOIxUSGgGnNWr0GVEAu1ECKbKK9oR5xRJm0fQrXt5RgO47Rxdi", // "password"
      email: "alex@example.com",
      name: "Alex Morgan",
      role: "user"
    };
    this.createUser(sampleUser);
  }
}

export const storage = new MemStorage();
