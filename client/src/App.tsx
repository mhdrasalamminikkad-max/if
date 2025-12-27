import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ExamKiosk from "@/pages/ExamKiosk";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";
import { useEffect, useRef } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ExamKiosk} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function KeyboardShortcutListener() {
  const [, setLocation] = useLocation();
  const secretCodeRef = useRef("");
  const SECRET_CODE = "786786";

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only add digit keys to the sequence
      if (/^\d$/.test(event.key)) {
        secretCodeRef.current += event.key;

        // Keep only the last 6 characters
        if (secretCodeRef.current.length > 6) {
          secretCodeRef.current = secretCodeRef.current.slice(-6);
        }

        // Check if the sequence matches the secret code
        if (secretCodeRef.current === SECRET_CODE) {
          setLocation("/admin");
          secretCodeRef.current = ""; // Reset after redirect
        }
      } else {
        // Reset if non-digit key is pressed
        secretCodeRef.current = "";
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [setLocation]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <KeyboardShortcutListener />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
