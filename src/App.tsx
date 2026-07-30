import React, { useState, useEffect } from "react";
import { Worksheet, SavedWorksheet, TeacherProfile, SubscriptionPlan } from "./types";
import WorksheetForm from "./components/WorksheetForm";
import WorksheetPreview from "./components/WorksheetPreview";
import HistorySidebar from "./components/HistorySidebar";
import CurriculumGuideModal from "./components/CurriculumGuideModal";
import AdminPanel from "./components/AdminPanel";
import ExamGenerator from "./components/ExamGenerator";
import SubscriptionModal from "./components/SubscriptionModal";
import TeacherBrandingModal from "./components/TeacherBrandingModal";
import { 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  FileSpreadsheet,
  FilePlus,
  Shield,
  User,
  Lock,
  LogOut,
  Crown,
  Award,
  Download,
  History,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  Edit3,
  Save,
  X,
  Check,
  FolderOpen,
  Tag
} from "lucide-react";

const INITIAL_SAMPLE_WORKSHEET: Worksheet = {
  title: "My Happy Family & Home",
  gradeLabel: "ป.1 (Grade 1)",
  instructions: "Look at the options and circle the correct word. (เลือกคำศัพท์ที่ถูกต้อง)",
  questions: [
    {
      id: 1,
      questionText: "This is my mother. She is kind. Who is she?",
      options: ["Mother", "Father", "Brother"],
      correctAnswer: "Mother",
      explanation: "Mother แปลว่า แม่ (She refers to a female parent)"
    },
    {
      id: 2,
      questionText: "I have a small dog. It says 'Woof!'. What pet do I have?",
      options: ["Cat", "Bird", "Dog"],
      correctAnswer: "Dog",
      explanation: "Dog แปลว่า สุนัข (Woof! คือเสียงสุนัขเห่า)"
    },
    {
      id: 3,
      questionText: "We live together in a warm ______.",
      options: ["House", "Car", "Tree"],
      correctAnswer: "House",
      explanation: "House แปลว่า บ้าน (We live in a house)"
    },
    {
      id: 4,
      questionText: "My ______ is 7 years old. He is my male sibling.",
      options: ["Sister", "Brother", "Mother"],
      correctAnswer: "Brother",
      explanation: "Brother แปลว่า พี่ชายหรือน้องชาย (Male sibling)"
    },
    {
      id: 5,
      questionText: "This is my pencil. I use it to write in the ______.",
      options: ["Kitchen", "Classroom", "Garden"],
      correctAnswer: "Classroom",
      explanation: "Classroom แปลว่า ห้องเรียน (We write in the classroom)"
    }
  ]
};

export default function App() {
  const [activeWorksheet, setActiveWorksheet] = useState<Worksheet | null>(INITIAL_SAMPLE_WORKSHEET);
  const [savedWorksheets, setSavedWorksheets] = useState<SavedWorksheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCurriculumGuideOpen, setIsCurriculumGuideOpen] = useState(false);
  const [activeSavedId, setActiveSavedId] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(true);
  const [supabaseTableError, setSupabaseTableError] = useState<string | null>(null);

  // --- NEW USER ROLES, SUBSCRIPTION & TEACHER BRANDING STATE ---
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [repositoryList, setRepositoryList] = useState<any[]>([]);
  const [mainNavTab, setMainNavTab] = useState<"profile" | "create" | "exam_creator" | "question_bank" | "history" | "upgrade" | "admin">("create");
  const [historySearch, setHistorySearch] = useState("");
  const [workspaceEngine, setWorkspaceEngine] = useState<"A" | "B">("A");

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isTeacherBrandingModalOpen, setIsTeacherBrandingModalOpen] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  const fetchTeacherProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/teacher-profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setTeacherProfile(data);
      }
    } catch (e) {
      console.error("Error fetching teacher profile", e);
    }
  };

  const handleSaveTeacherProfile = async (profile: TeacherProfile) => {
    try {
      const res = await fetch("/api/teacher-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save teacher profile");
      }
      const data = await res.json();
      setTeacherProfile(data.profile);
    } catch (e: any) {
      console.error("Error saving teacher profile", e);
      throw e;
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อนทำการเลือกแผนสมาชิกค่ะ");
      return;
    }
    try {
      const res = await fetch("/api/user/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: currentUser.email, plan })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...currentUser, role: plan, plan: plan, plan_expiry: data.plan_expiry };
        setCurrentUser(updatedUser);
        localStorage.setItem("magic_user_profile", JSON.stringify(updatedUser));
        setStatusMessage({
          type: "success",
          text: `🎉 ยินดีด้วยค่ะ! เปลี่ยนแผนสมาชิกเป็น ${plan.toUpperCase()} เรียบร้อยแล้ว!`
        });
        setIsSubscriptionModalOpen(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update plan");
      }
    } catch (e: any) {
      alert("❌ เกิดข้อผิดพลาด: " + e.message);
    }
  };

  // Automatically fetch teacher profile on user change
  useEffect(() => {
    if (currentUser?.email) {
      fetchTeacherProfile(currentUser.email);
    }
  }, [currentUser]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpgradingInProgress, setIsUpgradingInProgress] = useState(false);

  const openPaymentModal = () => {
    if (!currentUser) {
      alert("❌ กรุณาเข้าสู่ระบบครูก่อนอัปเกรดเป็นพรีเมียมค่ะ!");
      setStatusMessage({
        type: "error",
        text: "กรุณาเข้าสู่ระบบก่อนอัปเกรดเป็นสมาชิกพรีเมียมค่ะ"
      });
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!currentUser) return;
    setIsUpgradingInProgress(true);
    try {
      const res = await fetch("/api/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: currentUser.email, newRole: "premium" })
      });
      if (res.ok) {
        const updated = { ...currentUser, role: "premium" };
        setCurrentUser(updated);
        localStorage.setItem("magic_user_profile", JSON.stringify(updated));
        setIsPaymentModalOpen(false);
        setStatusMessage({
          type: "success",
          text: "🎉 ยินดีด้วยค่ะ! คุณครูได้รับการอัปเกรดเป็นสมาชิกระดับ Premium เรียบร้อยแล้ว ปลดล็อกสิทธิ์การดาวน์โหลดใบงานได้ไม่จำกัดจำนวนครั้งตลอดชีพ! 🪄✨"
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to upgrade role");
      }
    } catch (err: any) {
      alert("❌ เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsUpgradingInProgress(false);
    }
  };

  // ฟังก์ชันที่จะถูกเรียกเมื่อระบบชำระเงิน (เช่น Omise / Stripe) แจ้งเตือนว่าจ่ายเงินสำเร็จแล้ว
  const handlePaymentSuccess = async (userId: string) => {
    try {
      const res = await fetch("/api/payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upgrade via payment success handler");
      }

      // Sync local state if logged in
      if (currentUser) {
        const updated = { ...currentUser, role: "premium" };
        setCurrentUser(updated);
        localStorage.setItem("magic_user_profile", JSON.stringify(updated));
      }

      alert('ยินดีด้วยค่ะ! บัญชีของคุณครูได้รับการอัปเกรดเป็น Premium เรียบร้อยแล้ว 🪄✨');
      window.location.reload(); // โหลดหน้าเว็บใหม่เพื่อเปลี่ยนเมนูเป็นพรีเมียม
    } catch (error: any) {
      console.error('ไม่สามารถอัปเกรดสิทธิ์ได้:', error);
      alert('เกิดข้อผิดพลาดในการอัปเกรดสิทธิ์: ' + error.message);
    }
  };

  // Expose handlePaymentSuccess to window so third party gateways can trigger it
  useEffect(() => {
    (window as any).handlePaymentSuccess = handlePaymentSuccess;
    return () => {
      delete (window as any).handlePaymentSuccess;
    };
  }, [currentUser]);

  // Auth form inputs
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const fetchUsersList = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error("Error fetching users", e);
    }
  };

  const fetchRepositoryList = async () => {
    try {
      const res = await fetch("/api/repository/list");
      if (res.ok) {
        const data = await res.json();
        setRepositoryList(data);
      }
    } catch (e) {
      console.error("Error fetching repository list", e);
    }
  };

  const handleUserLoginSuccess = (session: { user: { email: string } }) => {
    const userEmail = session.user.email;

    // เงื่อนไขสกรีนสิทธิ์แบบเจาะจงอีเมลแอดมินตามที่คุณต้องการ
    if (userEmail === 'sakarinmam999@gmail.com') {
      console.log("ยินดีต้อนรับแอดมินศักรินทร์");
      setMainNavTab("question_bank"); // แสดงหน้าคลังข้อสอบส่วนกลางสำหรับแอดมิน
    } else {
      console.log("ผู้ใช้ทั่วไป");
      setMainNavTab("create");  // แสดงหน้าสร้างใบงานสีพาสเทลปกติ
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      setCurrentUser(data);
      localStorage.setItem("magic_user_profile", JSON.stringify(data));
      setAuthSuccess("Logged in successfully!");
      setAuthEmail("");
      setAuthPassword("");
      
      // Call handleUserLoginSuccess following user login flow
      handleUserLoginSuccess({ user: { email: data.email } });

      if (data.role === "admin") {
        fetchUsersList();
        fetchRepositoryList();
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setCurrentUser(data);
      localStorage.setItem("magic_user_profile", JSON.stringify(data));
      setAuthSuccess("Registered and logged in successfully!");
      setAuthEmail("");
      setAuthPassword("");

      // Call handleUserLoginSuccess following user registration flow
      handleUserLoginSuccess({ user: { email: data.email } });

      if (data.role === "admin") {
        fetchUsersList();
        fetchRepositoryList();
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("magic_user_profile");
    setAuthSuccess("Logged out successfully");
    setMainNavTab("create");
  };

  const handleUpdateUserRole = async (targetEmail: string, newRole: string) => {
    try {
      const res = await fetch("/api/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, newRole })
      });
      if (res.ok) {
        fetchUsersList();
        setStatusMessage({
          type: "success",
          text: `Updated role for ${targetEmail} to ${newRole}!`
        });
        
        // If updating ourselves, sync state
        if (currentUser && currentUser.email === targetEmail) {
          const updated = { ...currentUser, role: newRole };
          setCurrentUser(updated);
          localStorage.setItem("magic_user_profile", JSON.stringify(updated));
        }
      } else {
        const d = await res.json();
        throw new Error(d.error);
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update role" });
    }
  };

  const handleSaveToRepository = async (ws: Worksheet) => {
    if (!currentUser || currentUser.role !== "admin") return;
    try {
      const res = await fetch("/api/repository/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "repo_" + Date.now(),
          grade: ws.gradeLabel.match(/ป\.\d/) ? ws.gradeLabel.match(/ป\.\d/)![0] : "ป.1",
          topic: ws.title,
          exerciseStyle: ws.passage ? "reading-comprehension" : "multiple-choice",
          createdBy: currentUser.email,
          data: ws
        })
      });
      if (res.ok) {
        fetchRepositoryList();
        setStatusMessage({
          type: "success",
          text: "บันทึกแบบฝึกหัดเข้าคลังข้อสอบเรียบร้อยแล้ว! สมาชิกทั่วไปสามารถค้นหาและดึงไปทำได้ทันที"
        });
      } else {
        const d = await res.json();
        throw new Error(d.error);
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save to repository" });
    }
  };

  const handleDeleteFromRepository = async (id: string) => {
    try {
      const res = await fetch(`/api/repository/delete/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchRepositoryList();
        setStatusMessage({
          type: "success",
          text: "ลบแบบฝึกหัดออกจากคลังข้อสอบเรียบร้อยแล้ว"
        });
      } else {
        const d = await res.json();
        throw new Error(d.error);
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete from repository" });
    }
  };

  const handleLogDownload = async (worksheetId: string): Promise<boolean> => {
    if (!currentUser) {
      alert("❌ Please sign in to print or download worksheets!");
      setStatusMessage({
        type: "error",
        text: "Please sign in to print or download worksheets!"
      });
      return false;
    }
    try {
      const res = await fetch("/api/log-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, worksheetId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`❌ Quota Limit Exceeded: ${data.error || "Limit is 5 downloads for Free users."}`);
        setStatusMessage({
          type: "error",
          text: `Download quota exceeded! ${data.error || "Free users can only download/print up to 5 worksheets. Please upgrade to Premium."}`
        });
        return false;
      }
      
      const updatedUser = { ...currentUser, downloadCount: data.count };
      setCurrentUser(updatedUser);
      localStorage.setItem("magic_user_profile", JSON.stringify(updatedUser));
      return true;
    } catch (err) {
      console.error("Log download error", err);
      return true;
    }
  };

  // Check Supabase status and load worksheets
  useEffect(() => {
    // Restore session from localStorage
    const cachedUser = localStorage.getItem("magic_user_profile");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        fetch("/api/auth/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: parsed.email })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setCurrentUser(data);
            localStorage.setItem("magic_user_profile", JSON.stringify(data));
            if (data.role === "admin") {
              fetchUsersList();
              fetchRepositoryList();
            }
          } else {
            setCurrentUser(parsed);
          }
        })
        .catch(() => {
          setCurrentUser(parsed);
        });
      } catch (err) {
        console.error("Failed to parse cached user", err);
      }
    }
    
    fetchRepositoryList();

    async function initWorksheets() {
      try {
        const statusRes = await fetch("/api/firebase-status");
        const statusData = await statusRes.json();
        setIsSupabaseConfigured(statusData.configured);

        const res = await fetch("/api/worksheets");
        const worksheets = await res.json();
        
        if (Array.isArray(worksheets) && worksheets.length > 0) {
          const mapped: SavedWorksheet[] = worksheets.map((item: any) => ({
            id: item.id,
            createdAt: item.created_at || item.createdAt,
            grade: item.grade,
            topic: item.topic,
            exerciseStyle: item.exercise_style || item.exerciseStyle,
            data: item.data
          }));
          setSavedWorksheets(mapped);
        } else {
          const saved = localStorage.getItem("english_magic_worksheets");
          if (saved) {
            try {
              setSavedWorksheets(JSON.parse(saved));
            } catch (err) {
              console.error(err);
            }
          }
        }
      } catch (e: any) {
        console.log("Using local repository worksheets fallback.");
        const saved = localStorage.getItem("english_magic_worksheets");
        if (saved) {
          try {
            setSavedWorksheets(JSON.parse(saved));
          } catch (err) {
            console.error(err);
          }
        }
      } finally {
        setIsSupabaseLoading(false);
      }
    }

    initWorksheets();
  }, []);

  // Sync saved worksheets to localStorage (Local failover only)
  const saveToLocalStorage = (list: SavedWorksheet[]) => {
    setSavedWorksheets(list);
    localStorage.setItem("english_magic_worksheets", JSON.stringify(list));
  };

  // Generate worksheet API call
  const handleGenerateWorksheet = async (params: {
    grade: string;
    topic: string;
    exerciseStyle: string;
    numQuestions: number;
    customPrompt: string;
    includeAnswerKey: boolean;
  }) => {
    if (!currentUser) {
      alert("❌ Please sign in to generate or pull worksheets!");
      setStatusMessage({
        type: "error",
        text: "Please sign in using the Authentication Panel above to generate or pull worksheets."
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setActiveSavedId(undefined);

    try {
      const response = await fetch("/api/generate-worksheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...params,
          email: currentUser.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Internal Server Error during generation");
      }

      // Attach the user's preference for answer key inclusion
      const wsData = data.worksheet || data;
      wsData.includeAnswerKey = params.includeAnswerKey;

      setActiveWorksheet(wsData);
      setStatusMessage({
        type: "success",
        text: currentUser.role === "admin"
          ? "ผลิตใบงานสำเร็จและส่งข้อสอบเข้าคลัง Firebase เรียบร้อยแล้วค่ะ! ✨"
          : "ดึงข้อสอบจากคลัง Firebase ของ Admin มาประกอบเป็น Worksheet เรียบร้อยแล้วค่ะ! 📚"
      });
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        type: "error",
        text: error.message || "Failed to retrieve worksheet."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save current worksheet to Supabase or local history library
  const handleSaveToHistory = async () => {
    if (!activeWorksheet) return;

    let targetItem: SavedWorksheet;

    if (activeSavedId) {
      // Find the existing one to update properties
      const existing = savedWorksheets.find((item) => item.id === activeSavedId);
      if (!existing) return;
      targetItem = {
        ...existing,
        data: activeWorksheet,
        topic: activeWorksheet.title, // updated topic in case title was edited
        grade: activeWorksheet.gradeLabel.match(/ป\.\d/) ? activeWorksheet.gradeLabel.match(/ป\.\d/)![0] : existing.grade,
      };
    } else {
      // Create a new saved item
      targetItem = {
        id: "ws_" + Date.now(),
        createdAt: new Date().toISOString(),
        grade: activeWorksheet.gradeLabel.match(/ป\.\d/) ? activeWorksheet.gradeLabel.match(/ป\.\d/)![0] : "ป.1",
        topic: activeWorksheet.title,
        exerciseStyle: activeWorksheet.passage ? "reading-comprehension" : "multiple-choice",
        data: activeWorksheet
      };
    }

    if (isSupabaseConfigured) {
      try {
        setIsLoading(true);
        const response = await fetch("/api/worksheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: targetItem.id,
            createdAt: targetItem.createdAt,
            grade: targetItem.grade,
            topic: targetItem.topic,
            exerciseStyle: targetItem.exerciseStyle,
            data: targetItem.data
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to save worksheet to Supabase");
        }

        // Successfully saved to Supabase
        let updatedList: SavedWorksheet[];
        if (activeSavedId) {
          updatedList = savedWorksheets.map((item) => item.id === activeSavedId ? targetItem : item);
        } else {
          updatedList = [targetItem, ...savedWorksheets];
          setActiveSavedId(targetItem.id);
        }
        setSavedWorksheets(updatedList);
        // Also sync local storage as backup
        localStorage.setItem("english_magic_worksheets", JSON.stringify(updatedList));

        setStatusMessage({
          type: "success",
          text: activeSavedId 
            ? "บันทึกการแก้ไขใบงานเข้าคลังคลาวด์ Firebase เรียบร้อยแล้ว! ☁️" 
            : "บันทึกใบงานเข้าคลังคลาวด์ Firebase เรียบร้อยแล้ว! ☁️"
        });
      } catch (error: any) {
        console.error("Firebase save error:", error);
        setStatusMessage({
          type: "error",
          text: `ไม่สามารถบันทึกลง Firebase: ${error.message} - ระบบได้บันทึกลงในเครื่อง (Local Storage) ให้แทนแล้วค่ะ`
        });
        // Fallback to local
        fallbackLocalSave(targetItem);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local Storage only
      fallbackLocalSave(targetItem);
    }
  };

  const fallbackLocalSave = (item: SavedWorksheet) => {
    let updatedList: SavedWorksheet[];
    if (activeSavedId) {
      updatedList = savedWorksheets.map((it) => it.id === activeSavedId ? item : it);
    } else {
      updatedList = [item, ...savedWorksheets];
      setActiveSavedId(item.id);
    }
    setSavedWorksheets(updatedList);
    localStorage.setItem("english_magic_worksheets", JSON.stringify(updatedList));
    setStatusMessage({
      type: "success",
      text: activeSavedId 
        ? "Worksheet changes saved to local browser storage!" 
        : "Worksheet saved to local browser library!"
    });
  };

  // Select a worksheet from library
  const handleSelectWorksheet = (saved: SavedWorksheet) => {
    setActiveWorksheet(saved.data);
    setActiveSavedId(saved.id);
    setMainNavTab("create");
    setStatusMessage({
      type: "info",
      text: `ดึงใบงาน "${saved.data.title}" เข้ามาแสดงผลในระบบเรียบร้อยแล้ว!`
    });
  };

  // Delete from library
  const handleDeleteWorksheet = async (id: string) => {
    const newList = savedWorksheets.filter((item) => item.id !== id);
    
    if (isSupabaseConfigured) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/worksheets/${id}`, {
          method: "DELETE"
        });
        if (!response.ok) {
          throw new Error("Failed to delete from Supabase");
        }
        setSavedWorksheets(newList);
        localStorage.setItem("english_magic_worksheets", JSON.stringify(newList));
        if (activeSavedId === id) {
          setActiveSavedId(undefined);
          setActiveWorksheet(null);
        }
        setStatusMessage({
          type: "info",
          text: "Worksheet removed from Supabase Cloud library."
        });
      } catch (error: any) {
        console.error("Delete error:", error);
        setStatusMessage({
          type: "error",
          text: `Failed to delete from Cloud: ${error.message}`
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setSavedWorksheets(newList);
      localStorage.setItem("english_magic_worksheets", JSON.stringify(newList));
      if (activeSavedId === id) {
        setActiveSavedId(undefined);
        setActiveWorksheet(null);
      }
      setStatusMessage({
        type: "info",
        text: "Worksheet removed from local library."
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F2] pb-20 selection:bg-[#D4E4BC] text-[#3E4A2E]">
      
      {/* Premium Natural Tones Header (No-Print) */}
      <header className="no-print bg-[#D4E4BC] border-b border-[#B8CC9A] flex items-center justify-between px-6 py-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6B8E23] rounded-xl flex items-center justify-center text-white text-xl shadow-xs">🪄</div>
          <div className="text-left">
            <h1 className="text-lg md:text-xl font-bold text-[#3E4A2E] tracking-tight font-friendly">English Magic Primary</h1>
            <p className="text-[10px] text-[#556B2F] font-bold">Thai Primary Syllabus Rules (ป.1 - ป.6) • O-NET Aligned</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCurriculumGuideOpen(true)}
            className="hidden sm:flex items-center text-xs font-bold text-[#556B2F] bg-[#F4F7F2]/80 hover:bg-[#F4F7F2] border border-[#B8CC9A] px-3 py-1.5 rounded-lg transition"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Syllabus Rules
          </button>
          
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 text-[#2E7D6F] text-xs md:text-sm font-bold bg-[#E2F5E9] px-3 py-1.5 rounded-full border border-[#8EE4AF]">
              <span className="w-2 h-2 rounded-full bg-[#379683] animate-pulse"></span>
              <span>Firebase Cloud</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#2E7D6F] text-xs md:text-sm font-bold bg-[#E2F5E9] px-3 py-1.5 rounded-full border border-[#8EE4AF]">
              <span className="w-2 h-2 rounded-full bg-[#379683]"></span>
              <span>Local Repository</span>
            </span>
          )}

          <span className="text-[#556B2F] text-xs md:text-sm font-bold bg-[#E1E8D8] px-3 py-1.5 rounded-full border border-[#B8CC9A]/40">Kru Workspace</span>
          <div className="w-8 h-8 rounded-full bg-[#B8CC9A] border-2 border-white flex items-center justify-center text-xs font-bold text-[#3E4A2E]">ครู</div>
        </div>
      </header>

      {/* Topbar Navigation Bar (อยู่บน Topbar) */}
      <nav className="no-print bg-[#253334] text-white shadow-md border-b border-[#1b2627] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between overflow-x-auto py-2.5 scrollbar-none gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* 1. โปรไฟล์ผู้ใช้งาน */}
            <button
              onClick={() => setMainNavTab("profile")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                mainNavTab === "profile"
                  ? "bg-[#8EE4AF] text-[#253334] shadow-xs"
                  : "text-[#D4E4BC] hover:bg-[#374c4e] hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span>โปรไฟล์ผู้ใช้งาน</span>
            </button>

            {/* 2. สร้างใบงาน */}
            <button
              onClick={() => setMainNavTab("create")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                mainNavTab === "create"
                  ? "bg-[#8EE4AF] text-[#253334] shadow-xs"
                  : "text-[#D4E4BC] hover:bg-[#374c4e] hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>สร้างใบงาน</span>
            </button>

            {/* 2.5 การสร้างข้อสอบ (Exam Creator & Approval Workflow) */}
            <button
              onClick={() => setMainNavTab("exam_creator")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                mainNavTab === "exam_creator"
                  ? "bg-[#8EE4AF] text-[#253334] shadow-xs"
                  : "text-[#D4E4BC] hover:bg-[#374c4e] hover:text-white"
              }`}
            >
              <FilePlus className="w-4 h-4 text-emerald-300" />
              <span>การสร้างข้อสอบ</span>
              <span className="bg-[#379683] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                AI
              </span>
            </button>

            {/* 3. คลังข้อสอบ */}
            <button
              onClick={() => setMainNavTab("question_bank")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                mainNavTab === "question_bank"
                  ? "bg-[#8EE4AF] text-[#253334] shadow-xs"
                  : "text-[#D4E4BC] hover:bg-[#374c4e] hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>คลังข้อสอบ</span>
            </button>

            {/* 4. ประวัติการสร้างใบงาน */}
            <button
              onClick={() => setMainNavTab("history")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                mainNavTab === "history"
                  ? "bg-[#8EE4AF] text-[#253334] shadow-xs"
                  : "text-[#D4E4BC] hover:bg-[#374c4e] hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              <span>ประวัติการสร้างใบงาน</span>
              {savedWorksheets.length > 0 && (
                <span className="bg-[#379683] text-white text-[10px] font-bold px-2 py-0.2 rounded-full ml-0.5">
                  {savedWorksheets.length}
                </span>
              )}
            </button>

            {/* 5. อัปเกรด */}
            <button
              onClick={() => setMainNavTab("upgrade")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                mainNavTab === "upgrade"
                  ? "bg-amber-400 text-amber-950 shadow-xs"
                  : "text-amber-300 hover:bg-amber-900/60 hover:text-white"
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>อัปเกรด</span>
            </button>

            {/* Admin Panel Tab (If Admin) */}
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setMainNavTab("admin")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  mainNavTab === "admin"
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-sky-300 hover:bg-sky-900/60 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>ผู้ดูแลระบบ</span>
              </button>
            )}
          </div>

          {/* User Status pill & Branding controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTeacherBrandingModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="ตั้งค่าโลโก้และชื่อครู"
            >
              <span>🎨 แบรนด์ครู</span>
            </button>

            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                (currentUser?.plan || currentUser?.role) === "pro" || currentUser?.role === "admin"
                  ? "bg-amber-400 text-amber-950 font-black shadow-xs"
                  : (currentUser?.plan || currentUser?.role) === "premium"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-slate-700 text-slate-200 border border-slate-600"
              }`}
              title="ดูรายละเอียดแพ็กเกจสมาชิก"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>
                {((currentUser?.plan || currentUser?.role) === "pro" || currentUser?.role === "admin")
                  ? "Pro 💎"
                  : (currentUser?.plan || currentUser?.role) === "premium"
                  ? "Premium 🌟"
                  : "Free Plan"}
              </span>
            </button>

            {currentUser ? (
              <div className="hidden md:flex items-center gap-2 text-xs text-[#D4E4BC]">
                <span className="w-2 h-2 rounded-full bg-[#8EE4AF] animate-pulse"></span>
                <span className="font-medium truncate max-w-[150px]">{currentUser.email}</span>
              </div>
            ) : (
              <button
                onClick={() => setMainNavTab("profile")}
                className="hidden md:flex items-center gap-1.5 text-xs text-[#D4E4BC] bg-[#374c4e] px-3 py-1.5 rounded-xl hover:text-white cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ==================== 1. TAB: PROFILE / AUTH HUD ==================== */}
      {mainNavTab === "profile" && (
        <div className="no-print mx-auto max-w-7xl px-4 md:px-8 mt-6 animate-fade-in">
          {currentUser ? (
            /* User Is Logged In HUD */
            <div className="bg-white border-2 border-[#8EE4AF]/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm text-left">
              <div className="flex items-start md:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#379683] flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
                  {currentUser.role === "admin" ? <Shield className="w-7 h-7 text-white" /> : <User className="w-7 h-7 text-white" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-base md:text-lg break-all">{currentUser.email}</span>
                    {currentUser.role === "admin" ? (
                      <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-3 py-0.5 rounded-full border border-sky-200 uppercase tracking-tight flex items-center">
                        <Shield className="w-3 h-3 mr-1" /> Admin (ผู้ดูแลระบบ)
                      </span>
                    ) : currentUser.role === "premium" ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-0.5 rounded-full border border-emerald-200 uppercase tracking-tight flex items-center">
                        <Crown className="w-3 h-3 mr-1 text-emerald-600" /> Premium (ดาวน์โหลดไม่จำกัด)
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-0.5 rounded-full border border-blue-200 uppercase tracking-tight flex items-center">
                        <Award className="w-3 h-3 mr-1 text-blue-600" /> Free Tier
                      </span>
                    )}
                  </div>
                  
                  {currentUser.role === "free" ? (
                    <p className="text-xs text-gray-600">
                      💾 สิทธิ์ดาวน์โหลด: <strong className="text-red-600">{currentUser.downloadCount || 0} / 5</strong> ครั้ง (จำกัด 5 ครั้ง และใบงานดึงได้สูงสุด 5 ข้อต่อชุด)
                    </p>
                  ) : currentUser.role === "premium" ? (
                    <p className="text-xs text-emerald-800 font-semibold">
                      ✨ บัญชีพรีเมียม: สิทธิ์ดาวน์โหลดและพิมพ์ข้อสอบได้ไม่จำกัดจำนวนครั้ง มีโจทย์ครบถ้วนสูงสุด 20 ข้อต่อใบ!
                    </p>
                  ) : (
                    <p className="text-xs text-sky-900 font-semibold">
                      🛠️ ครูแอดมิน: สิทธิ์พิเศษในการเข้าถึงโมเดล AI ออกแบบข้อสอบ และจัดการคลังข้อสอบส่วนกลางได้เต็มรูปแบบ
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentUser.role === "free" && (
                  <button
                    onClick={() => setMainNavTab("upgrade")}
                    className="flex items-center px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
                  >
                    <Crown className="w-4 h-4 mr-1.5" /> อัปเกรดเป็น Premium (฿199)
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> ออกจากระบบ (Sign Out)
                </button>
              </div>
            </div>
          ) : (
            /* User Is Logged Out - Show Auth Panel */
            <div className="bg-white border border-[#E2F5E9] rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4 text-left">
                <span className="inline-flex bg-[#8EE4AF]/20 text-[#2E7D6F] text-xs font-bold px-3 py-1 rounded-full border border-[#8EE4AF]">
                  🔑 Role-Based Access Control System
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight font-friendly">
                  กรุณาเข้าสู่ระบบครูเพื่อเริ่มดึงคลังข้อสอบและดาวน์โหลดแบบฝึกหัด
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                  ระบบจัดการระดับสิทธิ์สมาชิก: บัญชี <strong>Free</strong> โหลดได้ 5 ใบงาน (ทำได้สูงสุด 5 ข้อต่อชุด) • บัญชี <strong>Premium</strong> ได้สิทธิ์ดาวน์โหลดและจำนวนโจทย์ไม่จำกัด • บัญชี <strong>Admin</strong> ดูแลระบบ สมาชิก และเพิ่มข้อสอบเข้าคลังหลักได้
                </p>
                
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    🚀 ทางลัดในการทดสอบระบบสมาชิก (คลิกเพื่อกรอกข้อมูลบัญชีทันที)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setAuthEmail("sakarinmam999@gmail.com");
                        setAuthPassword("Akarach@9365");
                        setIsRegistering(false);
                        setAuthError(null);
                      }}
                      className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition cursor-pointer"
                    >
                      👑 แอดมิน (Admin)
                    </button>
                    <button
                      onClick={() => {
                        setAuthEmail("testfree@gmail.com");
                        setAuthPassword("123456");
                        setIsRegistering(false);
                        setAuthError(null);
                      }}
                      className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition cursor-pointer"
                    >
                      👤 สมาชิกทั่วไป (Free 5 โหลด / 5 ข้อ)
                    </button>
                    <button
                      onClick={() => {
                        setAuthEmail("testpremium@gmail.com");
                        setAuthPassword("123456");
                        setIsRegistering(false);
                        setAuthError(null);
                      }}
                      className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
                    >
                      💎 สมาชิกพรีเมียม (Premium ไม่จำกัด)
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm text-center">
                  {isRegistering ? "สมัครสมาชิกใหม่ (Register)" : "เข้าสู่ระบบสมาชิก (Login)"}
                </h3>
                
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">อีเมล (Email)</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="teacher@school.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-emerald-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">รหัสผ่าน (Password)</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="******"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-emerald-300"
                      />
                    </div>
                  </div>

                  {authError && (
                    <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 text-center font-semibold">
                      ❌ {authError}
                    </p>
                  )}

                  {authSuccess && (
                    <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center font-semibold">
                      ✨ {authSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#379683] hover:bg-[#2E7D6F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isRegistering ? "สมัครบัญชีสมาชิกใหม่ 🚀" : "เข้าสู่ระบบความปลอดภัย 🔒"}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-[11px] text-[#379683] hover:underline font-semibold cursor-pointer"
                  >
                    {isRegistering ? "มีบัญชีแล้ว? คลิกเพื่อเข้าสู่ระบบ" : "ยังไม่มีบัญชีสมาชิก? คลิกเพื่อสมัครใหม่"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 2. TAB: CREATE WORKSHEET (สร้างใบงาน) ==================== */}
      {mainNavTab === "create" && (
        <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Side: Builder Controls (Col Span 4) */}
          <section className="no-print lg:col-span-4 space-y-6">
            {/* Status Alert Message */}
            {statusMessage && (
              <div 
                className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs md:text-sm animate-fade-in ${
                  statusMessage.type === "success" 
                    ? "bg-[#F0FDF4] border-[#6B8E23] text-[#3E4A2E]" 
                    : statusMessage.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#6B8E23]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1 text-left">
                  <span className="font-bold">
                    {statusMessage.type === "success" ? "Magic Alert!" : statusMessage.type === "error" ? "Warning!" : "Notification:"}
                  </span>
                  <p className="leading-relaxed text-gray-700">{statusMessage.text}</p>
                </div>
              </div>
            )}

            {/* Worksheet Form Builder */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3E4A2E] font-friendly">
                  Worksheet Design Center
                </h2>
              </div>

              <WorksheetForm 
                onSubmit={handleGenerateWorksheet} 
                isLoading={isLoading} 
                onOpenCurriculumGuide={() => setIsCurriculumGuideOpen(true)}
                currentUserRole={currentUser?.role}
              />
            </div>

            {/* Quick Curriculum Rule Overview Footer */}
            <div className="p-4 bg-[#3E4A2E] text-[#F4F7F2] rounded-2xl border border-[#556B2F] space-y-3 font-sans text-xs text-left">
              <h4 className="font-bold text-[#D4E4BC] font-friendly flex items-center">
                <Layers className="w-4 h-4 mr-1.5" /> Thai Curriculum Focus
              </h4>
              <div className="space-y-2 text-[#E1E8D8] leading-relaxed">
                <p>Worksheets are structured logically based on vocabulary limits:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#E1E8D8]/90 font-medium">
                  <li><strong>ป.1:</strong> 150-200 words (Self, Family, Pets)</li>
                  <li><strong>ป.2:</strong> 250-300 words (Yes/No, basic Wh)</li>
                  <li><strong>ป.3:</strong> 350-450 words (Feelings, Hobbies)</li>
                  <li><strong>ป.4:</strong> 550-700 words (Abstract, sequences)</li>
                  <li><strong>ป.5:</strong> 750-950 words (Compound, 'because')</li>
                  <li><strong>ป.6:</strong> 1050-1200 words (Complex, essay comprehension)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Right Side: Live Paper Preview (Col Span 8) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="no-print flex justify-between items-center px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3E4A2E] font-friendly">
                Live Paper Preview (แสดงผลงานฝึกหัด)
              </h2>
              <span className="text-xs text-[#8AA668] font-sans italic">
                ✨ Click on any question or the title to edit directly!
              </span>
            </div>

            {isLoading ? (
              <div className="bg-white border border-[#E1E8D8] rounded-3xl p-20 text-center shadow-sm flex flex-col items-center justify-center space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-[#E1E8D8]/40 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#6B8E23] animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#6B8E23] animate-bounce" />
                  </div>
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-bold text-[#3E4A2E] font-friendly text-lg">Summoning English Magic...</h3>
                  <p className="text-xs text-[#8AA668] leading-relaxed">
                    Analyzing vocabulary, grammar boundaries, and structuring O-NET friendly questions according to curriculum rules. This will take just a moment.
                  </p>
                </div>
              </div>
            ) : (
              <WorksheetPreview 
                worksheet={activeWorksheet}
                onUpdateWorksheet={setActiveWorksheet}
                onSaveToHistory={handleSaveToHistory}
                isSaving={isLoading}
                currentUser={currentUser}
                userPlan={(currentUser?.plan || currentUser?.role || "free") as SubscriptionPlan}
                teacherProfile={teacherProfile}
                onSaveToRepository={handleSaveToRepository}
                onLogDownload={handleLogDownload}
                onOpenBrandingModal={() => setIsTeacherBrandingModalOpen(true)}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
              />
            )}
          </section>
        </main>
      )}

      {/* ==================== 3. TAB: QUESTION BANK (คลังข้อสอบ) ==================== */}
      {mainNavTab === "question_bank" && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 animate-fade-in">
          <AdminPanel
            usersList={usersList}
            repositoryList={repositoryList}
            onUpdateUserRole={handleUpdateUserRole}
            onDeleteFromRepository={handleDeleteFromRepository}
            onSelectWorksheet={(item) => {
              setActiveWorksheet(item.data);
              setMainNavTab("create");
              setStatusMessage({
                type: "success",
                text: `ดึงข้อสอบ "${item.data.title}" เข้ามาในระบบ Workspace พรีวิวเรียบร้อยแล้ว!`
              });
            }}
            currentUser={currentUser}
            defaultTab="question_bank"
          />
        </div>
      )}

      {/* ==================== 4. TAB: HISTORY (ประวัติการสร้างใบงาน) ==================== */}
      {mainNavTab === "history" && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 animate-fade-in space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 font-friendly flex items-center gap-2">
                  <History className="w-6 h-6 text-[#379683]" />
                  <span>ประวัติการสร้างใบงาน (Worksheet Generation History)</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  รายการใบงานทั้งหมดที่คุณได้ออกแบบและบันทึกไว้ สามารถเลือกเปิดดู หรือดาวน์โหลดพิมพ์ซ้ำได้ทุกเมื่อ
                </p>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อใบงาน หรือระดับชั้น..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#379683]"
                />
              </div>
            </div>

            {savedWorksheets.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-700 text-sm">ยังไม่มีประวัติการสร้างใบงาน</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  เมื่อคุณสร้างใบงานในเมนู "สร้างใบงาน" และกดปุ่มบันทึก ใบงานจะถูกจัดเก็บไว้ที่นี่เพื่อเรียกดูย้อนหลังได้ตลอดเวลา
                </p>
                <button
                  onClick={() => setMainNavTab("create")}
                  className="mt-2 bg-[#379683] hover:bg-[#2E7D6F] text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  🪄 ไปที่หน้าสร้างใบงานใหม่
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {savedWorksheets
                  .filter((item) => {
                    if (!historySearch) return true;
                    const term = historySearch.toLowerCase();
                    return (
                      item.data.title.toLowerCase().includes(term) ||
                      item.data.gradeLabel.toLowerCase().includes(term)
                    );
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`bg-gray-50 border rounded-2xl p-4 transition space-y-3 hover:border-[#379683] hover:shadow-xs text-left ${
                        activeSavedId === item.id ? "border-[#379683] bg-[#E2F5E9]/30" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="bg-[#6B8E23] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          {item.data.gradeLabel}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(item.timestamp).toLocaleDateString("th-TH")}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                          {item.data.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          จำนวนโจทย์: <strong className="text-gray-800">{item.data.questions.length} ข้อ</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200/80">
                        <button
                          onClick={() => handleSelectWorksheet(item)}
                          className="w-full bg-[#379683] hover:bg-[#2E7D6F] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>เรียกดูใบงานนี้</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 5. TAB: UPGRADE (อัปเกรด) ==================== */}
      {mainNavTab === "upgrade" && (
        <div className="max-w-2xl mx-auto px-4 mt-6 animate-fade-in">
          <div 
            id="upgrade-section" 
            className="bg-white border-2 border-[#FFB7B2] rounded-3xl p-8 text-center shadow-md space-y-6 font-sans text-left"
          >
            <div className="text-center space-y-2">
              <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Upgrade Membership
              </span>
              <h2 className="text-2xl font-bold text-[#253334] font-friendly">
                👑 อัปเกรดเป็น English Magic Premium
              </h2>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                ปลดล็อกพลังแห่งการเรียนรู้ ดาวน์โหลดใบงานได้ไม่จำกัดจำนวนครั้ง และสร้างใบงานชุดใหญ่ได้สูงสุด 20 ข้อต่อใบเต็มอิ่ม!
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#FFF1A7]/60 to-amber-50 p-6 rounded-2xl border border-amber-200 text-center space-y-1">
              <span className="text-xs text-amber-900 font-bold block">
                จ่ายครั้งเดียวใช้งานได้ตลอดชีพ (Lifetime Access)
              </span>
              <span className="text-4xl font-extrabold text-[#253334]">
                ฿199
              </span>
            </div>

            <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-xs">
              <h4 className="font-bold text-gray-800 text-sm">✨ สิทธิประโยชน์ที่คุณจะได้รับทันที:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ดาวน์โหลดและพิมพ์ข้อสอบแบบ PDF ได้ไม่จำกัดจำนวนครั้ง</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>รองรับการเลือกโจทย์เต็มรูปแบบสูงสุด 20 ข้อต่อใบงาน</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>บันทึกใบงานลงคลังความรู้ระบบ Firebase Cloud ได้อย่างปลอดภัย</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>รับสิทธิ์ใช้งานระบบวิเคราะห์หลักสูตรภาษาอังกฤษชั้น ป.1 - ป.6 ครบถ้วน</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={openPaymentModal} 
              className="w-full bg-[#8EE4AF] hover:brightness-95 text-[#253334] font-bold py-4 rounded-2xl text-base shadow-sm transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              💳 ชำระเงินอัปเกรดทันที (PromptPay 199 บาท)
            </button>
          </div>
        </div>
      )}

      {/* ==================== 5.5 TAB: EXAM CREATOR (การสร้างข้อสอบ & อนุมัติคลัง) ==================== */}
      {mainNavTab === "exam_creator" && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 animate-fade-in">
          <ExamGenerator
            currentUser={currentUser}
            onSelectWorksheetForPreview={(ws) => {
              setActiveWorksheet(ws);
              setMainNavTab("create");
            }}
          />
        </div>
      )}

      {/* ==================== 6. TAB: ADMIN PANEL (ถ้าผู้ใช้เป็น Admin) ==================== */}
      {mainNavTab === "admin" && currentUser?.role === "admin" && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 animate-fade-in">
          <AdminPanel
            usersList={usersList}
            repositoryList={repositoryList}
            onUpdateUserRole={handleUpdateUserRole}
            onDeleteFromRepository={handleDeleteFromRepository}
            onSelectWorksheet={(item) => {
              setActiveWorksheet(item.data);
              setMainNavTab("create");
              setStatusMessage({
                type: "success",
                text: `ดึงข้อสอบ "${item.data.title}" เข้ามาในระบบ Workspace พรีวิวเรียบร้อยแล้ว!`
              });
            }}
            currentUser={currentUser}
            defaultTab="dashboard"
          />
        </div>
      )}

      {/* Curriculum Rules Modal Reference Popup */}
      <CurriculumGuideModal 
        isOpen={isCurriculumGuideOpen} 
        onClose={() => setIsCurriculumGuideOpen(false)} 
      />

      {/* Immersive Payment / Upgrade Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-[#FFB7B2] transform scale-100 transition-all font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FFF1A7] via-[#FFB7B2] to-[#8EE4AF]/60 p-6 text-center relative border-b border-gray-100">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center font-bold text-sm shadow-sm transition"
              >
                ✕
              </button>
              <span className="inline-block bg-white/90 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full border border-amber-200 mb-2 uppercase tracking-wide">
                Secure checkout
              </span>
              <h3 className="text-xl font-bold text-[#253334] flex items-center justify-center gap-1.5 font-friendly">
                👑 อัปเกรดเป็น Premium
              </h3>
              <p className="text-xs text-[#253334]/80 mt-1 font-medium">ชำระเงินสะดวกผ่าน PromptPay QR Code</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 text-center">
              {/* QR Code with promptpay details */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 inline-block w-full">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-10 bg-[#003865] rounded-lg flex items-center justify-center text-white font-extrabold text-xs tracking-widest mb-3 shadow-xs">
                    PROMPT PAY
                  </div>
                  
                  <div className="relative p-2 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://promptpay.io/0893652516/199" 
                      alt="PromptPay QR Code"
                      className="w-40 h-40 object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="mt-4 text-xs space-y-1 font-medium text-gray-700">
                    <p>ชื่อบัญชี: <strong className="text-gray-950">English Magic Co., Ltd. (บริษัท อิงลิชเมจิก จำกัด)</strong></p>
                    <p>ยอดชำระเงิน: <strong className="text-emerald-700 text-lg">฿199.00</strong></p>
                    <p className="text-[10px] text-gray-400">สแกนจ่ายได้ด้วยทุกแอปพลิเคชันธนาคาร</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-left text-xs bg-[#E2F5E9]/50 border border-[#8EE4AF]/40 p-4.5 rounded-2xl space-y-2">
                <h4 className="font-bold text-[#253334] flex items-center gap-1.5">
                  💡 ขั้นตอนการอัปเกรดสิทธิ์:
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-gray-600 font-medium">
                  <li>บันทึกภาพหน้าจอ QR Code ด้านบน</li>
                  <li>เปิดแอปธนาคารของคุณแล้วเลือก "สแกนจ่าย" เพื่อชำระเงิน 199 บาท</li>
                  <li>หลังจากชำระเงินเรียบร้อยแล้ว ให้คลิกปุ่มสีเขียวด้านล่างเพื่อยืนยัน</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleConfirmUpgrade}
                  disabled={isUpgradingInProgress}
                  style={{
                    backgroundColor: "#8EE4AF",
                    color: "#253334",
                    border: "none",
                    padding: "14px 20px",
                    fontSize: "15px",
                    fontWeight: "bold",
                    borderRadius: "20px",
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(142, 228, 175, 0.4)",
                  }}
                  className="hover:brightness-95 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpgradingInProgress ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#253334] border-t-transparent animate-spin"></span>
                      <span>กำลังดำเนินการเปิดใช้งาน...</span>
                    </>
                  ) : (
                    <span>✨ ยืนยันการชำระเงิน (อัปเกรดเป็นพรีเมียมทันที) 🚀</span>
                  )}
                </button>
                
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
                >
                  ไว้ทำภายหลัง (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={currentUser}
        onSelectPlan={handleSelectPlan}
      />

      <TeacherBrandingModal
        isOpen={isTeacherBrandingModalOpen}
        onClose={() => setIsTeacherBrandingModalOpen(false)}
        currentUserEmail={currentUser?.email || "guest"}
        userPlan={(currentUser?.plan || currentUser?.role || "free") as SubscriptionPlan}
        initialProfile={teacherProfile}
        onSaveProfile={handleSaveTeacherProfile}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Subtle bottom informational footer (No-Print) */}
      <footer className="no-print text-center text-xs text-gray-400 mt-20 border-t border-gray-100 pt-8 max-w-4xl mx-auto font-mono">
        <p>English Magic Primary • Designed for English Teachers in Thailand</p>
        <p className="mt-1">Local Browser Session Persistence Enabled</p>
      </footer>
    </div>
  );
}
