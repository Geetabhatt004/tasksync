import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Task } from "@shared/schema";
import { KanbanColumn } from "./kanban-column";
import { TaskModal } from "@/components/modals/task-modal";
import { statusColors } from "@/lib/utils";

interface KanbanBoardProps {
  projectId: number;
  projectMembers: { id: number; name: string; image?: string }[];
}

export function KanbanBoard({ projectId, projectMembers }: KanbanBoardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Fetch project tasks
  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    staleTime: 60000, // 1 minute
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !tasks) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
        Error loading tasks. Please try again.
      </div>
    );
  }
  
  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "inProgress");
  const reviewTasks = tasks.filter((task) => task.status === "review");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const overdueTasks = tasks.filter((task) => task.status === "overdue");
  
  const handleOpenTaskModal = () => {
    setIsTaskModalOpen(true);
  };
  
  return (
    <>
      <div className="px-4 py-5 md:px-6 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <KanbanColumn
            title="To Do"
            count={todoTasks.length}
            status="todo"
            tasks={todoTasks}
            projectId={projectId}
            projectMembers={projectMembers}
            onAddTask={handleOpenTaskModal}
            statusColors={statusColors}
          />
          
          <KanbanColumn
            title="In Progress"
            count={inProgressTasks.length}
            status="inProgress"
            tasks={inProgressTasks}
            projectId={projectId}
            projectMembers={projectMembers}
            onAddTask={handleOpenTaskModal}
            statusColors={statusColors}
          />
          
          <KanbanColumn
            title="Review"
            count={reviewTasks.length}
            status="review"
            tasks={reviewTasks}
            projectId={projectId}
            projectMembers={projectMembers}
            onAddTask={handleOpenTaskModal}
            statusColors={statusColors}
          />
          
          <KanbanColumn
            title="Done"
            count={doneTasks.length}
            status="done"
            tasks={doneTasks}
            projectId={projectId}
            projectMembers={projectMembers}
            onAddTask={handleOpenTaskModal}
            statusColors={statusColors}
          />
          
          <KanbanColumn
            title="Overdue"
            count={overdueTasks.length}
            status="overdue"
            tasks={overdueTasks}
            projectId={projectId}
            projectMembers={projectMembers}
            onAddTask={handleOpenTaskModal}
            statusColors={statusColors}
          />
        </div>
      </div>
      
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={projectId}
          projectMembers={projectMembers}
        />
      )}
    </>
  );
}
