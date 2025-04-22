import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, Clock, ArrowUpDown } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Task } from "@shared/schema";
import { 
  formatDate, 
  priorityColors, 
  statusColors, 
  priorityMapping, 
  statusMapping 
} from "@/lib/utils";
import { useToastAutomation } from "@/hooks/use-toast-automation";
import { ClipboardList } from "lucide-react";

export default function Tasks() {
  useToastAutomation(); // Show automated task reminders, etc.
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Fetch user tasks
  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Apply filters and sorting
  const filteredTasks = tasks ? 
    tasks
      .filter(task => !statusFilter || task.status === statusFilter)
      .filter(task => !priorityFilter || task.priority === priorityFilter)
      .sort((a, b) => {
        if (sortField === "dueDate") {
          // Handle null dates
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return sortDirection === "asc" ? 1 : -1;
          if (!b.dueDate) return sortDirection === "asc" ? -1 : 1;
          
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        } else if (sortField === "priority") {
          const priorityValues = { high: 3, medium: 2, low: 1 };
          const valueA = priorityValues[a.priority as keyof typeof priorityValues] || 0;
          const valueB = priorityValues[b.priority as keyof typeof priorityValues] || 0;
          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
        } else if (sortField === "status") {
          const statusValues = { todo: 1, inProgress: 2, review: 3, done: 4, overdue: 5 };
          const valueA = statusValues[a.status as keyof typeof statusValues] || 0;
          const valueB = statusValues[b.status as keyof typeof statusValues] || 0;
          return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
        } else {
          // Default to sort by title
          return sortDirection === "asc" 
            ? a.title.localeCompare(b.title) 
            : b.title.localeCompare(a.title);
        }
      })
    : [];
  
  const getSummaryByStatus = () => {
    if (!tasks) return {};
    
    const summary: Record<string, number> = {
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      overdue: 0,
    };
    
    tasks.forEach(task => {
      if (summary[task.status]) {
        summary[task.status]++;
      }
    });
    
    return summary;
  };
  
  const statusCounts = getSummaryByStatus();
  
  // Table column headers
  const tableHeaders = [
    { label: "Task", field: "title" },
    { label: "Priority", field: "priority" },
    { label: "Status", field: "status" },
    { label: "Due Date", field: "dueDate" },
    { label: "Project", field: null },
  ];
  
  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 lg:pb-0">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>
            
            {/* Task Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">To Do</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold">{statusCounts.todo || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold text-blue-600">{statusCounts.inProgress || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Review</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold text-purple-600">{statusCounts.review || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Done</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold text-green-600">{statusCounts.done || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-2xl font-bold text-red-600">{statusCounts.overdue || 0}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Status: {statusFilter ? statusMapping[statusFilter as keyof typeof statusMapping] : 'All'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("todo")}>
                    To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inProgress")}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("review")}>
                    Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("done")}>
                    Done
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
                    Overdue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Priority: {priorityFilter ? priorityMapping[priorityFilter as keyof typeof priorityMapping] : 'All'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPriorityFilter(null)}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                    Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Sort: {sortField} {sortDirection === "asc" ? "↑" : "↓"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => toggleSort("dueDate")}>
                    Due Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("priority")}>
                    Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("status")}>
                    Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort("title")}>
                    Title
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Tasks Table */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
                Error loading tasks. Please try again.
              </div>
            ) : filteredTasks.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableHeaders.map((header) => (
                          <TableHead key={header.label} className="w-[18%]">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="font-medium p-0 h-auto"
                              disabled={!header.field}
                              onClick={() => header.field && toggleSort(header.field)}
                            >
                              {header.label}
                              {header.field && sortField === header.field && (
                                <span className="ml-1">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </Button>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => {
                        const priorityStyle = priorityColors[task.priority as keyof typeof priorityColors];
                        const statusStyle = statusColors[task.status as keyof typeof statusColors];
                        
                        return (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div className="font-medium">{task.title}</div>
                              {task.description && (
                                <div className="text-gray-500 text-sm truncate max-w-xs">
                                  {task.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${priorityStyle.bg} ${priorityStyle.text}`}>
                                {priorityMapping[task.priority as keyof typeof priorityMapping]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.text}`}>
                                {statusMapping[task.status as keyof typeof statusMapping]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className={`text-sm ${
                                task.status === 'overdue' ? 'text-red-600 font-medium' : ''
                              }`}>
                                {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="link" 
                                size="sm" 
                                asChild 
                                className="p-0 h-auto font-normal"
                              >
                                <a href={`/projects/${task.projectId}`}>View Project</a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h2>
                <p className="text-gray-500 mb-4">
                  {statusFilter || priorityFilter 
                    ? "Try changing your filters to see more tasks" 
                    : "You don't have any tasks assigned to you yet"}
                </p>
                {(statusFilter || priorityFilter) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter(null);
                      setPriorityFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
