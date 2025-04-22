import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TaskContextType = {
  tasks: Task[] | null;
  isLoading: boolean;
  error: Error | null;
  projectTasks: (projectId: number) => {
    tasks: Task[] | null;
    isLoading: boolean;
    error: Error | null;
  };
  createTask: (projectId: number, task: Omit<InsertTask, "projectId">) => Promise<Task | undefined>;
  updateTask: (id: number, task: Partial<Task>) => Promise<Task | undefined>;
  deleteTask: (id: number) => Promise<boolean>;
  getTasks: () => Promise<Task[]>;
};

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all user tasks
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Function to get project-specific tasks
  const projectTasks = (projectId: number) => {
    const {
      data: tasks,
      isLoading,
      error,
    } = useQuery<Task[]>({
      queryKey: [`/api/projects/${projectId}/tasks`],
      enabled: !!projectId,
    });
    
    return { tasks, isLoading, error };
  };
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async ({ projectId, taskData }: { projectId: number; taskData: Omit<InsertTask, "projectId"> }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/tasks`, taskData);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${variables.projectId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const res = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${task.projectId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] }); // Refresh all project tasks
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper methods to expose more friendly API
  const createTask = async (projectId: number, taskData: Omit<InsertTask, "projectId">): Promise<Task | undefined> => {
    try {
      return await createTaskMutation.mutateAsync({ projectId, taskData });
    } catch (error) {
      return undefined;
    }
  };
  
  const updateTask = async (id: number, taskData: Partial<Task>): Promise<Task | undefined> => {
    try {
      return await updateTaskMutation.mutateAsync({ id, data: taskData });
    } catch (error) {
      return undefined;
    }
  };
  
  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      return await deleteTaskMutation.mutateAsync(id);
    } catch (error) {
      return false;
    }
  };
  
  const getTasks = async (): Promise<Task[]> => {
    try {
      const res = await fetch("/api/tasks", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Error fetching tasks: ${res.status}`);
      }
      
      return await res.json();
    } catch (error) {
      toast({
        title: "Failed to fetch tasks",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return [];
    }
  };
  
  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        projectTasks,
        createTask,
        updateTask,
        deleteTask,
        getTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}
