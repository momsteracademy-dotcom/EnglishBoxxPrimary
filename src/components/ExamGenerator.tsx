import React, { useState } from "react";
import { GeneratedExamItem, ExamGenerationParams } from "../types";
import { 
  PRIMARY_GRADES, 
  PRIMARY_TOPICS, 
  LEARNING_STAGES, 
  STAGE_KEYS, 
  DIFFICULTY_OPTIONS, 
  getStageBadge 
} from "../constants/learningPath";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Sliders, 
  FileCheck, 
  BookOpen, 
  Check, 
  X, 
  Edit3, 
  Save, 
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  Languages,
  Target,
  FileText
} from "lucide-react";

interface ExamGeneratorProps {
  currentUser?: any;
  onSelectWorksheetForPreview?: (worksheetData: any) => void;
}

export default function ExamGenerator({ currentUser, onSelectWorksheetForPreview }: ExamGeneratorProps) {
  // Form State initialized with Unified Learning Path
  const initialStage = "Vocabulary & Meaning";
  const initialStageData = LEARNING_STAGES[initialStage];

  const [params, setParams] = useState<ExamGenerationParams>({
    grade: "ป.2",
    topic: PRIMARY_TOPICS[0],
    learningStage: initialStage,
    focus: initialStageData.focusOptions[0],
    questionType: initialStageData.examQuestionTypes[0].value,
    difficulty: "Medium",
    numQuestions: 10
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [examList, setExamList] = useState<GeneratedExamItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<GeneratedExamItem | null>(null);

  const handleStageChange = (newStage: string) => {
    const stageData = LEARNING_STAGES[newStage];
    setParams(prev => ({
      ...prev,
      learningStage: newStage,
      focus: stageData ? stageData.focusOptions[0] : "",
      questionType: stageData && stageData.examQuestionTypes[0] ? stageData.examQuestionTypes[0].value : "multiple-choice"
    }));
  };

  // Handler for Generating Exam
  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.topic.trim()) {
      setStatusMessage({ type: "error", text: "กรุณาระบุ Worksheet Topic (หัวข้อข้อสอบ) ก่อนสร้างค่ะ" });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      // Call endpoint to generate questions
      const res = await fetch("/api/generate-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: params.grade,
          topic: params.topic,
          learningStage: params.learningStage,
          focus: params.focus,
          exerciseStyle: params.questionType,
          difficulty: params.difficulty,
          numQuestions: params.numQuestions,
          email: currentUser?.email || "admin@example.com"
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "เกิดข้อผิดพลาดในการสร้างข้อสอบ");
      }

      const data = await res.json();
      const rawQuestions = data.questions || [];

      // Convert raw questions into GeneratedExamItem with status = "pending" (รอตรวจสอบ)
      const formattedItems: GeneratedExamItem[] = rawQuestions.map((q: any, idx: number) => ({
        id: `exam_gen_${Date.now()}_${idx + 1}`,
        questionText: q.questionText || q.question_text || "",
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer || q.correct_answer || "",
        explanation: q.explanation || "ไม่มีคำอธิบายเพิ่มเติม",
        status: "pending", // Default status: รอตรวจสอบ
        grade: params.grade,
        topic: params.topic,
        learningStage: params.learningStage,
        focus: params.focus,
        questionType: params.questionType,
        difficulty: params.difficulty
      }));

      setExamList(formattedItems);
      setStatusMessage({
        type: "success",
        text: `✨ สร้างข้อสอบสำเร็จ ${formattedItems.length} ข้อ! ข้อสอบทั้งหมดอยู่ในสถานะ "รอตรวจสอบ" กรุณาตรวจสอบก่อนกด Approve เพื่อเข้าคลังข้อสอบค่ะ`
      });
    } catch (err: any) {
      console.error("Error generating exam:", err);
      setStatusMessage({
        type: "error",
        text: `❌ เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถสร้างข้อสอบได้"}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve Single Question
  const handleApproveSingle = async (index: number) => {
    const item = examList[index];
    if (!item) return;

    try {
      const res = await fetch("/api/admin/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          subject: "English",
          grade: item.grade,
          topic: item.topic,
          learning_stage: item.learningStage,
          focus: item.focus,
          question_type: item.questionType,
          difficulty: item.difficulty,
          question_text: item.questionText,
          options: item.options,
          correct_answer: item.correctAnswer,
          explanation: item.explanation,
          ai_generated: "Yes",
          generation_method: "Exam Creator Approved",
          created_by: currentUser?.email || "admin"
        })
      });

      if (res.ok) {
        const updated = [...examList];
        updated[index] = { ...updated[index], status: "approved" };
        setExamList(updated);
        setStatusMessage({
          type: "success",
          text: `🟢 อนุมัติข้อสอบข้อที่ ${index + 1} เข้าสู่คลังข้อสอบสำเร็จแล้ว!`
        });
      } else {
        const err = await res.json();
        if (err.duplicate) {
          setStatusMessage({
            type: "info",
            text: `⚠️ ข้อสอบข้อที่ ${index + 1} มีอยู่แล้วในคลังข้อสอบ (${err.error || "ตรวจพบข้อสอบซ้ำ - ข้ามการบันทึก"})`
          });
        } else {
          alert("ไม่สามารถอนุมัติข้อสอบได้: " + (err.error || ""));
        }
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการอนุมัติข้อสอบ");
    }
  };

  // Reject Single Question
  const handleRejectSingle = async (index: number) => {
    const item = examList[index];
    if (!item) return;

    const reason = window.prompt("ระบุเหตุผลในการปฏิเสธ (ถ้ามี):", "") || "ไม่ผ่านการตรวจสอบมาตรฐาน";

    try {
      await fetch("/api/admin/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          subject: "English",
          grade: item.grade,
          topic: item.topic,
          learning_stage: item.learningStage,
          focus: item.focus,
          question_type: item.questionType,
          difficulty: item.difficulty,
          question_text: item.questionText,
          options: item.options,
          correct_answer: item.correctAnswer,
          explanation: item.explanation,
          status: "rejected",
          reject_reason: reason,
          reviewed_by: currentUser?.email || "admin",
          reviewed_at: new Date().toISOString(),
          ai_generated: "Yes",
          created_by: currentUser?.email || "admin"
        })
      });

      const updated = [...examList];
      updated[index] = { ...updated[index], status: "rejected" };
      setExamList(updated);
      setStatusMessage({
        type: "info",
        text: `🔴 ปฏิเสธข้อสอบข้อที่ ${index + 1} เรียบร้อยแล้ว (บันทึกสถานะ Rejected)`
      });
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการปฏิเสธข้อสอบ");
    }
  };

  // Approve ALL Pending Questions
  const handleApproveAll = async () => {
    const pendingItems = examList.filter((x) => x.status === "pending" || x.status === "rejected");
    if (pendingItems.length === 0) {
      alert("ไม่มีข้อสอบที่รอการอนุมัติค่ะ");
      return;
    }

    try {
      const res = await fetch("/api/admin/question-bank/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: pendingItems.map((item) => ({
            id: item.id,
            subject: "English",
            grade: item.grade,
            topic: item.topic,
            learning_stage: item.learningStage,
            focus: item.focus,
            question_type: item.questionType,
            difficulty: item.difficulty,
            question_text: item.questionText,
            options: item.options,
            correct_answer: item.correctAnswer,
            explanation: item.explanation,
            status: "approved",
            reviewed_by: currentUser?.email || "admin",
            reviewed_at: new Date().toISOString(),
            ai_generated: "Yes",
            generation_method: "Exam Creator Batch Approved",
            created_by: currentUser?.email || "admin"
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updated = examList.map((x) => ({ ...x, status: "approved" as const }));
        setExamList(updated);
        const skippedText = data.skippedDuplicates > 0 ? ` (ข้ามข้อสอบซ้ำ ${data.skippedDuplicates} ข้อ)` : "";
        setStatusMessage({
          type: "success",
          text: `🟢 อนุมัติข้อสอบสำเร็จ ${data.count || 0} ข้อ${skippedText} นำเข้าสู่คลังข้อสอบเรียบร้อยแล้ว!`
        });
      } else {
        const err = await res.json();
        alert("เกิดข้อผิดพลาดในการอนุมัติทั้งหมด: " + (err.error || ""));
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // Reject ALL Pending Questions
  const handleRejectAll = async () => {
    const pendingItems = examList.filter((x) => x.status === "pending" || x.status === "approved");
    if (pendingItems.length === 0) {
      alert("ไม่มีข้อสอบที่รอดำเนินการค่ะ");
      return;
    }

    const reason = window.prompt("ระบุเหตุผลในการปฏิเสธทั้งหมด (ถ้ามี):", "") || "ยกเลิกทั้งชุด";

    try {
      const res = await fetch("/api/admin/question-bank/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: pendingItems.map((item) => ({
            id: item.id,
            subject: "English",
            grade: item.grade,
            topic: item.topic,
            learning_stage: item.learningStage,
            focus: item.focus,
            question_type: item.questionType,
            difficulty: item.difficulty,
            question_text: item.questionText,
            options: item.options,
            correct_answer: item.correctAnswer,
            explanation: item.explanation,
            status: "rejected",
            reject_reason: reason,
            reviewed_by: currentUser?.email || "admin",
            reviewed_at: new Date().toISOString(),
            ai_generated: "Yes",
            created_by: currentUser?.email || "admin"
          }))
        })
      });

      if (res.ok) {
        const updated = examList.map((x) => ({ ...x, status: "rejected" as const }));
        setExamList(updated);
        setStatusMessage({
          type: "info",
          text: `🔴 ปฏิเสธข้อสอบทั้งหมด ${pendingItems.length} ข้อเรียบร้อยแล้ว (บันทึกสถานะ Rejected)`
        });
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกการปฏิเสธข้อสอบ");
    }
  };

  // Save Inline Edits
  const handleSaveEdit = (index: number) => {
    if (!editForm) return;
    const updated = [...examList];
    updated[index] = editForm;
    setExamList(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  // Status Counts
  const pendingCount = examList.filter((x) => x.status === "pending").length;
  const approvedCount = examList.filter((x) => x.status === "approved").length;
  const rejectedCount = examList.filter((x) => x.status === "rejected").length;

  return (
    <div className="space-y-8 animate-fade-in pb-16 text-left font-sans">
      {/* Banner Title */}
      <div className="bg-gradient-to-r from-[#253334] via-[#3E4A2E] to-[#253334] text-white p-6 md:p-8 rounded-3xl shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#8EE4AF]/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2 text-[#8EE4AF] font-bold text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>AI Exam Creator & Approval Verification Workflow</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold font-friendly tracking-tight flex items-center gap-2">
          <span>🪄 การสร้างข้อสอบ & อนุมัติคลังข้อสอบ</span>
        </h1>

        <p className="text-xs md:text-sm text-[#D4E4BC] leading-relaxed max-w-3xl">
          สร้างข้อสอบภาษาอังกฤษ 100% (โจทย์ ตัวเลือก และเนื้อเรื่องเป็นภาษาอังกฤษล้วน) พร้อมเฉลยภาษาไทยที่มีคำแปลภาษาไทยและคำอธิบายประกอบครบถ้วน สามารถกำหนดจำนวนข้อสอบด่วน (20, 40, 60, 80 ข้อ) หรือพิมพ์กรอกตัวเลขจำนวนข้อได้เองตามต้องการ!
        </p>
      </div>

      {/* Alert Status Toast */}
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
            ) : statusMessage.type === "error" ? (
              <XCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <Clock className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <span className="font-bold">
              {statusMessage.type === "success" ? "ดำเนินการสำเร็จ!" : statusMessage.type === "error" ? "ข้อผิดพลาด:" : "แจ้งเตือน:"}
            </span>
            <p className="leading-relaxed text-gray-700">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* Grid: Left Parameter Controls Form, Right Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Generator Form Controls (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 font-friendly flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#379683]" />
              <span>1. กำหนดคุณลักษณะการสร้างข้อสอบ (Exam Specifications)</span>
            </h2>
            <span className="bg-[#E2F5E9] text-[#2E7D6F] font-bold text-[10px] px-3 py-1 rounded-full border border-[#8EE4AF]">
              Step 1 / 2
            </span>
          </div>

          <form onSubmit={handleGenerateExam} className="space-y-5">
            {/* 1. Grade Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                1. ระดับชั้น (Grade Level)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRIMARY_GRADES.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setParams({ ...params, grade: g })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      params.grade === g
                        ? "bg-[#379683] text-white border-[#379683] shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Topic / Unit */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                2. หัวข้อบทเรียน (Topic / Unit)
              </label>
              <select
                value={params.topic}
                onChange={(e) => setParams({ ...params, topic: e.target.value })}
                className="w-full text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#379683] focus:bg-white font-semibold text-gray-800"
              >
                {PRIMARY_TOPICS.map((top) => (
                  <option key={top} value={top}>{top}</option>
                ))}
              </select>

              <input
                type="text"
                value={params.topic}
                onChange={(e) => setParams({ ...params, topic: e.target.value })}
                placeholder="หรือพิมพ์ชื่อหัวข้อระบุเอง..."
                className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-[#379683]"
              />
            </div>

            {/* 3. Learning Stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                3. ขั้นตอนการเรียนรู้ (Learning Stage)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STAGE_KEYS.map((sKey) => {
                  const stage = LEARNING_STAGES[sKey];
                  const isSelected = params.learningStage === sKey;
                  return (
                    <button
                      key={sKey}
                      type="button"
                      onClick={() => handleStageChange(sKey)}
                      className={`p-2.5 text-left rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-50 border-[#379683] text-[#253334] font-bold shadow-xs"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs block">{stage.name}</span>
                        <span className={`text-[10px] inline-block px-2 py-0.2 rounded border ${stage.colorClass}`}>
                          {stage.badge}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#379683] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Focus / Sub-skill */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">4</span>
                4. จุดเน้นย่อย (Focus / Sub-skill)
              </label>
              <div className="flex flex-wrap gap-2">
                {(LEARNING_STAGES[params.learningStage]?.focusOptions || []).map((fOpt) => {
                  const isSelected = params.focus === fOpt;
                  return (
                    <button
                      key={fOpt}
                      type="button"
                      onClick={() => setParams({ ...params, focus: fOpt })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#379683] text-white shadow-xs"
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

            {/* 5. Question Type & Layout */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">5</span>
                5. ประเภทข้อสอบ (Question Type)
              </label>
              <select
                value={params.questionType}
                onChange={(e) => setParams({ ...params, questionType: e.target.value })}
                className="w-full text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#379683] focus:bg-white font-medium text-gray-800"
              >
                {(LEARNING_STAGES[params.learningStage]?.examQuestionTypes || []).map((qType) => (
                  <option key={qType.value} value={qType.value}>{qType.label}</option>
                ))}
              </select>
            </div>

            {/* 6. Difficulty Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">6</span>
                6. ระดับความยากง่าย (Difficulty Level)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "Easy", label: "ง่าย (Easy)", desc: "จำ / รู้จัก / พื้นฐาน" },
                  { id: "Medium", label: "ปานกลาง (Medium)", desc: "ใช้ความรู้ในบริบท" },
                  { id: "Hard", label: "ท้าทาย (Hard)", desc: "วิเคราะห์ / ประยุกต์" }
                ].map((diff) => (
                  <button
                    type="button"
                    key={diff.id}
                    onClick={() => setParams({ ...params, difficulty: diff.id })}
                    className={`p-3 rounded-2xl text-left border transition cursor-pointer space-y-0.5 ${
                      params.difficulty === diff.id
                        ? "bg-[#379683]/10 border-[#379683] text-[#253334]"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-bold text-xs block">{diff.label}</span>
                    <span className="text-[10px] text-gray-400 block">{diff.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Number of Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-[#379683] text-white rounded-full flex items-center justify-center text-[10px]">7</span>
                  7. จำนวนข้อสอบที่ต้องการสร้าง (Number of Questions)
                </label>
                <span className="text-[10px] text-[#379683] font-bold bg-[#E2F5E9] px-2.5 py-0.5 rounded-full border border-[#8EE4AF]">
                  กำหนดเองได้สูงสุด 80 ข้อ
                </span>
              </div>

              {/* Quick Preset Buttons & Custom Numeric Input */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">เลือกด่วน:</span>
                  {[10, 20, 40, 60, 80].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setParams({ ...params, numQuestions: num })}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        params.numQuestions === num
                          ? "bg-[#6B8E23] text-white border-[#6B8E23] shadow-xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {num} ข้อ
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-2xl">
                  <label className="text-xs font-bold text-gray-700 shrink-0">
                    หรือกรอกจำนวนตัวเลขเอง:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={params.numQuestions}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setParams({ ...params, numQuestions: Math.min(80, Math.max(1, val)) });
                    }}
                    className="w-28 text-sm font-black text-center bg-white border border-gray-300 rounded-xl py-2 px-3 outline-none focus:border-[#379683] focus:ring-2 focus:ring-[#379683]/20 text-gray-900"
                  />
                  <span className="text-xs font-bold text-gray-500">ข้อ</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-[#379683] hover:bg-[#2E7D6F] text-white font-bold py-4 rounded-2xl text-sm shadow-md transition hover:scale-[1.005] active:scale-[0.995] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>กำลังสร้างข้อสอบภาษาอังกฤษด้วย AI Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-[#8EE4AF]" />
                  <span>สร้างข้อสอบพร้อมเฉลย (Generate Exam Items) 🚀</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Instructions & Workflow Guide (Col 5) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="bg-gradient-to-br from-[#E2F5E9]/60 to-[#F4F7F2] border border-[#8EE4AF] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-[#253334] text-base font-friendly flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#379683]" />
              <span>ขั้นตอนการสร้างและอนุมัติข้อสอบ (Workflow Guide)</span>
            </h3>

            <div className="space-y-3 text-xs text-gray-700 leading-relaxed font-medium">
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80">
                <div className="w-6 h-6 rounded-full bg-[#379683] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">กำหนดสเปกข้อสอบ</h4>
                  <p className="text-gray-500 text-[11px]">เลือกชั้นเรียน บทเรียน รูปแบบโจทย์ ความยาก และระบุคำศัพท์เฉพาะที่ต้องการ</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">สถานะ "รอตรวจสอบ" (Pending)</h4>
                  <p className="text-gray-500 text-[11px]">ข้อสอบที่สร้างใหม่จะมาพร้อมคำเฉลยและอธิบาย สามารถแก้ไขข้อความก่อนนำเข้าคลังได้</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">กด Approve / Reject (อนุมัติ/ปฏิเสธ)</h4>
                  <p className="text-gray-500 text-[11px]">กด อนุมัติ (Approve) รายข้อ หรือ อนุมัติทั้งหมด เพื่อจัดเก็บลงคลังข้อสอบส่วนกลางทันที!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#3E4A2E] text-white p-5 rounded-3xl space-y-2 text-xs">
            <h4 className="font-bold text-[#D4E4BC] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#8EE4AF]" />
              <span>ประโยชน์ของคลังข้อสอบที่อนุมัติแล้ว</span>
            </h4>
            <p className="text-[#E1E8D8] text-[11px] leading-relaxed">
              ข้อสอบที่ผ่านการ อนุมัติ (Approved) จะถูกบันทึกไว้ใน Question Bank และพร้อมให้คุณครูท่านอื่นนำไปใช้ดึงเป็นชุดแบบฝึกหัดดาวน์โหลดได้ทันที โดยไม่ต้องรอเจนใหม่!
            </p>
          </div>
        </div>
      </div>

      {/* ==================== GENERATED EXAM LIST & APPROVAL SECTION ==================== */}
      {examList.length > 0 && (
        <div id="exam-verification-list" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
          {/* Header & Overall Status & Bulk Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900 font-friendly flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-[#379683]" />
                <span>2. รายการข้อสอบที่สร้างเรียบร้อย ({examList.length} ข้อ)</span>
              </h2>
              <p className="text-xs text-gray-500">
                หัวข้อ: <strong className="text-gray-800">{params.topic}</strong> • ชั้น: <strong className="text-gray-800">{params.grade}</strong> • รูปแบบ: <strong className="text-gray-800">{params.questionType}</strong>
              </p>
            </div>

            {/* Status Pills Counter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>รอตรวจสอบ: <strong>{pendingCount}</strong></span>
              </span>

              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>อนุมัติแล้ว: <strong>{approvedCount}</strong></span>
              </span>

              <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                <span>ยกเลิก: <strong>{rejectedCount}</strong></span>
              </span>
            </div>
          </div>

          {/* Bulk Control Bar (Approve All & Reject All) */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-700 font-medium">
              ⚡ <strong>ปุ่มควบคุมภาพรวมทั้งชุด:</strong> กดอนุมัติหรือยกเลิกข้อสอบที่รอดำเนินการทั้งหมดได้ในคลิกเดียว
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleApproveAll}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Approve All (อนุมัติทั้งหมดเข้าคลัง)</span>
              </button>

              <button
                type="button"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Reject All (ยกเลิกทั้งหมด)</span>
              </button>
            </div>
          </div>

          {/* Question Items Cards List */}
          <div className="space-y-4 pt-2">
            {examList.map((item, index) => {
              const isEditing = editingIndex === index;

              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-5 md:p-6 transition space-y-4 text-left ${
                    item.status === "approved"
                      ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                      : item.status === "rejected"
                      ? "bg-rose-50/30 border-rose-200 opacity-60"
                      : "bg-white border-amber-200 shadow-2xs"
                  }`}
                >
                  {/* Item Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#3E4A2E] text-white font-bold text-xs px-3 py-1 rounded-lg">
                        ข้อที่ {index + 1}
                      </span>

                      {/* Status Badge */}
                      {item.status === "pending" && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>สถานะ: รอตรวจสอบ (Pending)</span>
                        </span>
                      )}

                      {item.status === "approved" && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-3 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>อนุมัติแล้ว (Approved & Added to Bank)</span>
                        </span>
                      )}

                      {item.status === "rejected" && (
                        <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs px-3 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-700" />
                          <span>ยกเลิกแล้ว (Rejected)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700">{item.grade}</span>
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700">{item.questionType}</span>
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700">Diff: {item.difficulty}</span>
                    </div>
                  </div>

                  {/* Inline Editing Mode vs Display Mode */}
                  {isEditing && editForm ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">โจทย์คำถาม</label>
                        <input
                          type="text"
                          value={editForm.questionText}
                          onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                          className="w-full text-xs p-2.5 border rounded-lg bg-white"
                        />
                      </div>

                      {/* Options */}
                      {editForm.options.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">ตัวเลือก A-D</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {editForm.options.map((opt, optIdx) => (
                              <input
                                key={optIdx}
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...editForm.options];
                                  newOpts[optIdx] = e.target.value;
                                  setEditForm({ ...editForm, options: newOpts });
                                }}
                                className="text-xs p-2 border rounded-lg bg-white"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">เฉลยที่ถูกต้อง</label>
                        <input
                          type="text"
                          value={editForm.correctAnswer}
                          onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                          className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-emerald-800"
                        />
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">คำอธิบายเฉลย</label>
                        <textarea
                          rows={2}
                          value={editForm.explanation}
                          onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                          className="w-full text-xs p-2.5 border rounded-lg bg-white"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(index)}
                          className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> บันทึกการแก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(null);
                            setEditForm(null);
                          }}
                          className="bg-gray-200 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="space-y-3">
                      {/* Question Text */}
                      <h3 className="font-bold text-gray-900 text-sm md:text-base leading-relaxed">
                        {item.questionText}
                      </h3>

                      {/* Options Grid */}
                      {item.options && item.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {item.options.map((opt, optIdx) => {
                            const isCorrect =
                              opt.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase();
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                  isCorrect
                                    ? "bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold"
                                    : "bg-gray-50 border-gray-200 text-gray-700"
                                }`}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md">
                                    ✓ เฉลย
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Answer Key & Explanation Box (เฉลย + คำแปลภาษาไทย + คำอธิบายประกอบ) */}
                      <div className="bg-[#E2F5E9]/60 border border-[#8EE4AF] p-4 rounded-2xl text-xs space-y-2.5">
                        <div className="font-bold text-emerald-950 flex items-center justify-between flex-wrap gap-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>เฉลยที่ถูกต้อง:</span>
                            <span className="bg-emerald-200/80 text-emerald-950 px-2.5 py-0.5 rounded-md font-bold underline">
                              {item.correctAnswer}
                            </span>
                          </div>
                          <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            <span>มีคำแปลภาษาไทย & คำอธิบายประกอบ</span>
                          </span>
                        </div>

                        {item.explanation && (
                          <div className="bg-white/90 p-3 rounded-xl border border-emerald-100/80 text-gray-800 space-y-1.5 leading-relaxed text-[12px]">
                            <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs border-b border-gray-100 pb-1">
                              <span>💡 คำแปลภาษาไทยและคำอธิบายประกอบเฉลย:</span>
                            </div>
                            <div className="whitespace-pre-line text-slate-700 pl-1 font-sans">
                              {item.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Individual Action Buttons (Approve / Reject / Edit) */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(index);
                          setEditForm({ ...item });
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไขข้อความ</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRejectSingle(index)}
                          disabled={item.status === "rejected"}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-1.5 rounded-xl transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject (ปฏิเสธข้อนี้)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApproveSingle(index)}
                          disabled={item.status === "approved"}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve (อนุมัติข้อนี้)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500 font-medium">
              ✨ ข้อสอบที่อนุมัติแล้วจะถูกซิงก์ลงคลังข้อสอบ Firebase และไฟล์คลังส่วนกลางทันที
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleApproveAll}
                className="w-full sm:w-auto bg-[#379683] hover:bg-[#2E7D6F] text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#8EE4AF]" />
                <span>อนุมัติทั้งหมดที่รอดำเนินการ (Approve All)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
