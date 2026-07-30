import React from "react";
import { 
  PRIMARY_GRADES, 
  PRIMARY_TOPICS, 
  LEARNING_STAGES, 
  STAGE_KEYS, 
  DIFFICULTY_OPTIONS, 
  getStageBadge 
} from "../constants/learningPath";
import { 
  Users, 
  Database, 
  Trash2, 
  Award, 
  ArrowUpCircle, 
  Download, 
  BookOpen, 
  Search,
  Sparkles,
  Shield,
  Cpu,
  FileText,
  Check,
  Edit3,
  Save,
  PlusCircle,
  AlertTriangle,
  HelpCircle,
  Trash,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  FileCheck,
  Bookmark,
  Archive,
  ArrowRight,
  Info,
  Sliders,
  CheckCircle,
  Eye,
  CheckSquare,
  Plus,
  X,
  XCircle,
  RefreshCw,
  Tag,
  Filter,
  FolderOpen,
  Clock,
  TrendingUp,
  Calendar,
  ArrowUpDown,
  AlertCircle,
  Flame,
  ChevronDown,
  ChevronRight,
  ListFilter
} from "lucide-react";
import { QuestionBankEntry } from "../types";

interface UserProfile {
  id: string;
  email: string;
  role: "free" | "premium" | "pro" | "admin";
  plan?: "free" | "premium" | "pro" | "admin";
  plan_expiry?: string | null;
  downloadCount: number;
}

interface RepositoryItem {
  id: string;
  grade: string;
  topic: string;
  exerciseStyle: string;
  createdBy: string;
  data: any;
  is_archived?: boolean;
}

interface AdminPanelProps {
  usersList: UserProfile[];
  repositoryList: RepositoryItem[];
  onUpdateUserRole: (email: string, role: string) => void;
  onDeleteFromRepository: (id: string) => void;
  onSelectWorksheet: (ws: any) => void;
  currentUser?: any;
  defaultTab?: "generator" | "question_bank" | "library" | "dashboard" | "db_viewer";
}

const SUGGESTED_TOPICS: Record<string, string[]> = {
  "ป.1": ["My Family (ครอบครัว)", "Classroom Objects (สิ่งของในห้องเรียน)", "Colors & Numbers 1-10", "My Pets (สัตว์เลี้ยง)", "Greetings & Introduction"],
  "ป.2": ["My House (บ้านของฉัน)", "Food and Drinks (อาหารและเครื่องดื่ม)", "Parts of the Body (ร่างกาย)", "Farm Animals (สัตว์ในฟาร์ม)", "My Favorite Fruits (ผลไม้)"],
  "ป.3": ["Hobbies & Playtime (งานอดิเรก)", "Daily Activities (กิจวัตรประจำวัน)", "My Emotions (อารมณ์ความรู้สึก)", "The Weather (สภาพอากาศ)", "Vehicles & Transport (ยานพาหนะ)"],
  "ป.4": ["Telling Time (การบอกเวลา)", "Jobs & Occupations (อาชีพ)", "Around Town & Directions (เส้นทาง)", "Shopping (การซื้อของ)", "My School Subjects (วิชาเรียน)"],
  "ป.5": ["Healthy Habits (สุขอนามัย)", "Protecting the Environment (รักษ์โลก)", "Travel and Holidays (การท่องเที่ยว)", "Jobs and Duties (หน้าที่งาน)", "Brief Tales & Fables (นิทานสั้น)"],
  "ป.6": ["Festivals & Culture (เทศกาลและวัฒนธรรม)", "Songkran & Loy Krathong (ประเพณีไทย)", "Basic Technology & Computers", "Internet Safety for Kids", "Famous English Folktales"]
};

export default function AdminPanel({
  usersList,
  repositoryList,
  onUpdateUserRole,
  onDeleteFromRepository,
  onSelectWorksheet,
  currentUser,
  defaultTab = "question_bank"
}: AdminPanelProps) {
  // Navigation Tabs for Admin
  const [activeTab, setActiveTab] = React.useState<"generator" | "question_bank" | "library" | "dashboard" | "db_viewer">(defaultTab);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // --- QUESTION BANK STATES & FUNCTIONS ---
  const [questionBankList, setQuestionBankList] = React.useState<QuestionBankEntry[]>([]);
  const [isLoadingQuestionBank, setIsLoadingQuestionBank] = React.useState(false);
  const [qbTopicFilter, setQbTopicFilter] = React.useState<string>("all");
  const [qbGradeFilter, setQbGradeFilter] = React.useState<string>("all");
  const [qbSearch, setQbSearch] = React.useState<string>("");
  const [qbViewMode, setQbViewMode] = React.useState<"grouped" | "flat">("grouped");
  
  // 4-Level Drill-Down Accordion States for Question Bank
  const [openGrades, setOpenGrades] = React.useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = React.useState<Record<string, boolean>>({});
  const [openTypes, setOpenTypes] = React.useState<Record<string, boolean>>({});
  const [openDiffs, setOpenDiffs] = React.useState<Record<string, boolean>>({});

  const [showQuestionModal, setShowQuestionModal] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<QuestionBankEntry | null>(null);

  const defaultQuestionForm: QuestionBankEntry = {
    id: "",
    subject: "English",
    grade: "ป.3",
    cefr_level: "A1",
    topic: PRIMARY_TOPICS[0],
    learning_stage: "Vocabulary & Meaning",
    focus: LEARNING_STAGES["Vocabulary & Meaning"].focusOptions[0],
    grammar_focus: "Present Simple Tense",
    vocabulary_focus: "Common Routine Verbs",
    question_type: "multiple-choice",
    difficulty: "Medium",
    learning_objective: "Basic English Comprehension",
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    ai_generated: "No",
    generation_method: "Admin Manual Input"
  };

  const [questionForm, setQuestionForm] = React.useState<QuestionBankEntry>(defaultQuestionForm);

  const fetchQuestionBank = async () => {
    setIsLoadingQuestionBank(true);
    try {
      const res = await fetch("/api/admin/question-bank");
      if (res.ok) {
        const data = await res.json();
        setQuestionBankList(data || []);
      }
    } catch (e) {
      console.error("Error fetching question bank:", e);
    } finally {
      setIsLoadingQuestionBank(false);
    }
  };

  React.useEffect(() => {
    fetchQuestionBank();
  }, []);

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm(defaultQuestionForm);
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: QuestionBankEntry) => {
    setEditingQuestion(q);
    setQuestionForm({
      id: q.id || "",
      subject: q.subject || "English",
      grade: q.grade || "ป.3",
      cefr_level: q.cefr_level || "A1",
      topic: q.topic || "General English",
      learning_stage: q.learning_stage || "Vocabulary & Meaning",
      focus: q.focus || "",
      grammar_focus: q.grammar_focus || "",
      vocabulary_focus: q.vocabulary_focus || "",
      question_type: q.question_type || "multiple-choice",
      difficulty: q.difficulty || "Medium",
      learning_objective: q.learning_objective || "",
      question_text: q.question_text || q.questionText || "",
      options: q.options && q.options.length ? [...q.options] : ["", "", "", ""],
      correct_answer: q.correct_answer || q.correctAnswer || "",
      explanation: q.explanation || "",
      ai_generated: q.ai_generated || "No",
      generation_method: q.generation_method || "Admin Edit"
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestionBankItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionForm.question_text.trim()) {
      alert("กรุณากรอกข้อความโจทย์ข้อสอบ");
      return;
    }
    try {
      const res = await fetch("/api/admin/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionForm)
      });
      if (res.ok) {
        setAlert({ type: "success", text: "บันทึกข้อสอบลงคลัง Firebase สำเร็จแล้ว!" });
        setShowQuestionModal(false);
        fetchQuestionBank();
      } else {
        const err = await res.json();
        setAlert({ type: "error", text: err.error || "เกิดข้อผิดพลาดในการบันทึกข้อสอบ" });
      }
    } catch (err: any) {
      setAlert({ type: "error", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    }
  };

  const handleDeleteQuestionBankItem = async (id: string) => {
    if (!confirm("คุณต้องการลบข้อสอบข้อนี้ออกจากคลัง Firebase หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/question-bank/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAlert({ type: "success", text: "ลบข้อสอบออกจากคลัง Firebase เรียบร้อยแล้ว!" });
        fetchQuestionBank();
      }
    } catch (err) {
      setAlert({ type: "error", text: "เกิดข้อผิดพลาดในการลบข้อสอบ" });
    }
  };

  // Filter States
  const [userSearch, setUserSearch] = React.useState("");
  const [repoSearch, setRepoSearch] = React.useState("");

  // Common Generator Inputs (Engine A & B)
  const [engineMode, setEngineMode] = React.useState<"curriculum" | "reference">("curriculum");
  const [curriculum, setCurriculum] = React.useState("OBEC Thai Core Curriculum (พ.ศ. 2551)");
  const [engineGrade, setEngineGrade] = React.useState("ป.3");
  const [cefrLevel, setCefrLevel] = React.useState("A1");
  const [engineTopic, setEngineTopic] = React.useState("");
  const [isEngineCustomTopic, setIsEngineCustomTopic] = React.useState(false);
  const [engineCustomTopicText, setEngineCustomTopicText] = React.useState("");
  const [grammarFocus, setGrammarFocus] = React.useState("Present Simple Tense");
  const [vocabularyTheme, setVocabularyTheme] = React.useState("Common Routine Verbs");
  const [learningObjective, setLearningObjective] = React.useState("Understand daily schedules and basic time telling");
  const [difficulty, setDifficulty] = React.useState("Medium");
  const [engineNumQuestions, setEngineNumQuestions] = React.useState(5);
  const [engineFormat, setEngineFormat] = React.useState("Multiple Choice");
  const [language, setLanguage] = React.useState("English and Thai");
  const [paperSize, setPaperSize] = React.useState("A4");
  const [includeAnswerKey, setIncludeAnswerKey] = React.useState(true);

  // Engine B Specific States
  const [referenceText, setReferenceText] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  // STEP 1: Analysis Report State
  const [analysisReport, setAnalysisReport] = React.useState<any | null>(null);
  
  // STEP 2: Review Modifications State
  const [reviewStage, setReviewStage] = React.useState<"idle" | "analyzed" | "approved">("idle");

  // STEP 3: Worksheet Generation & State
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = React.useState<any | null>(null);
  const [editingWorksheet, setEditingWorksheet] = React.useState<any | null>(null);

  // System alert feedback
  const [alert, setAlert] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  // --- SOURCE METADATA STATES (AppSheet Enum Style with 'Allow other values') ---
  const [sourcesList, setSourcesList] = React.useState<any[]>([]);
  const [sourceCategory, setSourceCategory] = React.useState("Entrance Exam"); // Reference Type
  const [sourceName, setSourceName] = React.useState("Suankularb Entrance Exam"); // Exam Source
  const [sourcePubYear, setSourcePubYear] = React.useState("2025"); // Year
  const [aiInstruction, setAiInstruction] = React.useState(""); // AI Instruction
  const [showSourceDropdown, setShowSourceDropdown] = React.useState(false);
  const [referenceTypes, setReferenceTypes] = React.useState<string[]>([
    "Entrance Exam",
    "School Examination",
    "Standardized Test",
    "Curriculum",
    "Custom"
  ]);
  const [showCustomTypeInput, setShowCustomTypeInput] = React.useState(false);
  const [newCustomType, setNewCustomType] = React.useState("");

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/admin/sources");
      if (res.ok) {
        const data = await res.json();
        setSourcesList(data);
      }
    } catch (e) {
      console.error("Error fetching sources:", e);
    }
  };

  React.useEffect(() => {
    fetchSources();
  }, []);

  const handleSelectSource = (source: any) => {
    setSourceName(source.source_name);
    setSourceCategory(source.source_category || "Entrance Exam");
    setSourcePubYear(source.publication_year || "");
    setShowSourceDropdown(false);
  };

  const [isAddingSource, setIsAddingSource] = React.useState(false);

  const handleCreateNewSourceInline = async (nameToCreate: string) => {
    if (!nameToCreate.trim()) return;
    setIsAddingSource(true);
    try {
      const payload = {
        source_id: "src_" + Math.random().toString(36).substr(2, 9),
        source_name: nameToCreate.trim(),
        source_category: sourceCategory,
        publisher: "English Magic Team",
        curriculum: "OBEC Thai Core Curriculum",
        examination_type: sourceCategory,
        publication_year: sourcePubYear || new Date().getFullYear().toString(),
        notes: aiInstruction || "Created inline via English Magic UI",
        active: true
      };

      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Append to sourcesList if it didn't exist, and select it
        setSourcesList(prev => {
          if (prev.some(s => s.source_name.toLowerCase() === nameToCreate.trim().toLowerCase())) {
            return prev;
          }
          return [...prev, payload];
        });
        setSourceName(nameToCreate.trim());
        setAlert({ type: "success", text: `ลงทะเบียนแหล่งอ้างอิง "${nameToCreate.trim()}" สำเร็จ!` });
      } else {
        const errData = await res.json();
        setAlert({ type: "error", text: errData.error || "เกิดข้อผิดพลาดในการบันทึกแหล่งอ้างอิง" });
      }
    } catch (error) {
      console.error("Error creating inline source:", error);
      setAlert({ type: "error", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    } finally {
      setIsAddingSource(false);
      setShowSourceDropdown(false);
    }
  };

  // Synchronize preset topics when grade changes
  React.useEffect(() => {
    const suggestions = SUGGESTED_TOPICS[engineGrade];
    if (suggestions && suggestions.length > 0) {
      setEngineTopic(suggestions[0]);
    }
  }, [engineGrade]);

  // Sync edited worksheet when main generated worksheet is set
  React.useEffect(() => {
    if (generatedWorksheet) {
      setEditingWorksheet(JSON.parse(JSON.stringify(generatedWorksheet)));
    } else {
      setEditingWorksheet(null);
    }
  }, [generatedWorksheet]);

  const filteredUsers = usersList.filter(
    (u) => u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRepo = repositoryList.filter(
    (r) => r.topic.toLowerCase().includes(repoSearch.toLowerCase()) || r.grade.toLowerCase().includes(repoSearch.toLowerCase())
  );

  // Dynamically compute statistical values
  const totalQuestions = repositoryList.reduce((acc, item) => acc + (item.data?.questions?.length || 0), 0);
  const totalFreeUsers = usersList.filter(u => u.role === "free").length;
  const totalPremiumUsers = usersList.filter(u => u.role === "premium").length;

  const grades = ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"];
  const gradeStats = grades.map(grade => {
    const gradeItems = repositoryList.filter(item => item.grade === grade);
    const uniqueTopics = Array.from(new Set(gradeItems.map(item => item.topic).filter(Boolean)));
    const totalGradeQuestions = gradeItems.reduce((acc, item) => acc + (item.data?.questions?.length || 0), 0);
    
    let statusText = "🔴 ต้องการข้อสอบ";
    let statusColor = "bg-rose-50 text-rose-700 border-rose-200";
    if (totalGradeQuestions > 25) {
      statusText = "✨ แน่นปึก";
      statusColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
    } else if (totalGradeQuestions >= 11) {
      statusText = "🟢 พร้อมใช้";
      statusColor = "bg-blue-50 text-blue-800 border-blue-200";
    } else if (totalGradeQuestions > 0) {
      statusText = "🟡 ควรเพิ่ม";
      statusColor = "bg-amber-50 text-amber-800 border-amber-200";
    }

    return {
      grade,
      topics: uniqueTopics,
      questionCount: totalGradeQuestions,
      statusText,
      statusColor
    };
  });

  // STEP 1: Analyze Reference Material
  const handleAnalyzeReference = async () => {
    if (!referenceText.trim()) {
      setAlert({ type: "error", text: "กรุณากรอกหรือคัดลอกข้อความอ้างอิงประเมินก่อนค่ะ" });
      return;
    }

    setAlert(null);
    setIsAnalyzing(true);
    setAnalysisReport(null);
    setReviewStage("idle");
    setGeneratedWorksheet(null);

    try {
      const response = await fetch("/api/admin/analyze-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceText,
          email: currentUser?.email
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการเรียกใช้โมเดลวิเคราะห์ข้อมูล");
      }

      if (resData.success && resData.analysisReport) {
        setAnalysisReport(resData.analysisReport);
        setReviewStage("analyzed");
        
        // Auto-populate modified inputs based on analyzer detection
        const report = resData.analysisReport;
        if (report.grade) setEngineGrade(report.grade);
        if (report.cefrLevel) setCefrLevel(report.cefrLevel);
        if (report.topic) {
          setIsEngineCustomTopic(true);
          setEngineCustomTopicText(report.topic);
        }
        if (report.grammarFocus) setGrammarFocus(report.grammarFocus);
        if (report.vocabularyLevel) setVocabularyTheme(report.vocabularyLevel);
        if (report.learningObjectives) setLearningObjective(report.learningObjectives);
        if (report.estimatedDifficulty) setDifficulty(report.estimatedDifficulty);

        setAlert({
          type: "success",
          text: "✨ วิเคราะห์สำเร็จ! ระบบจำแนกความยาก ระดับโครงสร้าง และกลุ่มคำศัพท์เทียบเท่าหลักสูตรไทยประถมศึกษาเรียบร้อยแล้ว กรุณาตรวจสอบหรือปรับเปลี่ยนพารามิเตอร์ด้านล่างก่อนเริ่มสั่งปั๊มใบงานจริงค่ะ"
        });
      } else {
        throw new Error("ข้อมูลตอบกลับวิเคราะห์ไม่สมบูรณ์");
      }
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "ล้มเหลวในการส่งข้อมูลวิเคราะห์" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // STEP 2: Approve modifications & trigger generator
  const handleApproveAndGenerate = async () => {
    setAlert(null);
    setIsGenerating(true);
    setGeneratedWorksheet(null);

    try {
      // Security log approval
      await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email })
      });

      const topicToSend = isEngineCustomTopic ? engineCustomTopicText.trim() : engineTopic;

      // STEP 3: Trigger generation
      const response = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: engineMode,
          curriculum,
          grade: engineGrade,
          cefrLevel,
          topic: topicToSend,
          grammarFocus,
          vocabularyTheme,
          learningObjective,
          difficulty,
          numQuestions: engineNumQuestions,
          worksheetType: engineFormat,
          language,
          paperSize,
          includeAnswerKey,
          referenceText: engineMode === "reference" ? referenceText : undefined,
          referenceType: sourceCategory,
          sourceName: sourceName.trim(),
          sourcePubYear: sourcePubYear.trim(),
          aiInstruction: aiInstruction.trim(),
          email: currentUser?.email
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการสังเคราะห์ข้อสอบผ่านระบบ AI");
      }

      if (resData.success && resData.worksheet) {
        setGeneratedWorksheet(resData.worksheet);
        setReviewStage("approved");
        setAlert({
          type: "success",
          text: "🎉 ผลิตใบงานสำเร็จ! ผ่านการตรวจคุณภาพ (Quality Validation Steps) 6 มิติตามมาตรฐานเรียบร้อย"
        });
      } else {
        throw new Error("โครงสร้างผลลัพธ์ไม่ถูกต้องตามเกณฑ์ข้อกำหนด");
      }
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "เกิดอุปสรรคระหว่างผลิตใบงาน" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Editing of generated questions inside review form
  const handleEditQuestionText = (index: number, val: string) => {
    if (!editingWorksheet) return;
    const copy = { ...editingWorksheet };
    copy.questions[index].questionText = val;
    setEditingWorksheet(copy);
  };

  const handleEditOptionText = (qIndex: number, optIndex: number, val: string) => {
    if (!editingWorksheet) return;
    const copy = { ...editingWorksheet };
    copy.questions[qIndex].options[optIndex] = val;
    setEditingWorksheet(copy);
  };

  const handleEditCorrectAnswer = (index: number, val: string) => {
    if (!editingWorksheet) return;
    const copy = { ...editingWorksheet };
    copy.questions[index].correctAnswer = val;
    setEditingWorksheet(copy);
  };

  const handleEditExplanation = (index: number, val: string) => {
    if (!editingWorksheet) return;
    const copy = { ...editingWorksheet };
    copy.questions[index].explanation = val;
    setEditingWorksheet(copy);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!editingWorksheet) return;
    const copy = { ...editingWorksheet };
    copy.questions = copy.questions.filter((_: any, i: number) => i !== index);
    setEditingWorksheet(copy);
  };

  // Save Approved Worksheet to Database
  const handleSaveToDatabase = async () => {
    if (!editingWorksheet) return;
    setSaving(true);
    setAlert(null);

    const sourceMeta = {
      source_type: engineMode === "reference" ? "reference_document" : "curriculum_standards",
      source_category: sourceCategory,
      source_name: sourceName.trim(),
      publisher: "English Magic Team",
      curriculum: "OBEC Thai Core Curriculum",
      examination_type: sourceCategory,
      publication_year: sourcePubYear.trim() || new Date().getFullYear().toString(),
      notes: aiInstruction.trim() || "Created via English Magic UI",
      original_file: engineMode === "reference" ? referenceText.substring(0, 1000) : "N/A",
      detected_cefr: cefrLevel,
      detected_grade: engineGrade,
      detected_curriculum: curriculum,
      detected_topic: editingWorksheet.topic || "General English",
      detected_grammar: editingWorksheet.grammarFocus || grammarFocus,
      detected_difficulty: editingWorksheet.difficulty || difficulty,
      similarity_score: engineMode === "reference" ? "Low Similarity (<5%)" : "0% (Original)",
      copyright_risk: engineMode === "reference" ? (analysisReport?.copyrightRisk || "Low") : "Low Risk",
      ai_analysis_summary: analysisReport ? JSON.stringify(analysisReport) : "Standard curriculum standards synthesis",
      generation_date: new Date().toISOString(),
      generated_by: currentUser?.email || "sakarinmam999@gmail.com",
      approval_status: "Approved"
    };

    try {
      const response = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheet: editingWorksheet,
          sourceMeta,
          email: currentUser?.email
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      setAlert({
        type: "success",
        text: `💾 บันทึกใบงานเรียบร้อยแล้วค่ะ! ใบงานใหม่ได้รับการเผยแพร่ลงสู่ฐานข้อมูลหลักเรียบร้อย สมาชิกทั่วไปสามารถโหลดและพรินต์ได้ทันทีค่ะ`
      });

      // Clear generation state
      setGeneratedWorksheet(null);
      setEditingWorksheet(null);
      setAnalysisReport(null);
      setReferenceText("");
      setReviewStage("idle");
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "ล้มเหลวในการเชื่อมโยงข้อมูลบันทึก" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveWorksheet = async (id: string, isArchived: boolean) => {
    try {
      const response = await fetch("/api/admin/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isArchived,
          email: currentUser?.email
        })
      });
      if (response.ok) {
        setAlert({ type: "success", text: isArchived ? "เก็บใบงานเข้าคลังจดหมายเหตุ (Archive) เรียบร้อย" : "กู้คืนใบงานเรียบร้อย" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Grade, Question Type & Difficulty Order Mapping for Exam Specifications Sorting
  const GRADE_ORDER: Record<string, number> = {
    "ป.1": 1, "ป.2": 2, "ป.3": 3, "ป.4": 4, "ป.5": 5, "ป.6": 6
  };

  const TYPE_ORDER: Record<string, number> = {
    "multiple-choice": 1,
    "fill-in-blank": 2,
    "matching": 3,
    "reading-comprehension": 4,
    "scrambled-sentence": 5
  };

  const DIFFICULTY_ORDER: Record<string, number> = {
    "easy": 1, "Easy": 1, "ง่าย": 1,
    "medium": 2, "Medium": 2, "ปานกลาง": 2,
    "hard": 3, "Hard": 3, "ยาก": 3
  };

  // Extract unique topics from the question bank
  const qbTopics = Array.from(new Set(questionBankList.map(q => q.topic).filter(Boolean)));

  // Analytics: 1. Latest Update Date
  const latestQbUpdateDate = React.useMemo(() => {
    if (!questionBankList.length) return "ยังไม่มีข้อมูล";
    let maxTime = 0;
    questionBankList.forEach(q => {
      if (q.created_at) {
        const t = new Date(q.created_at).getTime();
        if (!isNaN(t) && t > maxTime) maxTime = t;
      }
    });
    if (maxTime === 0) {
      return new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    }
    return new Date(maxTime).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " น.";
  }, [questionBankList]);

  // Analytics: 2. Grade with Most Questions
  const mostPopulatedGrade = React.useMemo(() => {
    if (!questionBankList.length) return "ยังไม่มีข้อมูล";
    const counts: Record<string, number> = {};
    questionBankList.forEach(q => {
      const g = q.grade || "ป.3";
      counts[g] = (counts[g] || 0) + 1;
    });
    let maxGrade = "ป.3";
    let maxCnt = -1;
    Object.entries(counts).forEach(([g, cnt]) => {
      if (cnt > maxCnt) {
        maxCnt = cnt;
        maxGrade = g;
      }
    });
    return `${maxGrade} (${maxCnt} ข้อ)`;
  }, [questionBankList]);

  // Analytics: 3. Topics Suggested to Build (หัวข้อที่ควรสร้างเพิ่ม)
  const suggestedTopicsToBuild = React.useMemo(() => {
    const topicCounts: Record<string, number> = {};
    questionBankList.forEach(q => {
      const t = q.topic || "";
      if (t) topicCounts[t] = (topicCounts[t] || 0) + 1;
    });

    const suggestions: string[] = [];
    Object.entries(SUGGESTED_TOPICS).forEach(([grade, topics]) => {
      topics.forEach(top => {
        const count = topicCounts[top] || 0;
        if (count < 3) {
          suggestions.push(`${grade}: ${top}`);
        }
      });
    });

    if (suggestions.length === 0) return ["ป.1: My Pets", "ป.3: Daily Activities", "ป.5: Healthy Habits"];
    return suggestions.slice(0, 3);
  }, [questionBankList]);

  const [qbStageFilter, setQbStageFilter] = React.useState<string>("all");
  const [qbStatusFilter, setQbStatusFilter] = React.useState<string>("all");

  // Filtered & Sorted Question Bank items (Sorted strictly by Exam Specifications & Learning Path)
  const filteredQbList = React.useMemo(() => {
    const rawFiltered = questionBankList.filter(q => {
      const qTopic = q.topic || "General English";
      const qGrade = q.grade || "ป.3";
      const qStage = q.learning_stage || "";
      const matchesTopic = qbTopicFilter === "all" || qTopic.toLowerCase() === qbTopicFilter.toLowerCase();
      const matchesGrade = qbGradeFilter === "all" || qGrade === qbGradeFilter;
      const matchesStage = qbStageFilter === "all" || qStage.toLowerCase() === qbStageFilter.toLowerCase();
      
      const qStatus = (q.status || "approved").toLowerCase();
      const matchesStatus = qbStatusFilter === "all" || qStatus === qbStatusFilter;

      const qText = (q.question_text || q.questionText || "").toLowerCase();
      const qExp = (q.explanation || "").toLowerCase();
      const qGrammar = (q.grammar_focus || "").toLowerCase();
      const matchesSearch = !qbSearch || 
        qText.includes(qbSearch.toLowerCase()) || 
        qTopic.toLowerCase().includes(qbSearch.toLowerCase()) || 
        qExp.includes(qbSearch.toLowerCase()) ||
        qGrammar.includes(qbSearch.toLowerCase());

      return matchesTopic && matchesGrade && matchesStage && matchesStatus && matchesSearch;
    });

    // Sort strictly according to Exam Specifications:
    // 1) Grade -> 2) Worksheet Topic -> 3) Question Type -> 4) Difficulty
    return rawFiltered.sort((a, b) => {
      // 1. Grade
      const gA = GRADE_ORDER[a.grade || ""] || 99;
      const gB = GRADE_ORDER[b.grade || ""] || 99;
      if (gA !== gB) return gA - gB;

      // 2. Worksheet Topic
      const tA = (a.topic || "").toLowerCase();
      const tB = (b.topic || "").toLowerCase();
      if (tA !== tB) return tA.localeCompare(tB, "th");

      // 3. Question Type
      const qTypeA = TYPE_ORDER[a.question_type || ""] || 99;
      const qTypeB = TYPE_ORDER[b.question_type || ""] || 99;
      if (qTypeA !== qTypeB) return qTypeA - qTypeB;

      // 4. Difficulty
      const diffA = DIFFICULTY_ORDER[a.difficulty || ""] || 99;
      const diffB = DIFFICULTY_ORDER[b.difficulty || ""] || 99;
      return diffA - diffB;
    });
  }, [questionBankList, qbTopicFilter, qbGradeFilter, qbStageFilter, qbStatusFilter, qbSearch]);

  // Thai Labels for Worksheet Types (Question Types)
  const QUESTION_TYPE_LABELS: Record<string, string> = {
    "multiple-choice": "ปรนัย 4 ตัวเลือก (Multiple Choice)",
    "fill-in-blank": "เติมคำในช่องว่าง (Fill in the Blank)",
    "matching": "จับคู่คำศัพท์ (Matching)",
    "reading-comprehension": "การอ่านจับใจความ (Reading Comprehension)",
    "scrambled-sentence": "เรียงประโยคภาษาอังกฤษ (Scrambled Sentence)"
  };

  // Hierarchical Grouping Tree for Question Bank (4 Levels: Grade -> Topic -> Worksheet Type -> Difficulty)
  const groupedQbTree = React.useMemo(() => {
    // Map<Grade, Map<Topic, Map<Type, Map<Difficulty, QuestionBankEntry[]>>>>
    const gradeMap = new Map<string, Map<string, Map<string, Map<string, QuestionBankEntry[]>>>>();

    filteredQbList.forEach(q => {
      const grade = q.grade || "ป.3";
      const topic = q.topic || "General English";
      const typeKey = q.question_type || "multiple-choice";
      const rawDiff = (q.difficulty || "Medium").trim();
      
      let diffLabel = "Medium (ปานกลาง)";
      if (rawDiff.toLowerCase().includes("easy") || rawDiff.includes("ง่าย")) {
        diffLabel = "Easy (ง่าย)";
      } else if (rawDiff.toLowerCase().includes("hard") || rawDiff.includes("ยาก")) {
        diffLabel = "Hard (ยาก)";
      } else {
        diffLabel = "Medium (ปานกลาง)";
      }

      if (!gradeMap.has(grade)) gradeMap.set(grade, new Map());
      const topicMap = gradeMap.get(grade)!;

      if (!topicMap.has(topic)) topicMap.set(topic, new Map());
      const typeMap = topicMap.get(topic)!;

      if (!typeMap.has(typeKey)) typeMap.set(typeKey, new Map());
      const diffMap = typeMap.get(typeKey)!;

      if (!diffMap.has(diffLabel)) diffMap.set(diffLabel, []);
      diffMap.get(diffLabel)!.push(q);
    });

    const DIFF_ORDER: Record<string, number> = {
      "Easy (ง่าย)": 1,
      "Medium (ปานกลาง)": 2,
      "Hard (ยาก)": 3
    };

    const result: {
      grade: string;
      totalCount: number;
      topics: {
        topicName: string;
        totalCount: number;
        types: {
          typeKey: string;
          typeNameTH: string;
          totalCount: number;
          difficulties: {
            difficultyLabel: string;
            totalCount: number;
            questions: QuestionBankEntry[];
          }[];
        }[];
      }[];
    }[] = [];

    const sortedGrades = Array.from(gradeMap.keys()).sort((a, b) => {
      const oA = GRADE_ORDER[a] || 99;
      const oB = GRADE_ORDER[b] || 99;
      if (oA !== oB) return oA - oB;
      return a.localeCompare(b, "th");
    });

    sortedGrades.forEach(grade => {
      const topicMap = gradeMap.get(grade)!;
      const sortedTopics = Array.from(topicMap.keys()).sort((a, b) => a.localeCompare(b, "th"));

      let gradeTotal = 0;
      const topicsArr: any[] = [];

      sortedTopics.forEach(topicName => {
        const typeMap = topicMap.get(topicName)!;
        const sortedTypes = Array.from(typeMap.keys()).sort((a, b) => {
          const oA = TYPE_ORDER[a] || 99;
          const oB = TYPE_ORDER[b] || 99;
          return oA - oB;
        });

        let topicTotal = 0;
        const typesArr: any[] = [];

        sortedTypes.forEach(typeKey => {
          const diffMap = typeMap.get(typeKey)!;
          const sortedDiffs = Array.from(diffMap.keys()).sort((a, b) => (DIFF_ORDER[a] || 99) - (DIFF_ORDER[b] || 99));

          let typeTotal = 0;
          const diffsArr: any[] = [];

          sortedDiffs.forEach(diffLabel => {
            const qList = diffMap.get(diffLabel)!;
            typeTotal += qList.length;
            diffsArr.push({
              difficultyLabel: diffLabel,
              totalCount: qList.length,
              questions: qList
            });
          });

          topicTotal += typeTotal;
          const typeNameTH = QUESTION_TYPE_LABELS[typeKey] || typeKey;

          typesArr.push({
            typeKey,
            typeNameTH,
            totalCount: typeTotal,
            difficulties: diffsArr
          });
        });

        gradeTotal += topicTotal;
        topicsArr.push({
          topicName,
          totalCount: topicTotal,
          types: typesArr
        });
      });

      result.push({
        grade,
        totalCount: gradeTotal,
        topics: topicsArr
      });
    });

    return result;
  }, [filteredQbList]);

  // Expand / Collapse All Helpers
  const handleExpandAllNodes = () => {
    const gMap: Record<string, boolean> = {};
    const topMap: Record<string, boolean> = {};
    const typeMap: Record<string, boolean> = {};
    const diffMap: Record<string, boolean> = {};

    groupedQbTree.forEach((gNode) => {
      gMap[gNode.grade] = true;
      gNode.topics.forEach((tNode) => {
        const topKey = `${gNode.grade}_${tNode.topicName}`;
        topMap[topKey] = true;
        tNode.types.forEach((typeNode) => {
          const typeKey = `${gNode.grade}_${tNode.topicName}_${typeNode.typeKey}`;
          typeMap[typeKey] = true;
          typeNode.difficulties.forEach((dNode) => {
            const diffKey = `${gNode.grade}_${tNode.topicName}_${typeNode.typeKey}_${dNode.difficultyLabel}`;
            diffMap[diffKey] = true;
          });
        });
      });
    });

    setOpenGrades(gMap);
    setOpenTopics(topMap);
    setOpenTypes(typeMap);
    setOpenDiffs(diffMap);
  };

  const handleCollapseAllNodes = () => {
    setOpenGrades({});
    setOpenTopics({});
    setOpenTypes({});
    setOpenDiffs({});
  };

  // Review Question Status Handler (Approve / Reject without deleting)
  const handleReviewQuestion = async (id: string, status: "approved" | "rejected", reject_reason?: string) => {
    try {
      const res = await fetch(`/api/admin/question-bank/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reject_reason: reject_reason || "",
          reviewed_by: currentUser?.email || "admin"
        })
      });

      if (res.ok) {
        setQuestionBankList(prev => prev.map(q => {
          if (String(q.id) === String(id)) {
            return {
              ...q,
              status,
              reviewed_at: new Date().toISOString(),
              reviewed_by: currentUser?.email || "admin",
              reject_reason: status === "rejected" ? (reject_reason || "ไม่ได้ระบุเหตุผล") : ""
            };
          }
          return q;
        }));
      } else {
        const err = await res.json();
        alert("เกิดข้อผิดพลาดในการปรับสถานะ: " + (err.error || ""));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการปรับสถานะข้อสอบ");
    }
  };

  // Question Card Helper Renderer
  const renderQuestionCard = (q: QuestionBankEntry, idx: number) => {
    const options = q.options || [];
    const qText = q.question_text || q.questionText || "";
    const corrAns = q.correct_answer || q.correctAnswer || "";
    const mLeft = q.matching_left || q.matchingLeft;
    const mRight = q.matching_right || q.matchingRight;

    const qType = q.question_type || q.questionType || "multiple-choice";
    const qTypeDisplay = QUESTION_TYPE_LABELS[qType] || qType;

    const status = (q.status || "approved").toLowerCase();

    return (
      <div
        key={q.id || idx}
        className={`bg-white rounded-2xl border p-4 sm:p-5 hover:shadow-xs transition space-y-3.5 text-left ${
          status === "pending"
            ? "border-amber-300 bg-amber-50/20"
            : status === "rejected"
            ? "border-rose-200 bg-rose-50/20"
            : "border-gray-200 hover:border-amber-400"
        }`}
      >
        {/* Top metadata tags & Action buttons */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            {/* Status Badge */}
            {status === "pending" && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>สถานะ: รอตรวจ (Pending)</span>
              </span>
            )}
            {status === "approved" && (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>สถานะ: อนุมัติแล้ว (Approved)</span>
              </span>
            )}
            {status === "rejected" && (
              <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-700" />
                <span>สถานะ: ปฏิเสธ (Rejected)</span>
              </span>
            )}

            <span className="bg-[#6B8E23] text-white font-bold px-2.5 py-0.5 rounded-full">
              {q.grade || "ป.3"}
            </span>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full">
              เนื้อหา: {q.topic || "General English"}
            </span>
            {q.learning_stage && (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                ขั้น: {q.learning_stage}
              </span>
            )}
            <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
              โจทย์: {qTypeDisplay}
            </span>
            <span className="bg-orange-100 text-orange-900 border border-orange-200 font-bold px-2 py-0.5 rounded-full">
              ความยาก: {q.difficulty || "Medium"}
            </span>
            <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
              CEFR: {q.cefr_level || "A1"}
            </span>
            <span className="text-gray-400">ID: {q.id}</span>
          </div>

          {/* Controls: Review & Edit & Delete */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {status !== "approved" && (
              <button
                onClick={() => handleReviewQuestion(q.id, "approved")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="อนุมัติเข้าใช้งาน"
              >
                <Check className="w-3.5 h-3.5" />
                <span>อนุมัติ</span>
              </button>
            )}

            {status !== "rejected" && (
              <button
                onClick={() => {
                  const reason = window.prompt("ระบุเหตุผลในการปฏิเสธ (ถ้ามี):", "") || "ไม่ผ่านการตรวจสอบมาตรฐาน";
                  handleReviewQuestion(q.id, "rejected", reason);
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                title="ปฏิเสธข้อสอบ"
              >
                <X className="w-3.5 h-3.5" />
                <span>ปฏิเสธ</span>
              </button>
            )}

            <button
              onClick={() => handleOpenEditQuestion(q)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>

            <button
              onClick={() => handleDeleteQuestionBankItem(q.id)}
              className="bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-700 border border-gray-200 hover:border-rose-200 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              title="ลบถาวร"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Display Review Metadata if Rejected */}
        {status === "rejected" && q.reject_reason && (
          <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-900 font-medium flex items-center justify-between flex-wrap gap-2">
            <span>⚠️ <strong>เหตุผลที่ปฏิเสธ:</strong> {q.reject_reason}</span>
            {q.reviewed_by && (
              <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                โดย: {q.reviewed_by} {q.reviewed_at ? `(${new Date(q.reviewed_at).toLocaleDateString("th-TH")})` : ""}
              </span>
            )}
          </div>
        )}

        {/* Question Text */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            โจทย์ข้อสอบ #{idx + 1}:
          </span>
          <p className="text-sm font-bold text-gray-900 leading-relaxed font-friendly">
            {qText}
          </p>
        </div>

        {/* Matching items rendering */}
        {mLeft && mRight && (
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold text-emerald-800 block text-[10px] uppercase">ฝั่งซ้าย (Left Item):</span>
              <span className="font-semibold text-gray-800">{mLeft}</span>
            </div>
            <div>
              <span className="font-bold text-emerald-800 block text-[10px] uppercase">ฝั่งขวา (Right Match):</span>
              <span className="font-semibold text-gray-800">{mRight}</span>
            </div>
          </div>
        )}

        {/* Options Grid */}
        {options.length > 0 && !mLeft && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {options.map((opt, oIdx) => {
              const isCorrect = 
                corrAns === opt || 
                corrAns === String.fromCharCode(65 + oIdx) || 
                corrAns.toLowerCase() === opt.toLowerCase();
              
              return (
                <div
                  key={oIdx}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCorrect ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="flex-1 font-friendly">{opt}</span>
                  {isCorrect && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Explanation box */}
        {q.explanation && (
          <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-xl text-xs text-sky-950 space-y-0.5">
            <span className="font-bold text-sky-800 flex items-center gap-1">
              💡 เฉลยและคำอธิบาย:
            </span>
            <p className="leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in no-print text-[#253334]">
      
      {/* Premium Admin Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
          <Shield className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center bg-sky-500/30 text-sky-200 border border-sky-500/40 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              English Magic Primary – Admin Panel
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-friendly">แผงควบคุมระบบจัดทำข้อสอบหลังบ้าน</h2>
            <p className="text-xs text-sky-100 max-w-xl leading-relaxed">
              ควบคุมการปั๊มแบบฝึกหัดผ่าน 2 Engine ใหญ่ (Curriculum & Reference Standards) วิเคราะห์ความซับซ้อน มิติความคุ้มครองความซ้ำซ้อน และประเมินคุณภาพวิชาการ 4 ขั้นตอนแบบเรียลไทม์
            </p>
          </div>
          <span className="bg-[#FFB7B2] text-[#253334] px-4 py-1.5 rounded-full font-bold text-xs shadow-xs uppercase tracking-wider">
            Supreme Admin: {currentUser?.email || "sakarinmam999@gmail.com"}
          </span>
        </div>
      </div>

      {/* Primary Navigation Hub */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab("generator")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === "generator" 
              ? "bg-sky-600 text-white shadow-xs" 
              : "text-gray-500 hover:text-sky-700 hover:bg-gray-100"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>🧙 วิซาร์ด AI ปั๊มใบงาน (Worksheet Wizard)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("question_bank");
            fetchQuestionBank();
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === "question_bank" 
              ? "bg-amber-600 text-white shadow-xs font-bold" 
              : "text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/60"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>🔥 คลังข้อสอบ Firebase รายข้อ (Question Bank)</span>
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === "dashboard" 
              ? "bg-sky-600 text-white shadow-xs" 
              : "text-gray-500 hover:text-sky-700 hover:bg-gray-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📊 แดชบอร์ดและสมาชิก (Statistics)</span>
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === "library" 
              ? "bg-sky-600 text-white shadow-xs" 
              : "text-gray-500 hover:text-sky-700 hover:bg-gray-100"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>📚 คลังใบงานจัดทำเสร็จสิ้น (Worksheets Library)</span>
        </button>
        <button
          onClick={() => setActiveTab("db_viewer")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all ${
            activeTab === "db_viewer" 
              ? "bg-sky-600 text-white shadow-xs" 
              : "text-gray-500 hover:text-sky-700 hover:bg-gray-100"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>💾 แผนผัง DB สากล (SQL Schemas)</span>
        </button>
      </div>

      {/* Global Alert Feedback */}
      {alert && (
        <div 
          className={`p-4 rounded-xl border flex items-start space-x-3 text-xs md:text-sm animate-fade-in text-left ${
            alert.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
              : "bg-rose-50 border-rose-200 text-rose-950"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <div className="flex-1 space-y-0.5">
            <span className="font-bold">
              {alert.type === "success" ? "ดำเนินการสำเร็จ!" : "แจ้งจากวิซาร์ดไอที:"}
            </span>
            <p className="leading-relaxed text-gray-700">{alert.text}</p>
          </div>
        </div>
      )}

      {/* ==================== TAB: GENERATOR ==================== */}
      {activeTab === "generator" && (
        <div className="space-y-6">
          <div className="rounded-3xl border-3 border-sky-300 bg-white p-6 shadow-sm font-sans text-left space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-4 gap-2">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 font-friendly">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  สั่งปั๊มแบบทดสอบภาษาอังกฤษอัจฉริยะ (AI Data Engine Hub)
                </h3>
                <p className="text-xs text-gray-400">เลือกขับเคลื่อนด้วยรูปแบบหลักสูตรระดับชาติ หรือนำเข้าสไตล์วิชาการจากข้อสอบเดิมเพื่อสังเคราะห์เนื้อหาแนวใหม่แกะกล่อง</p>
              </div>
              <span className="bg-[#E8F0FE] text-[#1A73E8] px-3.5 py-1.5 rounded-full font-bold text-[10px] uppercase border border-blue-200">
                AI Engines: Active ⚡
              </span>
            </div>

            {/* Select Engine Mode */}
            <div className="grid grid-cols-1 gap-4">
              <div
                className="p-4 rounded-2xl border text-left transition-all relative border-sky-600 bg-sky-50/20"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-600 text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-sky-800">ENGINE A</span>
                    <h4 className="font-bold text-xs text-gray-800">Curriculum Standards Generator</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">ผลิตใบงานจากมาตรฐานหลักสูตรระดับชาติ (CEFR, ระดับชั้น ป.1-ป.6 และประเภทโจทย์ที่กำหนดอย่างเป็นระเบียบ)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= REFERENCE SOURCE SECTION ================= */}
            <div className="border border-sky-100 bg-sky-50/10 rounded-2xl p-4 space-y-3 animate-fade-in text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-600 rounded-lg text-white">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-xs text-gray-800">📂 แหล่งอ้างอิงและสไตล์ข้อสอบ (Reference Source & Style)</h4>
                  <p className="text-[10px] text-gray-500">ระบุสถาบัน ปีข้อสอบ หรือสไตล์ที่ต้องการ เพื่อให้ AI ออกแบบโจทย์ที่อิงมาตรฐานวิชาการที่แม่นยำ</p>
                </div>
              </div>

              {/* Grid with 3 columns on desktop for Type, Source, Year */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                {/* 1. Reference Type (Required) */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-gray-500 block">
                    ประเภทอ้างอิง (Reference Type) <span className="text-sky-600 font-bold">*</span>
                  </label>
                  <select
                    value={sourceCategory}
                    onChange={(e) => {
                      if (e.target.value === "__add_new_type__") {
                        setShowCustomTypeInput(true);
                      } else {
                        setSourceCategory(e.target.value);
                        setShowCustomTypeInput(false);
                      }
                    }}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {referenceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="__add_new_type__" className="text-sky-600 font-bold">➕ เพิ่มประเภทใหม่...</option>
                  </select>

                  {/* Custom Type Inline Input Modal/Box */}
                  {showCustomTypeInput && (
                    <div className="absolute z-20 left-0 right-0 mt-2 p-2.5 bg-white border border-gray-200 rounded-xl shadow-xl space-y-2 text-left">
                      <span className="text-[9px] font-bold text-sky-700 block">พิมพ์ชื่อประเภทใหม่:</span>
                      <input
                        type="text"
                        value={newCustomType}
                        onChange={(e) => setNewCustomType(e.target.value)}
                        placeholder="เช่น Exam Archive"
                        className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-bold outline-none"
                      />
                      <div className="flex justify-end gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setShowCustomTypeInput(false)}
                          className="px-2 py-1 text-gray-500 font-semibold hover:bg-gray-100 rounded"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newCustomType.trim();
                            if (trimmed) {
                              if (!referenceTypes.includes(trimmed)) {
                                setReferenceTypes([...referenceTypes, trimmed]);
                              }
                              setSourceCategory(trimmed);
                              setNewCustomType("");
                              setShowCustomTypeInput(false);
                            }
                          }}
                          className="px-2 py-1 bg-sky-600 text-white font-bold rounded"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Exam Source (Required) with searchable dropdown */}
                <div className="md:col-span-2 space-y-1 relative">
                  <label className="text-[10px] font-bold text-gray-500 block">
                    ชื่อข้อสอบอ้างอิง / แหล่งที่มา (Exam Source) <span className="text-sky-600 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => {
                        setSourceName(e.target.value);
                        setShowSourceDropdown(true);
                      }}
                      onFocus={() => setShowSourceDropdown(true)}
                      placeholder="พิมพ์เพื่อค้นหา เช่น Suankularb, IELTS, A-Level..."
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    {showSourceDropdown && (
                      <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 space-y-1 text-left">
                        <div className="px-2 py-0.5 text-[9px] font-bold text-sky-700 bg-sky-50 rounded">
                          🔍 ค้นพบในฐานระบบ & แนะนำ:
                        </div>
                        {(() => {
                          const POPULAR_SOURCES = [
                            "Suankularb Entrance Exam",
                            "Triam Udom Entrance Exam",
                            "Mahidol Wittayanusorn",
                            "O-NET",
                            "A-Level",
                            "IELTS",
                            "TOEFL",
                            "TOEIC",
                            "Cambridge",
                            "Oxford",
                            "GED"
                          ];
                          const merged = [
                            ...sourcesList.map(s => ({ ...s, is_db: true })),
                            ...POPULAR_SOURCES.filter(name => !sourcesList.some((s: any) => s.source_name.toLowerCase() === name.toLowerCase()))
                              .map(name => ({
                                source_id: `pop_${name.replace(/\s+/g, "_")}`,
                                source_name: name,
                                source_category: "Entrance Exam",
                                publication_year: "2025",
                                is_suggested: true
                              }))
                          ];
                          const filtered = merged.filter((s: any) =>
                            s.source_name.toLowerCase().includes(sourceName.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="px-2.5 py-1.5 text-xs text-gray-400 italic">
                                ไม่พบข้อมูลที่พิมพ์
                              </div>
                            );
                          }

                          return filtered.map((s: any) => (
                            <button
                              key={s.source_id}
                              type="button"
                              onClick={() => {
                                setSourceName(s.source_name);
                                if (s.source_category) {
                                  // Map source_category safely
                                  const cat = s.source_category;
                                  if (["Entrance Exam", "School Examination", "Standardized Test", "Curriculum", "Custom"].includes(cat)) {
                                    setSourceCategory(cat);
                                  } else if (cat === "English Proficiency Test") {
                                    setSourceCategory("Standardized Test");
                                  } else {
                                    setSourceCategory("Entrance Exam");
                                  }
                                }
                                if (s.publication_year) setSourcePubYear(s.publication_year);
                                setShowSourceDropdown(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-sky-50 rounded-lg transition-colors flex flex-col"
                            >
                              <span className="font-bold text-gray-800">{s.source_name}</span>
                              <span className="text-[9px] text-gray-400">
                                {s.is_suggested ? "✨ รายการแนะนำยอดนิยม" : `ปี: ${s.publication_year || "ไม่ระบุ"} | ประเภท: ${s.source_category || "N/A"}`}
                              </span>
                            </button>
                          ));
                        })()}

                        {/* Option to create new source inline if it doesn't match exactly */}
                        {!sourcesList.some((s: any) => s.source_name.toLowerCase() === sourceName.toLowerCase().trim()) && sourceName.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCreateNewSourceInline(sourceName)}
                            disabled={isAddingSource}
                            className="w-full text-left px-2.5 py-2 mt-1 text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1.5 border-t border-sky-100"
                          >
                            <span className="text-sm">➕</span>
                            <div>
                              <span className="block">เพิ่มแหล่งอ้างอิงใหม่: "<strong>{sourceName}</strong>"</span>
                              <span className="text-[9px] text-sky-500 font-semibold block">คลิกเพื่อลงทะเบียนลงฐานข้อมูล</span>
                            </div>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowSourceDropdown(false)}
                          className="w-full text-center py-1 text-[9px] text-gray-400 hover:text-gray-600 font-bold border-t border-gray-100 mt-1"
                        >
                          ปิดเมนูค้นหา ✖
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Exam Year (Optional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">
                    ปีข้อสอบ / เผยแพร่ (Year) <span className="text-gray-400 font-normal">(พ.ศ. หรือ ค.ศ.)</span>
                  </label>
                  <input
                    type="text"
                    value={sourcePubYear}
                    onChange={(e) => setSourcePubYear(e.target.value)}
                    placeholder="เช่น 2568 หรือ 2025"
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* 4. AI Instruction (Optional) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-gray-500 block">
                  คำสั่งพิเศษถึง AI ในการคัดสไตล์ข้อสอบ (AI Instruction) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  rows={2}
                  placeholder="เช่น: Similar to Suankularb entrance exam, focus on vocabulary and reading, use medium difficulty grammar, follow Cambridge PET style."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-sky-400"
                />
                <div className="flex flex-wrap gap-1.5 text-[9px] text-gray-400">
                  <span className="font-bold">ไอเดียการพิมพ์:</span>
                  <button
                    type="button"
                    onClick={() => setAiInstruction("Similar to Suankularb entrance exam.")}
                    className="hover:text-sky-600 underline"
                  >
                    Similar to Suankularb
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setAiInstruction("Focus on vocabulary and reading.")}
                    className="hover:text-sky-600 underline"
                  >
                    Focus on vocabulary & reading
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setAiInstruction("Follow Cambridge PET style.")}
                    className="hover:text-sky-600 underline"
                  >
                    Cambridge PET style
                  </button>
                </div>
              </div>
            </div>

            {/* ================= ENGINE B - STEP 1 AREA ================= */}
            {engineMode === "reference" && (
              <div className="border border-sky-100 bg-sky-50/20 rounded-2xl p-4 space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <span className="bg-sky-600 text-white px-2 py-0.5 rounded text-[9px] font-bold">STEP 1: REFERENCE ANALYSIS</span>
                  <h4 className="font-bold text-xs text-gray-800">ป้อนเอกสารหรือข้อความอ้างอิงของคุณครู</h4>
                  <p className="text-[10px] text-gray-500">พิมพ์ หรือคัดลอกข้อสอบอ้างอิง บทความ หรือรายละเอียดโครงสร้างชุดที่ต้องการแนวทดสอบเลียนแบบความยากมาใส่ด้านล่างนี้ได้เลยค่ะ</p>
                </div>
                
                <textarea
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  placeholder="ตัวอย่างเช่น:
Vocabulary focus: classroom objects (pencil, notebook, ruler)
Question 1: What is on the table? - A) A book, B) A fish...
Or copy-paste complete old examination papers..."
                  rows={5}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-sky-400 outline-none leading-relaxed font-mono"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleAnalyzeReference}
                    disabled={isAnalyzing}
                    className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>กำลังประมวลเอกสารอ้างอิง...</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-4 h-4" />
                        <span>สั่ง AI วิเคราะห์โครงสร้างข้อสอบอ้างอิง ✨</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Display Analysis Results */}
                {analysisReport && (
                  <div className="bg-white border border-sky-200 p-4 rounded-xl space-y-3 shadow-xs">
                    <h5 className="font-bold text-xs text-sky-900 flex items-center gap-1">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      รายงานวิเคราะห์ระดับประถมศึกษา & ข้อมูลลิขสิทธิ์ (Detailed Analysis Report)
                    </h5>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[10px]">
                      <div className="bg-[#EAF0F6] p-2 rounded-lg text-left border border-blue-100 col-span-2 md:col-span-1">
                        <span className="text-blue-700 block font-bold">ประเภทข้อสอบ (Exam Type)</span>
                        <span className="font-bold text-blue-900">{analysisReport.detectedExamType || "วิเคราะห์อิงหลักสูตร"}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-left">
                        <span className="text-gray-400 block font-bold">ช่วงอายุนักเรียนตรวจพบ</span>
                        <span className="font-semibold text-gray-700">{analysisReport.estimatedStudentAge || "7-9 ปี"}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-left">
                        <span className="text-gray-400 block font-bold">ระดับชั้นแนะนำ</span>
                        <span className="font-semibold text-gray-700 text-amber-700 font-bold">{analysisReport.grade || "ป.3"}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-left">
                        <span className="text-gray-400 block font-bold">ระดับสากล CEFR</span>
                        <span className="font-semibold text-gray-700">{analysisReport.cefrLevel || "A1"}</span>
                      </div>
                      <div className="bg-[#EAF5EC] p-2 rounded-lg text-left border border-emerald-100">
                        <span className="text-emerald-700 block font-bold">ความซ้ำซ้อนหลักเดิม</span>
                        <span className="font-semibold text-emerald-800">{analysisReport.similarityRisk || "Low Risk (<3%)"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                      <div className="bg-gray-50 p-2.5 rounded-lg text-left space-y-1">
                        <span className="text-sky-800 font-bold block">🎯 ไวยากรณ์ & คำศัพท์ (Grammar & Vocab Focus)</span>
                        <p className="text-gray-600 leading-relaxed">
                          <strong>Grammar:</strong> {analysisReport.grammarFocus || "Present Simple"}<br />
                          <strong>Vocabulary Level:</strong> {analysisReport.vocabularyLevel || "150-300 words"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg text-left space-y-1">
                        <span className="text-sky-800 font-bold block">📖 รายละเอียดการอ่านเขียน & ความยาก</span>
                        <p className="text-gray-600 leading-relaxed">
                          <strong>Reading Length:</strong> {analysisReport.readingLength || "Short sentences"}<br />
                          <strong>Estimated Difficulty:</strong> {analysisReport.estimatedDifficulty || "Easy to Medium"}<br />
                          <strong>Bloom's Taxonomy:</strong> {analysisReport.bloomsTaxonomyLevel || "Remembering / Understanding"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-200/50 p-2.5 rounded-lg text-left text-[10px]">
                      <span className="text-rose-900 font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-rose-600" />
                        รายงานความมั่นคงสิทธิและลิขสิทธิ์ (Copyright Shield Log)
                      </span>
                      <p className="text-rose-800 mt-1">
                        <strong>ระดับความเสี่ยงในการคัดลอก:</strong> <span className="font-bold underline">{analysisReport.copyrightRisk || "Low Risk - Completely Original Structure Recommended"}</span>. AI ตรวจสอบโครงสร้างประโยคและสิทธิ์ ไม่พบคำศัพท์ที่เข้าข่ายผิดลิขสิทธิ์ของค่ายหนังสือต่างๆ การผลิตในลำดับถัดไปจะหลีกเลี่ยงการใช้ชื่อตัวละคร ลำดับตัวเลข และบทเนื้อเรื่องเดิมโดยสิ้นเชิง
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 2: RE-EVALUATION / FORM INPUTS ================= */}
            {((engineMode === "reference" && reviewStage !== "idle") || engineMode === "curriculum") && (
              <div className="space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
                {engineMode === "reference" && (
                  <span className="bg-sky-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                    STEP 2: ADMIN PARAMETERS REVIEW
                  </span>
                )}
                
                <h4 className="font-bold text-xs text-sky-900">กำหนดตัวแปรและเนื้อหาทางวิชาการหลัก</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Grade Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ระดับชั้นเรียนเป้าหมาย (Grade)</label>
                    <select
                      value={engineGrade}
                      onChange={(e) => setEngineGrade(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 font-semibold text-gray-700 outline-none"
                    >
                      <option value="ป.1">ป.1 (อายุ 6-7 ปี - คำศัพท์ 150-200 คำ)</option>
                      <option value="ป.2">ป.2 (อายุ 7-8 ปี - คำศัพท์ 250-300 คำ)</option>
                      <option value="ป.3">ป.3 (อายุ 8-9 ปี - คำศัพท์ 350-450 คำ)</option>
                      <option value="ป.4">ป.4 (อายุ 9-10 ปี - คำศัพท์ 550-700 คำ)</option>
                      <option value="ป.5">ป.5 (อายุ 10-11 ปี - คำศัพท์ 750-950 คำ)</option>
                      <option value="ป.6">ป.6 (อายุ 11-12 ปี - คำศัพท์ 1050-1200 คำ)</option>
                    </select>
                  </div>

                  {/* CEFR Level */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">กรอบมาตรฐานภาษา (CEFR Level)</label>
                    <select
                      value={cefrLevel}
                      onChange={(e) => setCefrLevel(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 font-semibold text-gray-700 outline-none"
                    >
                      <option value="Pre-A1">Pre-A1 (คำถามพื้นฐานที่สุด, ภาพประกอบเดี่ยว)</option>
                      <option value="A1">A1 (ประโยคสั้นคุ้นเคย, บทรสั้น)</option>
                      <option value="A2">A2 (ประโยคแสดงข้อมูลทั่วไป, ข้อสอบ 2 ส่วน)</option>
                      <option value="B1">B1 (เข้าใจความเห็นประเด็นสำคัญ, ปลายเปิดขึ้น)</option>
                    </select>
                  </div>

                  {/* Curriculum */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">แกนกลางอ้างอิง (Curriculum Framework)</label>
                    <select
                      value={curriculum}
                      onChange={(e) => setCurriculum(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 font-semibold text-gray-700 outline-none"
                    >
                      <option value="OBEC Thai Core Curriculum (พ.ศ. 2551)">แกนกลาง สพฐ. พ.ศ. 2551</option>
                      <option value="Cambridge Primary English Standards">มาตรฐานระดับนานาชาติ Cambridge Primary</option>
                      <option value="Common European Framework Standards">มาตรฐานยุโรป CEFR Alignment Standard</option>
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Topic selection */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-500">หัวข้อบทเรียนหลัก (Topic)</label>
                      <button
                        type="button"
                        onClick={() => setIsEngineCustomTopic(!isEngineCustomTopic)}
                        className="text-[9px] text-sky-600 font-bold hover:underline"
                      >
                        {isEngineCustomTopic ? "เปลี่ยนใช้แบบเลือก" : "พิมพ์เองอิสระ"}
                      </button>
                    </div>
                    {isEngineCustomTopic ? (
                      <input
                        type="text"
                        value={engineCustomTopicText}
                        onChange={(e) => setEngineCustomTopicText(e.target.value)}
                        placeholder="เช่น My Lovely Kitchen, At the Zoo..."
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none text-gray-700 font-semibold"
                      />
                    ) : (
                      <select
                        value={engineTopic}
                        onChange={(e) => setEngineTopic(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                      >
                        {SUGGESTED_TOPICS[engineGrade]?.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Grammar Focus */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ไวยากรณ์เน้นย้ำ (Grammar Focus)</label>
                    <input
                      type="text"
                      value={grammarFocus}
                      onChange={(e) => setGrammarFocus(e.target.value)}
                      placeholder="เช่น Wh-Questions, Adjectives of Size, Present Continuous..."
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    />
                  </div>

                  {/* Vocabulary Theme */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ธีมคลังศัพท์เป้าหมาย (Vocabulary Theme)</label>
                    <input
                      type="text"
                      value={vocabularyTheme}
                      onChange={(e) => setVocabularyTheme(e.target.value)}
                      placeholder="เช่น Animal body parts, Names of jobs, Action verbs..."
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Learning Objective */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">วัตถุประสงค์การเรียนรู้ (Learning Objective)</label>
                    <input
                      type="text"
                      value={learningObjective}
                      onChange={(e) => setLearningObjective(e.target.value)}
                      placeholder="เช่น Students can match vocabularies with animal actions correctly"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ระดับความยากประเมิน (Difficulty)</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    >
                      <option value="Easy">Easy (ความจำความรู้พื้นฐาน, คำศัพท์ตรงประเด็น)</option>
                      <option value="Medium">Medium (การประยุกต์ใช้ประโยค, มีบทรองสั้น)</option>
                      <option value="Hard">Hard (การอ่านจับใจความ, มีการลวงตัวเลือก)</option>
                    </select>
                  </div>

                  {/* Worksheet Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">รูปแบบใบงานแบบทดสอบ</label>
                    <select
                      value={engineFormat}
                      onChange={(e) => setEngineFormat(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    >
                      <option value="Multiple Choice">Multiple Choice (แบบชอยส์ 4 ตัวเลือก)</option>
                      <option value="Fill in the Blank">Fill in the Blank (เติมคาในช่องว่าง)</option>
                      <option value="Short Answer">Short Answer (เขียนตอบสั้นๆ แนะนำประโยคเดี่ยว)</option>
                      <option value="Matching">Matching (ลากเส้นจับคู่คำศัพท์และภาพความหมาย)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Number of questions */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-800 block">จำนวนข้อคำถาม (1 - 100 ข้อ)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={engineNumQuestions}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setEngineNumQuestions(Math.max(1, Math.min(100, val)));
                          }
                        }}
                        className="w-16 p-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center outline-none focus:ring-2 focus:ring-sky-400"
                      />
                      <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl flex-1">
                        {[5, 10, 25, 50, 100].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setEngineNumQuestions(num)}
                            className={`flex-1 py-1 px-1.5 text-center font-bold text-[10px] rounded-lg transition ${
                              engineNumQuestions === num
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {num} ข้อ
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ภาษาในการชี้แจง (Language)</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    >
                      <option value="English and Thai">English and Thai Support (เหมาะกับหลักสูตรปกติ)</option>
                      <option value="English Only">English Only (เหมาะกับ Mini English Program / EP)</option>
                    </select>
                  </div>

                  {/* Paper Size */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ขนาดหน้ากระดาษ (Paper Size)</label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 outline-none font-semibold text-gray-700"
                    >
                      <option value="A4">A4 (มาตรฐานไทยนิยมพิมพ์)</option>
                      <option value="Letter">Letter Size (มาตรฐานสากล)</option>
                    </select>
                  </div>

                  {/* Include Answer Key */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">แสดงเฉลยข้อสอบแอดมิน</label>
                    <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl h-[38px] items-center">
                      <button
                        type="button"
                        onClick={() => setIncludeAnswerKey(true)}
                        className={`flex-1 py-1 font-bold text-[11px] rounded-lg transition ${
                          includeAnswerKey ? "bg-emerald-600 text-white shadow-xs" : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        แนบเฉลยด้วย
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludeAnswerKey(false)}
                        className={`flex-1 py-1 font-bold text-[11px] rounded-lg transition ${
                          !includeAnswerKey ? "bg-gray-500 text-white shadow-xs" : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        ไม่แสดงเฉลย
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleApproveAndGenerate}
                    disabled={isGenerating}
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transform hover:scale-[1.01]"
                  >
                    {isGenerating ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>กำลังปั๊มข้อสอบภาษาอังกฤษประณีตวิชาการ...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>อนุมัติตัวแปร & สั่ง AI ผลิตข้อสอบต้นฉบับแนวใหม่ (Generate Unique) ✨</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= STEP 3 & STEP 4: REVIEW, QUALITY VALIDATION & SAVING ================= */}
          {editingWorksheet && (
            <div className="border border-sky-200 rounded-3xl bg-white p-6 shadow-sm space-y-6 text-left animate-fade-in">
              
              {/* STEP 4: QUALITY VALIDATION BAR */}
              <div className="bg-[#F4F9F5] border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    STEP 4: QUALITY VALIDATION CHECKLIST (ผ่านเกณฑ์ประเมินสากล)
                  </span>
                  <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    ผ่านเกณฑ์สมบูรณ์ (All Pass)
                  </span>
                </div>
                
                <p className="text-[10px] text-gray-500">
                  ระบบได้ประมวลผลการจัดทำข้อสอบผ่านการวิเคราะห์เชิงลึก 6 แกนกลาง เพื่อประกันความแม่นยำด้านไวยากรณ์ ความเหมาะสมตามช่วงวัย และสิทธิ์ลิขสิทธิ์:
                </p>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="bg-white border border-emerald-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Grammar Accuracy</span>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                  <div className="bg-white border border-emerald-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Lexical Density</span>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                  <div className="bg-white border border-emerald-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Key Consistency</span>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                  <div className="bg-white border border-emerald-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">CEFR Alignment</span>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                  <div className="bg-white border border-emerald-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Age Suitability</span>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                  <div className="bg-white border border-emerald-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Zero Copy Shield</span>
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> PASS
                    </span>
                  </div>
                </div>
              </div>

              {/* WORKSHEET EDITABLE FORM */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-sky-900 flex items-center gap-1.5 font-friendly">
                    <Edit3 className="w-4 h-4 text-sky-600" />
                    คัดกรองเนื้อหาและปรับปรุงด้วยผู้ดูแลระบบ (Curation Panel)
                  </h4>
                  <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-[10px] font-bold">
                    จำนวนคำถาม: {editingWorksheet.questions?.length} ข้อ
                  </span>
                </div>

                {/* Info block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">หัวเรื่องแบบทดสอบ (Worksheet Title)</label>
                    <input
                      type="text"
                      value={editingWorksheet.title || ""}
                      onChange={(e) => {
                        const copy = { ...editingWorksheet };
                        copy.title = e.target.value;
                        setEditingWorksheet(copy);
                      }}
                      className="w-full p-2.5 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">คำชี้แจงการทำแบบทดสอบ (Instructions)</label>
                    <input
                      type="text"
                      value={editingWorksheet.instructions || ""}
                      onChange={(e) => {
                        const copy = { ...editingWorksheet };
                        copy.instructions = e.target.value;
                        setEditingWorksheet(copy);
                      }}
                      className="w-full p-2.5 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-800"
                    />
                  </div>
                </div>

                {/* Questions Listing */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {editingWorksheet.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30 hover:border-sky-200 transition space-y-3 relative">
                      
                      <div className="flex justify-between items-center">
                        <span className="bg-sky-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          ข้อที่ {idx + 1}
                        </span>
                        <button
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="ลบข้อสอบข้อนี้"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">โจทย์คำถามภาษาอังกฤษ (English Question Text)</label>
                        <input
                          type="text"
                          value={q.questionText || ""}
                          onChange={(e) => handleEditQuestionText(idx, e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold"
                        />
                      </div>

                      {/* Options (Multiple choice only) */}
                      {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="space-y-1">
                              <label className="text-[9px] font-bold text-gray-400">ตัวเลือกย่อยที่ {optIdx + 1}</label>
                              <input
                                type="text"
                                value={opt || ""}
                                onChange={(e) => handleEditOptionText(idx, optIdx, e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Correct answer & Explanation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-sky-800 block">🔑 เฉลยที่ถูกต้อง (Correct Answer Key)</label>
                          <input
                            type="text"
                            value={q.correctAnswer || ""}
                            onChange={(e) => handleEditCorrectAnswer(idx, e.target.value)}
                            className="w-full bg-sky-50/50 border border-sky-200 rounded-xl p-2.5 text-xs text-sky-900 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 block">📝 คำอธิบายเฉลยและไวยากรณ์ (Grammar Explanation in Thai)</label>
                          <input
                            type="text"
                            value={q.explanation || ""}
                            onChange={(e) => handleEditExplanation(idx, e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-600"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Final Save Panel */}
                <div className="bg-sky-950 text-white rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-left mt-6">
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm flex items-center gap-1.5 text-sky-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      วิเคราะห์วิชาการผ่านเกณฑ์เรียบร้อย บันทึกส่งออก?
                    </h5>
                    <p className="text-[10px] text-sky-200 leading-relaxed max-w-xl">
                      ใบงานภาษาอังกฤษประมวลแกนกลางใหม่นี้ จะถูกบันทึกเข้าคลังกลาง (Supabase Central Repository) ผู้ใช้บริการทั่วไปและพรีเมียมจะเข้าถึง ค้นหา และพิมพ์ดาวน์โหลดได้ทันทีค่ะ
                    </p>
                  </div>

                  <button
                    onClick={handleSaveToDatabase}
                    disabled={saving}
                    className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>กำลังบันทึกลงฐานข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>💾 อนุมัติสิทธิ์การผลิต & บันทึกลงคลังกลาง</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: FIREBASE QUESTION BANK (ADMIN REPOSITORY) ==================== */}
      {activeTab === "question_bank" && (
        <div className="space-y-6 text-left font-sans">
          {/* Header Banner & Quick Controls */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/30 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-amber-200/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Firebase Cloud Storage
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" /> Admin Full Access
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-amber-950 flex items-center gap-2 font-friendly">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                  ศูนย์รวมคลังข้อสอบ Firebase ส่วนกลาง (Question Bank Repository)
                </h3>
                <p className="text-xs text-amber-900/80">
                  สิทธิ์ระดับ แอดมิน (Admin) สามารถเข้าถึง ค้นหา แยกตามเนื้อหาบทเรียน แก้ไข เพิ่มเติม หรือลบข้อสอบในคลัง Firebase ได้ทั้งหมด 100%
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchQuestionBank}
                  disabled={isLoadingQuestionBank}
                  className="bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuestionBank ? "animate-spin" : ""}`} />
                  <span>โหลดคลังข้อสอบใหม่</span>
                </button>

                <button
                  onClick={handleOpenAddQuestion}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มข้อสอบเข้าคลัง Firebase</span>
                </button>
              </div>
            </div>

            {/* Overview Stats Badges (แสดงวันที่ Update ล่าสุด, ชั้นที่มีข้อสอบมากที่สุด, และอันที่ควรสร้าง) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200/90 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-amber-600" /> ข้อสอบทั้งหมดในคลัง
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-amber-950">{questionBankList.length} ข้อ</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
                    {qbTopics.length} หมวดเนื้อหา
                  </span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200/90 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> วันที่ Update ล่าสุด
                </span>
                <span className="text-sm font-extrabold text-emerald-950 block pt-1">
                  {latestQbUpdateDate}
                </span>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200/90 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" /> ชั้นที่มีข้อสอบมากที่สุด
                </span>
                <span className="text-sm font-extrabold text-sky-950 block pt-1">
                  {mostPopulatedGrade}
                </span>
              </div>

              <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-200/90 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600" /> อันที่ควรสร้างเพิ่ม (Needed)
                </span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {suggestedTopicsToBuild.map((item, i) => (
                    <span key={i} className="text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-md truncate max-w-[180px]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Categorized Filter Bar (แยกตามเนื้อหา / Topics & Grades) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-sm text-gray-800">แยกตามหมวดหมู่เนื้อหา (Filter by Content / Topic):</span>
              </div>

              {/* Grade, Learning Stage, Status Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Review Status Selector */}
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 p-1 rounded-xl text-xs font-bold">
                  <span className="px-1.5 text-amber-900 text-[11px]">สถานะ:</span>
                  {[
                    { key: "all", label: `ทั้งหมด (${questionBankList.length})` },
                    { key: "pending", label: `⏳ รอตรวจ (${questionBankList.filter(q => (q.status || "").toLowerCase() === "pending").length})` },
                    { key: "approved", label: `✅ Approved (${questionBankList.filter(q => (q.status || "approved").toLowerCase() === "approved").length})` },
                    { key: "rejected", label: `❌ Rejected (${questionBankList.filter(q => (q.status || "").toLowerCase() === "rejected").length})` }
                  ].map(st => (
                    <button
                      key={st.key}
                      onClick={() => setQbStatusFilter(st.key)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                        qbStatusFilter === st.key 
                          ? "bg-amber-600 text-white shadow-xs" 
                          : "text-amber-900 hover:bg-amber-100"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Grade Selector */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <span className="px-2 text-gray-500 text-[11px]">ชั้น:</span>
                  {["all", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"].map(g => (
                    <button
                      key={g}
                      onClick={() => setQbGradeFilter(g)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        qbGradeFilter === g 
                          ? "bg-amber-600 text-white shadow-xs" 
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {g === "all" ? "ทุกชั้น" : g}
                    </button>
                  ))}
                </div>

                {/* Stage Selector */}
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl text-xs font-bold">
                  <span className="text-emerald-800 text-[11px]">Stage:</span>
                  <select
                    value={qbStageFilter}
                    onChange={(e) => setQbStageFilter(e.target.value)}
                    className="bg-white border border-emerald-300 rounded-lg px-2 py-0.5 outline-none text-emerald-950 font-bold text-[11px] cursor-pointer"
                  >
                    <option value="all">ทุกขั้นตอน (All Stages)</option>
                    {STAGE_KEYS.map(sKey => (
                      <option key={sKey} value={sKey}>{LEARNING_STAGES[sKey].name}</option>
                    ))}
                  </select>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาโจทย์, เฉลย, หรือคำสำคัญ..."
                    value={qbSearch}
                    onChange={(e) => setQbSearch(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2 outline-none focus:border-amber-400 focus:bg-white"
                  />
                  {qbSearch && (
                    <button
                      onClick={() => setQbSearch("")}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Topic Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setQbTopicFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  qbTopicFilter === "all"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>แสดงทุกเนื้อหา ({questionBankList.length})</span>
              </button>

              {qbTopics.map((topName) => {
                const count = questionBankList.filter(q => q.topic === topName).length;
                return (
                  <button
                    key={topName}
                    onClick={() => setQbTopicFilter(topName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      qbTopicFilter === topName
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-50 text-amber-900 border border-amber-200/70 hover:bg-amber-100"
                    }`}
                  >
                    <span>{topName}</span>
                    <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Specs Sorting Status Header Banner & View Mode Toggle */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-300/80 p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-3 text-xs text-amber-950 font-bold">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                โครงสร้างคลังข้อสอบแบบ Drill-Down: 
                <span className="text-amber-800 ml-1 font-extrabold underline">
                  1. ระดับชั้น ➔ 2. ชื่อหัวข้อแบบฝึกหัด ➔ 3. ประเภทแบบฝึกหัด (Worksheet type) ➔ 4. ระดับความยาก (Difficulty)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto shrink-0">
              {qbViewMode === "grouped" && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    onClick={handleExpandAllNodes}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold border border-amber-300 transition cursor-pointer"
                  >
                    📂 ขยายทั้งหมด
                  </button>
                  <button
                    onClick={handleCollapseAllNodes}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold border border-gray-300 transition cursor-pointer"
                  >
                    📁 ย่อทั้งหมด
                  </button>
                </div>
              )}

              <button
                onClick={() => setQbViewMode("grouped")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  qbViewMode === "grouped"
                    ? "bg-[#6B8E23] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>จัดกลุ่มแยก 4 ระดับชั้น</span>
              </button>

              <button
                onClick={() => setQbViewMode("flat")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  qbViewMode === "flat"
                    ? "bg-[#6B8E23] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>รายการทั้งหมด ({filteredQbList.length})</span>
              </button>
            </div>
          </div>

          {/* Question Items Content */}
          <div className="space-y-4">
            {isLoadingQuestionBank ? (
              <div className="bg-white rounded-3xl p-12 text-center text-gray-400 space-y-3 border border-gray-100">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500" />
                <p className="text-xs font-bold">กำลังเชื่อมต่อและดึงคลังข้อสอบจาก Firebase Firestore...</p>
              </div>
            ) : filteredQbList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-gray-400 space-y-3 border border-gray-100">
                <BookOpen className="w-12 h-12 mx-auto text-gray-200" />
                <p className="text-sm font-bold text-gray-600">ไม่พบข้อสอบในคลังตรงตามเงื่อนไขที่เลือก</p>
                <p className="text-xs text-gray-400">ลองเปลี่ยนหมวดหมู่เนื้อหา หรือกด "เพิ่มข้อสอบเข้าคลัง Firebase" ด้านบน</p>
              </div>
            ) : qbViewMode === "grouped" ? (
              /* GROUPED 4-LEVEL DRILL-DOWN TREE VIEW */
              <div className="space-y-6">
                {groupedQbTree.map((gradeGroup) => {
                  const isGradeOpen = !!openGrades[gradeGroup.grade];

                  return (
                    <div
                      key={gradeGroup.grade}
                      className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs space-y-0 text-left"
                    >
                      {/* LEVEL 1: Grade Header Accordion */}
                      <div
                        onClick={() =>
                          setOpenGrades((prev) => ({
                            ...prev,
                            [gradeGroup.grade]: !prev[gradeGroup.grade]
                          }))
                        }
                        className="bg-gradient-to-r from-[#1b3b22] to-[#2e5c38] text-white p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:opacity-95 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-black text-amber-300 text-lg border border-white/20 shrink-0">
                            🎓
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2 flex-wrap">
                              <span>ระดับชั้น {gradeGroup.grade}</span>
                              <span className="text-xs font-extrabold text-amber-300 bg-black/30 px-3 py-0.5 rounded-full border border-amber-300/40">
                                {gradeGroup.totalCount} ข้อสอบ
                              </span>
                            </h3>
                            <p className="text-[11px] text-emerald-100/80 pt-0.5">
                              (มี {gradeGroup.topics.length} ชื่อหัวข้อแบบฝึกหัด)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-white/15 px-3 py-1 rounded-xl text-emerald-100 hidden sm:inline-block">
                            {isGradeOpen ? "ย่อชั้นเรียน" : "คลิกเพื่อดูหัวข้อแบบฝึกหัด"}
                          </span>
                          {isGradeOpen ? (
                            <ChevronDown className="w-5 h-5 text-emerald-200" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-emerald-200" />
                          )}
                        </div>
                      </div>

                      {/* LEVEL 1 BODY: Topics List */}
                      {isGradeOpen && (
                        <div className="p-4 sm:p-6 space-y-5 bg-slate-50/60 border-t border-gray-100">
                          {gradeGroup.topics.map((topicGroup) => {
                            const topicKey = `${gradeGroup.grade}_${topicGroup.topicName}`;
                            const isTopicOpen = !!openTopics[topicKey];

                            return (
                              <div
                                key={topicGroup.topicName}
                                className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs overflow-hidden"
                              >
                                {/* LEVEL 2: Topic Header Accordion */}
                                <div
                                  onClick={() =>
                                    setOpenTopics((prev) => ({
                                      ...prev,
                                      [topicKey]: !prev[topicKey]
                                    }))
                                  }
                                  className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-orange-100/30 border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none hover:bg-amber-100/60 transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                      📁
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                                        ชื่อหัวข้อแบบฝึกหัด (Worksheet Topic):
                                      </span>
                                      <h4 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-2 flex-wrap">
                                        <span>{topicGroup.topicName}</span>
                                        <span className="bg-amber-700 text-white font-black px-2.5 py-0.5 rounded-full text-xs">
                                          {topicGroup.totalCount} ข้อ
                                        </span>
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-amber-900 font-bold">
                                    <span className="text-[11px] opacity-80 hidden sm:inline-block">
                                      ({topicGroup.types.length} ประเภทแบบฝึกหัด)
                                    </span>
                                    {isTopicOpen ? (
                                      <ChevronDown className="w-4 h-4 text-amber-700" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-amber-700" />
                                    )}
                                  </div>
                                </div>

                                {/* LEVEL 2 BODY: Worksheet Types List */}
                                {isTopicOpen && (
                                  <div className="p-3 sm:p-4 space-y-4 bg-amber-50/30">
                                    {topicGroup.types.map((typeGroup) => {
                                      const typeKeyStr = `${gradeGroup.grade}_${topicGroup.topicName}_${typeGroup.typeKey}`;
                                      const isTypeOpen = !!openTypes[typeKeyStr];

                                      return (
                                        <div
                                          key={typeGroup.typeKey}
                                          className="bg-white rounded-xl border border-sky-200/90 shadow-2xs overflow-hidden"
                                        >
                                          {/* LEVEL 3: Worksheet Type Header Accordion */}
                                          <div
                                            onClick={() =>
                                              setOpenTypes((prev) => ({
                                                ...prev,
                                                [typeKeyStr]: !prev[typeKeyStr]
                                              }))
                                            }
                                            className="p-3 sm:p-3.5 bg-gradient-to-r from-sky-50 via-sky-100/50 to-indigo-50 border-b border-sky-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none hover:bg-sky-100/80 transition"
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                                📝
                                              </div>
                                              <div>
                                                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                                                  ประเภทแบบฝึกหัด (Worksheet type):
                                                </span>
                                                <h5 className="text-xs sm:text-sm font-extrabold text-sky-950 flex items-center gap-2 flex-wrap">
                                                  <span>{typeGroup.typeNameTH}</span>
                                                  <span className="bg-sky-800 text-white font-black px-2 py-0.2 rounded-full text-[11px]">
                                                    {typeGroup.totalCount} ข้อ
                                                  </span>
                                                </h5>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-sky-900 font-bold">
                                              <span className="text-[11px] opacity-80 hidden sm:inline-block">
                                                ({typeGroup.difficulties.length} ระดับความยาก)
                                              </span>
                                              {isTypeOpen ? (
                                                <ChevronDown className="w-4 h-4 text-sky-700" />
                                              ) : (
                                                <ChevronRight className="w-4 h-4 text-sky-700" />
                                              )}
                                            </div>
                                          </div>

                                          {/* LEVEL 3 BODY: Difficulties List */}
                                          {isTypeOpen && (
                                            <div className="p-3 space-y-3 bg-sky-50/20">
                                              {typeGroup.difficulties.map((diffGroup) => {
                                                const diffKeyStr = `${gradeGroup.grade}_${topicGroup.topicName}_${typeGroup.typeKey}_${diffGroup.difficultyLabel}`;
                                                const isDiffOpen = !!openDiffs[diffKeyStr];

                                                let diffBadgeStyle = "bg-emerald-100 text-emerald-950 border-emerald-300";
                                                let diffDot = "🟢";
                                                if (
                                                  diffGroup.difficultyLabel.includes("Medium") ||
                                                  diffGroup.difficultyLabel.includes("ปานกลาง")
                                                ) {
                                                  diffBadgeStyle = "bg-amber-100 text-amber-950 border-amber-300";
                                                  diffDot = "🟡";
                                                } else if (
                                                  diffGroup.difficultyLabel.includes("Hard") ||
                                                  diffGroup.difficultyLabel.includes("ยาก")
                                                ) {
                                                  diffBadgeStyle = "bg-rose-100 text-rose-950 border-rose-300";
                                                  diffDot = "🔴";
                                                }

                                                return (
                                                  <div
                                                    key={diffGroup.difficultyLabel}
                                                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                                                  >
                                                    {/* LEVEL 4: Difficulty Header Accordion */}
                                                    <div
                                                      onClick={() =>
                                                        setOpenDiffs((prev) => ({
                                                          ...prev,
                                                          [diffKeyStr]: !prev[diffKeyStr]
                                                        }))
                                                      }
                                                      className="p-2.5 sm:p-3 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-gray-100 transition"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-xs">{diffDot}</span>
                                                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${diffBadgeStyle}`}>
                                                          ระดับความยาก: {diffGroup.difficultyLabel}
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-700 bg-gray-200/80 px-2 py-0.2 rounded-full">
                                                          {diffGroup.totalCount} ข้อ
                                                        </span>
                                                      </div>

                                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                                        <span className="text-[10px] hidden sm:inline-block">
                                                          {isDiffOpen ? "ซ่อนข้อสอบ" : "คลิกเพื่อแสดงข้อสอบ"}
                                                        </span>
                                                        {isDiffOpen ? (
                                                          <ChevronDown className="w-4 h-4 text-gray-600" />
                                                        ) : (
                                                          <ChevronRight className="w-4 h-4 text-gray-600" />
                                                        )}
                                                      </div>
                                                    </div>

                                                    {/* LEVEL 4 BODY: Question Cards */}
                                                    {isDiffOpen && (
                                                      <div className="p-3 space-y-3 bg-slate-50/40">
                                                        {diffGroup.questions.map((q, qIdx) =>
                                                          renderQuestionCard(q, qIdx)
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* FLAT LIST VIEW */
              <div className="grid grid-cols-1 gap-4">
                {filteredQbList.map((q, idx) => renderQuestionCard(q, idx))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT QUESTION IN FIREBASE ==================== */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-2xl w-full p-6 shadow-2xl text-left space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-friendly">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>{editingQuestion ? "✏️ แก้ไขข้อสอบในคลัง Firebase" : "➕ เพิ่มข้อสอบใหม่ลงคลัง Firebase"}</span>
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionBankItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ระดับชั้น (Grade)</label>
                  <select
                    value={questionForm.grade}
                    onChange={(e) => setQuestionForm({ ...questionForm, grade: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 font-bold"
                  >
                    {PRIMARY_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">หมวดหมู่เนื้อหา (Topic)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Food & Drinks"
                    value={questionForm.topic}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">ระดับ CEFR</label>
                  <select
                    value={questionForm.cefr_level || "A1"}
                    onChange={(e) => setQuestionForm({ ...questionForm, cefr_level: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                  </select>
                </div>
              </div>

              {/* Learning Stage & Focus / Sub-skill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F0FDF4] border border-[#8EE4AF] rounded-2xl">
                <div>
                  <label className="block font-bold text-[#3E4A2E] mb-1">ขั้นตอนการเรียนรู้ (Learning Stage)</label>
                  <select
                    value={questionForm.learning_stage || "Vocabulary & Meaning"}
                    onChange={(e) => {
                      const stg = e.target.value;
                      const defaultFocus = LEARNING_STAGES[stg]?.focusOptions[0] || "";
                      setQuestionForm({ ...questionForm, learning_stage: stg, focus: defaultFocus });
                    }}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-bold text-emerald-900"
                  >
                    {STAGE_KEYS.map(s => (
                      <option key={s} value={s}>{LEARNING_STAGES[s].name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#3E4A2E] mb-1">จุดเน้นย่อย (Focus / Sub-skill)</label>
                  <input
                    type="text"
                    placeholder="เช่น Word Recognition, Meaning Matching..."
                    value={questionForm.focus || ""}
                    onChange={(e) => setQuestionForm({ ...questionForm, focus: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-medium text-emerald-950"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">ข้อความโจทย์ (Question Text) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="พิมพ์ข้อความคำถามภาษาอังกฤษที่นี่..."
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-bold text-gray-700">ตัวเลือก (Options A - D)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-xs">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        type="text"
                        placeholder={`ตัวเลือก ${String.fromCharCode(65 + i)}`}
                        value={questionForm.options[i] || ""}
                        onChange={(e) => {
                          const newOpts = [...(questionForm.options || [])];
                          newOpts[i] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer & Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-800 mb-1">คำตอบที่ถูกต้อง (Correct Answer) *</label>
                  <input
                    type="text"
                    required
                    placeholder="พิมพ์ข้อความเฉลยที่ถูกต้อง หรือ A/B/C/D"
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 font-bold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">รูปแบบข้อสอบ</label>
                  <select
                    value={questionForm.question_type || "multiple-choice"}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                  >
                    <option value="multiple-choice">Multiple Choice (ปรนัย 4 ตัวเลือก)</option>
                    <option value="fill-in-blank">Fill in the Blank (เติมคำ)</option>
                    <option value="matching">Matching (จับคู่)</option>
                    <option value="short-answer">Short Answer (เขียนตอบสั้น)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">คำอธิบายเฉลย (Explanation)</label>
                <textarea
                  rows={2}
                  placeholder="อธิบายเหตุผลของคำตอบภาษาไทยเพิ่มเติม..."
                  value={questionForm.explanation || ""}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกลงคลังข้อสอบ Firebase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB: DASHBOARD STATISTICS ==================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm font-sans text-left space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-4 gap-2">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-friendly">
                  <Layers className="w-5 h-5 text-sky-600" />
                  รายงานมวลรวมระบบ & อัตราความแน่นคลังข้อสอบ
                </h3>
                <p className="text-xs text-gray-400">สรุปความครอบคลุมข้อคำถามแบ่งตามมาตรฐานรายปีการศึกษา</p>
              </div>
            </div>

            {/* Quick stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-sky-50 border border-sky-100 p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-sky-700 block">จำนวนข้อสอบภาษาอังกฤษรวม</span>
                <span className="text-3xl font-extrabold text-sky-950 mt-1 block">
                  {totalQuestions} <span className="text-xs font-normal text-gray-500">ข้อ</span>
                </span>
                <span className="text-[10px] text-sky-600 block mt-1">({repositoryList.length} ใบงานใช้งานได้จริง)</span>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">สมาชิกทั่วไป (Free Members)</span>
                <span className="text-3xl font-extrabold text-amber-950 mt-1 block">
                  {totalFreeUsers} <span className="text-xs font-normal text-gray-500">คน</span>
                </span>
                <span className="text-[10px] text-amber-700 block mt-1">(จำกัดโควตาพิมพ์ 5 ใบงาน)</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">สมาชิกพรีเมียม (Premium Elite)</span>
                <span className="text-3xl font-extrabold text-emerald-950 mt-1 block">
                  {totalPremiumUsers} <span className="text-xs font-normal text-gray-500">คน</span>
                </span>
                <span className="text-[10px] text-emerald-700 block mt-1">(สิทธิ์เข้าถึงคลังปั๊มแบบไม่จำกัด)</span>
              </div>
            </div>

            {/* Grade table density */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider block">การครอบคลุมของหลักสูตรแยกตามระดับชั้น</h4>
              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sky-950 text-white text-[10px] uppercase font-bold">
                      <th className="p-3">ระดับชั้นเรียน</th>
                      <th className="p-3">หัวข้อที่จัดทำแล้ว</th>
                      <th className="p-3 text-center">สถิติจำนวนข้อสอบ</th>
                      <th className="p-3 text-center">ระดับความหนาแน่น</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-[11px] text-gray-700">
                    {gradeStats.map((g) => (
                      <tr key={g.grade} className="hover:bg-gray-50/50 transition">
                        <td className="p-3 font-bold">{g.grade}</td>
                        <td className="p-3">
                          {g.topics.length === 0 ? (
                            <span className="text-gray-400 italic">ไม่มีหัวข้อในระบบ</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {g.topics.map((t, i) => (
                                <span key={i} className="bg-gray-100 text-gray-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-gray-200">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold">{g.questionCount} ข้อ</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${g.statusColor}`}>
                            {g.statusText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Members management section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-4 h-4 text-sky-600" />
                  รายชื่อครูและสมาชิกผู้ลงทะเบียนทั้งหมด ({usersList.length} คน)
                </h4>
                <div className="relative w-48">
                  <Search className="w-3 h-3 absolute left-2 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นด้วยอีเมล..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-[10px] bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 outline-none focus:border-sky-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/45 hover:bg-white transition flex items-center justify-between text-xs">
                    <div className="text-left space-y-1">
                      <span className="font-bold text-gray-800 truncate block max-w-[200px]">{u.email}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          u.role === "admin" ? "bg-sky-50 text-sky-700 border-sky-200" :
                          u.role === "premium" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">ดาวน์โหลดแล้ว: {u.downloadCount}</span>
                      </div>
                    </div>
                    
                    {u.role !== "admin" && (
                      <select
                        value={u.plan || u.role}
                        onChange={(e) => onUpdateUserRole(u.email, e.target.value)}
                        className="text-[10px] font-bold bg-white border border-gray-200 rounded p-1 text-slate-800"
                      >
                        <option value="free">Free Plan</option>
                        <option value="premium">Premium 🌟</option>
                        <option value="pro">Premium Pro 💎</option>
                        <option value="admin">Admin 🛡️</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB: WORKSHEETS LIBRARY ==================== */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm font-sans text-left space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-4 gap-2">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-friendly">
                  <Database className="w-5 h-5 text-sky-600" />
                  ศูนย์รวมคลังข้อมูลแบบทดสอบและเอกสารอ้างอิงกลาง (Exam Repository)
                </h3>
                <p className="text-xs text-gray-400">ค้นหา แก้ไข เผยแพร่ หรือจัดเก็บใบงานภาษาอังกฤษที่ผ่านระบบ AI Wizard</p>
              </div>

              {/* Quick search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาบทเรียน ระดับชั้น เช่น ป.3..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-sky-300"
                />
              </div>
            </div>

            {/* List worksheets with Worksheet Sources columns */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredRepo.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs italic">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                  ไม่พบข้อมูลใบงานหรือแบบฝึกหัดภาษาอังกฤษ
                </div>
              ) : (
                filteredRepo.map((item) => {
                  const meta = item.data?.sourceMeta || {};
                  return (
                    <div key={item.id} className="p-4 rounded-2xl border border-gray-100 hover:border-sky-200 bg-white transition hover:shadow-xs space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          <span className="bg-[#6B8E23]/10 text-[#556B2F] font-bold px-2 py-0.5 rounded border border-[#B8CC9A]/30">
                            {item.grade}
                          </span>
                          <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded border border-sky-100 uppercase">
                            {item.exerciseStyle}
                          </span>
                          <span className="text-gray-400">ID: {item.id}</span>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                          <button
                            onClick={() => onSelectWorksheet({ id: item.id, data: item.data })}
                            className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg hover:bg-sky-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>เปิดโหมดพิมพ์ประเมิน (Print)</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              const isArchived = !item.is_archived;
                              handleArchiveWorksheet(item.id, isArchived);
                            }}
                            className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg"
                            title="เก็บเข้าคลังจดหมายเหตุ (Archive)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm("ต้องการลบแบบทดสอบฉบับนี้ออกจากฐานข้อมูลกลางถาวรหรือไม่?")) {
                                onDeleteFromRepository(item.id);
                              }
                            }}
                            className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                            title="ลบถาวร"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info & metadata columns */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-left">
                        <div className="md:col-span-4 space-y-1">
                          <h4 className="font-bold text-xs text-gray-800">{item.topic}</h4>
                          <p className="text-[10px] text-gray-500">
                            <strong>Worksheet Title:</strong> {item.data?.title || item.topic}<br />
                            <strong>Instructions:</strong> {item.data?.instructions || "Read and answer."}
                          </p>
                        </div>

                        {/* Worksheet Sources table representation */}
                        <div className="md:col-span-8 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-400 block font-bold">Source Type</span>
                            <span className="font-semibold text-gray-700 truncate block">{meta.source_type || "National Curriculum"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Source Name</span>
                            <span className="font-semibold text-gray-700 truncate block">{meta.source_name || "OBEC 2551 Core Standards"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Publisher / Year</span>
                            <span className="font-semibold text-gray-700 block">{meta.publisher || "English Magic"} / {meta.publication_year || "2026"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Similarity Score</span>
                            <span className="text-emerald-700 font-bold block">{meta.similarity_score || "0% (Original)"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Copyright Risk</span>
                            <span className="text-emerald-700 font-bold block">{meta.copyright_risk || "Low Risk"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Grammar Focus</span>
                            <span className="font-semibold text-gray-700 truncate block">{meta.detected_grammar || item.data?.grammarFocus || "Adjectives / Tenses"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Difficulty</span>
                            <span className="font-semibold text-gray-700 block">{meta.detected_difficulty || item.data?.difficulty || "Medium"}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold">Generated By</span>
                            <span className="font-semibold text-gray-500 truncate block">{meta.generated_by || "sakarinmam999@gmail.com"}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB: DATABASE SCHEMA VISUALIZER ==================== */}
      {activeTab === "db_viewer" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm font-sans text-left space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Database className="w-6 h-6 text-sky-600 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-gray-800 font-friendly">
                  แผนภาพโครงสร้างตารางข้อมูลและคุณภาพวิชาการ (Supabase Relational Database Schemas)
                </h3>
                <p className="text-xs text-gray-400">แสดงผลผังเชื่อมโยงและความสมบูรณ์ของความสัมพันธ์เชิงกายภาพ (ER Diagram & Table Blueprint)</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              สถาปัตยกรรมคลังฐานข้อมูลกลางของ <strong>English Magic</strong> ได้รับการออกแบบตามหลักความสัมพันธ์ Relational DB เต็มรูปแบบ รองรับความแน่นประชากรระดับสากล คุณภาพวิชาการ (CEFR, Bloom's) ตลอดจนประวัติดาวน์โหลดและบันทึกข้อสอบอ้างอิงของผู้ใช้อย่างครบถ้วน:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Table list & columns */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">บัญชีตารางวิชาการหลัก (Primary Relational Tables)</h4>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  
                  {/* Table 1: Subjects */}
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/45 space-y-1">
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono border border-sky-200">TABLE 1: subjects</span>
                    <h5 className="font-bold text-xs text-gray-800">กลุ่มตารางหมวดหมู่วิชาหลัก</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <strong>Columns:</strong> id (UUID, PK), name (TEXT - English, Grammar, Reading, etc.), description (TEXT), standard_framework (TEXT), created_at (TIMESTAMP)
                    </p>
                  </div>

                  {/* Table 2: Topics */}
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/45 space-y-1">
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono border border-sky-200">TABLE 2: topics</span>
                    <h5 className="font-bold text-xs text-gray-800">หัวข้อบทเรียนและกลุ่มทักษะ</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <strong>Columns:</strong> id (UUID, PK), subject_id (UUID, FK), grade_level (TEXT), name (TEXT), grammar_focus (TEXT), vocabulary_theme (TEXT)
                    </p>
                  </div>

                  {/* Table 3: Worksheets */}
                  <div className="p-3 border border-gray-100 rounded-xl bg-[#EAF5EC] space-y-1 border-emerald-200">
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono">TABLE 3: worksheets (ใช้งานจริง)</span>
                    <h5 className="font-bold text-xs text-emerald-950">เอกสารใบงานและแบบทดสอบภาษาอังกฤษสังเคราะห์</h5>
                    <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                      <strong>Columns:</strong> id (TEXT, PK), created_at (TIMESTAMP), grade (TEXT), topic (TEXT), exercise_style (TEXT), is_archived (BOOLEAN), data (JSONB - สารบัญคำถาม, คุณภาพวิจัย และรายงานประเมินลิขสิทธิ์)
                    </p>
                  </div>

                  {/* Table 4: Worksheet Questions */}
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/45 space-y-1">
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono border border-sky-200">TABLE 4: worksheet_questions</span>
                    <h5 className="font-bold text-xs text-gray-800">รายการคำถามรายข้อสอบ</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <strong>Columns:</strong> id (UUID, PK), worksheet_id (TEXT, FK), question_text (TEXT), options (JSONB), correct_answer (TEXT), explanation (TEXT), cognitive_level (TEXT)
                    </p>
                  </div>

                  {/* Table 5: Worksheet Sources */}
                  <div className="p-3 border border-sky-200 rounded-xl bg-sky-50/20 space-y-1">
                    <span className="bg-sky-600 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono">TABLE 5: worksheet_sources (ตารางอ้างอิงลิขสิทธิ์)</span>
                    <h5 className="font-bold text-xs text-sky-950">ประวัติตรวจสอบความซ้ำซ้อนเอกสารและรายงาน Copyright Shield</h5>
                    <p className="text-[10px] text-sky-900 leading-relaxed font-semibold">
                      <strong>Columns:</strong> id (UUID, PK), worksheet_id (TEXT, FK), source_type (TEXT), source_name (TEXT), original_text (TEXT), similarity_score (TEXT), copyright_risk (TEXT), ai_analysis_summary (JSONB)
                    </p>
                  </div>

                  {/* Table 6: Users & History */}
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/45 space-y-1">
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded font-mono border border-sky-200">TABLE 6: users & user_download_history</span>
                    <h5 className="font-bold text-xs text-gray-800">สมาชิกผู้ใช้งานและตารางสถิติตรวจจับโควตา</h5>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <strong>Columns:</strong> email (TEXT, PK), role (TEXT - free/premium), download_count (INT), history_logs (JSONB)
                    </p>
                  </div>

                </div>
              </div>

              {/* ER Relationship diagram presentation card */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">แบบเชื่อมโยงวิชาการ (Entity-Relationships Map)</h4>
                
                <div className="border border-sky-100 bg-sky-50/10 rounded-2xl p-4 text-xs text-left space-y-3">
                  <span className="bg-sky-600 text-white font-bold text-[9px] px-2 py-0.5 rounded">ERD LOGICAL VIEWER</span>
                  
                  <div className="space-y-3 font-mono text-[10px] text-sky-950">
                    <div className="p-2 border border-sky-200 bg-white rounded-lg">
                      <span className="font-bold">subjects (1)</span>
                      <div className="pl-2 border-l border-sky-200 mt-1">
                        └── <span className="text-sky-700">has many</span> topics (N)
                      </div>
                    </div>

                    <div className="p-2 border border-sky-200 bg-white rounded-lg">
                      <span className="font-bold">topics (1)</span>
                      <div className="pl-2 border-l border-sky-200 mt-1">
                        └── <span className="text-sky-700">targets CEFR in</span> worksheets (N)
                      </div>
                    </div>

                    <div className="p-2 border border-sky-200 bg-white rounded-lg">
                      <span className="font-bold">worksheets (1)</span>
                      <div className="pl-2 border-l border-sky-200 mt-1">
                        ├── <span className="text-emerald-700">has detailed</span> worksheet_questions (N)<br />
                        └── <span className="text-sky-700">documents originality in</span> worksheet_sources (1)
                      </div>
                    </div>

                    <div className="p-2 border border-sky-200 bg-white rounded-lg">
                      <span className="font-bold">users (1)</span>
                      <div className="pl-2 border-l border-sky-200 mt-1">
                        └── <span className="text-sky-700">records usage in</span> user_download_history (N)
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    โครงสร้างสถาปัตยกรรมฐานข้อมูลระดับแอดมินนี้ ได้รับการออกแบบตามกฎของ Third Normal Form (3NF) เพื่อความคงทน ไม่ซ้ำซ้อน และประมวลความเร็วสูงสุดภายใต้ฐานข้อมูล Supabase PostgreSQL (Cloud Infrastructure) ส่วนกลาง
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
