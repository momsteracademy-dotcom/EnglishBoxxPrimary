import React, { useState, useEffect } from "react";
import { Upload, X, Save, Image as ImageIcon, Sparkles, AlertCircle, Building2, User, Eye, Lock } from "lucide-react";
import { TeacherProfile, SubscriptionPlan } from "../types";

interface TeacherBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  userPlan: SubscriptionPlan;
  initialProfile?: TeacherProfile | null;
  onSaveProfile: (profile: TeacherProfile) => Promise<void>;
  onOpenSubscriptionModal?: () => void;
}

export default function TeacherBrandingModal({
  isOpen,
  onClose,
  currentUserEmail,
  userPlan,
  initialProfile,
  onSaveProfile,
  onOpenSubscriptionModal
}: TeacherBrandingModalProps) {
  if (!isOpen) return null;

  const [teacherName, setTeacherName] = useState(initialProfile?.teacher_name || "");
  const [schoolName, setSchoolName] = useState(initialProfile?.school_name || "");
  const [logoUrl, setLogoUrl] = useState(initialProfile?.logo_url || "");
  const [logoPosition, setLogoPosition] = useState<"left" | "center" | "right">(
    initialProfile?.logo_position || "left"
  );
  const [watermark, setWatermark] = useState(
    userPlan === "free" ? "Created with EnglishBoxx" : initialProfile?.watermark || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setTeacherName(initialProfile.teacher_name || "");
      setSchoolName(initialProfile.school_name || "");
      setLogoUrl(initialProfile.logo_url || "");
      setLogoPosition(initialProfile.logo_position || "left");
      setWatermark(
        userPlan === "free" ? "Created with EnglishBoxx" : initialProfile.watermark || ""
      );
    }
  }, [initialProfile, userPlan]);

  // Handle Logo Image Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (userPlan === "free") {
      alert("🔒 ฟีเจอร์อัปโหลดโลโก้ครู สงวนสิทธิ์สำหรับสมาชิก Premium และ Premium Pro เท่านั้นค่ะ");
      if (onOpenSubscriptionModal) onOpenSubscriptionModal();
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("⚠️ ไฟล์รูปภาพมีขนาดใหญ่เกินไป กรุณาใช้รูปขนาดไม่เกิน 2MB ค่ะ");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated: TeacherProfile = {
        uid: currentUserEmail.trim().toLowerCase(),
        teacher_name: teacherName.trim(),
        school_name: schoolName.trim(),
        logo_url: logoUrl,
        logo_position: logoPosition,
        watermark: userPlan === "free" ? "Created with EnglishBoxx" : watermark.trim(),
        updatedAt: new Date().toISOString()
      };

      await onSaveProfile(updated);
      setStatusMessage("บันทึกการตั้งค่าแบรนด์ครูเรียบร้อยแล้ว! ✨");
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage("❌ เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFree = userPlan === "free";
  const isPro = userPlan === "pro" || userPlan === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-[#253334] to-[#379683] text-white rounded-t-3xl flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Teacher Branding & Header Settings</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-friendly">
              ตั้งค่าแบรนด์ครู & หัวกระดาษใบงาน 🎨
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.includes("❌") ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}>
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {isFree && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">สมาชิก Free สามารถตั้งค่าชื่อครูและชื่อโรงเรียนได้</p>
                <p className="text-amber-800/90 mt-0.5">
                  การเพิ่มโลโก้ครูและการลบลายน้ำเริ่มต้นจะปลดล็อกสำหรับสมาชิก <strong className="text-emerald-800">Premium</strong> และ <strong className="text-amber-800">Premium Pro</strong> ค่ะ
                </p>
                {onOpenSubscriptionModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSubscriptionModal();
                    }}
                    className="mt-2 inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ✨ อัปเกรดแพ็กเกจสมาชิกคลิกที่นี่
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Teacher Name & School Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#2E7D6F]" />
                <span>ชื่อผู้สอน / คุณครู (Teacher Name)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น คุณครูสมศรี ใจดี (Kru Somsri)"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2E7D6F] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#2E7D6F]" />
                <span>ชื่อโรงเรียน / สถาบัน (School Name)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น โรงเรียนสาธิตวิทยานุสรณ์"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2E7D6F] text-xs"
              />
            </div>
          </div>

          {/* Teacher Logo Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#2E7D6F]" />
                <span>โลโก้ประจำตัวครู / โรงเรียน (Teacher Logo)</span>
              </label>
              {isFree && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Premium & Pro Only 🔒
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              {logoUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={logoUrl}
                    alt="Teacher Logo Preview"
                    className="w-20 h-20 object-contain rounded-xl border border-slate-300 bg-white p-1 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition cursor-pointer"
                    title="ลบรูปภาพ"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[10px]">ไม่มีโลโก้</span>
                </div>
              )}

              <div className="flex-1 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isFree}
                  id="teacher-logo-upload"
                  className="hidden"
                />
                <label
                  htmlFor="teacher-logo-upload"
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isFree
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-[#2E7D6F] hover:bg-[#253334] text-white shadow-sm"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{logoUrl ? "เปลี่ยนรูปโลโก้" : "เลือกไฟล์รูปภาพโลโก้"}</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  รองรับไฟล์ PNG, JPG หรือ GIF ขนาดไม่เกิน 2MB
                </p>
              </div>
            </div>

            {/* Logo Position */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                ตำแหน่งวางโลโก้บนหัวกระดาษ A4
              </label>
              <div className="flex items-center gap-3">
                {(["left", "center", "right"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setLogoPosition(pos)}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                      logoPosition === pos
                        ? "bg-[#2E7D6F] text-white border-[#2E7D6F]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {pos === "left" ? "ซ้าย (Left)" : pos === "center" ? "ตรงกลาง (Center)" : "ขวา (Right)"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Watermark Preferences */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2E7D6F]" />
                <span>ข้อความลายน้ำบนใบงาน (Watermark Text)</span>
              </label>
              {isFree ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Free Watermark Fixed
                </span>
              ) : isPro ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pro Custom Watermark Allowed 💎
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Premium (Watermark Removed) ✨
                </span>
              )}
            </div>

            <input
              type="text"
              disabled={!isPro}
              placeholder={
                isFree
                  ? "Created with EnglishBoxx"
                  : isPro
                  ? "พิมพ์ลายน้ำที่คุณต้องการ เช่น English Boxx - Kru Somsri"
                  : "ปิดลายน้ำอัตโนมัติสำหรับ Premium (ว่างไว้เพื่อซ่อนลายน้ำ)"
              }
              value={isFree ? "Created with EnglishBoxx" : watermark}
              onChange={(e) => setWatermark(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2E7D6F] text-xs disabled:bg-slate-100 text-slate-700"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              {isFree
                ? "ผู้ใช้แผน Free จะมีลายน้ำ Created with EnglishBoxx ที่มุมกระดาษ"
                : isPro
                ? "ผู้ใช้แผน Pro สามารถกำหนดข้อความลายน้ำลายไทย/อังกฤษได้อิสระ"
                : "ผู้ใช้แผน Premium ลายน้ำถูกลบออกแล้ว (หากอัปเกรดเป็น Pro จะสามารถตั้งข้อความเองได้ค่ะ)"}
            </p>
          </div>

          {/* Header Live Preview Box */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>ตัวอย่างการแสดงผลบนหัวกระดาษ A4 (Live Header Preview)</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative min-h-[90px] flex flex-col justify-between">
              <div className={`flex items-start gap-4 ${
                logoPosition === "center"
                  ? "flex-col items-center text-center"
                  : logoPosition === "right"
                  ? "flex-row-reverse justify-between text-right"
                  : "flex-row justify-between text-left"
              }`}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
                ) : (
                  <div className="h-10 w-20 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    [LOGO]
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {schoolName || "ชื่อโรงเรียนของคุณครู"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {teacherName ? `ผู้สอน: ${teacherName}` : "ชื่อผู้สอน: -"}
                  </p>
                </div>
              </div>

              {/* Watermark preview tag */}
              {(isFree || (isPro && watermark.trim())) && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                    💧 Watermark: {isFree ? "Created with EnglishBoxx" : watermark}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2E7D6F] hover:bg-[#253334] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
