import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, AlertCircle, Database, CheckCircle2, Layers, Tag, Target, FileText, Compass } from "lucide-react";
import { QuestionBankEntry } from "../types";
import { 
  PRIMARY_GRADES, 
  PRIMARY_TOPICS, 
  LEARNING_STAGES, 
  STAGE_KEYS, 
  getStageBadge 
} from "../constants/learningPath";

interface WorksheetFormProps {
  onSubmit: (params: {
    grade: string;
    topic: string;
    learningStage: string;
    focus: string;
    exerciseStyle: string;
    numQuestions: number;
    customPrompt: string;
    includeAnswerKey: boolean;
  }) => void;
  isLoading: boolean;
  onOpenCurriculumGuide: () => void;
  currentUserRole?: string;
}

export default function WorksheetForm({ onSubmit, isLoading, onOpenCurriculumGuide, currentUserRole }: WorksheetFormProps) {
  const [questionBank, setQuestionBank] = useState<QuestionBankEntry[]>([]);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Grade
  const [grade, setGrade] = useState("ป.1");
  
  // 2. Topic
  const [topic, setTopic] = useState(PRIMARY_TOPICS[0]);
  const [customTopicInput, setCustomTopicInput] = useState("");

  // 3. Learning Stage
  const [learningStage, setLearningStage] = useState("Vocabulary & Meaning");

  // 4. Focus / Sub-skill
  const currentStageData = LEARNING_STAGES[learningStage] || LEARNING_STAGES["Vocabulary & Meaning"];
  const [focus, setFocus] = useState(currentStageData.focusOptions[0]);

  // 5. Worksheet Type
  const [exerciseStyle, setExerciseStyle] = useState(currentStageData.worksheetTypes[0]?.value || "vocabulary-sheet");

  // 6. Number of Questions & Extras
  const [numQuestions, setNumQuestions] = useState(10);
  const [customPrompt, setCustomPrompt] = useState("");
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);

  // Fetch Question Bank from backend for count indicators
  const fetchBankData = async () => {
    setIsFetchingBank(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/question-bank");
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลคลังข้อสอบได้");
      }
      const data: QuestionBankEntry[] = await res.json();
      setQuestionBank(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch question bank error:", err);
      setFetchError(err.message || "Failed to load Question Bank");
    } finally {
      setIsFetchingBank(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, []);

  // When Learning Stage changes, reset Focus & Worksheet Type automatically
  const handleStageChange = (newStage: string) => {
    setLearningStage(newStage);
    const stageData = LEARNING_STAGES[newStage];
    if (stageData) {
      setFocus(stageData.focusOptions[0] || "");
      setExerciseStyle(stageData.worksheetTypes[0]?.value || "");
    }
  };

  // Calculate matching items count in local bank
  const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
  const activeTopic = customTopicInput.trim() || topic;
  const normTopic = normalize(activeTopic);

  const itemsForGrade = questionBank.filter((q) => (q.grade || "ป.3") === grade);
  const matchingQuestionsCount = itemsForGrade.filter((q) => {
    if (!normTopic || activeTopic === "ทุกหัวข้อ") return true;
    const normQT = normalize(q.topic || "");
    return normQT.includes(normTopic) || normTopic.includes(normQT);
  }).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTopic = customTopicInput.trim() || topic || "Food & Drinks (อาหารและเครื่องดื่ม)";
    onSubmit({
      grade,
      topic: finalTopic,
      learningStage,
      focus,
      exerciseStyle,
      numQuestions: numQuestions > 0 ? numQuestions : 10,
      customPrompt: customPrompt.trim(),
      includeAnswerKey
    });
  };

  const getGradeVibeInfo = () => {
    switch (grade) {
      case "ป.1": return "ป.1: Vocabulary (150-200 words). Short words, simple Matching & Circle actions.";
      case "ป.2": return "ป.2: Vocabulary (250-300 words). Simple Is/Are, basic Yes/No or Wh-questions.";
      case "ป.3": return "ป.3: Vocabulary (350-450 words). Expressing simple emotions & needs (I like, I am).";
      case "ป.4": return "ป.4: Vocabulary (550-700 words). Abstracts & sequences (First, Next, Then, Finally).";
      case "ป.5": return "ป.5: Vocabulary (750-950 words). Compound clauses with 'because', finding main ideas.";
      case "ป.6": return "ป.6: Vocabulary (1050-1200 words). Complex Wh-questions (Why, How), reading brief essays.";
      default: return "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-[#E1E8D8] shadow-sm text-[#3E4A2E]">
      {fetchError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#F0FDF4] border border-[#8EE4AF] p-3.5 rounded-xl space-y-1">
        <div className="flex items-center gap-2 text-[#379683] font-bold text-xs">
          <Compass className="w-4 h-4" />
          <span>ระบบออกแบบใบงานตาม Learning Path ภาษาอังกฤษประถมศึกษา</span>
        </div>
        <p className="text-[11px] text-[#556B2F] leading-relaxed">
          เริ่มต้นจากระดับชั้น ➔ เลือกหัวข้อ ➔ กำหนดเป้าหมายการเรียนรู้ (Learning Stage) ➔ จุดเน้นย่อย ➔ เลือกประเภทใบงานที่เหมาะสม
        </p>
      </div>

      {/* 1. Grade Level */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block flex items-center gap-1.5">
            <span className="w-5 h-5 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px]">1</span>
            1. ระดับชั้นเรียน (Target Grade)
          </label>
          <button
            type="button"
            onClick={onOpenCurriculumGuide}
            className="flex items-center text-xs font-bold text-[#6B8E23] hover:text-[#556B2F] transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" /> ดูเกณฑ์หลักสูตร
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRIMARY_GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`py-2.5 px-1.5 text-center font-bold font-friendly rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
                grade === g
                  ? "bg-[#F0FDF4] border-[#6B8E23] text-[#6B8E23] shadow-sm ring-1 ring-[#6B8E23]"
                  : "bg-white border-[#E1E8D8] text-[#556B2F] hover:bg-[#F0FDF4] hover:border-[#6B8E23]/30"
              }`}
            >
              <span>{g}</span>
            </button>
          ))}
        </div>
        <div className="flex items-start space-x-1.5 p-2.5 bg-[#F0FDF4] border border-[#E1E8D8] rounded-xl text-[11px] text-[#556B2F] font-medium leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-[#6B8E23] shrink-0 mt-0.5" />
          <span>{getGradeVibeInfo()}</span>
        </div>
      </div>

      {/* 2. Topic / Unit */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block flex items-center gap-1.5">
          <span className="w-5 h-5 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px]">2</span>
          2. หัวข้อบทเรียน (Topic / Unit)
        </label>

        <select
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setCustomTopicInput("");
          }}
          className="w-full p-3 bg-white border border-[#E1E8D8] rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#6B8E23] font-semibold text-[#3E4A2E] cursor-pointer"
        >
          {PRIMARY_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Custom Topic Input field */}
        <div className="pt-1">
          <input
            type="text"
            value={customTopicInput}
            onChange={(e) => setCustomTopicInput(e.target.value)}
            placeholder="หรือระบุหัวข้อบทเรียนเองเพิ่มเติม (เช่น Greeting, Feelings, Classroom Rules)"
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#6B8E23] focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* 3. Learning Stage */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block flex items-center gap-1.5">
          <span className="w-5 h-5 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px]">3</span>
          3. ขั้นตอนการเรียนรู้ (Learning Stage)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STAGE_KEYS.map((sKey) => {
            const stage = LEARNING_STAGES[sKey];
            const isSelected = learningStage === sKey;

            return (
              <button
                key={sKey}
                type="button"
                onClick={() => handleStageChange(sKey)}
                className={`p-3 text-left rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#F0FDF4] border-[#6B8E23] text-[#3E4A2E] ring-2 ring-[#6B8E23]/40 shadow-xs"
                    : "bg-white border-[#E1E8D8] hover:bg-emerald-50/50 hover:border-[#6B8E23]/40 text-gray-700"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block">{stage.name}</span>
                  <span className={`text-[10px] inline-block px-2 py-0.2 rounded-md border font-semibold ${stage.colorClass}`}>
                    {stage.badge}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[#6B8E23] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Focus / Sub-skill */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block flex items-center gap-1.5">
          <span className="w-5 h-5 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px]">4</span>
          4. จุดเน้นย่อย (Focus / Sub-skill) สำหรับ {currentStageData.shortName}
        </label>

        <div className="flex flex-wrap gap-2">
          {currentStageData.focusOptions.map((fOpt) => {
            const isSelected = focus === fOpt;
            return (
              <button
                key={fOpt}
                type="button"
                onClick={() => setFocus(fOpt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#6B8E23] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{fOpt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Worksheet Type (Filtered specifically for this Stage) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block flex items-center gap-1.5">
          <span className="w-5 h-5 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px]">5</span>
          5. รูปแบบใบงานที่เหมาะสม (Worksheet Type)
        </label>

        <div className="grid grid-cols-1 gap-2">
          {currentStageData.worksheetTypes.map((wType) => {
            const isSelected = exerciseStyle === wType.value;
            return (
              <button
                key={wType.value}
                type="button"
                onClick={() => setExerciseStyle(wType.value)}
                className={`p-3 text-left rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#F0FDF4] border-[#6B8E23] text-[#3E4A2E] ring-1 ring-[#6B8E23]"
                    : "bg-white border-[#E1E8D8] hover:border-[#6B8E23]/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#6B8E23]" />
                    <span className="text-xs font-bold text-[#3E4A2E] font-friendly">{wType.label}</span>
                  </div>
                  <p className="text-[10px] text-[#8AA668] mt-1 pl-6 leading-relaxed">{wType.desc}</p>
                </div>
                {isSelected && (
                  <span className="text-[10px] bg-[#6B8E23] text-white font-bold px-2 py-0.5 rounded-md">
                    เลือกอยู่
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Number of questions selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block flex items-center gap-1.5">
            <span className="w-5 h-5 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-[10px]">6</span>
            6. จำนวนข้อและส่วนประกอบใบงาน (Questions & Options)
          </label>
          <span className="text-xs font-bold text-[#6B8E23] bg-[#F0FDF4] border border-[#E1E8D8] px-2.5 py-0.5 rounded-full">
            {numQuestions} ข้อ
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#F4F7F2]/50 p-2.5 rounded-xl border border-[#E1E8D8]/60">
          {[5, 10, 15, 20, 30, 50, 80].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setNumQuestions(num)}
              className={`py-1.5 px-3 font-bold text-xs rounded-lg border transition cursor-pointer ${
                numQuestions === num
                  ? "bg-[#6B8E23] text-white border-[#6B8E23]"
                  : "bg-white text-[#556B2F] border-[#E1E8D8] hover:bg-[#F0FDF4]"
              }`}
            >
              {num} ข้อ
            </button>
          ))}
        </div>
      </div>

      {/* Custom instructions / prompt */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#556B2F] block">
          คำสั่งเพิ่มเติมถึงระบบ (Additional Instructions)
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="เช่น เน้นรูปภาพผลไม้และเครื่องดื่ม, เพิ่มบรรทัดรอยคัด, ใส่คำแปลศัพท์ภาษาไทยเล็กๆ"
          rows={2}
          className="w-full p-3 bg-white border border-[#E1E8D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6B8E23] text-[#3E4A2E] placeholder-[#8AA668]/60 leading-relaxed font-sans"
        />
      </div>

      {/* Options: Include Answer Key */}
      <div className="p-4 bg-[#FFF1A7]/30 border border-[#8EE4AF] rounded-2xl flex items-start space-x-3 transition-all duration-300 hover:bg-[#FFF1A7]/45">
        <input
          type="checkbox"
          id="includeAnswerKey"
          checked={includeAnswerKey}
          onChange={(e) => setIncludeAnswerKey(e.target.checked)}
          className="mt-1 h-4.5 w-4.5 rounded border-[#8EE4AF] text-[#379683] focus:ring-[#379683] cursor-pointer"
        />
        <div className="space-y-0.5">
          <label htmlFor="includeAnswerKey" className="text-xs font-bold text-[#253334] cursor-pointer flex items-center gap-1.5 font-friendly">
            เฉลยท้ายใบงาน (Include Answer Key) 🔑
          </label>
          <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
            แนบเฉลยและคำอธิบายภาษาไทยในหน้าถัดไปของใบงานเพื่อความสะดวกในการตรวจ
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !currentUserRole}
        className={`w-full py-4 font-bold rounded-2xl shadow-md transition duration-300 transform active:scale-[0.98] flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer font-friendly ${
          currentUserRole === "admin" 
            ? "bg-sky-600 text-white hover:bg-sky-700" 
            : !currentUserRole 
            ? "bg-gray-300 text-gray-500" 
            : "bg-[#6B8E23] text-white hover:bg-[#556B2F]"
        }`}
      >
        <Sparkles className="w-5 h-5 animate-pulse text-[#D4E4BC]" />
        <span>
          {isLoading 
            ? "กำลังดึงข้อสอบและจัดพิมพ์ Worksheet ตาม Learning Path..." 
            : !currentUserRole 
            ? "กรุณาเข้าสู่ระบบก่อน" 
            : "สร้าง Worksheet ตาม Learning Path 📚"}
        </span>
      </button>
    </form>
  );
}
