import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ProjectDetail from "@/pages/project-detail";
import Projects from "@/pages/projects";
import Tasks from "@/pages/tasks";
import { ProtectedRoute } from "./lib/protected-route";
import calender from '@/pages/calender';

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projects" component={Projects} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetail} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/calender" component={calender}/>
       <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
