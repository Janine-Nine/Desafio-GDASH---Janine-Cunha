import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import Explore from "@/pages/Explore";
import { isAuthenticated } from "@/lib/mockData";

function PrivateRoute({ component: Component, ...rest }: any) {
  return (
    <Route
      {...rest}
      component={(props: any) =>
        isAuthenticated() ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
}

function Router() {
  return (
    <Switch>
      <PrivateRoute path="/" component={Dashboard} />
      <PrivateRoute path="/users" component={Users} />
      <PrivateRoute path="/explore" component={Explore} />
      <Route path="/login" component={Login} />
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
