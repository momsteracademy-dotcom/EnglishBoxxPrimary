import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Worksheet, WorksheetQuestion, TeacherProfile, SubscriptionPlan } from "../types";
import { 
  Printer, 
  Save, 
  Eye, 
  EyeOff, 
  FileText, 
  Edit3, 
  Check, 
  Plus, 
  Trash2, 
  Type, 
  HelpCircle,
  FileDown,
  Sparkles,
  Crown,
  Palette
} from "lucide-react";

interface WorksheetPreviewProps {
  worksheet: Worksheet | null;
  onUpdateWorksheet: (updated: Worksheet) => void;
  onSaveToHistory: () => void;
  isSaving: boolean;
  currentUser?: any;
  userPlan?: SubscriptionPlan;
  teacherProfile?: TeacherProfile | null;
  onSaveToRepository?: (worksheet: Worksheet) => Promise<void>;
  onLogDownload?: (worksheetId: string) => Promise<boolean>;
  onOpenBrandingModal?: () => void;
  onOpenSubscriptionModal?: () => void;
}

export default function WorksheetPreview({ 
  worksheet, 
  onUpdateWorksheet, 
  onSaveToHistory,
  isSaving,
  currentUser,
  userPlan = "free",
  teacherProfile,
  onSaveToRepository,
  onLogDownload,
  onOpenBrandingModal,
  onOpenSubscriptionModal
}: WorksheetPreviewProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [printAnswerKeyOnNewPage, setPrintAnswerKeyOnNewPage] = useState(true);
  const [useComicFont, setUseComicFont] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // e.g. 'title', 'instructions', 'passage', 'q-1-text', 'q-1-ans'
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Stable randomized right-items mapping for matching exercise
  const [shuffledMatchingRight, setShuffledMatchingRight] = useState<{ id: number; text: string; letter: string }[]>([]);

  // Sync showAnswerKey with worksheet.includeAnswerKey when it generates
  useEffect(() => {
    if (worksheet && worksheet.includeAnswerKey !== undefined) {
      setShowAnswerKey(worksheet.includeAnswerKey);
    }
  }, [worksheet]);

  // Calculate stable matching letters when worksheet or questions change
  useEffect(() => {
    if (worksheet && worksheet.questions.length > 0) {
      const rightItems = worksheet.questions
        .map((q) => q.matchingRight || q.correctAnswer)
        .filter(Boolean);
      
      // Shuffle them stably
      const shuffled = [...rightItems]
        .map((text, index) => ({ text, sort: Math.sin(index + 5) })) // deterministic pseudo-shuffle
        .sort((a, b) => a.sort - b.sort)
        .map((item, index) => ({
          id: index,
          text: item.text,
          letter: String.fromCharCode(65 + index), // A, B, C, D...
        }));
      setShuffledMatchingRight(shuffled);
    } else {
      setShuffledMatchingRight([]);
    }
  }, [worksheet]);

  if (!worksheet) {
    return (
      <div className="bg-[#8EE4AF]/10 border-2 border-dashed border-[#8EE4AF] rounded-3xl p-12 text-center text-[#253334] flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-[#E2F5E9] flex items-center justify-center text-[#379683]">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg font-friendly text-[#253334]">No Worksheet Generated Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm font-sans leading-relaxed">
            Select a grade level and topic on the left, then click "Generate" to cast some learning magic!
          </p>
        </div>
      </div>
    );
  }

  // Handle printing
  const handlePrint = async () => {
    if (!worksheet) return;
    if (currentUser && onLogDownload) {
      const allowed = await onLogDownload(worksheet.title || "ws_print_" + Date.now());
      if (!allowed) return;
    }
    window.print();
  };

  // Handle PDF Download via jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    if (!worksheet) return;
    if (currentUser && onLogDownload) {
      const allowed = await onLogDownload(worksheet.title || "ws_pdf_" + Date.now());
      if (!allowed) return;
    }

    const element = document.getElementById("printable-worksheet-content");
    if (!element) return;

    try {
      setIsGeneratingPdf(true);

      const canvas = await html2canvas(element, {
        scale: 2, // High DPI resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#FCFDFB",
        ignoreElements: (el) => el.classList.contains("no-print")
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeTitle = (worksheet.title || "worksheet")
        .replace(/[/\\?%*:|"<>]/g, "_")
        .trim();

      pdf.save(`${safeTitle}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("❌ เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาใช้ปุ่ม พิมพ์ (Print) แล้วเลือก Save as PDF แทนได้ค่ะ");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper to change fields
  const updateField = (field: keyof Worksheet, value: any) => {
    onUpdateWorksheet({
      ...worksheet,
      [field]: value
    });
  };

  // Update a single question
  const updateQuestion = (index: number, updatedQ: Partial<WorksheetQuestion>) => {
    const newQuestions = [...worksheet.questions];
    newQuestions[index] = { ...newQuestions[index], ...updatedQ };
    onUpdateWorksheet({
      ...worksheet,
      questions: newQuestions
    });
  };

  // Delete a question
  const deleteQuestion = (index: number) => {
    const newQuestions = worksheet.questions.filter((_, idx) => idx !== index)
      .map((q, idx) => ({ ...q, id: idx + 1 })); // re-index
    onUpdateWorksheet({
      ...worksheet,
      questions: newQuestions
    });
  };

  // Add a new empty question
  const addQuestion = () => {
    const style = shuffledMatchingRight.length > 0 ? "matching" : "mcq";
    const newQ: WorksheetQuestion = {
      id: worksheet.questions.length + 1,
      questionText: "Type your new question text here.",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "Teacher explanation or Thai translation.",
      matchingLeft: "Left Term",
      matchingRight: "Right Match"
    };
    onUpdateWorksheet({
      ...worksheet,
      questions: [...worksheet.questions, newQ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Worksheet Controls (No-Print) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2F5E9] shadow-sm flex flex-wrap gap-3 items-center justify-between no-print text-[#253334] text-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Subscription Plan Badge */}
          {onOpenSubscriptionModal && (
            <button
              onClick={onOpenSubscriptionModal}
              className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                userPlan === "pro" || userPlan === "admin"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black"
                  : userPlan === "premium"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
              title="ดูรายละเอียดแพ็กเกจสมาชิก"
            >
              <Crown className="w-3.5 h-3.5 mr-1" />
              <span>
                {userPlan === "pro" || userPlan === "admin"
                  ? "Pro 💎"
                  : userPlan === "premium"
                  ? "Premium 🌟"
                  : "Free Plan"}
              </span>
            </button>
          )}

          {/* Teacher Branding Settings Button */}
          {onOpenBrandingModal && (
            <button
              onClick={onOpenBrandingModal}
              className="flex items-center px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#2E7D6F] font-bold text-xs transition cursor-pointer"
              title="ตั้งค่าโลโก้ ชื่อครู ชื่อโรงเรียน"
            >
              <Palette className="w-3.5 h-3.5 mr-1.5 text-[#2E7D6F]" />
              <span>ตั้งค่าแบรนด์ครู 🎨</span>
            </button>
          )}

          {/* Font Toggle */}
          <button
            onClick={() => setUseComicFont(!useComicFont)}
            className={`flex items-center px-3 py-1.5 rounded-lg border transition ${
              useComicFont ? "bg-[#8EE4AF]/25 border-[#8EE4AF] text-[#253334]" : "bg-white border-[#E2F5E9] text-gray-500 hover:bg-[#E2F5E9]/30"
            }`}
            title="Switch typography layout"
          >
            <Type className="w-4 h-4 mr-1.5 text-[#379683]" />
            <span className="font-semibold text-xs">{useComicFont ? "Comic Font" : "Sans Font"}</span>
          </button>

          {/* Answer Key Toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`flex items-center px-3 py-1.5 rounded-lg border transition ${
              showAnswerKey ? "bg-[#8EE4AF]/25 border-[#8EE4AF] text-[#253334]" : "bg-white border-[#E2F5E9] text-gray-400 hover:bg-[#E2F5E9]/30"
            }`}
            title="Toggle displaying the answer key"
          >
            {showAnswerKey ? <Eye className="w-4 h-4 mr-1.5 text-[#379683]" /> : <EyeOff className="w-4 h-4 mr-1.5" />}
            <span className="font-semibold text-xs">{showAnswerKey ? "Answer Key On" : "Answer Key Off"}</span>
          </button>

          {/* New Page break settings */}
          {showAnswerKey && (
            <label className="flex items-center space-x-1.5 text-xs font-bold text-[#5A7E64] cursor-pointer">
              <input
                type="checkbox"
                checked={printAnswerKeyOnNewPage}
                onChange={(e) => setPrintAnswerKeyOnNewPage(e.target.checked)}
                className="rounded border-[#8EE4AF] text-[#379683] focus:ring-[#379683] h-4 w-4"
              />
              <span>Separate Key Page</span>
            </label>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Admin: Save to Shared Exam Repository */}
          {currentUser?.role === "admin" && onSaveToRepository && (
            <button
              onClick={() => onSaveToRepository(worksheet)}
              className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer text-xs"
              title="Save to Shared Exam Repository (คลังข้อสอบ)"
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>บันทึกลงคลังข้อสอบ 📚</span>
            </button>
          )}

          {/* Save to History */}
          <button
            onClick={onSaveToHistory}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-white text-[#253334] font-bold rounded-xl border border-[#E2F5E9] hover:bg-[#8EE4AF]/10 transition shadow-xs disabled:opacity-50 cursor-pointer text-xs"
          >
            <Save className="w-4 h-4 mr-1.5 text-[#379683]" />
            <span>{isSaving ? "Saving..." : "Save Worksheet"}</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center px-4 py-2 bg-[#8EE4AF] text-[#253334] font-bold rounded-xl hover:bg-[#77d99d] transition shadow-sm font-friendly cursor-pointer text-xs disabled:opacity-50"
            title="Download clean PDF file"
          >
            <FileDown className="w-4 h-4 mr-1.5 text-[#2E7D6F]" />
            <span>{isGeneratingPdf ? "Creating PDF..." : "Download PDF 📄"}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-[#379683] text-white font-bold rounded-xl hover:bg-[#2E7D6F] transition shadow-sm font-friendly cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print 🖨️</span>
          </button>
        </div>
      </div>

      {/* Actual A4 Simulated Sheet */}
      <div 
        className={`print-sheet bg-[#FCFDFB] border-2 border-[#8EE4AF] shadow-xl rounded-3xl p-8 md:p-12 text-[#253334] max-w-4xl mx-auto relative flex flex-col justify-between min-h-[297mm] ${
          useComicFont ? "font-friendly" : "font-sans"
        }`}
        id="printable-worksheet-content"
      >
        <div>
          {/* Decorative corner ribbons in pastel peach & lemon yellow */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#FFB7B2] rounded-tl-2xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#FFF1A7] rounded-tr-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#FFF1A7] rounded-bl-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#FFB7B2] rounded-br-2xl pointer-events-none"></div>

          {/* Teacher Branding & School Header Banner */}
          <div className="border-b-2 border-[#8EE4AF] pb-4 mb-6">
            {/* Logo and School Name Display */}
            {(teacherProfile?.school_name || teacherProfile?.logo_url) && (
              <div className={`mb-3 pb-3 border-b border-dashed border-[#8EE4AF]/60 flex items-center gap-4 ${
                teacherProfile.logo_position === "center"
                  ? "flex-col text-center justify-center"
                  : teacherProfile.logo_position === "right"
                  ? "flex-row-reverse justify-between text-right"
                  : "flex-row justify-between text-left"
              }`}>
                {teacherProfile.logo_url && (
                  <img
                    src={teacherProfile.logo_url}
                    alt="School/Teacher Logo"
                    className="h-12 md:h-14 object-contain max-w-[160px]"
                  />
                )}
                <div>
                  {teacherProfile.school_name && (
                    <h3 className="font-extrabold text-base md:text-lg text-[#253334] tracking-tight">
                      {teacherProfile.school_name}
                    </h3>
                  )}
                  {teacherProfile.teacher_name && (
                    <p className="text-xs md:text-sm text-[#379683] font-bold">
                      ผู้สอน: {teacherProfile.teacher_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-[#253334] mb-3">
              {/* Subject Field */}
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-[#379683]">วิชา (Subject):</span>
                {editingId === "subject" ? (
                  <input
                    type="text"
                    value={worksheet.subject || "ภาษาอังกฤษ (English)"}
                    onChange={(e) => updateField("subject", e.target.value)}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                    className="border-b border-[#379683] px-1 text-[#253334] focus:outline-none bg-transparent"
                  />
                ) : (
                  <span 
                    onClick={() => setEditingId("subject")} 
                    className="underline decoration-dashed decoration-[#8EE4AF] cursor-pointer hover:text-[#379683]"
                    title="Click to edit Subject"
                  >
                    {worksheet.subject || "ภาษาอังกฤษ (English)"}
                  </span>
                )}
              </div>

              {/* Grade Field */}
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-[#379683]">ชั้น (Grade):</span>
                <span className="bg-[#8EE4AF]/30 text-[#2E7D6F] px-2.5 py-0.5 rounded-md font-friendly">
                  {worksheet.gradeLabel}
                </span>
              </div>

              {/* Teacher Name Field */}
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-[#379683]">ครูผู้สอน (Teacher):</span>
                {editingId === "teacherName" ? (
                  <input
                    type="text"
                    value={worksheet.teacherName || teacherProfile?.teacher_name || ""}
                    onChange={(e) => updateField("teacherName", e.target.value)}
                    onBlur={() => setEditingId(null)}
                    autoFocus
                    placeholder="ชื่อครูผู้สอน..."
                    className="border-b border-[#379683] px-1 text-[#253334] focus:outline-none bg-transparent"
                  />
                ) : (
                  <span 
                    onClick={() => setEditingId("teacherName")} 
                    className="underline decoration-dashed decoration-[#8EE4AF] cursor-pointer hover:text-[#379683]"
                    title="Click to edit Teacher Name"
                  >
                    {worksheet.teacherName || teacherProfile?.teacher_name || "____________________"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Worksheet Title Header */}
          <div className="relative group text-center my-4">
            {editingId === "title" ? (
              <div className="flex items-center space-x-2 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={worksheet.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  onBlur={() => setEditingId(null)}
                  autoFocus
                  className="text-2xl md:text-3xl font-bold text-center text-[#253334] border-b-4 border-[#8EE4AF] w-full focus:outline-none py-1 bg-transparent font-friendly"
                />
                <button onClick={() => setEditingId(null)} className="no-print p-1 text-[#379683] hover:text-[#2E7D6F]">
                  <Check className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#253334] font-friendly tracking-tight">
                  {worksheet.title}
                </h1>
                <button
                  onClick={() => setEditingId("title")}
                  className="no-print p-1 text-gray-400 hover:text-[#379683] hover:bg-[#8EE4AF]/20 rounded-xl transition"
                  title="Edit Title"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Student Name/Class Header Box */}
        <div className="grid grid-cols-12 gap-3 border-2 border-dashed border-[#8EE4AF] rounded-2xl p-4 bg-[#8EE4AF]/10 text-xs md:text-sm font-bold text-[#253334] mb-8 font-sans">
          <div className="col-span-12 sm:col-span-6 flex items-center">
            <span className="mr-2 whitespace-nowrap text-[#379683] font-bold">Name (ชื่อ-นามสกุล):</span>
            <div className="border-b border-dashed border-gray-400 flex-1 h-5"></div>
          </div>
          <div className="col-span-6 sm:col-span-3 flex items-center">
            <span className="mr-2 whitespace-nowrap text-[#379683] font-bold">Class (ชั้น/ห้อง):</span>
            <div className="border-b border-dashed border-gray-400 flex-1 h-5"></div>
          </div>
          <div className="col-span-6 sm:col-span-3 flex items-center">
            <span className="mr-2 whitespace-nowrap text-[#379683] font-bold">No (เลขที่):</span>
            <div className="border-b border-dashed border-gray-400 flex-1 h-5"></div>
          </div>
          <div className="col-span-6 sm:col-span-6 flex items-center mt-1">
            <span className="mr-2 whitespace-nowrap text-[#379683] font-bold">Date (วันที่):</span>
            <div className="border-b border-dashed border-gray-400 flex-1 h-5"></div>
          </div>
          <div className="col-span-6 sm:col-span-6 flex items-center mt-1">
            <span className="mr-2 whitespace-nowrap text-[#379683] font-bold">Score (คะแนน):</span>
            <div className="border-b border-dashed border-gray-400 flex-1 h-5 text-right pr-2 text-gray-400 font-normal text-xs">/ {worksheet.questions.length}</div>
          </div>
        </div>

        {/* Instructions Editing Section */}
        <div className="bg-[#FFF1A7]/30 rounded-xl border-2 border-[#8EE4AF] p-4.5 mb-8 relative group">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#379683] block">Instructions (คำชี้แจงสำหรับนักเรียน)</span>
              {editingId === "instructions" ? (
                <textarea
                  value={worksheet.instructions}
                  onChange={(e) => updateField("instructions", e.target.value)}
                  onBlur={() => setEditingId(null)}
                  autoFocus
                  rows={2}
                  className="w-full text-sm font-semibold text-[#253334] border-b border-[#379683] focus:outline-none bg-transparent"
                />
              ) : (
                <p className="text-sm md:text-base font-bold text-[#253334]">
                  {worksheet.instructions}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditingId(editingId === "instructions" ? null : "instructions")}
              className="no-print p-1 text-gray-400 hover:text-[#379683] hover:bg-[#8EE4AF]/20 rounded-xl transition ml-2"
              title="Edit Instructions"
            >
              {editingId === "instructions" ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Reading Comprehension Passage */}
        {worksheet.passage && (
          <div className="border-2 border-[#8EE4AF] bg-[#FFB7B2]/10 rounded-2xl p-6 mb-8 relative group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-bold text-[#379683] uppercase tracking-wide font-friendly flex items-center gap-2">
                📖 Read the Story:
              </h3>
              <button
                onClick={() => setEditingId(editingId === "passage" ? null : "passage")}
                className="no-print p-1.5 text-gray-400 hover:text-[#379683] hover:bg-[#8EE4AF]/20 rounded-xl transition"
                title="Edit Passage Text"
              >
                {editingId === "passage" ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>
            {editingId === "passage" ? (
              <textarea
                value={worksheet.passage}
                onChange={(e) => updateField("passage", e.target.value)}
                onBlur={() => setEditingId(null)}
                autoFocus
                rows={6}
                className="w-full text-sm md:text-base text-[#253334] bg-white border border-[#8EE4AF] rounded-xl p-3 focus:outline-none leading-relaxed"
              />
            ) : (
              <p className="text-sm md:text-base text-gray-700 leading-relaxed font-handwritten font-medium italic indent-8">
                {worksheet.passage}
              </p>
            )}
          </div>
        )}

        {/* Word Bank Display (if present or if fill-in-the-blank exercise) */}
        {(() => {
          const hasFillInBlank = worksheet.questions.some(q => 
            q.questionType === "fill-in-blank" || 
            q.fillSentence || 
            (q.options && q.options.length > 0 && q.questionText.includes("___"))
          );
          const customWordBank = worksheet.wordBank || 
            Array.from(new Set(worksheet.questions.flatMap(q => q.options || []))).filter(Boolean);

          if (hasFillInBlank && customWordBank.length > 0) {
            return (
              <div className="bg-[#E2F5E9]/80 border-2 border-dashed border-[#379683]/40 rounded-2xl p-4 mb-8 text-center">
                <span className="text-xs font-extrabold text-[#2E7D6F] uppercase tracking-wider block mb-2 font-friendly">
                  📌 Word Bank (คลังคำศัพท์เลือกเติมในช่องว่าง)
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {customWordBank.map((word, wIdx) => (
                    <span 
                      key={wIdx} 
                      className="px-3.5 py-1 bg-white border border-[#8EE4AF] text-[#253334] font-bold text-xs md:text-sm rounded-xl shadow-xs font-friendly"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Worksheet Questions Container */}
        <div className="space-y-6 md:space-y-8 mb-12">
          {worksheet.questions.map((q, idx) => {
            const isEditingText = editingId === `q-${idx}-text`;
            const isEditingAns = editingId === `q-${idx}-ans`;

            // Detect Question Type
            const qType = q.questionType || 
              (q.matchingLeft ? "matching" : 
               q.options && q.options.length === 2 ? "true-false" : 
               q.questionText.includes("___") ? "fill-in-blank" : "multiple-choice");

            return (
              <div 
                key={`q-${idx}-${q.id || idx}`} 
                className="relative group border border-dashed border-transparent hover:border-[#8EE4AF] hover:bg-[#8EE4AF]/5 rounded-2xl p-4 -m-4 transition"
              >
                {/* Question Actions (No-Print Hover Controls) */}
                <div className="no-print absolute top-3 right-3 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => setEditingId(isEditingText ? null : `q-${idx}-text`)}
                    className="p-1.5 bg-white hover:bg-[#8EE4AF]/20 text-gray-500 hover:text-[#379683] rounded-lg border border-[#E2F5E9] shadow-xs cursor-pointer"
                    title="Edit Question Text"
                  >
                    {isEditingText ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditingId(isEditingAns ? null : `q-${idx}-ans`)}
                    className="p-1.5 bg-white hover:bg-[#8EE4AF]/20 text-gray-500 hover:text-[#379683] rounded-lg border border-[#E2F5E9] shadow-xs cursor-pointer"
                    title="Edit Answer / Explanation"
                  >
                    <span className="text-[10px] font-bold px-0.5 text-[#379683]">Key</span>
                  </button>
                  <button
                    onClick={() => deleteQuestion(idx)}
                    className="p-1.5 bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg border border-gray-200 shadow-xs cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Question Content */}
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="font-bold text-[#379683] mr-2 text-sm md:text-base leading-snug font-friendly">{idx + 1}.</span>
                    <div className="flex-1">
                      {isEditingText ? (
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="w-full text-sm md:text-base text-[#253334] border-b-2 border-[#8EE4AF] focus:outline-none py-0.5 bg-transparent font-friendly"
                        />
                      ) : (
                        <span className="text-sm md:text-base text-[#253334] font-semibold leading-relaxed block font-friendly">
                          {q.questionText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Render based on exercise question type */}
                  
                  {/* Matching layout rendering */}
                  {q.matchingLeft && q.matchingRight ? (
                    <div className="grid grid-cols-12 gap-4 pl-6 text-sm md:text-base py-1">
                      {/* Left Column (Question Term) */}
                      <div className="col-span-6 flex items-center space-x-2.5">
                        <span className="text-gray-400 font-bold w-12 font-friendly text-[#379683]">
                          ( &nbsp; &nbsp; ) &nbsp; {idx + 1}.
                        </span>
                        <span className="font-semibold text-[#253334] font-friendly">{q.matchingLeft}</span>
                      </div>

                      {/* Right Column (Shuffled Matches) */}
                      <div className="col-span-6 flex items-center space-x-2.5">
                        {shuffledMatchingRight[idx] ? (
                          <div className="flex items-start space-x-2">
                            <span className="w-6 h-6 rounded-full border border-[#8EE4AF] bg-[#FFB7B2]/30 flex items-center justify-center font-bold text-[11px] shrink-0 font-friendly text-[#379683]">
                              {shuffledMatchingRight[idx].letter}
                            </span>
                            <span className="text-gray-700 font-medium font-friendly">{shuffledMatchingRight[idx].text}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {/* True / False Layout */}
                  {qType === "true-false" && q.options && (
                    <div className="flex items-center space-x-8 pl-6 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center space-x-2.5 text-xs md:text-sm font-friendly">
                          <span className="w-5 h-5 rounded-md border-2 border-[#379683] bg-white flex items-center justify-center shrink-0"></span>
                          <span className="text-gray-800 font-bold">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Multiple Choice Option Grid */}
                  {q.options && q.options.length > 2 && !q.matchingLeft && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-6 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
                        return (
                          <div key={oIdx} className="flex items-center space-x-2.5 text-xs md:text-sm font-friendly">
                            <span className="w-6 h-6 rounded-full border border-[#8EE4AF] bg-[#FFF1A7]/30 flex items-center justify-center font-bold text-[11px] shrink-0 text-[#379683]">
                              {letter}
                            </span>
                            <span className="text-gray-800 font-medium">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Open-ended / Fill-in-blank line if no choices provided */}
                  {(!q.options || q.options.length === 0) && !q.matchingLeft && (
                    <div className="pl-6 pt-2 text-xs md:text-sm text-gray-500 font-handwritten">
                      <div className="flex items-center space-x-2">
                        <span className="whitespace-nowrap font-bold text-[#379683]">Answer:</span>
                        <div className="border-b-2 border-[#8EE4AF]/50 flex-1 h-5 min-w-[250px] border-dashed"></div>
                      </div>
                    </div>
                  )}

                  {/* Editing Key / Explanation modal element inline */}
                  {isEditingAns && (
                    <div className="no-print mt-2 p-3 bg-[#FFF1A7]/30 rounded-xl border border-[#8EE4AF] text-xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#253334]">Correct Answer:</span>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                          className="p-1 bg-white border border-[#E2F5E9] rounded w-full font-friendly"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#253334]">Translation / Info:</span>
                        <input
                          type="text"
                          value={q.explanation || ""}
                          onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                          className="p-1 bg-white border border-[#E2F5E9] rounded w-full font-friendly"
                          placeholder="เฉลยหรืออธิบายเพิ่มเติม..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Question Button (No-Print) */}
        <button
          onClick={addQuestion}
          className="no-print w-full py-2.5 border-2 border-dashed border-[#8EE4AF] hover:border-[#379683] hover:bg-[#8EE4AF]/10 text-[#379683] hover:text-[#2E7D6F] font-bold text-xs rounded-xl flex items-center justify-center transition mb-8 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Custom Question</span>
        </button>

        {/* Separate Page break check or Horizontal Rule for Teacher Key */}
        {showAnswerKey && (
          <div className={`${printAnswerKeyOnNewPage ? "print-page-break" : "border-t-2 border-dashed border-[#8EE4AF] pt-8"} mt-12`}>
            {/* Answer Key Title */}
            <div className="flex items-center space-x-2.5 mb-6">
              <span className="px-3 py-1 bg-[#FFB7B2] text-[#253334] text-xs font-bold uppercase tracking-wider rounded-lg font-friendly shadow-xs">
                Teacher Only
              </span>
              <h2 className="text-xl font-bold text-[#253334] font-friendly">
                Answer Key & Explanations (เฉลยสำหรับครู)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {worksheet.questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#FFF1A7]/10 border-2 border-[#8EE4AF]/40 text-xs md:text-sm shadow-xs">
                  <div className="flex items-start">
                    <span className="font-bold text-[#379683] mr-1.5 font-friendly">{idx + 1}.</span>
                    <div className="space-y-1">
                      <p className="font-bold text-[#253334] font-friendly">
                        Correct Answer: <span className="text-[#379683] font-mono underline bg-[#8EE4AF]/10 px-2 py-0.5 rounded-md">{q.correctAnswer}</span>
                      </p>
                      {q.explanation && (
                        <p className="text-[#5A7E64] italic leading-relaxed text-[11px] md:text-xs">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Printable Watermark Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center flex items-center justify-between text-[11px] text-slate-400 font-sans">
          <span>{teacherProfile?.school_name || "EnglishBoxx Worksheet"}</span>
          <span className="font-semibold text-slate-500">
            {userPlan === "free" || worksheet.plan_used === "free"
              ? "Created with EnglishBoxx"
              : (userPlan === "pro" || worksheet.plan_used === "pro") && teacherProfile?.watermark
              ? teacherProfile.watermark
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
