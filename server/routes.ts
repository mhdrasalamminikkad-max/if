import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertLabEntrySchema, insertSettingSchema, insertStudentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import multer from "multer";
import XLSX from "xlsx";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create Lab Entry
  app.post("/api/lab-entries", async (req, res) => {
    try {
      // Check and reset monthly quotas if needed
      await storage.checkAndResetMonthlyQuotas();
      
      const validated = insertLabEntrySchema.parse(req.body);
      
      // Check if student exists
      let student = await storage.getStudentByRegNumber(validated.registrationNumber);
      
      // Auto-create student if not exists
      if (!student) {
        student = await storage.createStudent({
          name: validated.studentName,
          registrationNumber: validated.registrationNumber,
          monthlyQuotaMinutes: 120, // Default quota
        });
      }
      
      // Check if student is banned
      if (student.isBanned) {
        return res.status(403).json({ error: "Student is banned from using the lab" });
      }
      
      // Check if quota is exhausted
      const totalUsed = student.usedMinutes + student.extraMinutes;
      if (totalUsed >= student.monthlyQuotaMinutes) {
        return res.status(403).json({ error: "Monthly quota exhausted. Please contact administrator." });
      }
      
      // Don't deduct quota here - it will be deducted when student clicks End Session
      // Just record the lab entry with the check-in time
      const entry = await storage.createLabEntry(validated);
      res.json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create entry" });
    }
  });

  // Update Lab Entry with actual end time and deduct quota
  app.patch("/api/lab-entries/:id/end-session", async (req, res) => {
    try {
      const { actualEndTime, registrationNumber, startTimestamp } = req.body;
      const id = parseInt(req.params.id);
      
      // Calculate actual time used from submission time to end session time
      const startTime = new Date(startTimestamp);
      const endTime = new Date(actualEndTime);
      const actualSessionMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      
      // Update entry with actual end time
      const entry = await storage.updateLabEntryOvertime(id, actualEndTime, 0);
      
      // Deduct the actual time used from student quota
      if (actualSessionMinutes > 0 && registrationNumber) {
        // Get student to calculate how much goes to usedMinutes vs extraMinutes
        const student = await storage.getStudentByRegNumber(registrationNumber);
        if (student) {
          const remainingQuota = Math.max(0, student.monthlyQuotaMinutes - student.usedMinutes);
          const usedMinutes = Math.min(actualSessionMinutes, remainingQuota);
          const extraMinutes = Math.max(0, actualSessionMinutes - remainingQuota);
          
          await storage.updateStudentQuota(registrationNumber, usedMinutes, extraMinutes);
        }
      }
      
      res.json({ entry, actualSessionMinutes });
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Get All Lab Entries
  app.get("/api/lab-entries", async (req, res) => {
    try {
      const entries = await storage.getAllLabEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  // Get Setting
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // Update Setting
  app.post("/api/settings", async (req, res) => {
    try {
      const validated = insertSettingSchema.parse(req.body);
      const setting = await storage.upsertSetting(validated);
      res.json(setting);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // === STUDENT ROUTES ===
  
  // Search students by name
  app.get("/api/students/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const students = await storage.searchStudentsByName(query, 10);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to search students" });
    }
  });

  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      // Check and reset monthly quotas if needed
      await storage.checkAndResetMonthlyQuotas();
      
      // Recalculate flags for any students who may have been marked incorrectly
      await storage.recalculateAllStudentFlags();
      
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Get banned students
  app.get("/api/students/banned", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      const bannedStudents = students.filter(s => s.isBanned);
      res.json(bannedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banned students" });
    }
  });

  // Get student by registration number
  app.get("/api/students/:regNumber", async (req, res) => {
    try {
      const student = await storage.getStudentByRegNumber(req.params.regNumber);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  // Create student
  app.post("/api/students", async (req, res) => {
    try {
      const validated = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validated);
      res.json(student);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      if (error.code === '23505') {
        return res.status(409).json({ error: "Student with this registration number already exists" });
      }
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  // Update student quota
  app.patch("/api/students/:regNumber/quota", async (req, res) => {
    try {
      const { usedMinutes, extraMinutes } = req.body;
      const student = await storage.updateStudentQuota(
        req.params.regNumber, 
        usedMinutes || 0, 
        extraMinutes || 0
      );
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to update quota" });
    }
  });

  // Set student monthly quota
  app.patch("/api/students/:regNumber/monthly-quota", async (req, res) => {
    try {
      const { quotaMinutes } = req.body;
      const student = await storage.setStudentMonthlyQuota(req.params.regNumber, quotaMinutes);
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to update monthly quota" });
    }
  });

  // Ban/Unban student
  app.patch("/api/students/:regNumber/ban", async (req, res) => {
    try {
      const { isBanned } = req.body;
      const student = await storage.updateStudentBanStatus(req.params.regNumber, isBanned);
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ban status" });
    }
  });

  // Delete student
  app.delete("/api/students/:regNumber", async (req, res) => {
    try {
      await storage.deleteStudent(req.params.regNumber);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Reset all student quotas (monthly reset)
  app.post("/api/students/reset-quotas", async (req, res) => {
    try {
      await storage.resetStudentQuotas();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset quotas" });
    }
  });

  // Bulk import students from Excel
  const upload = multer({ storage: multer.memoryStorage() });
  app.post("/api/students/bulk-import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: "File is empty or invalid" });
      }

      // Get headers from first row and normalize them
      const headers = (data[0] as string[]).map((h) =>
        String(h).toLowerCase().trim().replace(/\s+/g, "")
      );

      // Find column indices
      const nameIndex = headers.findIndex((h) =>
        h.includes("name")
      );
      const regIndex = headers.findIndex((h) =>
        h.includes("registration") || h.includes("regnum") || h.includes("studentid") || h.includes("id")
      );
      const quotaIndex = headers.findIndex((h) =>
        h.includes("quota") || h.includes("minutes")
      );

      if (nameIndex === -1 || regIndex === -1) {
        return res.status(400).json({
          error: "Excel file must have columns for: Name and Registration Number (and optionally Monthly Quota)",
        });
      }

      const students = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any[];
        const name = String(row[nameIndex] || "").trim();
        const regNumber = String(row[regIndex] || "").trim();
        const quota = quotaIndex !== -1 ? parseInt(row[quotaIndex]) : 120;

        if (name && regNumber) {
          students.push({
            name,
            registrationNumber: regNumber,
            monthlyQuotaMinutes: isNaN(quota) ? 120 : quota,
          });
        }
      }

      if (students.length === 0) {
        return res.status(400).json({
          error: "No valid student records found in file. Ensure columns contain: Name, Registration Number",
        });
      }

      const result = await storage.bulkCreateStudents(students);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process file: " + error.message });
    }
  });

  return httpServer;
}
