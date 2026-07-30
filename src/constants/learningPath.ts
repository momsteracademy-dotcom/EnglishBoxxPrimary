export interface LearningPathStage {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  colorClass: string;
  focusOptions: string[];
  examQuestionTypes: { value: string; label: string }[];
  worksheetTypes: { value: string; label: string; desc: string }[];
}

export const PRIMARY_GRADES = ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"];

export const PRIMARY_TOPICS = [
  "Food & Drinks (อาหารและเครื่องดื่ม)",
  "Parts of the Body (ร่างกายของเรา)",
  "My Family & Home (ครอบครัวและบ้าน)",
  "At School & Classroom (ที่โรงเรียนและห้องเรียน)",
  "Animals & Pets (สัตว์และสัตว์เลี้ยง)",
  "Daily Activities (กิจวัตรประจำวัน)",
  "Weather & Seasons (สภาพอากาศและฤดูกาล)",
  "Hobbies & Free Time (งานอดิเรกและเวลาว่าง)"
];

export const LEARNING_STAGES: Record<string, LearningPathStage> = {
  "Vocabulary & Meaning": {
    id: "Vocabulary & Meaning",
    name: "1. Vocabulary & Meaning (คำศัพท์และความหมาย)",
    shortName: "Vocabulary",
    badge: "Vocabulary 🔤",
    colorClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    focusOptions: [
      "Word Recognition (การจำรูปคำศัพท์)",
      "Thai → English Meaning (ความหมายคำศัพท์)",
      "Word Definition (นิยามคำศัพท์)",
      "Word Matching (จับคู่คำศัพท์)"
    ],
    examQuestionTypes: [
      { value: "multiple-choice", label: "Multiple Choice (เลือกตอบ A-D)" },
      { value: "matching", label: "Matching (จับคู่คำศัพท์และความหมาย)" },
      { value: "fill-in-blank", label: "Fill in the Blank (เติมคำศัพท์ลงในช่องว่าง)" }
    ],
    worksheetTypes: [
      { value: "vocabulary-sheet", label: "Vocabulary Sheet (ใบงานคำศัพท์และความหมาย)", desc: "เน้นเรียนรู้คำศัพท์ ความหมายภาษาไทย และคำอ่าน" },
      { value: "word-matching", label: "Word Matching (จับคู่คำศัพท์และความหมาย)", desc: "ใบงานจับคู่คำศัพท์ภาษาอังกฤษกับความหมายภาษาไทย" },
      { value: "word-recognition", label: "Word Recognition (จำรูปคำศัพท์และสะกดคำ)", desc: "ฝึกสังเกต เลือก และสะกดคำศัพท์ที่ถูกต้อง" }
    ]
  },
  "Phonics & Sounds": {
    id: "Phonics & Sounds",
    name: "2. Phonics & Sounds (สระ เสียง และการผสมคำ)",
    shortName: "Phonics",
    badge: "Phonics 🔊",
    colorClass: "bg-purple-100 text-purple-900 border-purple-300",
    focusOptions: [
      "Letter Sounds (เสียงพยัญชนะ)",
      "Initial Sounds (เสียงต้นคำ)",
      "Word Sounds (เสียงสระและเสียงท้าย)",
      "CVC Words (คำผสม CVC)"
    ],
    examQuestionTypes: [
      { value: "multiple-choice", label: "Multiple Choice (เลือกตอบ A-D)" },
      { value: "fill-in-blank", label: "Fill in the Blank (เติมตัวอักษรให้ตรงกับเสียง)" },
      { value: "matching", label: "Matching (จับคู่เสียงสระ/พยัญชนะ)" }
    ],
    worksheetTypes: [
      { value: "sound-matching", label: "Sound Matching (จับคู่เสียงกับตัวอักษร)", desc: "จับคู่รูปภาพหรือคำศัพท์กับตัวอักษรเสียงแรก" },
      { value: "beginning-sound", label: "Beginning Sound (เติมเสียงต้นของคำ)", desc: "ฝึกฟังและเติมพยัญชนะต้นของคำศัพท์" },
      { value: "cvc-practice", label: "CVC Practice (แบบฝึกหัดผสมคำ CVC)", desc: "ฝึกประสมคำสามตัวอักษร CVC ง่ายๆ" }
    ]
  },
  "Reading": {
    id: "Reading",
    name: "3. Reading (การอ่านและการจับใจความ)",
    shortName: "Reading",
    badge: "Reading 📖",
    colorClass: "bg-sky-100 text-sky-900 border-sky-300",
    focusOptions: [
      "Word Reading (การอ่านระดับคำ)",
      "Sentence Reading (การอ่านระดับประโยค)",
      "Short Passage (ข้อความสั้น)",
      "Reading Comprehension (การอ่านจับใจความ)"
    ],
    examQuestionTypes: [
      { value: "reading-comprehension", label: "Reading Comprehension (อ่านบทความและตอบคำถาม)" },
      { value: "multiple-choice", label: "Multiple Choice (เลือกตอบ A-D จากบทอ่าน)" },
      { value: "matching", label: "Matching (จับคู่ประโยคจากเรื่องที่อ่าน)" }
    ],
    worksheetTypes: [
      { value: "read-match", label: "Read & Match (อ่านประโยคจับคู่ข้อความ)", desc: "อ่านประโยคสั้นๆ แล้วโยงเส้นจับคู่ความหมายหรือข้อความที่สอดคล้องกัน" },
      { value: "sentence-reading", label: "Sentence Reading (อ่านประโยคและตอบคำถาม)", desc: "อ่านประโยคสั้นพร้อมคำถาม True/False หรือเลือกตอบ" },
      { value: "short-reading", label: "Short Reading (อ่านบทความสั้นและตอบคำถาม)", desc: "เนื้อเรื่องสั้น 3-5 ประโยค พร้อมแบบฝึกหัดเข้าใจความ" }
    ]
  },
  "Sentence Patterns": {
    id: "Sentence Patterns",
    name: "4. Sentence Patterns (รูปแบบประโยคและการใช้)",
    shortName: "Sentence",
    badge: "Sentence 💬",
    colorClass: "bg-indigo-100 text-indigo-900 border-indigo-300",
    focusOptions: [
      "Complete the Sentence (เติมประโยคให้สมบูรณ์)",
      "Choose the Correct Sentence (เลือกประโยคที่ถูกต้อง)",
      "Sentence Matching (จับคู่ประโยค)"
    ],
    examQuestionTypes: [
      { value: "unscramble", label: "Unscramble (เรียงคำให้เป็นประโยค)" },
      { value: "multiple-choice", label: "Multiple Choice (เลือกประโยคที่ถูกต้อง A-D)" },
      { value: "fill-in-blank", label: "Fill in the Blank (เติมโครงสร้างประโยค)" },
      { value: "matching", label: "Sentence Matching (จับคู่ส่วนของประโยค)" }
    ],
    worksheetTypes: [
      { value: "sentence-complete", label: "Complete the Sentence (เติมประโยคให้สมบูรณ์)", desc: "ใช้คำศัพท์ที่กำหนดเติมแต่งประโยคตามภาพ" },
      { value: "sentence-unscramble", label: "Sentence Unscramble (เรียงคำให้เป็นประโยค)", desc: "เรียงคำศัพท์ที่สลับตำแหน่งให้เป็นประโยคสมบูรณ์" },
      { value: "sentence-matching", label: "Sentence Matching (จับคู่ประโยคถาม-ตอบ)", desc: "จับคู่คำถามและคำตอบ หรือประโยคคู่กัน" }
    ]
  },
  "Grammar": {
    id: "Grammar",
    name: "5. Grammar (ไวยากรณ์และโครงสร้าง)",
    shortName: "Grammar",
    badge: "Grammar ✍️",
    colorClass: "bg-amber-100 text-amber-900 border-amber-300",
    focusOptions: [
      "Present Simple",
      "Be Verb (Is / Am / Are)",
      "Have/Has",
      "Pronouns (คำสรรพนาม)",
      "Plural (พหูพจน์)",
      "Basic Prepositions (in, on, under, next to)"
    ],
    examQuestionTypes: [
      { value: "multiple-choice", label: "Multiple Choice (เลือกตอบ A-D ไวยากรณ์)" },
      { value: "fill-in-blank", label: "Fill in the Blank (เติมกริยา/โครงสร้างไวยากรณ์)" }
    ],
    worksheetTypes: [
      { value: "grammar-practice", label: "Grammar Practice (แบบฝึกหัดไวยากรณ์)", desc: "แบบฝึกหัดเลือกใช้หลักไวยากรณ์ที่ถูกต้อง" },
      { value: "sentence-completion", label: "Sentence Completion (เติมโครงสร้างไวยากรณ์)", desc: "เติมกริยาหรือคำสรรพนามลงในช่องว่าง" }
    ]
  },
  "Practice": {
    id: "Practice",
    name: "6. Practice (การฝึกฝนและประยุกต์)",
    shortName: "Practice",
    badge: "Practice 🧩",
    colorClass: "bg-teal-100 text-teal-900 border-teal-300",
    focusOptions: [
      "Matching (การจับคู่)",
      "Fill in the Blank (เติมคำในช่องว่าง)",
      "Choose the Correct Word (เลือกคำที่ถูกต้อง)",
      "Unscramble (เรียงคำ/ประโยค)",
      "Complete the Sentence (เติมประโยค)"
    ],
    examQuestionTypes: [
      { value: "matching", label: "Matching (จับคู่ข้อความ)" },
      { value: "fill-in-blank", label: "Fill in the Blank (เติมคำในช่องว่าง)" },
      { value: "unscramble", label: "Unscramble (เรียงประโยค)" },
      { value: "multiple-choice", label: "Multiple Choice (เลือกตอบ A-D)" }
    ],
    worksheetTypes: [
      { value: "vocab-practice", label: "Vocabulary Practice (ฝึกคำศัพท์และประโยค)", desc: "ใบงานประยุกต์ฝึกคำศัพท์รวมกับรูปภาพ" },
      { value: "fill-blank-practice", label: "Fill in the Blank (เติมคำในช่องว่าง)", desc: "เติมคำศัพท์จากกล่องคีย์เวิร์ดลงในประโยค" },
      { value: "matching-practice", label: "Matching (โยงเส้นจับคู่)", desc: "จับคู่ข้อความกับภาพ หรือรูปประโยค" }
    ]
  },
  "Review & Test": {
    id: "Review & Test",
    name: "7. Review & Test (ทบทวนและทดสอบ)",
    shortName: "Test",
    badge: "Test 🎯",
    colorClass: "bg-rose-100 text-rose-900 border-rose-300",
    focusOptions: [
      "Multiple Choice A-D (เลือกตอบ 4 ตัวเลือก)",
      "Mixed Review (ทบทวนรวมแบบทดสอบ)"
    ],
    examQuestionTypes: [
      { value: "multiple-choice", label: "Multiple Choice A-D (ปรนัย 4 ตัวเลือก)" },
      { value: "mixed-review", label: "Mixed Review (ผสมผสานหลายรูปแบบ)" }
    ],
    worksheetTypes: [
      { value: "multiple-choice", label: "Multiple Choice (แบบเลือกตอบ A-D)", desc: "ข้อสอบแบบปรนัย 4 ตัวเลือกประเมินผล" },
      { value: "mixed-review", label: "Mixed Review (ทบทวนรวมทุกทักษะ)", desc: "ใบงานรวมคำศัพท์ ไวยากรณ์ และการอ่าน" },
      { value: "mini-test", label: "Mini Test (มินิเทสต์ประเมินผล)", desc: "แบบทดสอบสั้น 5-10 ข้อ สำหรับเก็บคะแนน" }
    ]
  }
};

export const STAGE_KEYS = Object.keys(LEARNING_STAGES);

export const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy (ง่าย - จำ / รู้จัก / พื้นฐาน)" },
  { value: "Medium", label: "Medium (ปานกลาง - ใช้ความรู้ในบริบท)" },
  { value: "Hard", label: "Hard (ยาก - วิเคราะห์ / ประยุกต์)" }
];

export function getStageBadge(stageName?: string): { label: string; colorClass: string } {
  if (!stageName) {
    return { label: "Legacy 🏷️", colorClass: "bg-slate-100 text-slate-700 border-slate-300" };
  }
  
  for (const [key, stage] of Object.entries(LEARNING_STAGES)) {
    if (
      stageName.toLowerCase().includes(key.toLowerCase()) || 
      stageName.toLowerCase().includes(stage.shortName.toLowerCase())
    ) {
      return { label: stage.badge, colorClass: stage.colorClass };
    }
  }

  const lower = stageName.toLowerCase();
  if (lower.includes("vocab")) return { label: "Vocabulary 🔤", colorClass: "bg-emerald-100 text-emerald-900 border-emerald-300" };
  if (lower.includes("phonic")) return { label: "Phonics 🔊", colorClass: "bg-purple-100 text-purple-900 border-purple-300" };
  if (lower.includes("read")) return { label: "Reading 📖", colorClass: "bg-sky-100 text-sky-900 border-sky-300" };
  if (lower.includes("sentence")) return { label: "Sentence 💬", colorClass: "bg-indigo-100 text-indigo-900 border-indigo-300" };
  if (lower.includes("gramm")) return { label: "Grammar ✍️", colorClass: "bg-amber-100 text-amber-900 border-amber-300" };
  if (lower.includes("practic")) return { label: "Practice 🧩", colorClass: "bg-teal-100 text-teal-900 border-teal-300" };
  if (lower.includes("test") || lower.includes("review")) return { label: "Test 🎯", colorClass: "bg-rose-100 text-rose-900 border-rose-300" };

  return { label: "Legacy 🏷️", colorClass: "bg-slate-100 text-slate-700 border-slate-300" };
}
