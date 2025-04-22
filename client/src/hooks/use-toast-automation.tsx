import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@shared/schema";
import { formatDate } from "@/lib/utils";

// This hook handles all the automated toasts and notifications
export function useToastAutomation() {
  const { toast } = useToast();
  const [hasShownReminders, setHasShownReminders] = useState(false);
  const [hasShownSummary, setHasShownSummary] = useState(false);
  
  // Fetch task reminders (tasks due in the next 24 hours)
  const { data: upcomingTasks } = useQuery<Task[]>({
    queryKey: ["/api/automation/task-reminders"],
    enabled: !hasShownReminders,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch daily summary
  const { data: summary } = useQuery({
    queryKey: ["/api/automation/daily-summary"],
    enabled: !hasShownSummary,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
  
  // Fetch and update overdue tasks
  useQuery({
    queryKey: ["/api/automation/update-overdue"],
    refetchInterval: 1000 * 60 * 30, // Check every 30 minutes
  });
  
  // Show task reminders
  useEffect(() => {
    if (upcomingTasks && upcomingTasks.length > 0 && !hasShownReminders) {
      // Show a toast for each upcoming task, but limit to 3 max
      upcomingTasks.slice(0, 3).forEach((task, index) => {
        setTimeout(() => {
          toast({
            title: "Task Deadline Reminder",
            description: `"${task.title}" is due ${task.dueDate ? `on ${formatDate(task.dueDate)}` : "soon"}.`,
            variant: "warning",
          });
        }, index * 1000); // Stagger toasts
      });
      
      // If there are more, show a summary
      if (upcomingTasks.length > 3) {
        setTimeout(() => {
          toast({
            title: "Task Reminders",
            description: `You have ${upcomingTasks.length} tasks due in the next 24 hours.`,
            variant: "warning",
          });
        }, 3500);
      }
      
      setHasShownReminders(true);
    }
  }, [upcomingTasks, hasShownReminders, toast]);
  
  // Show daily summary toast once
  useEffect(() => {
    if (summary && !hasShownSummary) {
      // Check if summary has any overdue or due soon tasks
      if (summary.overdue > 0 || summary.dueSoon > 0) {
        setTimeout(() => {
          toast({
            title: "Daily Task Summary",
            description: `You have ${summary.overdue} overdue tasks and ${summary.dueSoon} tasks due soon.`,
            variant: "default",
          });
        }, 2000);
      }
      
      setHasShownSummary(true);
    }
  }, [summary, hasShownSummary, toast]);
  
  return null;
}
