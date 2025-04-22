import { useState } from "react";
import { 
  Edit2, Trash2, MessageSquare 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Task } from "@shared/schema";
import { cn, formatDate, priorityColors } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TaskModal } from "@/components/modals/task-modal";

interface TaskCardProps {
  task: Task;
  projectId: number; 
  projectMembers: { id: number; name: string; image?: string }[];
  canEdit?: boolean;
}

export function TaskCard({ 
  task, 
  projectId, 
  projectMembers, 
  canEdit = true 
}: TaskCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const assignee = task.assigneeId 
    ? projectMembers.find(member => member.id === task.assigneeId) 
    : null;
  
  const priorityStyle = priorityColors[task.priority as keyof typeof priorityColors];
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };
  
  return (
    <>
      <div className={cn(
        "task-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow",
        task.status === 'done' && "opacity-70"
      )}>
        <div className="flex justify-between items-start">
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            priorityStyle.bg,
            priorityStyle.text
          )}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          
          {canEdit && (
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-gray-600"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-gray-600"
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <h4 className="mt-3 text-sm font-medium text-gray-900">{task.title}</h4>
        
        {task.description && (
          <p className="mt-1 text-xs text-gray-500">{task.description}</p>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            {assignee ? (
              <Avatar className="h-6 w-6 rounded-full">
                {assignee.image ? (
                  <AvatarImage src={assignee.image} alt={assignee.name} />
                ) : (
                  <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
            ) : (
              <Avatar className="h-6 w-6 rounded-full">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            )}
            <span className="ml-2 text-xs text-gray-500">
              {task.dueDate ? formatDate(task.dueDate) : "No due date"}
            </span>
          </div>
          
          <div className="flex items-center text-gray-500 text-xs">
            <MessageSquare className="h-4 w-4 mr-1" />
            0
          </div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <TaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={projectId}
          task={task}
          projectMembers={projectMembers}
        />
      )}
    </>
  );
}
