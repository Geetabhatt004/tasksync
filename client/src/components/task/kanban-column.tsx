import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task } from "@shared/schema";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  title: string;
  count: number;
  status: string;
  tasks: Task[];
  projectId: number;
  projectMembers: { id: number; name: string; image?: string }[];
  onAddTask: () => void;
  className?: string;
  statusColors: Record<string, { bg: string; text: string }>;
}

export function KanbanColumn({
  title,
  count,
  status,
  tasks,
  projectId,
  projectMembers,
  onAddTask,
  className,
  statusColors
}: KanbanColumnProps) {
  const statusColor = statusColors[status as keyof typeof statusColors] || statusColors.todo;
  
  return (
    <div className={cn("bg-white rounded-lg shadow", className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            statusColor.bg,
            statusColor.text
          )}>
            {count}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3 kanban-column min-h-[60vh]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectId={projectId}
            projectMembers={projectMembers}
          />
        ))}
        
        <Button
          variant="ghost"
          className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
          onClick={onAddTask}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
