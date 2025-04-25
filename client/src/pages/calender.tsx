import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarRange } from "lucide-react";
import { Task, Project } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, priorityColors } from "@/lib/utils";
import { useToastAutomation } from "@/hooks/use-toast-automation";
import { TaskModal } from "@/components/modals/task-modal";

export default function CalendarPage() {
  useToastAutomation(); // Show automated task reminders, etc.
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  
  // Fetch all tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch all projects for task creation
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Navigate between months
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  // Get days for the current month
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);
  
  // Group tasks by date
  const tasksByDate = useMemo(() => {
    if (!tasks) return new Map<string, Task[]>();
    
    const grouped = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)?.push(task);
      }
    });
    
    return grouped;
  }, [tasks]);
  
  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate || !tasks) return [];
    
    return tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), selectedDate)
    );
  }, [selectedDate, tasks]);
  
  // Handler for date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Open task creation modal
  const handleNewTask = () => {
    if (selectedDate) {
      setIsNewTaskModalOpen(true);
    }
  };
  
  // Project ID for the first project (fallback)
  const firstProjectId = projects && Array.isArray(projects) && projects.length > 0 ? projects[0].id : 1;
  
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 lg:pb-0">
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center px-3 font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle>Task Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Day Labels */}
                    <div className="grid grid-cols-7 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-sm font-medium text-center text-gray-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for spacing */}
                      {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                        <div key={`empty-start-${i}`} className="h-24 p-1 border border-transparent"></div>
                      ))}
                      
                      {/* Day cells */}
                      {daysInMonth.map((date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const dayTasks = tasksByDate.get(dateKey) || [];
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        
                        return (
                          <div
                            key={dateKey}
                            className={cn(
                              "h-24 overflow-hidden border border-gray-200 rounded-md p-1 cursor-pointer transition-colors",
                              isSelected ? "bg-blue-50 border-blue-300" : "",
                              isToday ? "bg-yellow-50" : ""
                            )}
                            onClick={() => handleDateClick(date)}
                          >
                            <div className="flex justify-between items-start">
                              <span className={cn(
                                "text-sm font-medium",
                                isToday ? "text-blue-600" : "",
                                isSelected ? "text-blue-700" : ""
                              )}>
                                {format(date, 'd')}
                              </span>
                              {dayTasks.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                  {dayTasks.length}
                                </span>
                              )}
                            </div>
                            
                            {/* Tasks for this day */}
                            <div className="mt-1 space-y-1 overflow-hidden max-h-16">
                              {dayTasks.slice(0, 2).map((task) => {
                                const priorityStyle = priorityColors[task.priority as keyof typeof priorityColors];
                                return (
                                  <div
                                    key={task.id}
                                    className={cn(
                                      "text-xs truncate py-0.5 px-1.5 rounded",
                                      priorityStyle.bg,
                                      priorityStyle.text
                                    )}
                                  >
                                    {task.title}
                                  </div>
                                );
                              })}
                              {dayTasks.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{dayTasks.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Empty cells for spacing at the end */}
                      {Array.from({ length: 6 - endOfMonth(currentMonth).getDay() }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="h-24 p-1 border border-transparent"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Selected Day Details */}
                <Card>
                  <CardHeader className="pb-2 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle>
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
                      </CardTitle>
                      {selectedDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    {selectedDate && (
                      <Button size="sm" onClick={handleNewTask}>
                        + Add Task
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!selectedDate ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CalendarIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          Select a date to view or add tasks
                        </p>
                      </div>
                    ) : selectedDateTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-gray-500 mb-3">No tasks scheduled for this day</p>
                        <Button size="sm" onClick={handleNewTask}>
                          Add Task
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-2">
                        {selectedDateTasks.map((task) => {
                          const priorityStyle = priorityColors[task.priority as keyof typeof priorityColors];
                          return (
                            <div 
                              key={task.id} 
                              className="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                            >
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium">{task.title}</h3>
                                <Badge className={cn(
                                  "font-normal",
                                  priorityStyle.bg,
                                  priorityStyle.text
                                )}>
                                  {task.priority}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <span className={cn(
                                  "px-2 py-1 rounded",
                                  task.status === 'todo' ? 'bg-gray-100' :
                                  task.status === 'inProgress' ? 'bg-blue-100 text-blue-800' :
                                  task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                                  task.status === 'done' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                )}>
                                  {task.status === 'todo' ? 'To Do' :
                                   task.status === 'inProgress' ? 'In Progress' :
                                   task.status === 'review' ? 'Review' :
                                   task.status === 'done' ? 'Done' : 'Overdue'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
        
        <MobileNav />
      </div>
      
      {/* New Task Modal */}
      {isNewTaskModalOpen && selectedDate && (
        <TaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          projectId={firstProjectId}
          projectMembers={[]}
          initialDueDate={selectedDate instanceof Date ? selectedDate : new Date(selectedDate)} // Correct usage
        />
      )}
    </div>
  );
}