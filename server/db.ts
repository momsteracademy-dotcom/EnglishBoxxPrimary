import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const REPOSITORY_FILE = path.join(DATA_DIR, "repository.json");
const DOWNLOADS_FILE = path.join(DATA_DIR, "downloads.json");
const TEACHER_PROFILES_FILE = path.join(DATA_DIR, "teacher_profiles.json");

export type SubscriptionPlan = "free" | "premium" | "pro" | "admin";

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  password?: string; // stored as plain string for simple dev setup
  role: SubscriptionPlan;
  plan?: SubscriptionPlan;
  plan_expiry?: string | null;
  download_count?: number;
  generation_count?: number;
  createdAt: string;
}

export interface TeacherProfile {
  uid: string; // user email or uid
  teacher_name: string;
  school_name: string;
  logo_url: string;
  logo_position?: "left" | "center" | "right";
  watermark: string;
  updatedAt: string;
}

export interface RepositoryWorksheet {
  id: string;
  createdAt: string;
  grade: string;
  topic: string;
  exerciseStyle: string;
  created_by?: string;
  plan_used?: SubscriptionPlan;
  branding_enabled?: boolean;
  data: any; // Entire worksheet object
}

export interface UserDownload {
  email: string;
  worksheetIds: string[]; // List of worksheet IDs they have downloaded
}

// ---------------- USER PROFILE HELPERS ----------------
export function readUsers(): UserProfile[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Seed initial admin and test users
      const initialUsers: UserProfile[] = [
        {
          id: "admin-1",
          email: "sakarinmam999@gmail.com",
          password: "Akarach@9365",
          role: "admin",
          createdAt: new Date().toISOString()
        },
        {
          id: "test-free",
          email: "testfree@gmail.com",
          password: "123456",
          role: "free",
          createdAt: new Date().toISOString()
        },
        {
          id: "test-premium",
          email: "testpremium@gmail.com",
          password: "123456",
          role: "premium",
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
      return initialUsers;
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Ensure admin user is always in the seeded users list
    if (!parsed.some((u: any) => u.email === "sakarinmam999@gmail.com")) {
      parsed.push({
        id: "admin-1",
        email: "sakarinmam999@gmail.com",
        password: "Akarach@9365",
        role: "admin",
        createdAt: new Date().toISOString()
      });
    }

    // Ensure test free user is seeded
    if (!parsed.some((u: any) => u.email === "testfree@gmail.com")) {
      parsed.push({
        id: "test-free",
        email: "testfree@gmail.com",
        password: "123456",
        role: "free",
        createdAt: new Date().toISOString()
      });
    }

    // Ensure test premium user is seeded
    if (!parsed.some((u: any) => u.email === "testpremium@gmail.com")) {
      parsed.push({
        id: "test-premium",
        email: "testpremium@gmail.com",
        password: "123456",
        role: "premium",
        createdAt: new Date().toISOString()
      });
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    return parsed;
  } catch (e) {
    console.error("Error reading users file:", e);
    return [];
  }
}

export function writeUsers(users: UserProfile[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing users file:", e);
  }
}

// ---------------- EXAM REPOSITORY HELPERS ----------------
export function readRepository(): RepositoryWorksheet[] {
  try {
    if (!fs.existsSync(REPOSITORY_FILE)) {
      // Return empty array first
      fs.writeFileSync(REPOSITORY_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const data = fs.readFileSync(REPOSITORY_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading repository file:", e);
    return [];
  }
}

export function writeRepository(worksheets: RepositoryWorksheet[]) {
  try {
    fs.writeFileSync(REPOSITORY_FILE, JSON.stringify(worksheets, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing repository file:", e);
  }
}

// ---------------- DOWNLOAD TRACKING HELPERS ----------------
export function readDownloads(): UserDownload[] {
  try {
    if (!fs.existsSync(DOWNLOADS_FILE)) {
      fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const data = fs.readFileSync(DOWNLOADS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading downloads file:", e);
    return [];
  }
}

export function writeDownloads(downloads: UserDownload[]) {
  try {
    fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing downloads file:", e);
  }
}

// Add a download log helper
export function logUserDownload(email: string, worksheetId: string): { success: boolean; count: number; error?: string } {
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    return { success: false, count: 0, error: "User not found" };
  }
  
  const downloads = readDownloads();
  let userDl = downloads.find(d => d.email === email);
  
  if (!userDl) {
    userDl = { email, worksheetIds: [] };
    downloads.push(userDl);
  }
  
  if (!userDl.worksheetIds.includes(worksheetId)) {
    // Check quota for free user
    if (user.role === "free" && userDl.worksheetIds.length >= 5) {
      return { success: false, count: userDl.worksheetIds.length, error: "Download quota exceeded (Limit 5 for Free users)" };
    }
    userDl.worksheetIds.push(worksheetId);
    writeDownloads(downloads);
  }
  
  return { success: true, count: userDl.worksheetIds.length };
}

export function getUserDownloadCount(email: string): number {
  const downloads = readDownloads();
  const userDl = downloads.find(d => d.email === email);
  return userDl ? userDl.worksheetIds.length : 0;
}

// ---------------- NEW DATABASE STRUCTURES: SOURCES & QUESTION BANK ----------------

export interface Source {
  source_id: string;
  source_name: string;
  source_category: string;
  publisher?: string;
  curriculum?: string;
  examination_type?: string;
  publication_year?: string | number;
  country?: string;
  notes?: string;
  active: boolean;
  createdAt?: string;
}

export interface QuestionBankEntry {
  id: string;
  subject: string;
  grade: string;
  cefr_level: string;
  topic: string;
  grammar_focus?: string;
  vocabulary_focus?: string;
  question_type: string;
  difficulty: string;
  learning_objective?: string;
  source_id?: string;
  source_category?: string;
  ai_generated: "Yes" | "No";
  generation_method?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  tags?: string[];
  status?: "pending" | "approved" | "rejected";
  reviewed_at?: string;
  reviewed_by?: string;
  reject_reason?: string;
  created_at: string;
  created_by: string;
}

const SOURCES_FILE = path.join(DATA_DIR, "sources.json");
const QUESTION_BANK_FILE = path.join(DATA_DIR, "question_bank_local.json");

export function readSources(): Source[] {
  try {
    if (!fs.existsSync(SOURCES_FILE)) {
      const defaultSources: Source[] = [
        {
          source_id: "src_suankularb",
          source_name: "Suankularb Entrance Exam",
          source_category: "Entrance Exam",
          publisher: "Suankularb Wittayalai",
          curriculum: "OBEC Thai Core Curriculum",
          examination_type: "Entrance Exam",
          publication_year: "2025",
          country: "Thailand",
          notes: "Predefined historical entrance exam guide",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          source_id: "src_triamudom",
          source_name: "Triam Udom Entrance Exam",
          source_category: "Entrance Exam",
          publisher: "Triam Udom Suksa",
          curriculum: "OBEC Thai Core Curriculum",
          examination_type: "Entrance Exam",
          publication_year: "2025",
          country: "Thailand",
          notes: "Highly rigorous English grammar questions",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          source_id: "src_cambridge",
          source_name: "Cambridge English",
          source_category: "English Proficiency Test",
          publisher: "Cambridge University Press",
          curriculum: "Cambridge Primary English Standards",
          examination_type: "Proficiency Exam",
          publication_year: "2024",
          country: "United Kingdom",
          notes: "A1-A2 CEFR level alignment",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          source_id: "src_oxford",
          source_name: "Oxford Practice Test",
          source_category: "English Proficiency Test",
          publisher: "Oxford University Press",
          curriculum: "Common European Framework Standards",
          examination_type: "Practice Exam",
          publication_year: "2024",
          country: "United Kingdom",
          notes: "Structured A1 diagnostic test",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          source_id: "src_ministry",
          source_name: "Ministry of Education",
          source_category: "Government Syllabus",
          publisher: "Ministry of Education Thailand",
          curriculum: "OBEC Thai Core Curriculum (พ.ศ. 2551)",
          examination_type: "Syllabus Standard",
          publication_year: "2008",
          country: "Thailand",
          notes: "Thai national syllabus specifications",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          source_id: "src_internal",
          source_name: "Internal Worksheet",
          source_category: "Other",
          publisher: "English Magic Team",
          curriculum: "OBEC Thai Core Curriculum",
          examination_type: "Classwork Worksheet",
          publication_year: "2026",
          country: "Thailand",
          notes: "Standard internal curriculum worksheets",
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(SOURCES_FILE, JSON.stringify(defaultSources, null, 2), "utf-8");
      return defaultSources;
    }
    const data = fs.readFileSync(SOURCES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading sources file:", e);
    return [];
  }
}

export function writeSources(sources: Source[]) {
  try {
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing sources file:", e);
  }
}

export function readQuestionBank(): QuestionBankEntry[] {
  try {
    if (!fs.existsSync(QUESTION_BANK_FILE)) {
      fs.writeFileSync(QUESTION_BANK_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const data = fs.readFileSync(QUESTION_BANK_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading question bank file:", e);
    return [];
  }
}

export function writeQuestionBank(entries: QuestionBankEntry[]) {
  try {
    fs.writeFileSync(QUESTION_BANK_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing question bank file:", e);
  }
}

// ---------------- TEACHER PROFILE HELPERS ----------------
export function readTeacherProfiles(): TeacherProfile[] {
  try {
    if (!fs.existsSync(TEACHER_PROFILES_FILE)) {
      fs.writeFileSync(TEACHER_PROFILES_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const data = fs.readFileSync(TEACHER_PROFILES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading teacher profiles file:", e);
    return [];
  }
}

export function writeTeacherProfiles(profiles: TeacherProfile[]) {
  try {
    fs.writeFileSync(TEACHER_PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing teacher profiles file:", e);
  }
}

export function getTeacherProfileByUid(uid: string): TeacherProfile | null {
  const profiles = readTeacherProfiles();
  const found = profiles.find(p => p.uid.toLowerCase() === uid.toLowerCase());
  return found || null;
}

export function saveTeacherProfile(profile: TeacherProfile): TeacherProfile {
  const profiles = readTeacherProfiles();
  const index = profiles.findIndex(p => p.uid.toLowerCase() === profile.uid.toLowerCase());
  const updated: TeacherProfile = {
    ...profile,
    updatedAt: new Date().toISOString()
  };
  if (index >= 0) {
    profiles[index] = updated;
  } else {
    profiles.push(updated);
  }
  writeTeacherProfiles(profiles);
  return updated;
}
