import React from "react";
import { Check, Sparkles, ShieldCheck, Crown, Zap, X, Image as ImageIcon, Type, Layout } from "lucide-react";
import { UserProfile, SubscriptionPlan } from "../types";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSelectPlan: (plan: SubscriptionPlan) => Promise<void>;
  isLoading?: boolean;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentUser,
  onSelectPlan,
  isLoading = false
}: SubscriptionModalProps) {
  if (!isOpen) return null;

  const currentPlan: SubscriptionPlan = (currentUser?.plan || currentUser?.role || "free") as SubscriptionPlan;

  const handleChoosePlan = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;
    await onSelectPlan(plan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-emerald-100 flex flex-col">
        {/* Modal Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#253334] via-[#2E7D6F] to-[#379683] text-white rounded-t-3xl overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Crown className="w-64 h-64 text-white" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400/20 backdrop-blur-md text-emerald-200 text-xs font-bold mb-3 border border-emerald-300/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>แพ็กเกจสมาชิก EnglishBoxx</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-friendly tracking-tight">
            เลือกแพ็กเกจที่เหมาะกับคุณครู 🪄✨
          </h2>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl font-sans">
            ยกระดับการสร้างใบงานภาษาอังกฤษ พิมพ์พร้อมโลโก้ครู ลบลายน้ำ และสร้างข้อสอบ A4 คุณภาพสูงได้ไม่จำกัด!
          </p>
        </div>

        {/* Plans Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
          
          {/* FREE PLAN */}
          <div className={`relative bg-white rounded-2xl p-6 border transition flex flex-col justify-between shadow-sm hover:shadow-md ${
            currentPlan === "free" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">
                  Free
                </span>
                {currentPlan === "free" && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    แผนปัจจุบัน
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-friendly">สมาชิกฟรี</h3>
              <div className="mt-3 mb-6">
                <span className="text-3xl font-black text-slate-900">฿0</span>
                <span className="text-slate-500 text-sm font-medium"> /ตลอดชีพ</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>สร้างใบงานได้จำกัด (5 ครั้ง/วัน)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>แบบฝึกหัดพื้นฐานครอบคลุม ป.1-ม.6</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <span className="line-through">แสดงลายน้ำ "Created with EnglishBoxx"</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <span className="line-through">ไม่สามารถเพิ่มโลโก้ครูได้</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <span className="line-through">ไม่สามารถตั้งค่าลายน้ำเฉพาะตัวได้</span>
                </div>
              </div>
            </div>

            <button
              disabled={currentPlan === "free" || isLoading}
              onClick={() => handleChoosePlan("free")}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer ${
                currentPlan === "free"
                  ? "bg-slate-100 text-slate-400 cursor-default"
                  : "bg-slate-800 hover:bg-slate-900 text-white"
              }`}
            >
              {currentPlan === "free" ? "ใช้งานอยู่นี้" : "สลับมาแผนฟรี"}
            </button>
          </div>

          {/* PREMIUM PLAN */}
          <div className={`relative bg-white rounded-2xl p-6 border transition flex flex-col justify-between shadow-md hover:shadow-lg ${
            currentPlan === "premium" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-300"
          }`}>
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>ยอดนิยม ⭐</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
                  Premium
                </span>
                {currentPlan === "premium" && (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    แผนปัจจุบัน
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-friendly">ครูพรีเมียม</h3>
              <div className="mt-3 mb-6">
                <span className="text-3xl font-black text-slate-900">฿290</span>
                <span className="text-slate-500 text-sm font-medium"> /เดือน</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2 font-medium text-emerald-950">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>สร้างใบงานได้มากขึ้น (100 ครั้ง/เดือน)</span>
                </div>
                <div className="flex items-start gap-2 font-medium text-emerald-950">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>✨ ลบลายน้ำเริ่มต้นออกได้สะอาดตา</span>
                </div>
                <div className="flex items-start gap-2 font-medium text-emerald-950">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>🖼️ เพิ่มโลโก้ครู (Teacher Logo)</span>
                </div>
                <div className="flex items-start gap-2 font-medium text-emerald-950">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>✍️ ใส่ชื่อครู และ ชื่อโรงเรียน บนหัวใบงาน</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>จัดหน้า A4 Print Preview พร้อมสั่งพิมพ์/PDF</span>
                </div>
              </div>
            </div>

            <button
              disabled={currentPlan === "premium" || isLoading}
              onClick={() => handleChoosePlan("premium")}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm ${
                currentPlan === "premium"
                  ? "bg-slate-100 text-slate-400 cursor-default"
                  : "bg-[#2E7D6F] hover:bg-[#253334] text-white"
              }`}
            >
              {currentPlan === "premium" ? "ใช้งานอยู่นี้" : "อัปเกรดเป็น Premium"}
            </button>
          </div>

          {/* PREMIUM PRO PLAN */}
          <div className={`relative bg-gradient-to-b from-slate-900 via-slate-900 to-[#1b2b28] text-white rounded-2xl p-6 border transition flex flex-col justify-between shadow-xl ${
            currentPlan === "pro" ? "border-amber-400 ring-2 ring-amber-400/30" : "border-slate-800"
          }`}>
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>คุ้มค่าที่สุด 💎</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full">
                  Premium Pro
                </span>
                {currentPlan === "pro" && (
                  <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full">
                    แผนปัจจุบัน
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-amber-100 font-friendly">พรีเมียม โปร</h3>
              <div className="mt-3 mb-6">
                <span className="text-3xl font-black text-white">฿590</span>
                <span className="text-slate-400 text-sm font-medium"> /เดือน</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200 border-t border-slate-800 pt-4">
                <div className="flex items-start gap-2 font-semibold text-amber-200">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>🚀 สร้างใบงานไม่จำกัด (Unlimited Generation)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>🎨 Custom Branding ปรับตำแหน่งโลโก้ (ซ้าย/กลาง/ขวา)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>💧 กำหนดข้อความ ลายน้ำพิเศษเฉพาะคุณ (Custom Watermark)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>🌟 เข้าถึงโมเดลและฟีเจอร์ใหม่ก่อนใคร (Priority Access)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>📞 ทีมงานซัพพอร์ตดูแลเป็นพิเศษ</span>
                </div>
              </div>
            </div>

            <button
              disabled={currentPlan === "pro" || isLoading}
              onClick={() => handleChoosePlan("pro")}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer shadow-lg ${
                currentPlan === "pro"
                  ? "bg-slate-800 text-slate-500 cursor-default"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black"
              }`}
            >
              {currentPlan === "pro" ? "ใช้งานอยู่นี้" : "ปลดล็อก Premium Pro 💎"}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ปลอดภัยด้วยระบบการชำระเงินมาตรฐาน สามารถยกเลิกได้ตลอดเวลา</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    </div>
  );
}
