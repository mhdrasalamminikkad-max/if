import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, desc, ilike, or } from "drizzle-orm";
import { 
  labEntries, 
  settings,
  students,
  type InsertLabEntry, 
  type LabEntry,
  type InsertSetting,
  type Setting,
  type InsertStudent,
  type Student
} from "@shared/schema";

const { Pool } = pg;

// Database credentials hardcoded
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://if_user:tH03X9e0Zkf6wpDzboAjCjQiXzPGJkgj@dpg-d52jc8m3jp1c73c56i1g-a.virginia-postgres.render.com/if";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool);

export interface IStorage {
  // Lab Entries
  createLabEntry(entry: InsertLabEntry): Promise<LabEntry>;
  getAllLabEntries(): Promise<LabEntry[]>;
  updateLabEntryOvertime(id: number, actualEndTime: string, overtimeMinutes: number): Promise<LabEntry>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
  
  // Students
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentByRegNumber(regNumber: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  searchStudentsByName(query: string, limit?: number): Promise<Student[]>;
  updateStudentQuota(regNumber: string, usedMinutes: number, extraMinutes: number): Promise<Student>;
  updateStudentBanStatus(regNumber: string, isBanned: boolean): Promise<Student>;
  updateStudentFlag(regNumber: string, isFlagged: boolean): Promise<Student>;
  setStudentMonthlyQuota(regNumber: string, quotaMinutes: number): Promise<Student>;
  resetStudentQuotas(): Promise<void>;
  checkAndResetMonthlyQuotas(): Promise<boolean>;
  bulkCreateStudents(students: InsertStudent[]): Promise<{ created: number; failed: number; errors: string[] }>;
  recalculateAllStudentFlags(): Promise<number>;
  deleteStudent(regNumber: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createLabEntry(entry: InsertLabEntry): Promise<LabEntry> {
    const [created] = await db.insert(labEntries).values(entry).returning();
    return created;
  }

  async getAllLabEntries(): Promise<LabEntry[]> {
    return await db.select().from(labEntries).orderBy(desc(labEntries.timestamp));
  }

  async updateLabEntryOvertime(id: number, actualEndTime: string, overtimeMinutes: number): Promise<LabEntry> {
    const [updated] = await db
      .update(labEntries)
      .set({ actualEndTime, overtimeMinutes })
      .where(eq(labEntries.id, id))
      .returning();
    return updated;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async upsertSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(settings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values(setting).returning();
      return created;
    }
  }

  // Student methods
  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async getStudentByRegNumber(regNumber: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.registrationNumber, regNumber));
    return student;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.updatedAt));
  }

  async searchStudentsByName(query: string, limit: number = 10): Promise<Student[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(students)
      .where(
        or(
          ilike(students.name, searchPattern),
          ilike(students.registrationNumber, searchPattern)
        )
      )
      .limit(limit);
  }

  async updateStudentQuota(regNumber: string, usedMinutes: number, extraMinutes: number): Promise<Student> {
    const student = await this.getStudentByRegNumber(regNumber);
    if (!student) throw new Error("Student not found");

    const newUsedMinutes = student.usedMinutes + usedMinutes;
    const newExtraMinutes = student.extraMinutes + extraMinutes;
    const isFlagged = newUsedMinutes + newExtraMinutes > student.monthlyQuotaMinutes;

    const [updated] = await db
      .update(students)
      .set({ 
        usedMinutes: newUsedMinutes, 
        extraMinutes: newExtraMinutes,
        isFlagged,
        updatedAt: new Date() 
      })
      .where(eq(students.registrationNumber, regNumber))
      .returning();
    return updated;
  }

  async updateStudentBanStatus(regNumber: string, isBanned: boolean): Promise<Student> {
    const [updated] = await db
      .update(students)
      .set({ isBanned, updatedAt: new Date() })
      .where(eq(students.registrationNumber, regNumber))
      .returning();
    return updated;
  }

  async updateStudentFlag(regNumber: string, isFlagged: boolean): Promise<Student> {
    const [updated] = await db
      .update(students)
      .set({ isFlagged, updatedAt: new Date() })
      .where(eq(students.registrationNumber, regNumber))
      .returning();
    return updated;
  }

  async setStudentMonthlyQuota(regNumber: string, quotaMinutes: number): Promise<Student> {
    const [updated] = await db
      .update(students)
      .set({ monthlyQuotaMinutes: quotaMinutes, updatedAt: new Date() })
      .where(eq(students.registrationNumber, regNumber))
      .returning();
    return updated;
  }

  async resetStudentQuotas(): Promise<void> {
    await db
      .update(students)
      .set({ usedMinutes: 0, extraMinutes: 0, isFlagged: false, updatedAt: new Date() });
    
    // Store the last reset date
    await this.upsertSetting({
      key: "last_quota_reset",
      value: new Date().toISOString(),
    });
  }

  async checkAndResetMonthlyQuotas(): Promise<boolean> {
    // Get the last reset date from settings
    const lastResetSetting = await this.getSetting("last_quota_reset");
    const lastResetDate = lastResetSetting ? new Date(lastResetSetting.value) : null;
    const now = new Date();

    // If never reset or more than a month has passed, reset quotas
    if (!lastResetDate || this.isMonthPassed(lastResetDate, now)) {
      await this.resetStudentQuotas();
      return true;
    }
    return false;
  }

  private isMonthPassed(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Check if we're in a different month or year
    if (d2.getFullYear() > d1.getFullYear()) return true;
    if (d2.getFullYear() === d1.getFullYear() && d2.getMonth() > d1.getMonth()) return true;
    
    return false;
  }

  async bulkCreateStudents(studentList: InsertStudent[]): Promise<{ created: number; failed: number; errors: string[] }> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const student of studentList) {
      try {
        await this.createStudent(student);
        created++;
      } catch (error: any) {
        failed++;
        if (error.code === '23505') {
          errors.push(`Registration ${student.registrationNumber}: Already exists`);
        } else {
          errors.push(`Registration ${student.registrationNumber}: ${error.message}`);
        }
      }
    }

    return { created, failed, errors };
  }

  async recalculateAllStudentFlags(): Promise<number> {
    const allStudents = await this.getAllStudents();
    let updated = 0;

    for (const student of allStudents) {
      const totalUsed = student.usedMinutes + student.extraMinutes;
      const shouldBeFlagged = totalUsed > student.monthlyQuotaMinutes;
      
      if (student.isFlagged !== shouldBeFlagged) {
        await this.updateStudentFlag(student.registrationNumber, shouldBeFlagged);
        updated++;
      }
    }

    return updated;
  }

  async deleteStudent(regNumber: string): Promise<void> {
    await db
      .delete(students)
      .where(eq(students.registrationNumber, regNumber));
  }
}

export const storage = new DatabaseStorage();
