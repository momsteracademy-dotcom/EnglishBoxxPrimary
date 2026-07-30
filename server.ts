import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import {
  readUsers,
  writeUsers,
  readRepository,
  writeRepository,
  readDownloads,
  writeDownloads,
  logUserDownload,
  getUserDownloadCount,
  UserProfile,
  RepositoryWorksheet,
  readSources,
  writeSources,
  readQuestionBank,
  writeQuestionBank,
  Source,
  QuestionBankEntry,
  TeacherProfile,
  readTeacherProfiles,
  writeTeacherProfiles,
  getTeacherProfileByUid,
  saveTeacherProfile
} from "./server/db";
import {
  isFirebaseConfigured,
  getFirebaseWorksheets,
  saveFirebaseWorksheet,
  deleteFirebaseWorksheet,
  getFirebaseQuestionBank,
  saveFirebaseQuestionBankItem,
  saveMultipleFirebaseQuestionBankItems,
  deleteFirebaseQuestionBankItem,
  getFirebaseTeacherProfile,
  saveFirebaseTeacherProfile
} from "./server/firebase";

dotenv.config();

// Supabase integration disabled per user request
let supabaseClient: any = null;
function isSupabaseConfigured() {
  return false;
}

// ==========================================
// TEXT NORMALIZATION & DUPLICATE QUESTION CHECKING
// ==========================================
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0E00-\u0E7F]/g, " ")
    .replace(/\s+/g, " ");
}

export function isDuplicateQuestion(
  newItem: any,
  existingBank: any[]
): { isDuplicate: boolean; matchedReason?: string; matchedItem?: any } {
  if (!newItem) return { isDuplicate: false };

  const newText = newItem.question_text || newItem.questionText || "";
  const newTextNorm = normalizeText(newText);
  if (!newTextNorm) return { isDuplicate: false };

  const newGradeNorm = normalizeText(newItem.grade || newItem.gradeLabel || "");
  const newTopicNorm = normalizeText(newItem.topic || "");
  const newAnsNorm = normalizeText(newItem.correct_answer || newItem.correctAnswer || "");
  const newOptionsNorm = (newItem.options || []).map((o: string) => normalizeText(o)).filter(Boolean).sort().join("|");

  for (const item of existingBank) {
    if (!item) continue;
    // Skip if comparing same record ID (i.e. updating existing record)
    if (newItem.id && item.id && String(newItem.id) === String(item.id)) {
      continue;
    }

    const itemText = item.question_text || item.questionText || "";
    const itemTextNorm = normalizeText(itemText);
    if (!itemTextNorm) continue;

    const itemGradeNorm = normalizeText(item.grade || item.gradeLabel || "");
    const itemTopicNorm = normalizeText(item.topic || "");
    const itemAnsNorm = normalizeText(item.correct_answer || item.correctAnswer || "");
    const itemOptionsNorm = (item.options || []).map((o: string) => normalizeText(o)).filter(Boolean).sort().join("|");

    // Check 1: Exact normalized question text match
    if (newTextNorm === itemTextNorm) {
      return { isDuplicate: true, matchedReason: "โจทย์ข้อสอบซ้ำกับในคลังข้อสอบ", matchedItem: item };
    }

    // Check 2: Same options & correct answer under same grade/topic
    if (
      newAnsNorm && itemAnsNorm && newAnsNorm === itemAnsNorm &&
      newOptionsNorm && itemOptionsNorm && newOptionsNorm === itemOptionsNorm &&
      (!newGradeNorm || !itemGradeNorm || newGradeNorm === itemGradeNorm)
    ) {
      return { isDuplicate: true, matchedReason: "ตัวเลือกและคำตอบซ้ำกับข้อสอบที่มีอยู่ในคลัง", matchedItem: item };
    }

    // Check 3: Significant text overlap for longer questions with same correct answer
    if (newTextNorm.length > 10 && itemTextNorm.length > 10) {
      if ((newTextNorm.includes(itemTextNorm) || itemTextNorm.includes(newTextNorm)) && newAnsNorm === itemAnsNorm) {
        if (!newGradeNorm || !itemGradeNorm || newGradeNorm === itemGradeNorm) {
          return { isDuplicate: true, matchedReason: "ข้อความโจทย์และคำตอบมีความคล้ายคลึงอย่างมาก", matchedItem: item };
        }
      }
    }
  }

  return { isDuplicate: false };
}

export function deduplicateQuestionBank(bank: any[]): any[] {
  const uniqueBank: any[] = [];
  for (const item of bank) {
    if (!isDuplicateQuestion(item, uniqueBank).isDuplicate) {
      uniqueBank.push(item);
    }
  }
  return uniqueBank;
}

function disableSupabaseFallback() {
  // no-op
}

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  
  let supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not fully configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your user Secrets.");
  }

  // Clean URL if it ends with /rest/v1/ or /rest/v1
  let cleanUrl = supabaseUrl.trim();
  cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, "");
  
  supabaseClient = createClient(cleanUrl, supabaseAnonKey.trim());
  return supabaseClient;
}

let supabaseService: any = null;

function getSupabaseService() {
  if (supabaseService) return supabaseService;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase is not fully configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY.");
  }

  // Clean URL if it ends with /rest/v1/ or /rest/v1
  let cleanUrl = supabaseUrl.trim();
  cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, "");
  
  supabaseService = createClient(cleanUrl, serviceKey.trim());
  return supabaseService;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- AUTH ENDPOINTS ---
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and Password are required" });
      }
      
      const users = readUsers();
      const user = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ error: "Incorrect password" });
      }
      
      // Auto-promote sakarinmam999@gmail.com or momsteracademy@gmail.com to admin if not already set
      if ((user.email.trim().toLowerCase() === "sakarinmam999@gmail.com" || user.email.trim().toLowerCase() === "momsteracademy@gmail.com") && user.role !== "admin") {
        user.role = "admin";
        writeUsers(users);
      }
      
      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        downloadCount: getUserDownloadCount(user.email)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and Password are required" });
      }
      
      const users = readUsers();
      const exists = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
      
      if (exists) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const isSakarinAdmin = email.trim().toLowerCase() === "sakarinmam999@gmail.com" || email.trim().toLowerCase() === "momsteracademy@gmail.com";
      const newUser: UserProfile = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        email: email.trim().toLowerCase(),
        password: password,
        role: isSakarinAdmin ? "admin" : "free", // auto-promote admin
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      writeUsers(users);
      
      res.json({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        downloadCount: 0
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/me", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const users = readUsers();
      const user = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan || user.role,
        plan_expiry: user.plan_expiry || null,
        createdAt: user.createdAt,
        downloadCount: getUserDownloadCount(user.email)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- TEACHER BRANDING PROFILE ENDPOINTS ---
  app.get("/api/teacher-profile", async (req, res) => {
    try {
      const email = (req.query.email || req.query.uid || "") as string;
      if (!email) {
        return res.status(400).json({ error: "Email or UID is required" });
      }

      // Try Firebase Firestore first
      if (isFirebaseConfigured()) {
        const fbProfile = await getFirebaseTeacherProfile(email.trim().toLowerCase());
        if (fbProfile) {
          return res.json(fbProfile);
        }
      }

      // Fallback to local DB
      const localProfile = getTeacherProfileByUid(email.trim().toLowerCase());
      if (localProfile) {
        return res.json(localProfile);
      }

      // Default blank profile
      res.json({
        uid: email.trim().toLowerCase(),
        teacher_name: "",
        school_name: "",
        logo_url: "",
        logo_position: "left",
        watermark: ""
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teacher-profile", async (req, res) => {
    try {
      const { uid, teacher_name, school_name, logo_url, logo_position, watermark } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "UID/Email is required" });
      }

      const cleanUid = String(uid).trim().toLowerCase();
      const profileData: TeacherProfile = {
        uid: cleanUid,
        teacher_name: teacher_name || "",
        school_name: school_name || "",
        logo_url: logo_url || "",
        logo_position: logo_position || "left",
        watermark: watermark || "",
        updatedAt: new Date().toISOString()
      };

      // Save to local file DB
      const savedLocal = saveTeacherProfile(profileData);

      // Sync to Firebase Firestore if configured
      if (isFirebaseConfigured()) {
        await saveFirebaseTeacherProfile(cleanUid, profileData);
      }

      res.json({ success: true, profile: savedLocal });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- ADMIN MEMBER MANAGEMENT & SUBSCRIPTION PLANS ---
  app.get("/api/users", (req, res) => {
    try {
      const users = readUsers();
      const list = users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        plan: u.plan || u.role,
        plan_expiry: u.plan_expiry || null,
        createdAt: u.createdAt,
        downloadCount: getUserDownloadCount(u.email)
      }));
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/update-role", async (req: any, res: any) => {
    try {
      const { targetEmail, newRole, plan_expiry } = req.body;
      if (!targetEmail || !newRole) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const users = readUsers();
      const userIndex = users.findIndex(u => u.email.trim().toLowerCase() === targetEmail.trim().toLowerCase());
      
      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Prevent demoting the initial admins via API
      if ((targetEmail.trim().toLowerCase() === "sakarinmam999@gmail.com" || targetEmail.trim().toLowerCase() === "momsteracademy@gmail.com") && newRole !== "admin") {
        return res.status(400).json({ error: "Cannot demote the main admin user." });
      }
      
      users[userIndex].role = newRole;
      users[userIndex].plan = newRole;
      if (plan_expiry !== undefined) {
        users[userIndex].plan_expiry = plan_expiry;
      }
      writeUsers(users);

      // If Supabase is configured, also update profiles table
      if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getSupabaseService();
          await supabase
            .from('profiles')
            .update({ role: newRole, plan: newRole, plan_expiry: plan_expiry || null })
            .eq('email', targetEmail.trim().toLowerCase());
        } catch (err: any) {
          console.warn("Could not sync role to Supabase profiles:", err.message || err);
        }
      }
      
      res.json({ success: true, email: targetEmail, role: newRole, plan: newRole, plan_expiry: users[userIndex].plan_expiry });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/update-plan", async (req: any, res: any) => {
    try {
      const { targetEmail, plan, plan_expiry } = req.body;
      if (!targetEmail || !plan) {
        return res.status(400).json({ error: "Missing required fields targetEmail and plan" });
      }

      const users = readUsers();
      const userIndex = users.findIndex(u => u.email.trim().toLowerCase() === targetEmail.trim().toLowerCase());

      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      users[userIndex].role = plan;
      users[userIndex].plan = plan;
      users[userIndex].plan_expiry = plan_expiry || null;
      writeUsers(users);

      res.json({
        success: true,
        email: targetEmail,
        plan,
        plan_expiry: users[userIndex].plan_expiry
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- PAYMENT SUCCESS WEBHOOK / CALLBACK ENDPOINT ---
  app.post("/api/payment-success", async (req: any, res: any) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      let emailFound = "";

      // 1. If Supabase is configured, update the cloud database profiles table
      if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = getSupabaseService();
        
        // Update profile role and download count in Supabase
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            role: 'premium',
            download_count: 0 // Reset/unlimit download counts
          })
          .eq('id', userId)
          .select('email')
          .maybeSingle();

        if (error) {
          console.error("Supabase update role on payment success failed:", error);
        } else if (data && data.email) {
          emailFound = data.email;
        }

        // If we didn't get email back via select().maybeSingle(), try direct query
        if (!emailFound) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', userId)
              .maybeSingle();
            if (profile && profile.email) {
              emailFound = profile.email;
            }
          } catch (profileErr) {
            console.warn("Could not fetch user email from profile:", profileErr);
          }
        }
      }

      // 2. Always sync with local users.json database
      const users = readUsers();
      let userUpdated = false;

      // Try finding by email from Supabase if we got it
      if (emailFound) {
        const idx = users.findIndex(u => u.email.trim().toLowerCase() === emailFound.trim().toLowerCase());
        if (idx !== -1) {
          users[idx].role = "premium";
          writeUsers(users);
          userUpdated = true;
        }
      }

      // Fallback: search local DB by userId matching id or email
      if (!userUpdated) {
        const idx = users.findIndex(u => u.id === userId || u.email.trim().toLowerCase() === userId.trim().toLowerCase());
        if (idx !== -1) {
          users[idx].role = "premium";
          writeUsers(users);
          userUpdated = true;
        }
      }

      res.json({ success: true, message: "User successfully upgraded to Premium" });
    } catch (error: any) {
      console.error("Error in /api/payment-success endpoint:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- REPOSITORY EXAMS MANAGEMENT ---
  app.get("/api/repository/list", (req, res) => {
    try {
      const repo = readRepository();
      res.json(repo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/repository/add", async (req, res) => {
    try {
      const { id, grade, topic, exerciseStyle, data, createdBy } = req.body;
      if (!id || !grade || !topic || !exerciseStyle || !data) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const repo = readRepository();
      const existingIndex = repo.findIndex(item => item.id === id);
      
      const newItem: RepositoryWorksheet = {
        id,
        createdAt: new Date().toISOString(),
        grade,
        topic,
        exerciseStyle,
        created_by: createdBy || "admin",
        data
      };
      
      if (existingIndex !== -1) {
        repo[existingIndex] = newItem;
      } else {
        repo.push(newItem);
      }
      
      writeRepository(repo);

      // --- SYNC TO SUPABASE QUESTION BANK ---
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseService();
          // First delete existing questions in the bank for this exact grade, topic and format to avoid duplicates
          await supabase
            .from("question_bank")
            .delete()
            .eq("grade", grade)
            .eq("topic", topic)
            .eq("format", exerciseStyle);

          // Build row objects for the question_bank table
          const questionsList = (data.questions || []).map((q: any) => ({
            grade,
            topic,
            format: exerciseStyle,
            question_text: q.questionText || q.question_text || "",
            options: q.options || [],
            correct_answer: q.correctAnswer || q.correct_answer || "",
            explanation: q.explanation || "",
            matching_left: q.matchingLeft || "",
            matching_right: q.matchingRight || ""
          }));

          if (questionsList.length > 0) {
            const { error: insertError } = await supabase
              .from("question_bank")
              .insert(questionsList);

            if (insertError) {
              console.error("Supabase question_bank sync error:", insertError.message || insertError);
            } else {
              console.log(`Successfully synchronized ${questionsList.length} questions to Supabase question_bank.`);
            }
          }
        } catch (supaErr: any) {
          console.warn("Could not sync shared repository questions to Supabase:", supaErr.message || supaErr);
        }
      }

      res.json({ success: true, item: newItem });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/repository/delete/:id", (req, res) => {
    try {
      const { id } = req.params;
      const repo = readRepository();
      const filtered = repo.filter(item => item.id !== id);
      writeRepository(filtered);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- DOWNLOAD QUOTA TRACKING ---
  app.post("/api/log-download", async (req, res) => {
    try {
      const { email, worksheetId } = req.body;
      if (!email || !worksheetId) {
        return res.status(400).json({ error: "Missing email or worksheetId" });
      }
      
      // 1. Sync & enforce quota with Supabase if configured
      if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getSupabaseService();
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, download_count')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (!profileError && profile) {
            if (profile.role === 'free') {
              const currentCount = profile.download_count || 0;
              if (currentCount >= 5) {
                return res.status(403).json({ 
                  error: "คุณครูใช้สิทธิ์สมาชิกทั่วไปครบ 5 ใบงานแล้วค่ะ สนใจอัปเกรดเป็น Premium เพื่อดาวน์โหลดไม่จำกัดไหมคะ? 🪄✨" 
                });
              }
              
              // Increment the count in Supabase profiles
              await supabase
                .from('profiles')
                .update({ download_count: currentCount + 1 })
                .eq('email', email.trim().toLowerCase());
            }
          }
        } catch (supaErr: any) {
          console.warn("Could not sync download counter to Supabase profiles:", supaErr.message || supaErr);
        }
      }

      // 2. Always log locally as a stable backup
      const result = logUserDownload(email, worksheetId);
      if (!result.success) {
        return res.status(403).json({ error: result.error, count: result.count });
      }
      
      res.json({ success: true, count: result.count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to map DB questions (snake_case/camelCase) to frontend camelCase WorksheetQuestion objects with running numbers
  function mapDatabaseQuestions(questions: any[]): any[] {
    return (questions || []).map((q: any, index: number) => ({
      id: index + 1,
      questionText: q.question_text || q.questionText || "",
      options: Array.isArray(q.options) ? q.options : (typeof q.options === "string" ? JSON.parse(q.options) : []),
      correctAnswer: q.correct_answer || q.correctAnswer || "",
      explanation: q.explanation || "",
      matchingLeft: q.matching_left || q.matchingLeft || "",
      matchingRight: q.matching_right || q.matchingRight || ""
    }));
  }

  // API Route: Generate/Fetch Worksheet (Pull strictly from Question Bank in Firebase/Local)
  app.post("/api/generate-worksheet", async (req, res) => {
    try {
      const { grade, topic, learningStage, focus, exerciseStyle, numQuestions, customPrompt, email } = req.body;

      if (!grade || !topic) {
        return res.status(400).json({ error: "Missing required fields: grade, topic" });
      }

      // Check user role
      const users = readUsers();
      const userEmailClean = (email || "").trim().toLowerCase();
      const user = users.find(u => u.email.trim().toLowerCase() === userEmailClean);
      let role = user ? user.role : (userEmailClean ? "premium" : "free");
      if (userEmailClean === "momsteracademy@gmail.com" || userEmailClean === "sakarinmam999@gmail.com" || (user && user.role === "admin")) {
        role = "admin";
      }

      // 1. Fetch Question Bank from Firebase AND Local
      let bank: any[] = [];
      if (isFirebaseConfigured()) {
        try {
          const fbBank = await getFirebaseQuestionBank();
          if (fbBank && Array.isArray(fbBank)) {
            bank = fbBank;
          }
        } catch (e) {
          console.error("Firebase read error in generate-worksheet, fallback to local:", e);
        }
      }
      const localBank = readQuestionBank();
      const bankIds = new Set(bank.map(q => String(q.id)));
      for (const q of localBank) {
        if (!bankIds.has(String(q.id))) {
          bank.push(q);
        }
      }

      // Helper function to normalize strings for comparison
      const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
      const normTopic = normalize(topic);
      const normStyle = normalize(exerciseStyle || "");

      // 2. Filter Question Bank items by grade, topic, and style (Only Approved status)
      let qbMatches = bank.filter((q: any) => {
        const qStatus = (q.status || "approved").toLowerCase();
        if (qStatus !== "approved") return false;

        const qGrade = q.grade || "ป.3";
        const mGrade = qGrade === grade;

        const qTopic = normalize(q.topic || "");
        const mTopic = !normTopic || qTopic.includes(normTopic) || normTopic.includes(qTopic) || normTopic === "all" || normTopic === "ทุกหัวข้อ";

        let mStyle = true;
        if (normStyle && normStyle !== "all" && normStyle !== "ทุกประเภทโจทย์") {
          const qFormat = normalize(q.question_type || q.format || q.questionType || "");
          mStyle = qFormat.includes(normStyle) || normStyle.includes(qFormat);
        }

        return mGrade && mTopic && mStyle;
      });

      // Relax style check if no match found for specific style (Only Approved status)
      if (qbMatches.length === 0 && normStyle) {
        qbMatches = bank.filter((q: any) => {
          const qStatus = (q.status || "approved").toLowerCase();
          if (qStatus !== "approved") return false;

          const qGrade = q.grade || "ป.3";
          const mGrade = qGrade === grade;
          const qTopic = normalize(q.topic || "");
          const mTopic = !normTopic || qTopic.includes(normTopic) || normTopic.includes(qTopic);
          return mGrade && mTopic;
        });
      }

      // If matching questions exist in Question Bank, return them!
      if (qbMatches.length > 0) {
        let selectedQuestions = qbMatches;
        if (numQuestions && numQuestions > 0 && numQuestions < qbMatches.length) {
          selectedQuestions = qbMatches.slice(0, numQuestions);
        }
        if (role === "free" && selectedQuestions.length > 5) {
          selectedQuestions = selectedQuestions.slice(0, 5);
        }

        const generatedWorksheet = {
          title: topic,
          gradeLabel: grade,
          instructions: `Complete the exercises about ${topic}`,
          passage: "",
          questions: mapDatabaseQuestions(selectedQuestions)
        };

        return res.json(generatedWorksheet);
      }

      // 3. Fallback: Check saved repository worksheets
      const repo = readRepository();
      let repoMatches = repo.filter(item => {
        const mGrade = item.grade === grade;
        const normRepoTopic = normalize(item.topic);
        const normRepoTitle = normalize(item.data?.title || "");
        const mTopic = normRepoTopic.includes(normTopic) || normTopic.includes(normRepoTopic) || normRepoTitle.includes(normTopic);
        return mGrade && mTopic;
      });

      if (repoMatches.length > 0) {
        const matchedItem = repoMatches[0];
        const worksheet = JSON.parse(JSON.stringify(matchedItem.data));
        if (role === "free") {
          worksheet.questions = worksheet.questions.slice(0, 5);
          worksheet.title = `${worksheet.title} (Free Trial)`;
        } else if (numQuestions && numQuestions < worksheet.questions.length) {
          worksheet.questions = worksheet.questions.slice(0, numQuestions);
        }
        return res.json(worksheet);
      }

      // 4. Fallback to Gemini AI Generation if not found in Bank or Repository
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(404).json({
          error: `ไม่พบข้อสอบเรื่อง "${topic}" สำหรับชั้น ${grade} ในคลังข้อสอบ\nและไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบเพื่อสร้างข้อสอบอัตโนมัติ`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Craft custom curriculum instructions based on grade
      let curriculumGuide = "";
      if (grade === "ป.1") {
        curriculumGuide = `
        - GRADE: ป.1 (Grade 1) - Age 6-7.
        - VOCABULARY RANGE: Extremely simple, 150-200 words limit. Theme: Self, family, classroom objects, basic colors, animals, numbers 1-10.
        - COMPLEXITY: Strictly short phrases or single-word answers. No full clauses, no complex grammar.
        - EXERCISE STYLE GUIDE: Simple instructions (e.g., Match, Circle, Yes/No).
        `;
      } else if (grade === "ป.2") {
        curriculumGuide = `
        - GRADE: ป.2 (Grade 2) - Age 7-8.
        - VOCABULARY RANGE: Simple, 250-300 words. Themes: My family, house, food, body parts, animals.
        - COMPLEXITY: Simple sentences. Yes/No questions (e.g., "Is this a...?", "Is it...?") and very basic Wh-questions (e.g., "What is this?", "How many...", "Where is...?").
        `;
      } else if (grade === "ป.3") {
        curriculumGuide = `
        - GRADE: ป.3 (Grade 3) - Age 8-9.
        - VOCABULARY RANGE: Basic, 350-450 words. Themes: Daily activities, hobbies, basic emotions, weather, food.
        - COMPLEXITY: Basic single clauses. Expressing basic feelings and needs (e.g., "I like...", "I am happy.", "I want..."). Basic Wh-questions.
        `;
      } else if (grade === "ป.4") {
        curriculumGuide = `
        - GRADE: ป.4 (Grade 4) - Age 9-10.
        - VOCABULARY RANGE: Moderate, 550-700 words. Introduce simple abstract words (e.g., love, help, time, work).
        - COMPLEXITY: Use of simple sequencing words (First, Next, Then, Finally) to describe steps or simple stories. Past tense introduction (was/were, simple regular verbs).
        `;
      } else if (grade === "ป.5") {
        curriculumGuide = `
        - GRADE: ป.5 (Grade 5) - Age 10-11.
        - VOCABULARY RANGE: Expanded, 750-950 words. Themes: Environment, occupations, travel, health, brief narratives.
        - COMPLEXITY: Compound sentences. Giving reasons using the conjunction "because" (e.g., "I like cats because they are cute."). Identifying main ideas from short stories.
        `;
      } else if (grade === "ป.6") {
        curriculumGuide = `
        - GRADE: ป.6 (Grade 6) - Age 11-12.
        - VOCABULARY RANGE: High, 1,050-1,200 words. Themes: Festivals, history, simple technology, global issues, folktales.
        - COMPLEXITY: Compound and complex ideas. Advanced Wh-questions ("Why", "How" with descriptive answers). Reading short essays, emails, or tales, and evaluating main points.
        `;
      }

      // Prepare system instruction and prompt
      const systemInstruction = `
      You are English Magic Primary, an expert English Language Teacher's Assistant aligned with the Thai Ministry of Education Primary School English Curriculum (O-NET friendly).
      Your core task is to generate highly aligned, ready-to-print English worksheets for primary school students in Thailand.

      CRITICAL CONSTRAINTS:
      1. STRICT LANGUAGE SEPARATION:
         - 'questionText', 'options', 'passage', 'matchingLeft', 'matchingRight', and worksheet instructions MUST BE 100% IN ENGLISH ONLY.
         - NEVER include Thai text, Thai translation, or parenthetical Thai inside 'questionText', 'options', or 'passage'.
         - 'explanation' MUST BE WRITTEN IN THAI, and MUST CONTAIN BOTH:
           a) "คำแปล: " followed by the full Thai translation of the question/sentence and choices/correct answer.
           b) "คำอธิบาย: " followed by a clear, friendly, educational explanation in Thai explaining why the answer is correct.
      2. Adhere strictly to the requested grade-level vocabulary size, grammatical constraints, and sentence complexity:
         ${curriculumGuide}
      3. For any question type, ensure the answers are clear, unambiguous, and grammatically correct.
      4. Avoid spelling mistakes, double correct answers, or overly advanced phrasing.
      `;

      const prompt = `
      Generate an English worksheet with the following specifications:
      - Grade Level: ${grade}
      - Topic/Theme: ${topic}
      ${learningStage ? `- Learning Stage: ${learningStage}` : ""}
      ${focus ? `- Sub-skill Focus: ${focus}` : ""}
      - Exercise Style: ${exerciseStyle}
      - Number of Questions: ${numQuestions}
      ${customPrompt ? `- Teacher's Custom Focus/Notes: ${customPrompt}` : ""}

      STRICT LANGUAGE REQUIREMENTS:
      - All questions, choices (A-D), passages, and prompts MUST BE 100% STRICTLY IN ENGLISH ONLY (absolutely NO THAI text in questionText, options, or passage).
      - In 'explanation', you MUST provide:
        1. "คำแปล: [คำแปลภาษาไทยของโจทย์และคำตอบ]"
        2. "คำอธิบาย: [คำอธิบายประกอบภาษาไทยอย่างอารมณ์ดีและเข้าใจง่าย]"

      QUESTION TYPE SPECIFICS (TEXT-BASED MVP):
      - All questions MUST be strictly text-based. Do NOT request or generate images or visual prompts.
      - If exerciseStyle is "matching" or "word-matching" or "picture-matching":
        - Provide 'matchingLeft' (left text item) and 'matchingRight' (right text answer/meaning).
        - 'correctAnswer' must state the pair (e.g. "Apple - ผลไม้").
      - If exerciseStyle is "fill-in-blank":
        - 'questionText' must contain a clear blank line "_______".
        - Provide choices in 'options' or word bank items.
      - If exerciseStyle is "true-false":
        - 'questionText' is a statement.
        - 'options' must be ["True", "False"].
      - If exerciseStyle is "reading" or "reading-comprehension":
        - Populate 'passage' with a simple story/text in English.
        - Questions refer to the passage text.

      Ensure the JSON output complies exactly with the requested response schema.
      `;

      let response;
      let lastError;
      const modelsToTry = [
        "gemini-3.6-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];

      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          try {
            console.log(`Attempting generation with model ${modelName} (attempt ${attempts + 1})...`);
            response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    gradeLabel: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                    passage: { type: Type.STRING },
                    questions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.INTEGER },
                          questionType: { type: Type.STRING },
                          questionText: { type: Type.STRING },
                          options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                          },
                          correctAnswer: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                          matchingLeft: { type: Type.STRING },
                          matchingRight: { type: Type.STRING },
                          visual: {
                            type: Type.OBJECT,
                            properties: {
                              required: { type: Type.BOOLEAN },
                              type: { type: Type.STRING },
                              prompt: { type: Type.STRING },
                              url: { type: Type.STRING }
                            }
                          }
                        },
                        required: ["id", "questionText", "correctAnswer"]
                      }
                    }
                  },
                  required: ["title", "gradeLabel", "instructions", "questions"]
                }
              }
            });
            break;
          } catch (err: any) {
            lastError = err;
            attempts++;
            console.warn(`Model ${modelName} failed on attempt ${attempts}:`, err.message || err);
            if (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
        if (response) {
          break;
        }
      }

      if (!response) {
        throw lastError || new Error("Failed to generate content with all available models.");
      }

      const text = response.text;
      if (!text) {
        throw new Error("No response from AI model.");
      }

      const parsed = JSON.parse(text);

      // Normalize questions to clean text-based MVP structure
      if (Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map((q: any, idx: number) => {
          let qType = q.questionType || exerciseStyle || "multiple-choice";
          if (qType.startsWith("picture-")) {
            qType = qType.replace("picture-", "");
          }
          if (qType === "matching") {
            qType = "matching";
          }

          return {
            ...q,
            id: q.id || (idx + 1),
            questionType: qType,
            visual: { required: false, type: "none" }
          };
        });
      }

      // Auto-save generated worksheet to repository and question bank so future requests can pull from repo
      try {
        const newRepoItem = {
          id: `repo_gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
          grade,
          topic,
          exerciseStyle,
          created_by: email || "system",
          data: parsed
        };
        const currentRepo = readRepository();
        currentRepo.push(newRepoItem);
        writeRepository(currentRepo);

        // Also save to local question bank with clean structure (excluding duplicates)
        if (Array.isArray(parsed.questions)) {
          const currentQb = readQuestionBank();
          const qbItems = parsed.questions.map((q: any, idx: number) => ({
            id: `qb_${Date.now()}_${idx}`,
            subject: "English",
            grade,
            cefr_level: grade === "ป.1" || grade === "ป.2" ? "Pre-A1" : "A1",
            topic,
            learning_stage: learningStage || "Vocabulary & Meaning",
            focus: focus || "",
            question_type: q.questionType || exerciseStyle || "multiple-choice",
            difficulty: "Medium",
            question_text: q.questionText || "",
            options: q.options || [],
            correct_answer: q.correctAnswer || "",
            explanation: q.explanation || "",
            matching_left: q.matchingLeft || "",
            matching_right: q.matchingRight || "",
            visual_required: false,
            visual_type: "none",
            visual_prompt: "",
            visual_url: "",
            visual: { required: false, type: "none" },
            created_at: new Date().toISOString(),
            created_by: email || "system"
          }));

          const uniqueQbItems: any[] = [];
          for (const item of qbItems) {
            if (!isDuplicateQuestion(item, [...currentQb, ...uniqueQbItems]).isDuplicate) {
              uniqueQbItems.push(item);
            }
          }

          if (uniqueQbItems.length > 0) {
            currentQb.push(...uniqueQbItems);
            writeQuestionBank(currentQb);

            if (isFirebaseConfigured()) {
              saveMultipleFirebaseQuestionBankItems(uniqueQbItems);
              saveFirebaseWorksheet({
                id: newRepoItem.id,
                created_at: newRepoItem.createdAt,
                grade,
                topic,
                exercise_style: exerciseStyle,
                data: parsed
              });
            }
          }
        }
      } catch (saveErr) {
        console.warn("Error auto-saving AI generated worksheet to repository:", saveErr);
      }

      // Enforce Free user constraint: Only 5 questions if free user
      if (role === "free") {
        parsed.questions = (parsed.questions || []).slice(0, 5);
        parsed.title = `${parsed.title} (Free Trial)`;
      }

      res.json(parsed);

    } catch (error: any) {
      console.error("Error generating worksheet:", error);
      res.status(500).json({ error: error.message || "Failed to generate worksheet." });
    }
  });

  // --- USER SPECIFIC WORKSHEET ROUTE (handleUserWorksheetRequest logic) ---
  app.post("/api/user-worksheet", async (req: any, res: any) => {
    // รับค่า userId จาก Supabase Auth token หลังล็อกอิน หรือจาก body/query/email เพื่อความยืดหยุ่นและเสถียรภาพ
    const userId = req.user?.id || req.body.userId || req.body.email || "guest-user";
    const { grade, topic, format, exerciseStyle } = req.body;

    // Support both format (from snippet) and exerciseStyle (from frontend)
    const activeStyle = format || exerciseStyle;

    if (!grade || !topic || !activeStyle) {
      return res.status(400).json({ error: "Missing required fields: grade, topic, format/exerciseStyle" });
    }

    try {
      let profile: { role: string; download_count: number } | null = null;
      let isUsingSupabase = false;

      // 🔍 1. ตรวจสอบสิทธิ์ (Role) และโควตาของผู้ใช้รายนี้จากตาราง profiles
      if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getSupabaseService();
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('role', 'download_count')
            .eq('id', userId)
            .single();

          if (!profileError && data) {
            profile = { 
              role: data.role || "free", 
              download_count: data.download_count || 0 
            };
            isUsingSupabase = true;
          }
        } catch (err: any) {
          console.warn("Supabase profiles query failed, falling back to local database:", err.message || err);
        }
      }

      // Fallback Profile: If Supabase is not configured or fails, use local users.json
      if (!profile) {
        const users = readUsers();
        const u = users.find(x => 
          x.id === userId || 
          x.email === userId || 
          x.email.trim().toLowerCase() === String(userId || "").trim().toLowerCase()
        );
        if (u) {
          const dlCount = getUserDownloadCount(u.email);
          profile = { role: u.role, download_count: dlCount };
        } else {
          profile = { role: "free", download_count: 0 };
        }
      }

      // 🔒 ตั้งค่าข้อจำกัดตามสิทธิ์ (Tier Constraints)
      let itemLimit = 20; // ค่าเริ่มต้นของ Premium หรือ Admin
      
      if (profile.role === 'free') {
        // สมาชิก Free ทำได้แค่ 5 ข้อ
        itemLimit = 5; 
        
        // ตรวจสอบว่าดาวน์โหลดเกิน 5 ใบงานหรือยัง
        if (profile.download_count >= 5) {
          return res.status(403).json({ 
            error: 'คุณครูใช้สิทธิ์สมาชิกทั่วไปครบ 5 ใบงานแล้วค่ะ สนใจอัปเกรดเป็น Premium เพื่อดาวน์โหลดไม่จำกัดไหมคะ? 🪄✨' 
          });
        }
      }

      // 🔍 2. ดึงข้อสอบจากคลัง (Supabase) ที่ Admin สร้างไว้เท่านั้น ห้ามใช้ AI เจนสด
      let questions: any[] = [];
      let worksheetTitle = `Worksheet: ${topic}`;
      let gradeLabel = grade;
      let instructions = `Complete the exercises about ${topic}`;
      let passage = "";

      if (isUsingSupabase) {
        const supabase = getSupabaseService();
        const { data, error: dbError } = await supabase
          .from('question_bank')
          .select('*')
          .eq('grade', grade)
          .eq('topic', topic)
          .eq('format', activeStyle)
          .limit(itemLimit);

        if (dbError) throw dbError;
        questions = data || [];
      } else {
        // Local fallback: pull from repository.json
        const repo = readRepository();
        const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
        const normTopic = normalize(topic);
        const normStyle = normalize(activeStyle);
        
        const matches = repo.filter(item => {
          const mGrade = item.grade === grade;
          const mStyle = normalize(item.exerciseStyle) === normStyle;
          const normRepoTopic = normalize(item.topic);
          const normRepoTitle = normalize(item.data?.title || "");
          return mGrade && mStyle && (normRepoTopic.includes(normTopic) || normTopic.includes(normRepoTopic) || normRepoTitle.includes(normTopic));
        });

        if (matches.length > 0) {
          const matchedItem = matches[0];
          const worksheetData = matchedItem.data || {};
          const rawQs = worksheetData.questions || [];
          questions = rawQs.slice(0, itemLimit);
          worksheetTitle = worksheetData.title || worksheetTitle;
          gradeLabel = worksheetData.gradeLabel || gradeLabel;
          instructions = worksheetData.instructions || instructions;
          passage = worksheetData.passage || passage;
        }
      }

      // 🚫 ถ้าระบบค้นหาในคลังแล้วไม่เจอข้อสอบที่ Admin ทำไว้
      if (!questions || questions.length === 0) {
        return res.status(404).json({ 
          error: 'ขออภัยค่ะ ระบบยังไม่มีชุดใบงานหัวข้อนี้ในคลัง คุณครูสามารถแจ้งความต้องการให้ Admin เพิ่มระบบได้นะคะ' 
        });
      }

      // 📈 3. หากเป็นสมาชิก Free และดึงข้อมูลสำเร็จ ให้บวกคะแนนการดาวน์โหลดเพิ่ม 1
      if (profile.role === 'free') {
        if (isUsingSupabase) {
          const supabase = getSupabaseService();
          await supabase
            .from('profiles')
            .update({ download_count: profile.download_count + 1 })
            .eq('id', userId);
        } else {
          // Increment local downloads count
          const users = readUsers();
          const u = users.find(x => 
            x.id === userId || 
            x.email === userId || 
            x.email.trim().toLowerCase() === String(userId || "").trim().toLowerCase()
          );
          if (u) {
            logUserDownload(u.email, "ws_pull_" + Date.now());
          }
        }
      }

      // ส่งข้อสอบกลับไปให้หน้าบ้านวาดหน้าจอพาสเทลสดใส
      return res.json({ 
        status: 'success', 
        userRole: profile.role,
        questions: mapDatabaseQuestions(questions),
        // Envelope properties to support our front-end component directly
        title: worksheetTitle,
        gradeLabel: gradeLabel,
        instructions: instructions,
        passage: passage
      });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
    }
  });

  // Firebase Firestore: Check status
  app.get("/api/firebase-status", async (req, res) => {
    const configured = isFirebaseConfigured();
    res.json({ configured, reachable: configured });
  });

  // Fetch all worksheets (Firebase Firestore with Local Fallback)
  app.get("/api/worksheets", async (req, res) => {
    const getLocalWorksheets = () => {
      const repo = readRepository();
      return repo.map(item => ({
        id: item.id,
        created_at: item.createdAt,
        grade: item.grade,
        topic: item.topic,
        exercise_style: item.exerciseStyle,
        data: item.data
      }));
    };

    try {
      if (isFirebaseConfigured()) {
        const firestoreData = await getFirebaseWorksheets();
        if (firestoreData && Array.isArray(firestoreData) && firestoreData.length > 0) {
          return res.json(firestoreData);
        }
      }
      return res.json(getLocalWorksheets());
    } catch (error: any) {
      console.warn("Firebase fetch worksheets error, using local fallback:", error);
      res.json(getLocalWorksheets());
    }
  });

  // Upsert worksheet
  app.post("/api/worksheets", async (req, res) => {
    try {
      const { id, createdAt, grade, topic, exerciseStyle, data: worksheetData } = req.body;
      
      if (!id || !grade || !topic || !exerciseStyle || !worksheetData) {
        return res.status(400).json({ error: "Missing required fields in request body" });
      }

      // Always update local repository
      const repo = readRepository();
      const existingIndex = repo.findIndex(item => item.id === id);
      const newItem: RepositoryWorksheet = {
        id,
        createdAt: createdAt || new Date().toISOString(),
        grade,
        topic,
        exerciseStyle,
        created_by: "admin",
        data: worksheetData
      };
      if (existingIndex !== -1) {
        repo[existingIndex] = newItem;
      } else {
        repo.push(newItem);
      }
      writeRepository(repo);

      // Also sync to Firebase if configured
      if (isFirebaseConfigured()) {
        await saveFirebaseWorksheet({
          id,
          created_at: createdAt || new Date().toISOString(),
          grade,
          topic,
          exercise_style: exerciseStyle,
          data: worksheetData
        });
      }

      return res.json({
        id: newItem.id,
        created_at: newItem.createdAt,
        grade: newItem.grade,
        topic: newItem.topic,
        exercise_style: newItem.exerciseStyle,
        data: newItem.data
      });
    } catch (error: any) {
      console.error("Error saving worksheet:", error);
      res.status(500).json({ error: error.message || "Failed to save worksheet." });
    }
  });

  // Delete worksheet
  app.delete("/api/worksheets/:id", async (req, res) => {
    try {
      const { id } = req.params;

      let repo = readRepository();
      repo = repo.filter(item => item.id !== id);
      writeRepository(repo);

      if (isFirebaseConfigured()) {
        await deleteFirebaseWorksheet(id);
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting worksheet:", error);
      res.status(500).json({ error: error.message || "Failed to delete worksheet." });
    }
  });

  // API Route: AI Data Engine for Generating and Reviewing Curriculum-Aligned Questions
  app.post("/api/admin/generate-questions-engine", async (req, res) => {
    try {
      // Security Check: Only allow Supreme Admin
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in your Secrets. Please add it in the Settings panel."
        });
      }

      const { mode, grade, topic, referenceText, numQuestions, format } = req.body;

      if (!mode) {
        return res.status(400).json({ error: "Missing 'mode' parameter (curriculum or reference)" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = `
You are the advanced AI Data Engine for "English Magic Primary", a highly structured English test question generation backend aligned with the Thai Ministry of Education Primary School English Curriculum.

Your goal is to generate high-quality, level-appropriate English test questions.

[STRICT GRADE CONSTRAINTS]
- ป.1 (Grade 1): Vocabulary (150-200 words) about self, family, classroom. Short phrases or single-word answers. Simple instructions (e.g., Match, Circle, Yes/No).
- ป.2 (Grade 2): Vocabulary (250-300 words). Simple sentences, Yes/No questions, basic Wh-questions (e.g. Is this a...? Is it...? What is this? How many...).
- ป.3 (Grade 3): Vocabulary (350-450 words). Basic single clauses. Expressing basic feelings and needs (e.g. I like, I am happy, I want). Basic Wh-questions.
- ป.4 (Grade 4): Vocabulary (550-700 words). Introduction of sequence words (First, Next, Then, Finally) to describe simple steps/stories. Simple past tense was/were/regular verbs.
- ป.5 (Grade 5): Vocabulary (750-950 words). Use of Compound sentences and giving reasons using "because" (e.g. I like cats because they are cute.). Finding main ideas from short stories.
- ป.6 (Grade 6): Vocabulary (1,050-1,200 words). Compound and complex ideas, advanced Wh-questions (Why, How). Reading short essays, emails, or tales.

Your output must strictly be a valid JSON array of question objects based on the requested format.
- If multiple-choice, each object must have exactly 4 non-empty choices in 'options'.
- If fill-in-the-blank or short answer, leave 'options' as an empty array [].
- Make sure detected_level is strictly "ป.1" / "ป.2" / "ป.3" / "ป.4" / "ป.5" / "ป.6" based on the vocabulary and structural constraints.
`;

      let userPrompt = "";
      if (mode === "curriculum") {
        userPrompt = `Generate ${numQuestions || 5} questions for Grade/Level: "${grade}" on the Topic: "${topic}".
The questions should use the format: "${format || "multiple-choice"}".
Make sure the vocabulary and complexity strictly respect the ${grade} curriculum constraints.
Use Thai for the 'data_source_note' (e.g. 'อิงตามหลักสูตรบทเรียน ${topic} สำหรับชั้น ${grade}').`;
      } else {
        userPrompt = `Analyze the following reference text/sample guide provided by the teacher:
"""
${referenceText}
"""
Based on the vocabulary, structure, and style constraints of the Thai Ministry of Education, identify/detect which Grade level (ป.1 - ป.6) this text belongs to.
Then, generate ${numQuestions || 5} BRAND NEW questions inspired by that style and level. DO NOT copy the reference text exactly. Use it only as a conceptual and stylistic guideline.
The generated questions should be of type/format: "${format || "multiple-choice"}".
Fill "detected_level" with the detected level (ป.1, ป.2, ป.3, ป.4, ป.5, or ป.6) that this sample best fits.
Fill "data_source_note" with a detailed explanation in Thai (e.g. 'สร้างสรรค์แนวใหม่โดยอิงรูปแบบจากเอกสารอ้างอิงของคุณครู (ระดับชั้นตรวจพบ: ${grade || "ป.3"})').`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correct_answer: { type: Type.STRING },
                detected_level: { type: Type.STRING },
                data_source_note: { type: Type.STRING }
              },
              required: ["question_text", "options", "correct_answer", "detected_level", "data_source_note"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API.");
      }

      const questions = JSON.parse(text);
      res.json({ success: true, questions });
    } catch (error: any) {
      console.error("AI Data Engine Error:", error);
      res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการผลิตข้อสอบด้วย AI" });
    }
  });

  // API Route: Save reviewed questions directly to Supabase question_bank
  app.post("/api/admin/save-questions-bank", async (req, res) => {
    try {
      // Security Check: Only allow Supreme Admin
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      if (!isSupabaseConfigured()) {
        return res.status(400).json({ error: "Supabase is not configured." });
      }

      const { questions, topic, format } = req.body;
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Missing or empty 'questions' array" });
      }

      const supabase = getSupabaseService();

      // We will map questions to question_bank columns:
      // grade, topic, format, question_text, options, correct_answer, explanation, matching_left, matching_right
      const rows = questions.map(q => ({
        grade: q.detected_level || q.grade || "ป.3",
        topic: topic || q.topic || "บทเรียน AI ประยุกต์",
        format: format || q.format || "multiple-choice",
        question_text: q.question_text || q.questionText || "",
        options: q.options || [],
        correct_answer: q.correct_answer || q.correctAnswer || "",
        explanation: q.explanation || q.data_source_note || "",
        matching_left: "",
        matching_right: ""
      }));

      const { data, error } = await supabase
        .from("question_bank")
        .insert(rows)
        .select();

      if (error) throw error;

      res.json({ success: true, count: rows.length, inserted: data });
    } catch (error: any) {
      console.error("Error saving questions to Supabase question_bank:", error);
      res.status(500).json({ error: error.message || "Failed to save questions to question_bank." });
    }
  });

  // API Route: Get all Sources
  app.get("/api/admin/sources", async (req, res) => {
    try {
      let sources = readSources();
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseService();
          const { data, error } = await supabase.from("sources").select("*");
          if (!error && data && data.length > 0) {
            sources = data.map((d: any) => ({
              source_id: d.source_id || d.id?.toString(),
              source_name: d.source_name || d.name || "",
              source_category: d.source_category || d.category || "",
              publisher: d.publisher || "",
              curriculum: d.curriculum || "",
              examination_type: d.examination_type || d.examinationType || "",
              publication_year: d.publication_year || d.publicationYear || "",
              country: d.country || "",
              notes: d.notes || "",
              active: d.active !== false,
              createdAt: d.created_at || d.createdAt || new Date().toISOString()
            }));
          }
        } catch (e) {
          console.error("Supabase sources read error, using local fallback:", e);
        }
      }
      res.json(sources);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Create dynamic Source if not exists
  app.post("/api/admin/sources", async (req, res) => {
    try {
      const newSource: Source = req.body;
      if (!newSource.source_name || !newSource.source_category) {
        return res.status(400).json({ error: "Source Name and Category are required." });
      }
      
      const currentSources = readSources();
      const exists = currentSources.find(
        s => s.source_name.trim().toLowerCase() === newSource.source_name.trim().toLowerCase()
      );
      if (exists) {
        return res.json({ success: true, source: exists, existed: true });
      }

      if (!newSource.source_id) {
        newSource.source_id = "src_" + Math.random().toString(36).substr(2, 9);
      }
      newSource.active = true;
      newSource.createdAt = new Date().toISOString();

      currentSources.push(newSource);
      writeSources(currentSources);

      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseService();
          await supabase.from("sources").upsert({
            source_id: newSource.source_id,
            source_name: newSource.source_name,
            source_category: newSource.source_category,
            publisher: newSource.publisher || "",
            curriculum: newSource.curriculum || "",
            examination_type: newSource.examination_type || "",
            publication_year: newSource.publication_year || "",
            country: newSource.country || "",
            notes: newSource.notes || "",
            active: newSource.active
          });
        } catch (dbErr) {
          console.error("Failed to sync new source to Supabase:", dbErr);
        }
      }

      res.json({ success: true, source: newSource });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Get all Question Bank entries (Firebase Firestore or Local Fallback - Deduplicated)
  app.get(["/api/question-bank", "/api/admin/question-bank"], async (req, res) => {
    try {
      let bank = readQuestionBank();
      if (isFirebaseConfigured()) {
        try {
          const fbBank = await getFirebaseQuestionBank();
          if (fbBank && Array.isArray(fbBank) && fbBank.length > 0) {
            bank = fbBank.map((d: any) => ({
              id: d.id?.toString() || "qb-" + Math.random().toString(36).substr(2, 9),
              subject: d.subject || "English",
              grade: d.grade || "ป.3",
              cefr_level: d.cefr_level || d.cefrLevel || "A1",
              topic: d.topic || "General English",
              grammar_focus: d.grammar_focus || d.grammarFocus || "",
              vocabulary_focus: d.vocabulary_focus || d.vocabularyFocus || "",
              question_type: d.format || d.question_type || d.questionType || "multiple-choice",
              difficulty: d.difficulty || "Medium",
              learning_objective: d.learning_objective || d.learningObjective || "",
              source_id: d.source_id || d.sourceId || "",
              source_category: d.source_category || d.sourceCategory || "",
              ai_generated: d.ai_generated || d.aiGenerated || "Yes",
              generation_method: d.generation_method || d.generationMethod || "AI Engine",
              questionText: d.question_text || d.questionText || d.question_text || "",
              question_text: d.question_text || d.questionText || "",
              options: d.options || [],
              correctAnswer: d.correct_answer || d.correctAnswer || "",
              correct_answer: d.correct_answer || d.correctAnswer || "",
              explanation: d.explanation || "",
              status: d.status || "approved",
              reviewed_at: d.reviewed_at || "",
              reviewed_by: d.reviewed_by || "",
              reject_reason: d.reject_reason || "",
              tags: d.tags || [],
              createdAt: d.created_at || d.createdAt || new Date().toISOString(),
              createdBy: d.created_by || d.createdBy || "sakarinmam999@gmail.com",
              created_at: d.created_at || d.createdAt || new Date().toISOString(),
              created_by: d.created_by || d.createdBy || "sakarinmam999@gmail.com"
            }));
          }
        } catch (e) {
          console.error("Firebase question_bank read error, using local fallback:", e);
        }
      }

      const deduplicated = deduplicateQuestionBank(bank).map(q => ({
        ...q,
        status: q.status || "approved"
      }));

      const filterStatus = req.query.status as string;
      if (filterStatus && ["pending", "approved", "rejected"].includes(filterStatus)) {
        res.json(deduplicated.filter(q => q.status === filterStatus));
      } else {
        res.json(deduplicated);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Batch Review Questions (Approve or Reject multiple)
  app.post(["/api/question-bank/batch-review", "/api/admin/question-bank/batch-review"], async (req, res) => {
    try {
      const { ids, status, reject_reason, reviewed_by } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({ error: "Missing ids array or status" });
      }

      let bank = readQuestionBank();
      const now = new Date().toISOString();
      const idSet = new Set(ids.map(String));
      const updatedItems: any[] = [];

      bank = bank.map(item => {
        if (idSet.has(String(item.id))) {
          const updated = {
            ...item,
            status,
            reviewed_at: now,
            reviewed_by: reviewed_by || "admin",
            reject_reason: status === "rejected" ? (reject_reason || "ไม่ได้ระบุเหตุผล") : ""
          };
          updatedItems.push(updated);
          return updated;
        }
        return item;
      });

      writeQuestionBank(bank);

      if (isFirebaseConfigured() && updatedItems.length > 0) {
        await saveMultipleFirebaseQuestionBankItems(updatedItems);
      }

      res.json({ success: true, count: updatedItems.length, items: updatedItems });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Batch save Question Bank entries (With Duplicate Filtering)
  app.post(["/api/question-bank/batch", "/api/admin/question-bank/batch"], async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing or invalid 'items' array" });
      }

      let bank = readQuestionBank();
      const savedEntries: any[] = [];
      let skippedDuplicates = 0;

      for (const item of items) {
        if (!item.question_text && !item.questionText) continue;
        const id = item.id || "qb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
        const isExisting = bank.some(b => String(b.id) === String(id));

        const entry = {
          id,
          subject: item.subject || "English",
          grade: item.grade || "ป.3",
          cefr_level: item.cefr_level || item.cefrLevel || "A1",
          topic: item.topic || "General English",
          grammar_focus: item.grammar_focus || item.grammarFocus || "",
          vocabulary_focus: item.vocabulary_focus || item.vocabularyFocus || "",
          question_type: item.question_type || item.questionType || item.format || "multiple-choice",
          difficulty: item.difficulty || "Medium",
          learning_objective: item.learning_objective || "",
          source_id: item.source_id || "",
          source_category: item.source_category || "",
          ai_generated: item.ai_generated || "Yes",
          generation_method: item.generation_method || "Exam Generator",
          question_text: item.question_text || item.questionText || "",
          options: item.options || [],
          correct_answer: item.correct_answer || item.correctAnswer || "",
          explanation: item.explanation || "",
          status: item.status || "approved",
          reviewed_at: item.reviewed_at || (item.status === "approved" || item.status === "rejected" ? new Date().toISOString() : ""),
          reviewed_by: item.reviewed_by || (item.status === "approved" || item.status === "rejected" ? "admin" : ""),
          reject_reason: item.reject_reason || "",
          tags: item.tags || [item.grade, item.topic].filter(Boolean),
          created_at: item.created_at || new Date().toISOString(),
          created_by: item.created_by || "admin"
        };

        // Skip if duplicate and not editing existing record
        if (!isExisting) {
          const dupCheck = isDuplicateQuestion(entry, [...bank, ...savedEntries]);
          if (dupCheck.isDuplicate) {
            skippedDuplicates++;
            continue;
          }
        }

        const existingIdx = bank.findIndex(b => String(b.id) === String(id));
        if (existingIdx !== -1) {
          bank[existingIdx] = { ...bank[existingIdx], ...entry };
        } else {
          bank.push(entry as any);
        }
        savedEntries.push(entry);
      }

      writeQuestionBank(bank);

      // Save to Firebase Firestore
      if (isFirebaseConfigured() && savedEntries.length > 0) {
        await saveMultipleFirebaseQuestionBankItems(savedEntries);
      }

      res.json({ success: true, count: savedEntries.length, skippedDuplicates, items: savedEntries });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Review single question (Approve or Reject without deletion)
  app.post(["/api/question-bank/:id/review", "/api/admin/question-bank/:id/review"], async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reject_reason, reviewed_by } = req.body;
      if (!status || !["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      let bank = readQuestionBank();
      const idx = bank.findIndex(b => String(b.id) === String(id));
      if (idx === -1) {
        return res.status(404).json({ error: "Question not found in bank" });
      }

      const now = new Date().toISOString();
      bank[idx] = {
        ...bank[idx],
        status,
        reviewed_at: now,
        reviewed_by: reviewed_by || "admin",
        reject_reason: status === "rejected" ? (reject_reason || "ไม่ได้ระบุเหตุผล") : ""
      };

      writeQuestionBank(bank);

      if (isFirebaseConfigured()) {
        await saveFirebaseQuestionBankItem(bank[idx]);
      }

      res.json({ success: true, item: bank[idx] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Create or update Question Bank entry (With Duplicate Check)
  app.post(["/api/question-bank", "/api/admin/question-bank"], async (req, res) => {
    try {
      const item = req.body;
      if (!item.question_text && !item.questionText) {
        return res.status(400).json({ error: "Missing question_text" });
      }

      let bank = readQuestionBank();
      const id = item.id || "qb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const isExisting = bank.some(b => String(b.id) === String(id));

      const entry = {
        id,
        subject: item.subject || "English",
        grade: item.grade || "ป.3",
        cefr_level: item.cefr_level || item.cefrLevel || "A1",
        topic: item.topic || "General English",
        grammar_focus: item.grammar_focus || item.grammarFocus || "",
        vocabulary_focus: item.vocabulary_focus || item.vocabularyFocus || "",
        question_type: item.question_type || item.format || "multiple-choice",
        difficulty: item.difficulty || "Medium",
        learning_objective: item.learning_objective || "",
        source_id: item.source_id || "",
        source_category: item.source_category || "",
        ai_generated: item.ai_generated || "Yes",
        generation_method: item.generation_method || "AI Engine",
        question_text: item.question_text || item.questionText || "",
        options: item.options || [],
        correct_answer: item.correct_answer || item.correctAnswer || "",
        explanation: item.explanation || "",
        status: item.status || "approved",
        reviewed_at: item.reviewed_at || (item.status === "approved" || item.status === "rejected" ? new Date().toISOString() : ""),
        reviewed_by: item.reviewed_by || (item.status === "approved" || item.status === "rejected" ? "admin" : ""),
        reject_reason: item.reject_reason || "",
        tags: item.tags || [],
        created_at: item.created_at || new Date().toISOString(),
        created_by: item.created_by || "sakarinmam999@gmail.com"
      };

      // Perform duplicate check if not updating existing record
      if (!isExisting) {
        const dupCheck = isDuplicateQuestion(entry, bank);
        if (dupCheck.isDuplicate) {
          return res.status(400).json({
            error: `พบข้อสอบซ้ำในคลังข้อสอบ: ${dupCheck.matchedReason}`,
            duplicate: true,
            matchedItem: dupCheck.matchedItem
          });
        }
      }

      // Save to local JSON
      const existingIdx = bank.findIndex(b => String(b.id) === String(id));
      if (existingIdx !== -1) {
        bank[existingIdx] = { ...bank[existingIdx], ...entry };
      } else {
        bank.push(entry as any);
      }
      writeQuestionBank(bank);

      // Save to Firebase Firestore
      if (isFirebaseConfigured()) {
        await saveFirebaseQuestionBankItem(entry);
      }

      res.json({ success: true, item: entry });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Delete Question Bank entry
  app.delete(["/api/question-bank/:id", "/api/admin/question-bank/:id"], async (req, res) => {
    try {
      const { id } = req.params;
      let bank = readQuestionBank();
      bank = bank.filter(b => String(b.id) !== String(id));
      writeQuestionBank(bank);

      if (isFirebaseConfigured()) {
        await deleteFirebaseQuestionBankItem(id);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ENGLISH MAGIC - WORK SHEET SYSTEM ENDPOINTS
  // ==========================================
  const MAGIC_WORKSHEETS_FILE = path.join(process.cwd(), "data", "worksheets_magic.json");

  function readMagicWorksheets() {
    try {
      if (!fs.existsSync(MAGIC_WORKSHEETS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(MAGIC_WORKSHEETS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  function writeMagicWorksheets(data: any) {
    try {
      const dir = path.dirname(MAGIC_WORKSHEETS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(MAGIC_WORKSHEETS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing worksheets magic file:", e);
    }
  }

  // Admin API: Analyze reference document (Step 1)
  app.post("/api/admin/analyze-reference", async (req, res) => {
    try {
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      const { referenceText } = req.body;
      if (!referenceText || referenceText.trim().length === 0) {
        return res.status(400).json({ error: "Missing 'referenceText' in request body" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured in your Secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const promptText = `Analyze the following English assessment/teaching reference material and provide a highly detailed analysis report suited for primary school worksheet alignment in Thailand:
"""
${referenceText}
"""
Please fill in every field accurately. Specifically detect and analyze the kind of exam it is according to Thai Curriculum Standards (e.g. O-NET Grade 6, standard midterm/final exam, Cambridge assessment, etc.) and write it down in 'detectedExamType'. Assess similarity and copyright risks thoroughly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction: `You are a Senior AI Assessment Architect. Analyze reference texts to map them to the Thai primary English curriculum levels and metadata. Identify what kind of exam/assessment this is based on Thai curriculum standards (e.g. O-NET, standard school term test, etc.).`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedStudentAge: { type: Type.STRING },
              grade: { type: Type.STRING },
              cefrLevel: { type: Type.STRING },
              curriculum: { type: Type.STRING },
              topic: { type: Type.STRING },
              grammarFocus: { type: Type.STRING },
              vocabularyLevel: { type: Type.STRING },
              readingLength: { type: Type.STRING },
              writingDifficulty: { type: Type.STRING },
              listeningType: { type: Type.STRING },
              questionTypes: { type: Type.STRING },
              numberOfQuestions: { type: Type.INTEGER },
              learningObjectives: { type: Type.STRING },
              estimatedDifficulty: { type: Type.STRING },
              bloomsTaxonomyLevel: { type: Type.STRING },
              similarityRisk: { type: Type.STRING },
              copyrightRisk: { type: Type.STRING },
              detectedExamType: { type: Type.STRING }
            },
            required: [
              "estimatedStudentAge", "grade", "cefrLevel", "curriculum", "topic",
              "grammarFocus", "vocabularyLevel", "readingLength", "writingDifficulty",
              "listeningType", "questionTypes", "numberOfQuestions", "learningObjectives",
              "estimatedDifficulty", "bloomsTaxonomyLevel", "similarityRisk", "copyrightRisk", "detectedExamType"
            ]
          }
        }
      });

      const analysisReport = JSON.parse(response.text || "{}");
      res.json({ success: true, analysisReport });
    } catch (error: any) {
      console.error("Reference Analysis Error:", error);
      res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการวิเคราะห์เอกสารอ้างอิง" });
    }
  });

  // Admin API: Generate unique, aligned English worksheets (Step 3 & 4)
  app.post("/api/admin/generate", async (req, res) => {
    try {
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured in your Secrets." });
      }

      const {
        mode,
        curriculum,
        grade,
        cefrLevel,
        topic,
        grammarFocus,
        vocabularyTheme,
        learningObjective,
        difficulty,
        numQuestions,
        worksheetType,
        language,
        paperSize,
        includeAnswerKey,
        referenceText,
        referenceType,
        sourceName,
        sourcePubYear,
        aiInstruction
      } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      let systemInstruction = `You are an expert English assessment designer and curriculum specialist.
Your task is to generate HIGH-QUALITY English examination questions for school students in Thailand.

==========================
PRIORITY
==========================
Always follow this order:
Priority 1: Reference Source
Priority 2: Grade
Priority 3: Topic
Priority 4: Question Type
Priority 5: Grammar Focus
Priority 6: Vocabulary Theme
Priority 7: Difficulty

If any inputs conflict with each other, always prioritize higher priority values. For example, if Topic = "My Emotions" and Learning Objective = "Daily Routine", ignore the learning objective and generate questions based on Topic.

==========================
QUESTION REQUIREMENTS & LANGUAGE RULES
==========================
- Generate completely original questions. Never copy real examination questions.
- 'questionText', 'options', 'passage', and prompts MUST BE 100% IN ENGLISH ONLY (no Thai text inside questions or choices).
- 'explanation' MUST BE IN THAI and MUST INCLUDE:
  1) "คำแปล: [คำแปลภาษาไทยของโจทย์และคำตอบ]"
  2) "คำอธิบาย: [คำอธิบายประกอบภาษาไทย]"
- Match vocabulary and grammar strictly to the selected grade's Thai curriculum capabilities.
- Randomize answer positions for choices A-D.
- Avoid duplicate questions and ambiguous answers. Use completely natural, professional English.

==========================
QUALITY CHECK
==========================
Before returning the result, verify that:
✓ Grammar is correct
✓ Vocabulary matches grade
✓ Only one correct answer
✓ No duplicate questions
✓ Difficulty matches
✓ Topic is followed

If any requirement fails, regenerate that question before returning.`;

      let userPrompt = `
Generate an assessment worksheet with exactly ${numQuestions || 5} questions based on the following specifications:

==========================
INPUT
==========================
Reference Source: ${mode === "reference" && referenceText ? referenceText : "None"}
Reference Type: ${referenceType || "None"}
Exam Year: ${sourcePubYear || "None"}
Grade: ${grade || "ป.3"}
Curriculum: ${curriculum || "OBEC Thai Core Curriculum (พ.ศ. 2551)"}
CEFR Level: ${cefrLevel || "A1"}
Topic: ${topic || "English in Daily Life"}
Grammar Focus: ${grammarFocus || "Present Simple Tense"}
Vocabulary Theme: ${vocabularyTheme || "Common Objects"}
Question Type: ${worksheetType || "Multiple Choice"}
Difficulty: ${difficulty || "Medium"}
Number of Questions: ${numQuestions || 5}
Language: ${language || "English and Thai explanation"}
Additional AI Instruction: ${aiInstruction || ""}

==========================
OUTPUT FORMAT
==========================
Please output a structured JSON representing the worksheet and its questions.
For each question, ensure the following fields are fully filled in the JSON object:
- id: Question Number (1, 2, 3...)
- questionType: The specific Question Type (e.g., "${worksheetType}")
- learningObjective: Automatically generated learning objective
- questionText: The English question string
- options: Choices A-D (Exactly 4 choices for Multiple Choice. Empty array for short answer/fill-in-the-blank)
- correctAnswer: The correct answer (e.g. choice text or value)
- explanation: Detailed educational explanation
- grammarFocus: Grammar Focus used in this question
- vocabularyUsed: Array of main vocabulary words used
- estimatedCefr: Estimated CEFR level of this specific question
- difficulty: Difficulty level

CRITICAL: You MUST return EXACTLY ${numQuestions || 5} questions in the 'questions' array. Do not return more, do not return fewer.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              gradeLabel: { type: Type.STRING },
              instructions: { type: Type.STRING },
              cefr: { type: Type.STRING },
              topic: { type: Type.STRING },
              grammarFocus: { type: Type.STRING },
              vocabularyTheme: { type: Type.STRING },
              learningObjective: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              worksheetType: { type: Type.STRING },
              language: { type: Type.STRING },
              paperSize: { type: Type.STRING },
              includeAnswerKey: { type: Type.BOOLEAN },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    questionText: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    questionType: { type: Type.STRING },
                    learningObjective: { type: Type.STRING },
                    grammarFocus: { type: Type.STRING },
                    vocabularyUsed: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    estimatedCefr: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                  },
                  required: [
                    "id", "questionText", "options", "correctAnswer", "explanation",
                    "questionType", "learningObjective", "grammarFocus", "vocabularyUsed", "estimatedCefr", "difficulty"
                  ]
                }
              },
              qualityValidation: {
                type: Type.OBJECT,
                properties: {
                  grammarAccuracy: { type: Type.STRING },
                  vocabularyAccuracy: { type: Type.STRING },
                  answerKeyCorrectness: { type: Type.STRING },
                  cefrAlignment: { type: Type.STRING },
                  difficultyConsistency: { type: Type.STRING },
                  questionUniqueness: { type: Type.STRING }
                },
                required: ["grammarAccuracy", "vocabularyAccuracy", "answerKeyCorrectness", "cefrAlignment", "difficultyConsistency", "questionUniqueness"]
              }
            },
            required: [
              "title", "gradeLabel", "instructions", "cefr", "topic", "grammarFocus",
              "vocabularyTheme", "learningObjective", "difficulty", "worksheetType",
              "language", "paperSize", "includeAnswerKey", "questions", "qualityValidation"
            ]
          }
        }
      });

      const worksheet = JSON.parse(response.text || "{}");

      // Perform Duplicate Check against existing Question Bank
      if (Array.isArray(worksheet.questions)) {
        const existingBank = readQuestionBank();
        const uniqueQuestions: any[] = [];
        const seenInBatch: any[] = [];

        for (const q of worksheet.questions) {
          const dupCheck = isDuplicateQuestion(q, [...existingBank, ...seenInBatch]);
          if (!dupCheck.isDuplicate) {
            seenInBatch.push(q);
            uniqueQuestions.push(q);
          } else {
            console.log(`[Exam Generator] Duplicate question filtered: "${q.questionText}" (${dupCheck.matchedReason})`);
          }
        }
        worksheet.questions = uniqueQuestions;
      }

      res.json({ success: true, worksheet });
    } catch (error: any) {
      console.error("Worksheet Generation Error:", error);
      res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการผลิตใบงานดนตรีอักษรภาษาอังกฤษ" });
    }
  });

  // Admin API: Log approvals
  app.post("/api/admin/approve", (req, res) => {
    const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
    if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
      return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
    }
    res.json({ success: true, date: new Date().toISOString() });
  });

  // Admin API: Save / Publish Worksheet
  app.post("/api/admin/save", async (req, res) => {
    try {
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      const worksheetData = req.body.worksheet;
      let sourceMeta = req.body.sourceMeta;

      if (!worksheetData) {
        return res.status(400).json({ error: "Missing worksheet data in request" });
      }

      // --- DYNAMIC SOURCE RECORD CREATION & RELATIONSHIP LINKING ---
      if (sourceMeta && sourceMeta.source_name) {
        const sources = readSources();
        const found = sources.find(s => s.source_name.trim().toLowerCase() === sourceMeta.source_name.trim().toLowerCase());
        if (!found) {
          const newSource: Source = {
            source_id: sourceMeta.source_id || "src_" + Math.random().toString(36).substr(2, 9),
            source_name: sourceMeta.source_name,
            source_category: sourceMeta.source_category || "Other",
            publisher: sourceMeta.publisher || "",
            curriculum: sourceMeta.curriculum || "",
            examination_type: sourceMeta.examination_type || "",
            publication_year: sourceMeta.publication_year || "",
            country: sourceMeta.country || "",
            notes: sourceMeta.notes || "",
            active: true,
            createdAt: new Date().toISOString()
          };
          sources.push(newSource);
          writeSources(sources);
          sourceMeta.source_id = newSource.source_id;

          if (isSupabaseConfigured()) {
            try {
              const supabase = getSupabaseService();
              await supabase.from("sources").upsert({
                source_id: newSource.source_id,
                source_name: newSource.source_name,
                source_category: newSource.source_category,
                publisher: newSource.publisher || "",
                curriculum: newSource.curriculum || "",
                examination_type: newSource.examination_type || "",
                publication_year: newSource.publication_year || "",
                country: newSource.country || "",
                notes: newSource.notes || "",
                active: newSource.active
              });
            } catch (err) {
              console.error("Failed to sync auto-created source to Supabase:", err);
            }
          }
        } else {
          sourceMeta.source_id = found.source_id;
        }
      }

      // --- INDIVIDUAL QUESTION STORAGE IN QUESTION BANK (WITH DUPLICATE CHECK) ---
      if (worksheetData.questions && Array.isArray(worksheetData.questions)) {
        const bank = readQuestionBank();
        const newBankEntries: QuestionBankEntry[] = [];

        for (const q of worksheetData.questions) {
          const entry: QuestionBankEntry = {
            id: "qb_" + Math.random().toString(36).substr(2, 9),
            subject: "English",
            grade: worksheetData.gradeLabel || "ป.3",
            cefr_level: worksheetData.cefr || "A1",
            topic: worksheetData.topic || "General English",
            grammar_focus: worksheetData.grammarFocus || "",
            vocabulary_focus: worksheetData.vocabularyTheme || "",
            question_type: worksheetData.worksheetType || "multiple-choice",
            difficulty: worksheetData.difficulty || "Medium",
            learning_objective: worksheetData.learningObjective || "",
            source_id: sourceMeta?.source_id || "",
            source_category: sourceMeta?.source_category || "",
            ai_generated: "Yes",
            generation_method: worksheetData.generationMethod || "AI Engine",
            question_text: q.questionText || q.question_text || "",
            options: q.options || [],
            correct_answer: q.correctAnswer || q.correct_answer || "",
            explanation: q.explanation || "",
            tags: [worksheetData.topic, worksheetData.gradeLabel].filter(Boolean),
            created_at: new Date().toISOString(),
            created_by: adminEmail || "sakarinmam999@gmail.com"
          };
          
          if (!isDuplicateQuestion(entry, [...bank, ...newBankEntries]).isDuplicate) {
            bank.push(entry);
            newBankEntries.push(entry);
          }
        }

        if (newBankEntries.length > 0) {
          writeQuestionBank(bank);
        }

        // Sync individual question bank entries to Firebase Firestore if configured
        if (isFirebaseConfigured()) {
          try {
            await saveMultipleFirebaseQuestionBankItems(newBankEntries);
          } catch (dbErr) {
            console.error("Failed to sync question bank entries to Firebase:", dbErr);
          }
        }
      }

      const newId = worksheetData.id || "ws-" + Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();

      const savedItem = {
        id: newId,
        created_at: timestamp,
        grade: worksheetData.gradeLabel || "Grade General",
        topic: worksheetData.topic || "General English",
        exercise_style: worksheetData.worksheetType || "Multiple Choice",
        is_archived: false,
        data: {
          ...worksheetData,
          id: newId,
          sourceMeta: sourceMeta || {}
        }
      };

      // Save to local JSON worksheets_magic file
      const currentMagic = readMagicWorksheets();
      const existingIdx = currentMagic.findIndex((item: any) => item.id === newId);
      if (existingIdx > -1) {
        currentMagic[existingIdx] = savedItem;
      } else {
        currentMagic.unshift(savedItem);
      }
      writeMagicWorksheets(currentMagic);

      // Also append to the existing general repository
      const repo = readRepository();
      const repoItem = {
        id: newId,
        createdAt: timestamp,
        grade: savedItem.grade,
        topic: savedItem.topic,
        exerciseStyle: savedItem.exercise_style,
        created_by: adminEmail,
        data: savedItem.data
      };
      const rIdx = repo.findIndex(item => item.id === newId);
      if (rIdx > -1) {
        repo[rIdx] = repoItem;
      } else {
        repo.unshift(repoItem);
      }
      writeRepository(repo);

      // Save full worksheet to Firebase Firestore
      if (isFirebaseConfigured()) {
        try {
          await saveFirebaseWorksheet({
            id: newId,
            created_at: timestamp,
            grade: savedItem.grade,
            topic: savedItem.topic,
            exercise_style: savedItem.exercise_style,
            data: savedItem.data
          });
        } catch (dbErr) {
          console.error("Failed to sync worksheet to Firebase:", dbErr);
        }
      }

      res.json({ success: true, worksheet: savedItem });
    } catch (error: any) {
      console.error("Save Worksheet Error:", error);
      res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการบันทึกใบงานลงระบบ" });
    }
  });

  // Admin API: Update Worksheet
  app.post("/api/admin/update", async (req, res) => {
    try {
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      const { id, worksheet } = req.body;
      if (!id || !worksheet) {
        return res.status(400).json({ error: "Missing required update fields" });
      }

      const currentMagic = readMagicWorksheets();
      const existingIdx = currentMagic.findIndex((item: any) => item.id === id);
      if (existingIdx === -1) {
        return res.status(404).json({ error: "Worksheet not found" });
      }

      currentMagic[existingIdx].data = worksheet;
      currentMagic[existingIdx].grade = worksheet.gradeLabel || currentMagic[existingIdx].grade;
      currentMagic[existingIdx].topic = worksheet.topic || currentMagic[existingIdx].topic;
      currentMagic[existingIdx].exercise_style = worksheet.worksheetType || currentMagic[existingIdx].exercise_style;
      writeMagicWorksheets(currentMagic);

      // Legacy Repository update
      const repo = readRepository();
      const rIdx = repo.findIndex(item => item.id === id);
      if (rIdx > -1) {
        repo[rIdx].data = worksheet;
        repo[rIdx].grade = worksheet.gradeLabel || repo[rIdx].grade;
        repo[rIdx].topic = worksheet.topic || repo[rIdx].topic;
        repo[rIdx].exerciseStyle = worksheet.worksheetType || repo[rIdx].exerciseStyle;
        writeRepository(repo);
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseService();
          await supabase
            .from("worksheets")
            .upsert({
              id,
              grade: worksheet.gradeLabel,
              topic: worksheet.topic,
              exercise_style: worksheet.worksheetType,
              data: worksheet
            });
        } catch (dbErr) {
          console.error("Failed to sync updated to Supabase:", dbErr);
        }
      }

      res.json({ success: true, worksheet: currentMagic[existingIdx] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin API: Delete Worksheet
  app.delete("/api/admin/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentMagic = readMagicWorksheets();
      const filtered = currentMagic.filter((item: any) => item.id !== id);
      writeMagicWorksheets(filtered);

      const repo = readRepository();
      const filteredRepo = repo.filter(item => item.id !== id);
      writeRepository(filteredRepo);

      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseService();
          await supabase.from("worksheets").delete().eq("id", id);
        } catch (dbErr) {
          console.error("Failed to sync delete to Supabase:", dbErr);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin API: Archive Worksheet
  app.post("/api/admin/archive", async (req, res) => {
    try {
      const adminEmail = (req as any).user?.email || req.body.email || req.headers["x-admin-email"];
      if (adminEmail !== "sakarinmam999@gmail.com" && adminEmail !== "momsteracademy@gmail.com") {
        return res.status(403).json({ error: "ปฏิเสธการเข้าถึง: สิทธิ์เฉพาะแอดมินสูงสุดเท่านั้น" });
      }

      const { id, isArchived } = req.body;
      const currentMagic = readMagicWorksheets();
      const existingIdx = currentMagic.findIndex((item: any) => item.id === id);
      if (existingIdx > -1) {
        currentMagic[existingIdx].is_archived = isArchived;
        writeMagicWorksheets(currentMagic);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User API: Search and filter published, unarchived worksheets
  app.get("/api/worksheets/search", (req, res) => {
    try {
      const { query, grade, format, cefr, difficulty } = req.query;
      let worksheets = readMagicWorksheets();

      // If file is empty, try reading from the primary repository file as fallback
      if (worksheets.length === 0) {
        const repo = readRepository();
        worksheets = repo.map(item => ({
          id: item.id,
          created_at: item.createdAt,
          grade: item.grade,
          topic: item.topic,
          exercise_style: item.exerciseStyle,
          is_archived: false,
          data: item.data
        }));
      }

      // Filter out archived
      let filtered = worksheets.filter((ws: any) => !ws.is_archived);

      if (query) {
        const q = String(query).toLowerCase();
        filtered = filtered.filter((ws: any) =>
          ws.topic.toLowerCase().includes(q) ||
          (ws.data && ws.data.title && ws.data.title.toLowerCase().includes(q)) ||
          (ws.data && ws.data.grammarFocus && ws.data.grammarFocus.toLowerCase().includes(q))
        );
      }

      if (grade) {
        filtered = filtered.filter((ws: any) => ws.grade === String(grade));
      }

      if (format) {
        filtered = filtered.filter((ws: any) => ws.exercise_style === String(format));
      }

      if (cefr) {
        filtered = filtered.filter((ws: any) => ws.data && ws.data.cefr === String(cefr));
      }

      if (difficulty) {
        filtered = filtered.filter((ws: any) => ws.data && ws.data.difficulty === String(difficulty));
      }

      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User API: Fetch specific worksheet
  app.get("/api/worksheets/detail/:id", (req, res) => {
    try {
      const { id } = req.params;
      const worksheets = readMagicWorksheets();
      let found = worksheets.find((ws: any) => ws.id === id);

      if (!found) {
        const repo = readRepository();
        const rItem = repo.find(item => item.id === id);
        if (rItem) {
          found = {
            id: rItem.id,
            created_at: rItem.createdAt,
            grade: rItem.grade,
            topic: rItem.topic,
            exercise_style: rItem.exerciseStyle,
            is_archived: false,
            data: rItem.data
          };
        }
      }

      if (!found) {
        return res.status(404).json({ error: "Worksheet not found" });
      }

      res.json(found);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User API: Record download & check limits
  app.post("/api/worksheets/download", (req, res) => {
    try {
      const { email, worksheetId } = req.body;
      if (!email || !worksheetId) {
        return res.status(400).json({ error: "Missing required fields: email, worksheetId" });
      }

      const result = logUserDownload(email, worksheetId);
      if (!result.success) {
        return res.status(403).json({ error: result.error, count: result.count });
      }

      res.json({ success: true, count: result.count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // 404 handler for API routes to prevent HTML SPA fallback on missing API endpoints
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
