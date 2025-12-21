import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Lock, Unlock, Power, LogOut, ShieldCheck, UserPlus, Users, Ban, CheckCircle, Clock, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentAutocomplete } from "@/components/StudentAutocomplete";
import type { Student } from "@shared/schema";

const formSchema = z.object({
  studentName: z.string().min(2, "Name is required"),
  registrationNumber: z.string().min(1, "Registration Number is required"),
  purpose: z.string().min(1, "Purpose is required"),
  pcNumber: z.string().min(1, "PC Number is required"),
  time: z.string().min(1, "Time is required"),
  endTime: z.string().optional().default(""),
  declaration: z.boolean().refine((val) => val === true, "You must accept the declaration"),
}).refine((data) => data.studentName && data.registrationNumber, "Student details are required");

export default function ExamKiosk() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [configTime, setConfigTime] = useState(10);
  const [timeLeft, setTimeLeft] = useState(configTime * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [keySequence, setKeySequence] = useState("");
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [actualTimeUsed, setActualTimeUsed] = useState(0);
  const [studentQuotaRemaining, setStudentQuotaRemaining] = useState(0);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [studentValidationError, setStudentValidationError] = useState<string>("");
  const adminCode = "786786";

  // Apply exit prevention only when NOT in submitted view
  useEffect(() => {
    if (isSubmitted) return;

    // Block F11, ESC, Alt+F4, and other exit keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        return false;
      }
      if (e.altKey && e.key === "F4") {
        e.preventDefault();
        return false;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        return false;
      }
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        return false;
      }
      if (e.key === "Meta" || e.key === "Windows") {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.altKey && e.key === "Delete") {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && e.key === "Escape") {
        e.preventDefault();
        return false;
      }
      if (e.altKey && e.key === " ") {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return false;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("beforeunload", handleBeforeUnload, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("beforeunload", handleBeforeUnload, true);
    };
  }, [isSubmitted]);

  // Listen for secret admin code
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isAdmin || isSubmitted) return;
      
      const newSequence = (keySequence + e.key).slice(-6);
      setKeySequence(newSequence);
      
      if (newSequence === adminCode) {
        setIsAdmin(true);
        setKeySequence("");
        toast({ title: "Admin Access Granted" });
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [keySequence, isAdmin, isSubmitted]);

  // Enter fullscreen after form submission and handle F11 to exit
  useEffect(() => {
    if (isSubmitted && !isAdmin) {
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document as any).webkitRequestFullscreen) {
            await (document as any).webkitRequestFullscreen();
          } else if ((document as any).mozRequestFullScreen) {
            await (document as any).mozRequestFullScreen();
          } else if ((document as any).msRequestFullscreen) {
            await (document as any).msRequestFullscreen();
          }
        } catch (err) {
          console.log("Fullscreen request denied or unavailable");
        }
      };
      enterFullscreen();

      // Handle F11 to exit fullscreen
      const handleF11Exit = (e: KeyboardEvent) => {
        if (e.key === "F11") {
          e.preventDefault();
          // Exit fullscreen
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          // Optionally close the window/app
          if (window.close) {
            window.close();
          }
          return false;
        }
      };

      window.addEventListener("keydown", handleF11Exit, true);
      return () => {
        window.removeEventListener("keydown", handleF11Exit, true);
      };
    }
  }, [isSubmitted, isAdmin]);

  // Fetch settings on mount
  const { data: timeSetting } = useQuery({
    queryKey: ["/api/settings/defaultTime"],
    queryFn: async () => {
      const res = await fetch("/api/settings/defaultTime");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch setting");
      return res.json();
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (timeSetting?.value) {
      const mins = parseInt(timeSetting.value);
      setConfigTime(mins);
      setTimeLeft(mins * 60);
    }
  }, [timeSetting]);

  // Timer Logic for initial form submission
  useEffect(() => {
    if (isSubmitted || isAdmin) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, isAdmin]);


  const handleTimeUp = () => {
    toast({ variant: "destructive", title: "TIME EXPIRED", description: "System would shut down." });
  };

  // Form Logic
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "", registrationNumber: "", purpose: "", pcNumber: "",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: "",
      declaration: false,
    },
  });

  // Validate student data against database on registration number blur
  const validateStudentData = async () => {
    const regNumber = form.getValues("registrationNumber");
    const enteredName = form.getValues("studentName");
    
    if (!regNumber || !enteredName) {
      setStudentValidationError("");
      return;
    }

    try {
      const res = await fetch(`/api/students/${regNumber}`);
      if (!res.ok) {
        setStudentValidationError("Registration number not found in database");
        return;
      }
      const student = await res.json();
      
      // Check if the name matches (case-insensitive comparison)
      if (student.name.toLowerCase().trim() !== enteredName.toLowerCase().trim()) {
        setStudentValidationError(`Name mismatch! Expected: "${student.name}", but got: "${enteredName}"`);
      } else {
        setStudentValidationError("");
      }
    } catch (error) {
      setStudentValidationError("Error validating student data");
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await fetch("/api/lab-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 403) {
        const error = await res.json();
        throw new Error(error.error || "Access denied");
      }
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentEntryId(data.id);
      setIsSubmitted(true);
      setSessionStartTime(new Date()); // Record actual check-in time
      
      // Fetch student quota info
      const regNumber = form.getValues("registrationNumber");
      fetch(`/api/students/${regNumber}`)
        .then(res => res.json())
        .then(student => {
          const remaining = student.monthlyQuotaMinutes - (student.usedMinutes + student.extraMinutes);
          setStudentQuotaRemaining(Math.max(0, remaining));
        })
        .catch(() => {});
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-entries"] });
      toast({ title: "Access Granted", description: "Entry saved. Session started. Click 'End Session' when done." });
    },
    onError: (error: any) => {
      if (error.message.includes("banned")) {
        setIsBanned(true);
      }
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentEntryId || !sessionStartTime) return;
      const regNumber = form.getValues("registrationNumber");
      const now = new Date();
      const timeUsedMinutes = Math.floor((now.getTime() - sessionStartTime.getTime()) / 60000);
      
      const res = await fetch(`/api/lab-entries/${currentEntryId}/end-session`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualEndTime: now.toISOString(),
          startTimestamp: sessionStartTime.toISOString(),
          registrationNumber: regNumber,
        }),
      });
      if (!res.ok) throw new Error("Failed to end session");
      return res.json();
    },
    onSuccess: (data) => {
      const timeUsed = data.actualSessionMinutes || 0;
      setActualTimeUsed(timeUsed);
      
      // Calculate overtime if time used exceeds remaining quota
      const overtime = Math.max(0, timeUsed - studentQuotaRemaining);
      setOvertimeMinutes(overtime);
      
      if (overtime > 0) {
        toast({ 
          variant: "destructive",
          title: "Overtime Used", 
          description: `Time used: ${timeUsed} min. Overtime: ${overtime} min (deducted from quota).` 
        });
      } else {
        toast({ title: "Session Ended", description: `Total time used: ${timeUsed} minutes. Quota updated.` });
      }
      
      // Reset form and state to allow next student login
      setTimeout(() => {
        setIsSubmitted(false);
        setCurrentEntryId(null);
        setSessionStartTime(null);
        setActualTimeUsed(0);
        setStudentQuotaRemaining(0);
        setOvertimeMinutes(0);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/lab-entries"] });
      }, 2000);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate student data before submitting
    await validateStudentData();
    if (studentValidationError) {
      toast({ variant: "destructive", title: "Error", description: studentValidationError });
      return;
    }
    submitMutation.mutate(values);
  }

  const handleEndSession = () => {
    endSessionMutation.mutate();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

  if (isBanned) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center text-white p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-md">
          <div className="flex justify-center mb-6"><Ban className="w-24 h-24 text-red-400" /></div>
          <h1 className="text-4xl font-bold">Access Denied</h1>
          <p className="text-red-200 text-lg">You have been banned from using the lab. Please contact the administrator.</p>
        </motion.div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboard 
        configTime={configTime} 
        setConfigTime={setConfigTime} 
        onLogout={() => { setIsAdmin(false); setTimeLeft(configTime * 60); }}
        queryClient={queryClient}
      />
    );
  }

  // Minimized session view - student can come back to end session
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-xl border-emerald-300 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-emerald-900">Lab Session Active</CardTitle>
            <CardDescription className="text-xs">Click to end your session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              size="sm"
              data-testid="button-end-session-minimized"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {endSessionMutation.isPending ? "Ending..." : "End Session"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col">
        <header className="bg-white border-b border-emerald-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
              <div>
                <h1 className="text-3xl font-bold text-emerald-900">Access Granted</h1>
                <p className="text-emerald-700 text-sm mt-1">You are now logged in. The system is ready.</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6 max-w-2xl w-full"
          >
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-900">Session Started Successfully</h2>
              <p className="text-slate-600">Your login has been recorded. You can now use the workstation.</p>
            </div>

            {/* End Session Button */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-6 space-y-4">
              <p className="text-sm font-bold text-emerald-900">Click below when you're done working:</p>
              <Button
                onClick={handleEndSession}
                disabled={endSessionMutation.isPending}
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-6"
                data-testid="button-end-session-main"
              >
                <LogOut className="w-6 h-6 mr-3" />
                {endSessionMutation.isPending ? "Ending Session..." : "End Session"}
              </Button>
            </div>

            {/* F11 Exit Instructions */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-blue-900 mb-3">HOW TO EXIT</p>
                <p className="text-sm text-blue-800 mb-4">To exit the application and go back to the desktop:</p>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex gap-3 items-start bg-white p-3 rounded border border-blue-200">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                  <div>
                    <p className="font-semibold text-blue-900">Press the F11 key</p>
                    <p className="text-xs text-blue-700 mt-1">This will exit the application and return to the desktop</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-white p-3 rounded border border-blue-200">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                  <div>
                    <p className="font-semibold text-blue-900">Or click "End Session" above</p>
                    <p className="text-xs text-blue-700 mt-1">This will officially end your lab session</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Warning */}
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-left">
                  <p className="text-sm font-bold text-red-700">
                    CRITICAL: MUST END SESSION BEFORE LEAVING
                  </p>
                  <p className="text-sm text-red-700">
                    Click the red "End Session" button above or press F11 to exit. Failing to do so will result in serious consequences:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>⚠️ <span className="font-bold">ACCOUNT BAN</span> - Permanently banned from the lab</li>
                    <li>⚠️ <span className="font-bold">QUOTA LOSS</span> - Entire monthly quota deducted</li>
                    <li>⚠️ <span className="font-bold">LAB ACCESS REVOKED</span> - Future lab access may be lost</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center font-semibold bg-amber-50 p-3 rounded border border-amber-200">
              Remember: Click "End Session" or press F11 before leaving the workstation!
            </p>
          </motion.div>
        </main>

        <Taskbar sessionActive={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 pb-12">
      <header className={`px-6 py-4 flex justify-between items-center shadow-md z-10 transition-colors duration-500 ${isUrgent ? 'bg-red-900' : 'bg-slate-900'} text-white`}>
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-red-400" />
          <span className="font-semibold tracking-wide uppercase text-sm text-red-100">System Locked</span>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-md font-mono text-xl font-bold ${isUrgent ? 'bg-red-600 animate-pulse' : 'bg-slate-800'}`}>
          <Power className="w-5 h-5" />
          <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <Background />
        <Card className={`w-full max-w-3xl shadow-xl relative z-0 backdrop-blur-sm bg-white/90 border-2 transition-colors ${isUrgent ? 'border-red-400' : 'border-slate-200'}`}>
          <CardHeader className="border-b border-slate-100 pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">Lab Entry Log</CardTitle>
            <CardDescription className="text-slate-500">Complete this form to unlock the workstation.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="studentName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name</FormLabel>
                      <FormControl>
                        <StudentAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          onSelectStudent={(student: Student) => {
                            form.setValue("studentName", student.name);
                            form.setValue("registrationNumber", student.registrationNumber);
                          }}
                          placeholder="John Doe"
                          data-testid="input-student-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="REG-2024-001" data-testid="input-reg-number" {...field} onBlur={() => validateStudentData()} />
                      </FormControl>
                      {studentValidationError && (
                        <p className="text-sm font-medium text-destructive mt-2" data-testid="error-student-validation">
                          {studentValidationError}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pcNumber" render={({ field }) => (
                    <FormItem><FormLabel>PC Number</FormLabel><FormControl><Input placeholder="Lab1-PC-05" data-testid="input-pc-number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem><FormLabel>Time In</FormLabel><FormControl><Input {...field} readOnly className="bg-slate-100" data-testid="input-time-in" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem><FormLabel>End Time <span className="text-xs text-gray-500">(Optional)</span></FormLabel><FormControl><Input type="time" data-testid="input-end-time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="purpose" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Purpose</FormLabel><FormControl><Input placeholder="Research / Assignment" data-testid="input-purpose" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                   <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-sm text-amber-800">System locks automatically if not submitted in time. Overtime after your end time will be deducted from your monthly quota.</p>
                </div>

                <FormField control={form.control} name="declaration" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-declaration" /></FormControl>
                      <FormLabel>I confirm these details are correct.</FormLabel>
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full bg-blue-700 hover:bg-blue-800 text-white" disabled={!form.formState.isValid || submitMutation.isPending} data-testid="button-submit">
                  <Unlock className="w-5 h-5 mr-2" /> {submitMutation.isPending ? "Submitting..." : "Submit Log & Unlock PC"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Taskbar sessionActive={false} />
    </div>
  );
}


function AdminDashboard({ configTime, setConfigTime, onLogout, queryClient }: any) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentReg, setNewStudentReg] = useState("");
  const [newStudentQuota, setNewStudentQuota] = useState(120);

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/lab-entries"],
    queryFn: async () => {
      const res = await fetch("/api/lab-entries");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const settingMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "defaultTime", value: String(minutes) }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/defaultTime"] });
      toast({ title: "Settings Saved", description: `Time allocation updated to ${configTime} minutes.` });
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newStudentName, 
          registrationNumber: newStudentReg,
          monthlyQuotaMinutes: newStudentQuota 
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add student");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student Added" });
      setShowAddStudent(false);
      setNewStudentName("");
      setNewStudentReg("");
      setNewStudentQuota(120);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ regNumber, isBanned }: { regNumber: string; isBanned: boolean }) => {
      const res = await fetch(`/api/students/${regNumber}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: variables.isBanned ? "Student Banned" : "Student Unbanned" });
    },
  });

  const resetQuotasMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/students/reset-quotas", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Quotas Reset", description: "All student quotas have been reset for the new month." });
    },
  });

  const handleSave = () => {
    if (configTime > 0) {
      settingMutation.mutate(configTime);
    } else {
      toast({ variant: "destructive", title: "Invalid Value" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          Admin Dashboard
        </div>
        <Button variant="outline" onClick={onLogout} data-testid="button-logout"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle><CardDescription>Manage system behavior</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px] max-w-xs">
              <label className="text-sm font-medium">Time Allocation (Minutes)</label>
              <Input type="number" value={configTime} onChange={(e) => setConfigTime(Number(e.target.value))} data-testid="input-config-time" />
            </div>
            <Button onClick={handleSave} className="bg-blue-600" disabled={settingMutation.isPending} data-testid="button-save-config">
              {settingMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={() => resetQuotasMutation.mutate()} variant="outline" disabled={resetQuotasMutation.isPending} data-testid="button-reset-quotas">
              {resetQuotasMutation.isPending ? "Resetting..." : "Reset Monthly Quotas"}
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="students" data-testid="tab-students"><Users className="w-4 h-4 mr-2" /> Students</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs"><Clock className="w-4 h-4 mr-2" /> Entry Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>Manage student quotas and access</CardDescription>
                </div>
                <Button onClick={() => setShowAddStudent(true)} data-testid="button-add-student">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Student
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {studentsLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Reg. Number</TableHead>
                          <TableHead>Quota (min)</TableHead>
                          <TableHead>Used</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student: any) => (
                          <TableRow key={student.id} className={student.isFlagged ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            <TableCell>{student.monthlyQuotaMinutes}</TableCell>
                            <TableCell>{student.usedMinutes}</TableCell>
                            <TableCell className={student.extraMinutes > 0 ? 'text-red-600 font-bold' : ''}>
                              {student.extraMinutes}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {student.isFlagged && (
                                  <Badge variant="destructive" className="gap-1">
                                    <Flag className="w-3 h-3" /> Flagged
                                  </Badge>
                                )}
                                {student.isBanned && (
                                  <Badge variant="outline" className="border-red-500 text-red-500 gap-1">
                                    <Ban className="w-3 h-3" /> Banned
                                  </Badge>
                                )}
                                {!student.isFlagged && !student.isBanned && (
                                  <Badge variant="secondary" className="gap-1">
                                    <CheckCircle className="w-3 h-3" /> Active
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.isBanned ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => banMutation.mutate({ regNumber: student.registrationNumber, isBanned: false })}
                                  disabled={banMutation.isPending}
                                  data-testid={`button-unban-${student.id}`}
                                >
                                  Unban
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => banMutation.mutate({ regNumber: student.registrationNumber, isBanned: true })}
                                  disabled={banMutation.isPending}
                                  data-testid={`button-ban-${student.id}`}
                                >
                                  Ban
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {students.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">No students found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader><CardTitle>Entry Logs</CardTitle><CardDescription>History of student access</CardDescription></CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {logsLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time In</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Actual End</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Reg. Number</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>PC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono">{log.time}</TableCell>
                            <TableCell className="font-mono">{log.endTime || "-"}</TableCell>
                            <TableCell className="font-mono">{log.actualEndTime || "-"}</TableCell>
                            <TableCell className={log.overtimeMinutes > 0 ? 'text-red-600 font-bold' : ''}>
                              {log.overtimeMinutes || 0} min
                            </TableCell>
                            <TableCell className="font-medium">{log.studentName}</TableCell>
                            <TableCell>{log.registrationNumber}</TableCell>
                            <TableCell>{log.purpose}</TableCell>
                            <TableCell>{log.pcNumber}</TableCell>
                          </TableRow>
                        ))}
                        {logs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-slate-500">No logs found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Add a student to the system with their monthly quota.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Student Name</label>
              <Input 
                placeholder="John Doe" 
                value={newStudentName} 
                onChange={(e) => setNewStudentName(e.target.value)} 
                data-testid="input-new-student-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Number</label>
              <Input 
                placeholder="REG-2024-001" 
                value={newStudentReg} 
                onChange={(e) => setNewStudentReg(e.target.value)} 
                data-testid="input-new-student-reg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Quota (Minutes)</label>
              <Input 
                type="number" 
                value={newStudentQuota} 
                onChange={(e) => setNewStudentQuota(Number(e.target.value))} 
                data-testid="input-new-student-quota"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudent(false)}>Cancel</Button>
            <Button 
              onClick={() => addStudentMutation.mutate()} 
              disabled={!newStudentName || !newStudentReg || addStudentMutation.isPending}
              data-testid="button-confirm-add-student"
            >
              {addStudentMutation.isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Background() {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-slate-500 rounded-full blur-3xl" />
    </div>
  );
}

function Taskbar({ sessionActive }: { sessionActive: boolean }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-900 to-blue-800 border-t border-blue-700 flex items-center justify-between px-3 shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
          sessionActive 
            ? 'bg-white/20 hover:bg-white/30 cursor-pointer' 
            : 'bg-white/10 hover:bg-white/20 cursor-pointer'
        }`}>
          <div className={`w-4 h-4 rounded ${sessionActive ? 'bg-green-500 shadow-md' : 'bg-gray-400'}`} />
          <span className="text-white text-xs font-medium">{sessionActive ? 'Lab Session Active' : 'Lab Entry Log'}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-white text-xs">
          <span className="font-mono">{timeString}</span>
        </div>
      </div>
    </div>
  );
}
