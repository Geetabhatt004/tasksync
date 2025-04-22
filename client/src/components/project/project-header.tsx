import { useState } from "react";
import { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { UserPlus, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TaskModal } from "@/components/modals/task-modal";

interface ProjectHeaderProps {
  project: Project;
  projectMembers: { id: number; name: string; image?: string }[];
}

export function ProjectHeader({ project, projectMembers }: ProjectHeaderProps) {
  const [activeView, setActiveView] = useState<string>("board");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const handleOpenTaskModal = () => {
    setIsTaskModalOpen(true);
  };
  
  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            {project.deadline && (
              <p className="mt-1 text-xs text-gray-500">
                Deadline: {formatDate(project.deadline)}
              </p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <AvatarGroup users={projectMembers} max={4} />
            
            <Button size="sm" variant="outline" className="h-9">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
            
            <Button 
              size="sm" 
              variant="default" 
              className="h-9 bg-primary hover:bg-blue-600"
              onClick={handleOpenTaskModal}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
        
        <div className="px-6 pb-2">
          <div className="flex items-center space-x-4 overflow-x-auto">
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === "board"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("board")}
            >
              Board View
            </button>
            
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === "list"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("list")}
            >
              List View
            </button>
            
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === "calendar"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("calendar")}
            >
              Calendar
            </button>
            
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === "files"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("files")}
            >
              Files
            </button>
            
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === "discussion"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveView("discussion")}
            >
              Discussion
            </button>
          </div>
        </div>
      </div>
      
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={project.id}
          projectMembers={projectMembers}
        />
      )}
    </>
  );
}
