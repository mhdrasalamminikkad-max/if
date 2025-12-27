import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Users, ArrowLeft, Ban, Upload, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import type { Student } from "@shared/schema";

export default function StudentAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: allStudents = [], isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const bannedStudents = allStudents.filter(s => s.isBanned);
  const activeStudents = allStudents.filter(s => !s.isBanned);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/bulk-import")}
            data-testid="button-bulk-import"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
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

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList data-testid="tabs-students">
            <TabsTrigger value="all" data-testid="tab-all">
              <Users className="w-4 h-4 mr-2" />
              All Students
            </TabsTrigger>
            <TabsTrigger value="banned" data-testid="tab-banned">
              <Ban className="w-4 h-4 mr-2" />
              Banned Students
              {bannedStudents.length > 0 && (
                <Badge variant="destructive" className="ml-2">{bannedStudents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>Manage all registered students</CardDescription>
              </CardHeader>
              <CardContent>
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
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allStudents.map((student) => (
                          <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            <TableCell>{student.monthlyQuotaMinutes} mins</TableCell>
                            <TableCell>{student.usedMinutes + student.extraMinutes} mins</TableCell>
                            <TableCell>
                              {student.isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : student.isFlagged ? (
                                <Badge variant="secondary">Flagged</Badge>
                              ) : (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={student.isBanned ? "outline" : "destructive"}
                                onClick={() => handleBanToggle(student.registrationNumber, student.isBanned)}
                                disabled={banMutation.isPending}
                                data-testid={`button-toggle-ban-${student.id}`}
                              >
                                {student.isBanned ? "Unban" : "Ban"}
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

          <TabsContent value="banned">
            <Card>
              <CardHeader>
                <CardTitle>Banned Students</CardTitle>
                <CardDescription>Students who are currently banned from using the lab</CardDescription>
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
                        {bannedStudents.map((student) => (
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
        </Tabs>
      </div>
    </div>
  );
}
