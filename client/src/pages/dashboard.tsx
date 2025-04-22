import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, Task } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useToastAutomation } from "@/hooks/use-toast-automation";

export default function Dashboard() {
  useToastAutomation(); // Show automated task reminders, etc.
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch user tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch daily summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/automation/daily-summary"],
  });

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenMobileSidebar={() => setShowMobileSidebar(!showMobileSidebar)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 lg:pb-0">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-3xl font-bold">{projects?.length || 0}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Tasks In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSummary ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-3xl font-bold">{summary?.inProgress || 0}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Tasks Due Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSummary ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-3xl font-bold text-yellow-600">{summary?.dueSoon || 0}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Overdue Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSummary ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-3xl font-bold text-red-600">{summary?.overdue || 0}</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Projects */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <Button size="sm" asChild>
                  <Link href="/projects">
                    <a className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      New Project
                    </a>
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingProjects ? (
                  <div className="flex items-center justify-center col-span-3 py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : projects && projects.length > 0 ? (
                  projects.slice(0, 3).map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description || "No description provided"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {project.deadline && (
                          <p className="text-sm text-gray-500">
                            Deadline: {formatDate(project.deadline)}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <Link href={`/projects/${project.id}`}>
                            <a>View Project</a>
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 bg-gray-100 rounded-lg p-6 text-center">
                    <p className="text-gray-600 mb-4">You don't have any projects yet</p>
                    <Button asChild>
                      <Link href="/projects">
                        <a>Create Your First Project</a>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/tasks">
                    <a>View All</a>
                  </Link>
                </Button>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="divide-y divide-gray-200">
                  {isLoadingTasks ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : tasks && tasks.length > 0 ? (
                    tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-500 truncate">{task.description}</p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            {task.dueDate && (
                              <span className="mt-1 text-xs text-gray-500">
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-600">No tasks assigned to you</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
