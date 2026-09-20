export type RoleSlug = 
  | 'admin'
  | 'psychologist'
  | 'lawyer'
  | 'treatment_center'
  | 'association'
  | 'family'
  | 'patient'
  | 'guest';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_slug: RoleSlug;
  wilaya_id?: number;
  wilaya_name?: string;
  status: 'active' | 'pending_approval' | 'suspended';
  created_at?: string;
}

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type CaseStatus = 
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'FIRST_SESSION'
  | 'FOLLOW_UP'
  | 'REFERRED'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface CaseFile {
  id: number;
  number_case: string;
  created_by: number;
  patient_id: number;
  assigned_psychologist_id?: number;
  assigned_lawyer_id?: number;
  treatment_center_id?: number;
  addiction_type_id: number;
  addiction_type_name?: string;
  priority: PriorityLevel;
  status: CaseStatus;
  description: string;
  target_response_hours: number;
  created_at: string;
  creator_first_name?: string;
  creator_last_name?: string;
  creator_phone?: string;
  creator_email?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  psy_first_name?: string;
  psy_last_name?: string;
  lawyer_first_name?: string;
  lawyer_last_name?: string;
  center_name?: string;
  latest_progress?: number;
}

export interface Assessment {
  id: number;
  case_file_id: number;
  psychologist_id: number;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Extreme';
  recommendation: string;
  mental_health_notes?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

export interface TreatmentPlan {
  id: number;
  case_file_id: number;
  goal: string;
  strategy: string;
  duration: string;
  sessions_count: number;
  final_evaluation?: string;
  created_at: string;
}

export interface TherapySession {
  id: number;
  case_file_id: number;
  session_number: number;
  date: string;
  duration: number;
  notes: string;
  session_next?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface CaseProgress {
  id: number;
  case_file_id: number;
  progress_percentage: number;
  notes?: string;
  updated_by: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

export interface CaseDocument {
  id: number;
  case_file_id: number;
  uploaded_by: number;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  visibility: 'all' | 'medical_only' | 'legal_only' | 'admin_only';
  created_at: string;
  uploader_name?: string;
}

export interface Appointment {
  id: number;
  case_file_id: number;
  number_case?: string;
  created_by: number;
  specialist_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: 'psychological' | 'legal' | 'treatment' | 'referral';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  notes?: string;
  cancellation_reason?: string;
  specialist_first_name?: string;
  specialist_last_name?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  specialty?: string;
}

export interface LegalConsultation {
  id: number;
  case_file_id: number;
  lawyer_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
  legal_opinion?: string;
  recommendation?: string;
  created_at: string;
  lawyer_first_name?: string;
  lawyer_last_name?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  attachment_url?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_role?: string;
}

export interface Conversation {
  id: number;
  case_file_id: number;
  title: string;
  number_case: string;
  priority: PriorityLevel;
  case_status: CaseStatus;
  last_message?: string;
  last_message_at?: string;
  last_message_time?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  unread_count?: number;
}

export interface TreatmentCenter {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name?: string;
  address: string;
  phone: string;
  capacity?: number;
  services?: string;
}

export interface Association {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name?: string;
  address?: string;
  phone: string;
  services: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: number;
  created_at: string;
}

export interface Wilaya {
  id: number;
  code: string;
  name_ar: string;
  name_fr: string;
}

export interface AddictionType {
  id: number;
  name_ar: string;
  name_en: string;
  description: string;
}

export interface EmergencyResource {
  id: number;
  title_ar: string;
  phone_number: string;
  description_ar: string;
  is_24_7: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  role_slug?: string;
  email?: string;
}

export interface PlatformKpi {
  total_cases: number;
  completed_cases: number;
  active_cases: number;
  recovery_rate_pct: number;
  cases_by_status: { status: string; count: number }[];
  cases_by_priority: { priority: string; count: number }[];
  cases_by_addiction: { name_ar: string; count: number }[];
  users_by_role: { role_slug: string; count: number }[];
  appointments_summary: { status: string; count: number }[];
}
