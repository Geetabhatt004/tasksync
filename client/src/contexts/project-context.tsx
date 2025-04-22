import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, InsertProject } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProjectContextType = {
  projects: Project[] | null;
  isLoading: boolean;
  error: Error | null;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  createProject: (project: InsertProject) => Promise<Project | undefined>;
  updateProject: (id: number, project: Partial<Project>) => Promise<Project | undefined>;
  deleteProject: (id: number) => Promise<boolean>;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Fetch all projects
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      const res = await apiRequest("POST", "/api/projects", projectData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      const res = await apiRequest("PUT", `/api/projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper methods to expose more friendly API
  const createProject = async (project: InsertProject): Promise<Project | undefined> => {
    try {
      return await createProjectMutation.mutateAsync(project);
    } catch (error) {
      return undefined;
    }
  };
  
  const updateProject = async (id: number, project: Partial<Project>): Promise<Project | undefined> => {
    try {
      return await updateProjectMutation.mutateAsync({ id, data: project });
    } catch (error) {
      return undefined;
    }
  };
  
  const deleteProject = async (id: number): Promise<boolean> => {
    try {
      return await deleteProjectMutation.mutateAsync(id);
    } catch (error) {
      return false;
    }
  };
  
  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoading,
        error,
        selectedProject,
        setSelectedProject,
        createProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}
