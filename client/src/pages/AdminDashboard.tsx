import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Users, Ban, Upload, UserCheck, UserX, LogOut, Clock, Settings, Plus, FileText, Download, Edit, AlertTriangle, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Student, LabEntry } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRegNum, setNewStudentRegNum] = useState("");
  const [newStudentQuota, setNewStudentQuota] = useState("120");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editingStudentQuota, setEditingStudentQuota] = useState("");
  const [bulkQuotaValue, setBulkQuotaValue] = useState("120");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteStudentRegNum, setDeleteStudentRegNum] = useState("");
  
  // Date filters for each section
  const [logDateFilter, setLogDateFilter] = useState("all");
  const [bannedDateFilter, setBannedDateFilter] = useState("all");
  const [overusedDateFilter, setOverusedDateFilter] = useState("all");
  const [summaryDateFilter, setSummaryDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customStartDateBanned, setCustomStartDateBanned] = useState("");
  const [customEndDateBanned, setCustomEndDateBanned] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    if (!auth) {
      setLocation("/admin-login");
    } else {
      setIsAuthenticated(true);
    }
  }, [setLocation]);

  const { data: allStudents = [], isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const { data: labEntries = [], isLoading: loadingEntries } = useQuery<LabEntry[]>({
    queryKey: ["/api/lab-entries"],
    enabled: isAuthenticated,
  });

  const bannedStudents = allStudents.filter(s => s.isBanned);
  const flaggedStudents = allStudents.filter(s => s.isFlagged);
  const activeStudents = allStudents.filter(s => !s.isBanned);

  // Helper function to get date range based on filter
  const getDateRange = (filterType: string, customStart: string, customEnd: string) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filterType) {
      case "today":
        return { start: startOfToday, end: now };
      case "week":
        return { start: startOfWeek, end: now };
      case "month":
        return { start: startOfMonth, end: now };
      case "custom":
        return {
          start: customStart ? new Date(customStart) : startOfToday,
          end: customEnd ? new Date(customEnd) : now,
        };
      default:
        return { start: new Date(0), end: now };
    }
  };

  // Filter data based on date range
  const filterByDate = (date: string | null | undefined, dateRange: { start: Date; end: Date }) => {
    if (!date) return true;
    try {
      const dataDate = new Date(date);
      return dataDate >= dateRange.start && dataDate <= dateRange.end;
    } catch {
      return true;
    }
  };

  // Format ISO timestamp to HH:MM time format
  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return "-";
    }
  };

  const filteredLabEntries = labEntries.filter((entry) => {
    const dateRange = getDateRange(logDateFilter, customStartDate, customEndDate);
    return filterByDate(entry.timestamp as string, dateRange);
  });

  const filteredBannedStudents = bannedStudents.filter((student) => {
    const dateRange = getDateRange(bannedDateFilter, customStartDateBanned, customEndDateBanned);
    return filterByDate(student.updatedAt as string, dateRange);
  });

  const filteredOverusedStudents = flaggedStudents.filter((student) => {
    const dateRange = getDateRange(overusedDateFilter, "", "");
    return filterByDate(student.updatedAt as string, dateRange);
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setImportResult(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out from the admin panel.",
    });
    setLocation("/admin-login");
  };


  const banMutation = useMutation({
    mutationFn: async ({ regNumber, isBanned }: { regNumber: string; isBanned: boolean }) => {
      const res = await apiRequest("PATCH", `/api/students/${regNumber}/ban`, { isBanned });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: variables.isBanned ? "Student banned" : "Student unbanned",
        description: variables.isBanned 
          ? "The student has been banned from using the lab." 
          : "The student can now access the lab again.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student status.",
        variant: "destructive",
      });
    },
  });

  const handleBanToggle = (regNumber: string, currentlyBanned: boolean) => {
    banMutation.mutate({ regNumber, isBanned: !currentlyBanned });
  };

  const deleteMutation = useMutation({
    mutationFn: async (regNumber: string) => {
      const res = await apiRequest("DELETE", `/api/students/${regNumber}`, {});
      return await res.json();
    },
    onSuccess: (_, regNumber) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student deleted",
        description: "The student has been removed from the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete student.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteStudent = (regNumber: string) => {
    setDeleteStudentRegNum(regNumber);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteStudentRegNum) {
      deleteMutation.mutate(deleteStudentRegNum);
      setDeleteConfirmOpen(false);
      setDeleteStudentRegNum("");
    }
  };

  const updateQuotaMutation = useMutation({
    mutationFn: async ({ regNumber, quotaMinutes }: { regNumber: string; quotaMinutes: number }) => {
      const res = await apiRequest("PATCH", `/api/students/${regNumber}/monthly-quota`, { quotaMinutes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Monthly quota updated",
      });
      setEditingStudentId(null);
      setEditingStudentQuota("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quota",
        variant: "destructive",
      });
    },
  });

  const handleEditQuota = (student: Student) => {
    setEditingStudentId(student.id);
    setEditingStudentQuota(student.monthlyQuotaMinutes.toString());
  };

  const handleSaveQuota = (regNumber: string) => {
    const quota = parseInt(editingStudentQuota);
    if (isNaN(quota) || quota < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quota value",
        variant: "destructive",
      });
      return;
    }
    updateQuotaMutation.mutate({ regNumber, quotaMinutes: quota });
  };

  const bulkUpdateQuotaMutation = useMutation({
    mutationFn: async () => {
      const quota = parseInt(bulkQuotaValue);
      if (isNaN(quota) || quota < 0) {
        throw new Error("Invalid quota value");
      }
      // Update all students
      const results = await Promise.all(
        allStudents.map(student =>
          apiRequest("PATCH", `/api/students/${student.registrationNumber}/monthly-quota`, {
            quotaMinutes: quota,
          })
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: `Monthly quota set to ${bulkQuotaValue} minutes for all students`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quotas for all students",
        variant: "destructive",
      });
    },
  });

  const handleSetAllQuotas = () => {
    const quota = parseInt(bulkQuotaValue);
    if (isNaN(quota) || quota < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quota value",
        variant: "destructive",
      });
      return;
    }
    if (allStudents.length === 0) {
      toast({
        title: "Error",
        description: "No students to update",
        variant: "destructive",
      });
      return;
    }
    bulkUpdateQuotaMutation.mutate();
  };

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/students", {
        name: newStudentName,
        registrationNumber: newStudentRegNum,
        monthlyQuotaMinutes: parseInt(newStudentQuota),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Added",
        description: `${newStudentName} has been added successfully`,
      });
      setNewStudentName("");
      setNewStudentRegNum("");
      setNewStudentQuota("120");
      setShowAddStudent(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add student. Please check the details and try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = () => {
    if (!newStudentName || !newStudentRegNum) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addStudentMutation.mutate();
  };

  const summaryRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    if (!summaryRef.current) return;
    
    // Open print dialog for PDF export
    window.print();
  };

  const downloadAsImage = async () => {
    if (!summaryRef.current) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(summaryRef.current, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "student-summary.png";
      link.click();

      toast({
        title: "Success",
        description: "Summary downloaded as image",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/students/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Import Failed",
          description: data.error || "Failed to import students",
          variant: "destructive",
        });
      } else {
        setImportResult(data);
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        toast({
          title: "Import Successful",
          description: `Created: ${data.created} | Failed: ${data.failed}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-total-students">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-students">{allStudents.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-students">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-active-students">{activeStudents.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-banned-students">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Students</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-banned-count">{bannedStudents.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-4">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="students" data-testid="tab-students">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Clock className="w-4 h-4 mr-2" />
              Log Times
            </TabsTrigger>
            <TabsTrigger value="banned" data-testid="tab-banned">
              <Ban className="w-4 h-4 mr-2" />
              Banned
              {bannedStudents.length > 0 && (
                <Badge variant="destructive" className="ml-2">{bannedStudents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overused" data-testid="tab-overused">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Overused
              {flaggedStudents.length > 0 && (
                <Badge variant="destructive" className="ml-2">{flaggedStudents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bulk-import" data-testid="tab-bulk-import">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="summary" data-testid="tab-summary">
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
          </TabsList>

          {/* Bulk Import Tab */}
          <TabsContent value="bulk-import">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Students</CardTitle>
                <CardDescription>Upload an Excel file with student data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-input"
                    data-testid="input-file-upload"
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-semibold">Choose Excel file or drag and drop</p>
                    <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, .csv</p>
                  </label>
                </div>

                {importResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-green-50 dark:bg-green-950">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="w-5 h-5 text-green-600" />
                            <p className="font-semibold text-green-900">Created</p>
                          </div>
                          <p className="text-3xl font-bold text-green-700">{importResult.created}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 dark:bg-red-950">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <UserX className="w-5 h-5 text-red-600" />
                            <p className="font-semibold text-red-900">Failed</p>
                          </div>
                          <p className="text-3xl font-bold text-red-700">{importResult.failed}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {importResult.errors.length > 0 && (
                      <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                        <CardContent className="pt-6">
                          <p className="font-semibold text-red-900 mb-2">Errors:</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {importResult.errors.map((error, idx) => (
                              <p key={idx} className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Excel Format:</strong> Columns required:
                    <br/>- name (Student Name)
                    <br/>- registrationNumber (Student ID)
                    <br/>- monthlyQuotaMinutes (Optional, defaults to 120)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>Manage student quotas and access</CardDescription>
                </div>
                <Button onClick={() => setShowAddStudent(!showAddStudent)} data-testid="button-add-student">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </CardHeader>
              <CardContent>
                {allStudents.length > 0 && (
                  <div className="mb-6 p-4 border rounded-lg space-y-3 bg-blue-50 dark:bg-blue-950">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Set All Students Quota</h3>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-blue-900 dark:text-blue-100">Monthly Quota (Minutes)</label>
                        <Input
                          type="number"
                          placeholder="120"
                          value={bulkQuotaValue}
                          onChange={(e) => setBulkQuotaValue(e.target.value)}
                          data-testid="input-bulk-quota"
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleSetAllQuotas} 
                        disabled={bulkUpdateQuotaMutation.isPending}
                        data-testid="button-set-all-quotas"
                      >
                        {bulkUpdateQuotaMutation.isPending ? "Updating..." : "Apply to All"}
                      </Button>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      This will set the monthly quota to {bulkQuotaValue} minutes for all {allStudents.length} students.
                    </p>
                  </div>
                )}

                {showAddStudent && (
                  <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/50">
                    <h3 className="font-semibold">Add New Student</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Student Name</label>
                      <Input
                        placeholder="Enter student name"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        data-testid="input-student-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Registration Number</label>
                      <Input
                        placeholder="Enter registration number"
                        value={newStudentRegNum}
                        onChange={(e) => setNewStudentRegNum(e.target.value)}
                        data-testid="input-student-reg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monthly Quota (Minutes)</label>
                      <Input
                        type="number"
                        placeholder="120"
                        value={newStudentQuota}
                        onChange={(e) => setNewStudentQuota(e.target.value)}
                        data-testid="input-student-quota"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddStudent} disabled={addStudentMutation.isPending} data-testid="button-submit-student">
                        {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddStudent(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {loadingStudents ? (
                  <p className="text-muted-foreground text-center py-8">Loading students...</p>
                ) : allStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-students">
                    No students registered yet. Use Bulk Import to add students.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Registration Number</TableHead>
                          <TableHead>Monthly Quota</TableHead>
                          <TableHead>Used</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allStudents.map((student) => (
                          <TableRow key={student.id} data-testid={`row-student-${student.id}`} className={student.isFlagged ? "border-l-4 border-l-red-600" : ""}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            <TableCell>
                              {editingStudentId === student.id ? (
                                <div className="flex gap-2 items-center">
                                  <Input
                                    type="number"
                                    value={editingStudentQuota}
                                    onChange={(e) => setEditingStudentQuota(e.target.value)}
                                    className="w-20"
                                    data-testid={`input-edit-quota-${student.id}`}
                                  />
                                  <span className="text-sm">mins</span>
                                </div>
                              ) : (
                                `${student.monthlyQuotaMinutes} mins`
                              )}
                            </TableCell>
                            <TableCell>{student.usedMinutes + student.extraMinutes} mins</TableCell>
                            <TableCell>
                              {student.isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : student.isFlagged ? (
                                <Badge variant="destructive">Overused</Badge>
                              ) : (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {editingStudentId === student.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveQuota(student.registrationNumber)}
                                      disabled={updateQuotaMutation.isPending}
                                      data-testid={`button-save-quota-${student.id}`}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingStudentId(null);
                                        setEditingStudentQuota("");
                                      }}
                                      data-testid={`button-cancel-quota-${student.id}`}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditQuota(student)}
                                      data-testid={`button-edit-quota-${student.id}`}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={student.isBanned ? "outline" : "destructive"}
                                      onClick={() => handleBanToggle(student.registrationNumber, student.isBanned)}
                                      disabled={banMutation.isPending}
                                      data-testid={`button-toggle-ban-${student.id}`}
                                    >
                                      {student.isBanned ? "Unban" : "Ban"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteStudent(student.registrationNumber)}
                                      disabled={deleteMutation.isPending}
                                      data-testid={`button-delete-student-${student.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Entry Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div>
                  <CardTitle>Lab Entry Logs</CardTitle>
                  <CardDescription>View all student lab entry and exit times</CardDescription>
                </div>
                <div className="flex gap-2 items-end flex-wrap">
                  <select 
                    value={logDateFilter} 
                    onChange={(e) => setLogDateFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                    data-testid="select-log-date-filter"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {logDateFilter === "custom" && (
                    <>
                      <input 
                        type="date" 
                        value={customStartDate} 
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                        data-testid="input-log-start-date"
                      />
                      <input 
                        type="date" 
                        value={customEndDate} 
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                        data-testid="input-log-end-date"
                      />
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {filteredLabEntries.length} entries
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEntries ? (
                  <p className="text-muted-foreground text-center py-8">Loading logs...</p>
                ) : labEntries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-logs">
                    No lab entry logs yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Registration Number</TableHead>
                          <TableHead>PC Number</TableHead>
                          <TableHead>Time In</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Actual End Time</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Overtime (mins)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLabEntries.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-log-${entry.id}`}>
                            <TableCell className="font-medium">{entry.studentName}</TableCell>
                            <TableCell>{entry.registrationNumber}</TableCell>
                            <TableCell>{entry.pcNumber}</TableCell>
                            <TableCell>{entry.time}</TableCell>
                            <TableCell>{entry.endTime || "-"}</TableCell>
                            <TableCell>{formatTime(entry.actualEndTime as string)}</TableCell>
                            <TableCell>{entry.purpose}</TableCell>
                            <TableCell>
                              {(entry.overtimeMinutes ?? 0) > 0 ? (
                                <Badge variant="destructive">{entry.overtimeMinutes}</Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banned Students Tab */}
          <TabsContent value="banned">
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div>
                  <CardTitle>Banned Students</CardTitle>
                  <CardDescription>Students who are currently banned from using the lab</CardDescription>
                </div>
                <div className="flex gap-2 items-end flex-wrap">
                  <select 
                    value={bannedDateFilter} 
                    onChange={(e) => setBannedDateFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                    data-testid="select-banned-date-filter"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {bannedDateFilter === "custom" && (
                    <>
                      <input 
                        type="date" 
                        value={customStartDateBanned} 
                        onChange={(e) => setCustomStartDateBanned(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                        data-testid="input-banned-start-date"
                      />
                      <input 
                        type="date" 
                        value={customEndDateBanned} 
                        onChange={(e) => setCustomEndDateBanned(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                        data-testid="input-banned-end-date"
                      />
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {filteredBannedStudents.length} students
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {bannedStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-banned">
                    No banned students
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Registration Number</TableHead>
                          <TableHead>Monthly Quota</TableHead>
                          <TableHead>Used Minutes</TableHead>
                          <TableHead>Extra Minutes</TableHead>
                          <TableHead>Flagged</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBannedStudents.map((student) => (
                          <TableRow key={student.id} data-testid={`row-banned-${student.id}`}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            <TableCell>{student.monthlyQuotaMinutes} mins</TableCell>
                            <TableCell>{student.usedMinutes} mins</TableCell>
                            <TableCell>{student.extraMinutes} mins</TableCell>
                            <TableCell>
                              {student.isFlagged ? (
                                <Badge variant="destructive">Yes</Badge>
                              ) : (
                                <Badge variant="outline">No</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBanToggle(student.registrationNumber, true)}
                                disabled={banMutation.isPending}
                                data-testid={`button-unban-${student.id}`}
                              >
                                Unban
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overused Students Tab */}
          <TabsContent value="overused">
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div>
                  <CardTitle>Overused Students</CardTitle>
                  <CardDescription>Students who have exceeded their monthly quota</CardDescription>
                </div>
                <div className="flex gap-2 items-end flex-wrap">
                  <select 
                    value={overusedDateFilter} 
                    onChange={(e) => setOverusedDateFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                    data-testid="select-overused-date-filter"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <span className="text-sm text-muted-foreground">
                    {filteredOverusedStudents.length} students
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {flaggedStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-overused">
                    No overused students
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Registration Number</TableHead>
                          <TableHead>Monthly Quota</TableHead>
                          <TableHead>Used Minutes</TableHead>
                          <TableHead>Extra Minutes</TableHead>
                          <TableHead>Total Used</TableHead>
                          <TableHead>Overused By</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOverusedStudents.map((student) => {
                          const totalUsed = student.usedMinutes + student.extraMinutes;
                          const overusedBy = totalUsed - student.monthlyQuotaMinutes;
                          return (
                            <TableRow key={student.id} data-testid={`row-overused-${student.id}`} className="border-l-4 border-l-red-600">
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.registrationNumber}</TableCell>
                              <TableCell>{student.monthlyQuotaMinutes} mins</TableCell>
                              <TableCell>{student.usedMinutes} mins</TableCell>
                              <TableCell>{student.extraMinutes} mins</TableCell>
                              <TableCell className="font-semibold text-red-600">{totalUsed} mins</TableCell>
                              <TableCell className="font-semibold text-red-600">+{overusedBy} mins</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={student.isBanned ? "outline" : "destructive"}
                                  onClick={() => handleBanToggle(student.registrationNumber, student.isBanned)}
                                  disabled={banMutation.isPending}
                                  data-testid={`button-ban-overused-${student.id}`}
                                >
                                  {student.isBanned ? "Unban" : "Ban"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div>
                  <CardTitle>Student Summary</CardTitle>
                  <CardDescription>Complete student details report</CardDescription>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <select 
                    value={summaryDateFilter} 
                    onChange={(e) => setSummaryDateFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                    data-testid="select-summary-date-filter"
                  >
                    <option value="all">All Students</option>
                    <option value="today">Active Today</option>
                    <option value="week">Active This Week</option>
                    <option value="month">Active This Month</option>
                  </select>
                  <Button onClick={generatePDF} data-testid="button-download-pdf">
                    <FileText className="w-4 h-4 mr-2" />
                    Print/PDF
                  </Button>
                  <Button onClick={downloadAsImage} variant="outline" data-testid="button-download-image">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <p className="text-muted-foreground text-center py-8">Loading summary...</p>
                ) : allStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No students to display</p>
                ) : (
                  <div ref={summaryRef} className="p-6 bg-white">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-4 text-black">Student Lab Summary Report</h2>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-black">{allStudents.length}</p>
                        </div>
                        <div className="p-4 bg-green-100 rounded-lg">
                          <p className="text-sm text-gray-600">Active Students</p>
                          <p className="text-2xl font-bold text-green-700">{activeStudents.length}</p>
                        </div>
                        <div className="p-4 bg-red-100 rounded-lg">
                          <p className="text-sm text-gray-600">Banned Students</p>
                          <p className="text-2xl font-bold text-red-700">{bannedStudents.length}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Generated on {new Date().toLocaleString()}</p>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4 text-black">All Students</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Name</th>
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Registration</th>
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Quota (mins)</th>
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Used (mins)</th>
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Extra (mins)</th>
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Remaining</th>
                              <th className="border border-gray-300 p-2 text-left text-black font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allStudents.map((student) => {
                              const used = student.usedMinutes + student.extraMinutes;
                              const remaining = Math.max(0, student.monthlyQuotaMinutes - used);
                              return (
                                <tr key={student.id} className="border-b">
                                  <td className="border border-gray-300 p-2 text-black">{student.name}</td>
                                  <td className="border border-gray-300 p-2 text-black">{student.registrationNumber}</td>
                                  <td className="border border-gray-300 p-2 text-black text-right">{student.monthlyQuotaMinutes}</td>
                                  <td className="border border-gray-300 p-2 text-black text-right">{student.usedMinutes}</td>
                                  <td className="border border-gray-300 p-2 text-black text-right">{student.extraMinutes}</td>
                                  <td className="border border-gray-300 p-2 text-black text-right">{remaining}</td>
                                  <td className="border border-gray-300 p-2 text-black">
                                    {student.isBanned ? (
                                      <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-sm font-semibold">Banned</span>
                                    ) : student.isFlagged ? (
                                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm font-semibold">Flagged</span>
                                    ) : (
                                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-sm font-semibold">Active</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
