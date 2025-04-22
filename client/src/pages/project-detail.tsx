import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ProjectHeader } from "@/components/project/project-header";
import { KanbanBoard } from "@/components/task/kanban-board";
import { Project, User } from "@shared/schema";
import { useToastAutomation } from "@/hooks/use-toast-automation";

export default function ProjectDetail() {
  useToastAutomation(); // Show automated task reminders, etc.
  const [, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0");
  
  // Fetch project data
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  // Fetch project members
  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });
  
  if (isLoadingProject || isLoadingMembers) {
    return (
      <div className="h-screen flex overflow-hidden">
        <Sidebar className="hidden lg:flex" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  if (projectError || !project) {
    return (
      <div className="h-screen flex overflow-hidden">
        <Sidebar className="hidden lg:flex" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="px-6 py-8">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
                Error loading project. Please try again.
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  const projectMembers = members?.map(member => ({
    id: member.id,
    name: member.name
  })) || [];
  
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 lg:pb-0">
          <ProjectHeader project={project} projectMembers={projectMembers} />
          <KanbanBoard projectId={projectId} projectMembers={projectMembers} />
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
