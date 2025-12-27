import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Upload, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BulkImportPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
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
        setResult(data);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Students</CardTitle>
            <CardDescription>
              Upload an Excel file with student data. Required columns: name, registrationNumber (optional: monthlyQuotaMinutes)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={loading}
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

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 dark:bg-green-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-green-900">Created</p>
                      </div>
                      <p className="text-3xl font-bold text-green-700">{result.created}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 dark:bg-red-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="font-semibold text-red-900">Failed</p>
                      </div>
                      <p className="text-3xl font-bold text-red-700">{result.failed}</p>
                    </CardContent>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {result.errors.map((error, idx) => (
                          <p key={idx} className="text-sm">{error}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Excel Format:</strong> Your file should have columns like:
            <br/>- name (Student Name)
            <br/>- registrationNumber (Student ID/Reg Number)
            <br/>- monthlyQuotaMinutes (Optional, defaults to 120)
          </p>
        </div>
      </div>
    </div>
  );
}
