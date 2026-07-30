import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Database, 
  FileText, 
  Loader2, 
  ChevronDown, 
  Plus, 
  Check, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from "lucide-react";

interface EngineBFormProps {
  isLoading: boolean;
  currentUser: any;
  onWorksheetGenerated: (worksheet: any) => void;
  setStatusMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export default function EngineBForm({ 
  isLoading, 
  currentUser, 
  onWorksheetGenerated,
  setStatusMessage
}: EngineBFormProps) {
  // --- CORE ENGINE B STATES ---
  const [referenceText, setReferenceText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any | null>(null);
  const [reviewStage, setReviewStage] = useState<"idle" | "analyzed" | "approved">("idle");
  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // --- SOURCE METADATA STATES (As requested, simplified & compact) ---
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [referenceTypes, setReferenceTypes] = useState<string[]>([
    "Entrance Exam",
    "School Examination",
    "Standardized Test",
    "Curriculum",
    "Custom"
  ]);
  const [sourceCategory, setSourceCategory] = useState("Entrance Exam"); // Reference Type
  const [sourceName, setSourceName] = useState(""); // Exam Source
  const [sourcePubYear, setSourcePubYear] = useState(""); // Year
  const [aiInstruction, setAiInstruction] = useState(""); // AI Instruction
  
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [newCustomType, setNewCustomType] = useState("");

  // --- GENERATION PARAMS STATES (Auto-filled on analysis, editable) ---
  const [engineGrade, setEngineGrade] = useState("ป.1");
  const [cefrLevel, setCefrLevel] = useState("A1");
  const [engineTopic, setEngineTopic] = useState("");
  const [isEngineCustomTopic, setIsEngineCustomTopic] = useState(false);
  const [engineCustomTopicText, setEngineCustomTopicText] = useState("");
  const [grammarFocus, setGrammarFocus] = useState("");
  const [vocabularyTheme, setVocabularyTheme] = useState("");
  const [learningObjective, setLearningObjective] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [engineNumQuestions, setEngineNumQuestions] = useState(5);
  const [engineFormat, setEngineFormat] = useState("Multiple Choice");
  const [language, setLanguage] = useState("English and Thai");
  const [paperSize, setPaperSize] = useState("A4");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch registered sources
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

  useEffect(() => {
    fetchSources();
  }, []);

  // Handler for adding a new reference type inline
  const handleAddNewReferenceType = () => {
    const trimmed = newCustomType.trim();
    if (!trimmed) return;
    if (!referenceTypes.includes(trimmed)) {
      setReferenceTypes([...referenceTypes, trimmed]);
    }
    setSourceCategory(trimmed);
    setNewCustomType("");
    setShowCustomTypeInput(false);
  };

  // Handler for saving a custom source inline to database
  const handleCreateNewSourceInline = async (nameToCreate: string) => {
    if (!nameToCreate.trim()) return;
    setIsAddingSource(true);
    setAlert(null);
    try {
      const payload = {
        source_id: "src_" + Math.random().toString(36).substr(2, 9),
        source_name: nameToCreate.trim(),
        source_category: sourceCategory,
        publisher: "English Magic Team",
        curriculum: "OBEC Thai Core Curriculum",
        examination_type: sourceCategory,
        publication_year: sourcePubYear || new Date().getFullYear().toString(),
        notes: aiInstruction || "Created inline via English Magic Workspace",
        active: true
      };

      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAlert({
          type: "success",
          text: `✨ บันทึกแหล่งอ้างอิง "${nameToCreate}" ลงในระบบเรียบร้อยแล้ว!`
        });
        await fetchSources();
        setShowSourceDropdown(false);
      } else {
        throw new Error("ล้มเหลวในการบันทึกแหล่งอ้างอิง");
      }
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
    } finally {
      setIsAddingSource(false);
    }
  };

  // STEP 1: Analyze Reference Material
  const handleAnalyzeReference = async () => {
    if (!referenceText.trim()) {
      setAlert({ type: "error", text: "กรุณากรอกหรือคัดลอกข้อความอ้างอิงเพื่อวิเคราะห์ก่อนค่ะ" });
      return;
    }

    setAlert(null);
    setIsAnalyzing(true);
    setAnalysisReport(null);
    setReviewStage("idle");

    try {
      const response = await fetch("/api/admin/analyze-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceText,
          email: currentUser?.email || "sakarinmam999@gmail.com"
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการเรียกใช้โมเดลวิเคราะห์ข้อมูล");
      }

      if (resData.success && resData.analysisReport) {
        const report = resData.analysisReport;
        setAnalysisReport(report);
        setReviewStage("analyzed");
        
        // Auto-populate inputs based on analyzer detection
        if (report.grade) setEngineGrade(report.grade);
        if (report.cefrLevel) setCefrLevel(report.cefrLevel);
        if (report.topic) {
          setIsEngineCustomTopic(true);
          setEngineCustomTopicText(report.topic);
        }
        if (report.grammarFocus) setGrammarFocus(report.grammarFocus);
        if (report.vocabularyLevel) setVocabularyTheme(report.vocabularyLevel);
        if (report.learningObjectives) setLearningObjective(report.learningObjectives);
        if (report.estimatedDifficulty) {
          // Normalize difficulty format
          const diff = report.estimatedDifficulty.toLowerCase();
          if (diff.includes("easy") || diff.includes("ง่าย")) setDifficulty("Easy");
          else if (diff.includes("hard") || diff.includes("ยาก") || diff.includes("difficult")) setDifficulty("Hard");
          else setDifficulty("Medium");
        }

        setAlert({
          type: "success",
          text: "✨ วิเคราะห์สำเร็จ! ระบบจำแนกประเภทความยาก ระดับโครงสร้าง และกลุ่มคำศัพท์เรียบร้อยแล้ว"
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

  // STEP 2: Trigger Generation of worksheet
  const handleApproveAndGenerate = async () => {
    if (!sourceName.trim()) {
      setAlert({ type: "error", text: "กรุณาระบุหรือเลือกชื่อข้อสอบอ้างอิง (Exam Source) ก่อนค่ะ" });
      return;
    }

    setAlert(null);
    setStatusMessage(null);
    setReviewStage("approved");

    const topicToSend = isEngineCustomTopic ? engineCustomTopicText.trim() : engineTopic;

    try {
      // Security log approval
      await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email || "sakarinmam999@gmail.com" })
      });

      const response = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reference",
          curriculum: "OBEC Thai Core Curriculum",
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
          referenceText,
          referenceType: sourceCategory,
          sourceName: sourceName.trim(),
          sourcePubYear: sourcePubYear.trim(),
          aiInstruction: aiInstruction.trim(),
          email: currentUser?.email || "sakarinmam999@gmail.com"
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการสังเคราะห์ข้อสอบผ่านระบบ AI");
      }

      if (resData.success && resData.worksheet) {
        // Inject inclusion helper attribute
        resData.worksheet.includeAnswerKey = includeAnswerKey;
        onWorksheetGenerated(resData.worksheet);
        
        setStatusMessage({
          type: "success",
          text: "🎉 ผลิตใบงานสไตล์อ้างอิงสำเร็จ! ระบบนำส่งไปยังห้องพรีวิวของคุณเพื่อปรับแก้หรือสั่งพิมพ์ทันที"
        });
        setAlert({
          type: "success",
          text: "🎉 สังเคราะห์ใบงานแนวประยุกต์สำเร็จ! ตัวอย่างแสดงในกระดาษรีวิวขวาเรียบร้อย"
        });
      } else {
        throw new Error("โครงสร้างผลลัพธ์ไม่ถูกต้องตามเกณฑ์ข้อกำหนด");
      }
    } catch (err: any) {
      setAlert({ type: "error", text: err.message || "เกิดอุปสรรคระหว่างผลิตใบงาน" });
    }
  };

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

  return (
    <div className="space-y-6 bg-[#FCFDF9] p-6 rounded-2xl border border-[#E1E8D8] shadow-sm text-[#3E4A2E]">
      
      {/* ALERT BOX */}
      {alert && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
          alert.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : alert.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800" 
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{alert.text}</span>
        </div>
      )}

      {/* STEP 1: Paste Reference material */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block">
            📋 ข้อความข้อสอบหรือเนื้อหาอ้างอิง (Reference Material)
          </label>
        </div>
        <p className="text-[11px] text-[#556B2F]/80 leading-snug">
          คัดลอกโจทย์ข้อสอบเก่า, ข้อสอบปลายภาคโรงเรียน, หรือหนังสือเรียนต้นฉบับมาวาง เพื่อให้ AI นำโครงสร้างและความซับซ้อนไปออกแบบข้อสอบใหม่แกะกล่อง ไม่ผิดลิขสิทธิ์
        </p>
        <textarea
          rows={6}
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder={`ตัวอย่างเช่น:\n1. Choose the correct option to fill in the blank.\nIf I ______ time, I would visit the National Museum today.\na) have\nb) had\nc) will have\nd) would have`}
          className="w-full p-3 bg-white border border-[#D0DBCE] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#8EAA6B] focus:border-transparent outline-none transition"
        />
        <button
          type="button"
          disabled={isAnalyzing || !referenceText.trim()}
          onClick={handleAnalyzeReference}
          className="w-full py-2.5 px-4 bg-[#7A9A5C] hover:bg-[#68854E] active:bg-[#577041] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              กำลังวิเคราะห์โครงสร้างมาตรฐานข้อสอบ...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              สั่ง AI วิเคราะห์ข้อสอบอ้างอิงตาม Curriculum Standard ✨
            </>
          )}
        </button>
      </div>

      {/* SHOW REPORT IF ANALYZED */}
      {analysisReport && (
        <div className="border border-sky-100 bg-sky-50/20 rounded-2xl p-4 space-y-3 animate-fade-in text-left">
          <div className="flex items-center gap-2 border-b border-sky-100/50 pb-2">
            <span className="text-sky-700 font-bold text-sm">📊 Report:</span>
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full uppercase">
              Curriculum Standard Analysis
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">ประเภทข้อสอบตามหลักสูตร (Exam Type)</span>
              <span className="font-bold text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded inline-block">
                {analysisReport.detectedExamType || "วิเคราะห์ตามโครงสร้างมาตรฐานหลักสูตร"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">ระดับชั้นประเมิน (Grade / Age)</span>
              <span className="font-bold text-gray-800">
                {analysisReport.grade || "N/A"} ({analysisReport.estimatedStudentAge || "N/A"})
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">มาตรฐานระดับสากล (CEFR Level)</span>
              <span className="font-bold text-gray-800">{analysisReport.cefrLevel || "N/A"}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">โครงสร้างไวยากรณ์ (Grammar Focus)</span>
              <span className="font-bold text-gray-800 text-[11px] truncate block" title={analysisReport.grammarFocus}>
                {analysisReport.grammarFocus || "N/A"}
              </span>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">จุดประสงค์การเรียนรู้ (Learning Objectives)</span>
              <p className="font-semibold text-gray-700 text-[11px] leading-snug">
                {analysisReport.learningObjectives || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">ความยากง่าย (Difficulty)</span>
              <span className="font-bold text-orange-700">{analysisReport.estimatedDifficulty || "N/A"}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 uppercase font-bold">Bloom's Taxonomy Level</span>
              <span className="font-semibold text-blue-700">{analysisReport.bloomsTaxonomyLevel || "N/A"}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-sky-100/50 flex gap-2 text-[10px]">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
              ✔️ คัดสรรใหม่ 100% ปลอดภัยจากลิขสิทธิ์
            </span>
          </div>
        </div>
      )}

      {/* COMPACT & SIMPLIFIED REFERENCE METADATA SECTION */}
      <div className="border border-[#D0DBCE] bg-[#F4F6F0]/40 rounded-2xl p-4 space-y-4 text-left">
        <div className="flex items-center gap-2 border-b border-[#D0DBCE] pb-2">
          <Database className="w-4 h-4 text-[#556B2F]" />
          <h4 className="font-bold text-xs text-[#3E4A2E]">📂 รายละเอียดแหล่งอ้างอิงแบบย่อ (Simplified Reference Source)</h4>
        </div>

        {/* Compact row - Grid with 3 columns on desktop for Type, Source, Year */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          
          {/* 1. Reference Type (Required) */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-[#556B2F] block">
              ประเภทอ้างอิง (Reference Type) <span className="text-red-500">*</span>
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
              className="w-full p-2 bg-white border border-[#D0DBCE] rounded-xl text-xs font-semibold text-[#3E4A2E] outline-none focus:ring-2 focus:ring-[#8EAA6B]"
            >
              {referenceTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="__add_new_type__" className="text-sky-600 font-bold">
                ➕ เพิ่มประเภทใหม่... (Add Custom...)
              </option>
            </select>

            {/* Custom Type Inline Input Modal/Box */}
            {showCustomTypeInput && (
              <div className="absolute z-20 left-0 right-0 mt-2 p-2.5 bg-white border border-[#D0DBCE] rounded-xl shadow-xl space-y-2">
                <span className="text-[9px] font-bold text-[#556B2F] block">พิมพ์ชื่อประเภทอ้างอิงใหม่:</span>
                <input
                  type="text"
                  value={newCustomType}
                  onChange={(e) => setNewCustomType(e.target.value)}
                  placeholder="เช่น Exam Archive"
                  className="w-full p-1.5 border border-[#D0DBCE] rounded-lg text-xs font-bold outline-none"
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
                    onClick={handleAddNewReferenceType}
                    className="px-2 py-1 bg-[#7A9A5C] text-white font-bold rounded"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Exam Source (Required) with searchable dropdown */}
          <div className="md:col-span-2 space-y-1 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-[#556B2F] block">
              ชื่อข้อสอบอ้างอิง / แหล่งที่มา (Exam Source) <span className="text-red-500">*</span>
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
                placeholder="พิมพ์เพื่อค้นหา หรือ เพิ่มแหล่งข้อมูล..."
                className="w-full p-2 bg-white border border-[#D0DBCE] rounded-xl text-xs font-bold text-[#3E4A2E] outline-none focus:ring-2 focus:ring-[#8EAA6B]"
              />
              {showSourceDropdown && (
                <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-[#D0DBCE] rounded-xl shadow-lg p-1.5 space-y-1 text-left">
                  <div className="px-2 py-0.5 text-[9px] font-bold text-[#556B2F] bg-[#F4F6F0] rounded">
                    🔍 แนะนำและสืบค้นในระบบ:
                  </div>
                  {(() => {
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
                          ไม่พบคีย์เวิร์ดที่ค้นหา
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
                            if (referenceTypes.includes(s.source_category)) {
                              setSourceCategory(s.source_category);
                            }
                          }
                          if (s.publication_year) setSourcePubYear(s.publication_year);
                          setShowSourceDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-[#F4F6F0] rounded-lg transition-colors flex flex-col"
                      >
                        <span className="font-bold text-gray-800">{s.source_name}</span>
                        <span className="text-[9px] text-gray-400">
                          {s.is_suggested ? "✨ ยอดนิยมในไทย" : `ปี: ${s.publication_year || "ไม่ระบุ"} | ประเภท: ${s.source_category || "N/A"}`}
                        </span>
                      </button>
                    ));
                  })()}

                  {/* Option to create new source inline (AppSheet style) */}
                  {!sourcesList.some((s: any) => s.source_name.toLowerCase() === sourceName.toLowerCase().trim()) && sourceName.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCreateNewSourceInline(sourceName)}
                      disabled={isAddingSource}
                      className="w-full text-left px-2.5 py-2 mt-1 text-xs font-bold bg-[#E8EFE3] text-[#556B2F] hover:bg-[#DCE7D5] rounded-lg transition-colors flex items-center gap-1.5 border-t border-[#D0DBCE]"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <div>
                        <span className="block">เพิ่มแหล่งอ้างอิงใหม่: "<strong>{sourceName}</strong>"</span>
                        <span className="text-[9px] text-[#7A9A5C] font-semibold block">คลิกลงทะเบียนลงฐานข้อมูล</span>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSourceDropdown(false)}
                    className="w-full text-center py-1 text-[9px] text-gray-400 hover:text-gray-600 font-bold border-t border-gray-100 mt-1"
                  >
                    ปิดหน้าต่างค้นหา ✖
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. Exam Year (Optional) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#556B2F] block">
              ปีข้อสอบ (Exam Year)
            </label>
            <input
              type="text"
              value={sourcePubYear}
              onChange={(e) => setSourcePubYear(e.target.value)}
              placeholder="เช่น 2025 หรือ 2568"
              className="w-full p-2 bg-white border border-[#D0DBCE] rounded-xl text-xs font-bold text-[#3E4A2E] outline-none focus:ring-2 focus:ring-[#8EAA6B]"
            />
          </div>

        </div>

        {/* 4. AI Instruction (Optional) */}
        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-bold text-[#556B2F] block">
            คำสั่งสไตล์ข้อสอบ AI (AI Instruction - Optional)
          </label>
          <textarea
            rows={2}
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder="เช่น ออกโจทย์ให้คล้ายข้อสอบ Suankularb แต่เปลี่ยนตัวเลือกและเพิ่มความซับซ้อนของคำกริยาขึ้นอีกนิด"
            className="w-full p-2 bg-white border border-[#D0DBCE] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8EAA6B]"
          />
        </div>
      </div>

      {/* GENERATION PARAMS STEP 2: Adjustment form */}
      <div className="border border-[#D0DBCE] bg-white rounded-2xl p-4 space-y-4 text-left">
        <div className="flex items-center gap-2 border-b border-[#D0DBCE] pb-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <h4 className="font-bold text-xs text-[#3E4A2E]">⚙️ ปรับรายละเอียดพารามิเตอร์สังเคราะห์ (Synthesis Parameters)</h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Target Grade level */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">Target Grade (ระดับชั้น)</label>
            <select
              value={engineGrade}
              onChange={(e) => setEngineGrade(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            >
              <option value="ป.1">ป.1 (Primary 1)</option>
              <option value="ป.2">ป.2 (Primary 2)</option>
              <option value="ป.3">ป.3 (Primary 3)</option>
              <option value="ป.4">ป.4 (Primary 4)</option>
              <option value="ป.5">ป.5 (Primary 5)</option>
              <option value="ป.6">ป.6 (Primary 6)</option>
            </select>
          </div>

          {/* CEFR level */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">CEFR Standard Level</label>
            <select
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            >
              <option value="Pre-A1">Pre-A1 (Novice)</option>
              <option value="A1">A1 (Beginner)</option>
              <option value="A2">A2 (Elementary)</option>
              <option value="B1">B1 (Intermediate)</option>
            </select>
          </div>

          {/* Topic to generate */}
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-gray-500 block">Worksheet Topic (หัวข้อใบงาน)</label>
            <input
              type="text"
              value={isEngineCustomTopic ? engineCustomTopicText : engineTopic}
              onChange={(e) => {
                setIsEngineCustomTopic(true);
                setEngineCustomTopicText(e.target.value);
              }}
              placeholder="หัวข้อการประเมิน เช่น Tenses, School Objects, Vocab..."
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none font-semibold text-[#3E4A2E]"
            />
          </div>

          {/* Grammar Focus */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">ไวยากรณ์หลัก (Grammar Focus)</label>
            <input
              type="text"
              value={grammarFocus}
              onChange={(e) => setGrammarFocus(e.target.value)}
              placeholder="เช่น Present Simple, Pronouns..."
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            />
          </div>

          {/* Vocabulary Level / Theme */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">กลุ่มคลังคำศัพท์ (Vocabulary Focus)</label>
            <input
              type="text"
              value={vocabularyTheme}
              onChange={(e) => setVocabularyTheme(e.target.value)}
              placeholder="เช่น Jobs, Foods, Animals..."
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            />
          </div>

          {/* Learning objectives */}
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-gray-500 block">จุดประสงค์การเรียนรู้หลัก (Learning Objective)</label>
            <input
              type="text"
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              placeholder="เพื่อทดสอบทักษะการใช้..."
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            />
          </div>

          {/* Worksheet exercise Style */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">Exercise Format (รูปแบบข้อสอบ)</label>
            <select
              value={engineFormat}
              onChange={(e) => setEngineFormat(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none font-semibold text-gray-700"
            >
              <option value="Multiple Choice">Multiple Choice (เลือกตอบ)</option>
              <option value="Fill in the Blanks">Fill in the Blanks (เติมคำในช่องว่าง)</option>
              <option value="Match Words / Meanings">Match Words (จับคู่คำศัพท์)</option>
              <option value="Yes / No Questions">Yes / No Questions (คำถามใช่หรือไม่)</option>
              <option value="Sentence Unscramble">Sentence Unscramble (เรียงประโยค)</option>
              <option value="Reading Comprehension">Reading Comprehension (อ่านจับใจความ)</option>
            </select>
          </div>

          {/* Number of questions */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">Number of Questions</label>
            <select
              value={engineNumQuestions}
              onChange={(e) => setEngineNumQuestions(Number(e.target.value))}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            >
              <option value="3">3 ข้อ</option>
              <option value="5">5 ข้อ</option>
              <option value="10">10 ข้อ</option>
              <option value="15">15 ข้อ</option>
            </select>
          </div>

          {/* Language instructions */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">Language (ภาษาของโจทย์คำชี้แจง)</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            >
              <option value="English Only">English Only</option>
              <option value="English and Thai">English and Thai (คู่ขนาน)</option>
            </select>
          </div>

          {/* Difficulty level */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">Difficulty (ระดับความยากง่าย)</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none"
            >
              <option value="Easy">Easy (ง่ายสำหรับวัยเริ่มต้น)</option>
              <option value="Medium">Medium (ปานกลางอิงมาตรฐานหลักสูตร)</option>
              <option value="Hard">Hard (ยากและท้าทายความสามารถ)</option>
            </select>
          </div>
        </div>

        {/* Answer Key Toggle */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            id="include_answer_key_engine"
            checked={includeAnswerKey}
            onChange={(e) => setIncludeAnswerKey(e.target.checked)}
            className="w-4 h-4 rounded text-[#7A9A5C] border-gray-300 focus:ring-[#8EAA6B]"
          />
          <label htmlFor="include_answer_key_engine" className="text-xs font-semibold text-[#3E4A2E] cursor-pointer">
            แนบเฉลยท้ายใบงานพร้อมวิเคราะห์คำตอบละเอียด (Include Detailed Answer Key & Explanations)
          </label>
        </div>
      </div>

      {/* GENERATE ACTION */}
      <button
        type="button"
        disabled={isLoading || isAnalyzing || !sourceName.trim()}
        onClick={handleApproveAndGenerate}
        className="w-full py-3.5 px-4 bg-[#556B2F] hover:bg-[#3E4A2E] active:bg-[#2A331F] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            กำลังสังเคราะห์แบบประเมินประยุกต์ใหม่ด้วย AI Data Engine...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            สั่งผลิตข้อสอบประยุกต์ใหม่ (Generate Custom Worksheet) ⚡
          </>
        )}
      </button>

    </div>
  );
}
