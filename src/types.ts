export type SubscriptionPlan = "free" | "premium" | "pro" | "admin";

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  password?: string;
  role: SubscriptionPlan;
  plan?: SubscriptionPlan;
  plan_expiry?: string | null;
  downloadCount?: number;
  generationCount?: number;
  createdAt: string;
}

export interface TeacherProfile {
  uid: string;
  teacher_name: string;
  school_name: string;
  logo_url: string;
  logo_position?: "left" | "center" | "right";
  watermark: string;
  updatedAt?: string;
}

export interface WorksheetHeaderBranding {
  enabled: boolean;
  teacherName?: string;
  schoolName?: string;
  logoUrl?: string;
  logoPosition?: "left" | "center" | "right";
  watermarkText?: string;
  showWatermark?: boolean;
}

export interface VisualData {
  required: boolean;
  type: "image" | "number_line" | "diagram" | "none";
  prompt?: string;
  url?: string;
}

export interface WorksheetQuestion {
  id: number;
  questionType?: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  matchingLeft?: string;
  matchingRight?: string;
  fillSentence?: string;
  wordBank?: string[];
  passage?: string;
  visual?: VisualData;
}

export interface Worksheet {
  title: string;
  gradeLabel: string;
  subject?: string;
  teacherName?: string;
  schoolName?: string;
  instructions: string;
  passage?: string;
  questions: WorksheetQuestion[];
  wordBank?: string[];
  includeAnswerKey?: boolean;
  
  // Subscription & Branding fields
  plan_used?: SubscriptionPlan;
  branding_enabled?: boolean;
  branding?: WorksheetHeaderBranding;
}

export interface SavedWorksheet {
  id: string;
  createdAt: string;
  grade: string;
  topic: string;
  exerciseStyle: string;
  created_by?: string;
  plan_used?: SubscriptionPlan;
  branding_enabled?: boolean;
  data: Worksheet;
}

export interface QuestionBankEntry {
  id: string;
  subject: string;
  grade: string;
  cefr_level?: string;
  topic: string;
  learning_stage?: string;
  learningStage?: string;
  focus?: string;
  grammar_focus?: string;
  vocabulary_focus?: string;
  question_type?: string;
  questionType?: string;
  difficulty?: string;
  learning_objective?: string;
  source_id?: string;
  source_category?: string;
  ai_generated?: string;
  generation_method?: string;
  question_text: string;
  questionText?: string;
  options: string[];
  correct_answer: string;
  correctAnswer?: string;
  explanation?: string;
  matching_left?: string;
  matchingLeft?: string;
  matching_right?: string;
  matchingRight?: string;
  visual_required?: boolean;
  visual_type?: "image" | "number_line" | "diagram" | "none";
  visual_prompt?: string;
  visual_url?: string;
  visual?: VisualData;
  tags?: string[];
  status?: "pending" | "approved" | "rejected";
  reviewed_at?: string;
  reviewed_by?: string;
  reject_reason?: string;
  created_at?: string;
  created_by?: string;
}

export interface GeneratedExamItem {
  id: string | number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  status: "pending" | "approved" | "rejected";
  grade: string;
  topic: string;
  learningStage?: string;
  focus?: string;
  questionType: string;
  difficulty: string;
  grammarFocus?: string;
  vocabularyFocus?: string;
  learningObjective?: string;
  cefrLevel?: string;
  matchingLeft?: string;
  matchingRight?: string;
  visual?: VisualData;
}

export interface ExamGenerationParams {
  grade: string;
  topic: string;
  learningStage: string;
  focus: string;
  questionType: string;
  difficulty: string;
  numQuestions: number;
  grammarFocus?: string;
  vocabularyFocus?: string;
}
