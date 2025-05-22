import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Conversations from "@/pages/conversations";
import Inventory from "@/pages/inventory";
import Personas from "@/pages/personas";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import ProtectedPromptTesting from "@/pages/protected-prompt-testing";
import SimplePromptTesting from "@/pages/simple-prompt-testing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/personas" component={Personas} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/prompt-testing" component={ProtectedPromptTesting} />
      <Route path="/simple-prompt-testing" component={SimplePromptTesting} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Layout>
          <Router />
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
