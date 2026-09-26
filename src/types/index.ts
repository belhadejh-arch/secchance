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
  title?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
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

export const ALGERIA_WILAYAS: Wilaya[] = [
  { id: 1, code: '01', name_ar: 'أدرار', name_fr: 'Adrar' },
  { id: 2, code: '02', name_ar: 'الشلف', name_fr: 'Chlef' },
  { id: 3, code: '03', name_ar: 'الأغواط', name_fr: 'Laghouat' },
  { id: 4, code: '04', name_ar: 'أم البواقي', name_fr: 'Oum El Bouaghi' },
  { id: 5, code: '05', name_ar: 'باتنة', name_fr: 'Batna' },
  { id: 6, code: '06', name_ar: 'بجاية', name_fr: 'Béjaïa' },
  { id: 7, code: '07', name_ar: 'بسكرة', name_fr: 'Biskra' },
  { id: 8, code: '08', name_ar: 'بشار', name_fr: 'Béchar' },
  { id: 9, code: '09', name_ar: 'البليدة', name_fr: 'Blida' },
  { id: 10, code: '10', name_ar: 'البويرة', name_fr: 'Bouira' },
  { id: 11, code: '11', name_ar: 'تمنراست', name_fr: 'Tamanrasset' },
  { id: 12, code: '12', name_ar: 'تبسة', name_fr: 'Tébessa' },
  { id: 13, code: '13', name_ar: 'تلمسان', name_fr: 'Tlemcen' },
  { id: 14, code: '14', name_ar: 'تيارت', name_fr: 'Tiaret' },
  { id: 15, code: '15', name_ar: 'تيزي وزو', name_fr: 'Tizi Ouzou' },
  { id: 16, code: '16', name_ar: 'الجزائر العاصمة', name_fr: 'Alger' },
  { id: 17, code: '17', name_ar: 'الجلفة', name_fr: 'Djelfa' },
  { id: 18, code: '18', name_ar: 'جيجل', name_fr: 'Jijel' },
  { id: 19, code: '19', name_ar: 'سطيف', name_fr: 'Sétif' },
  { id: 20, code: '20', name_ar: 'سعيدة', name_fr: 'Saïda' },
  { id: 21, code: '21', name_ar: 'سكيكدة', name_fr: 'Skikda' },
  { id: 22, code: '22', name_ar: 'سيدي بلعباس', name_fr: 'Sidi Bel Abbès' },
  { id: 23, code: '23', name_ar: 'عنابة', name_fr: 'Annaba' },
  { id: 24, code: '24', name_ar: 'قالمة', name_fr: 'Guelma' },
  { id: 25, code: '25', name_ar: 'قسنطينة', name_fr: 'Constantine' },
  { id: 26, code: '26', name_ar: 'المدية', name_fr: 'Médéa' },
  { id: 27, code: '27', name_ar: 'مستغانم', name_fr: 'Mostaganem' },
  { id: 28, code: '28', name_ar: 'المسيلة', name_fr: 'M\'Sila' },
  { id: 29, code: '29', name_ar: 'معسكر', name_fr: 'Mascara' },
  { id: 30, code: '30', name_ar: 'ورقلة', name_fr: 'Ouargla' },
  { id: 31, code: '31', name_ar: 'وهران', name_fr: 'Oran' },
  { id: 32, code: '32', name_ar: 'البيض', name_fr: 'El Bayadh' },
  { id: 33, code: '33', name_ar: 'إليزي', name_fr: 'Illizi' },
  { id: 34, code: '34', name_ar: 'برج بوعريريج', name_fr: 'Bordj Bou Arréridj' },
  { id: 35, code: '35', name_ar: 'بومرداس', name_fr: 'Boumerdès' },
  { id: 36, code: '36', name_ar: 'الطارف', name_fr: 'El Tarf' },
  { id: 37, code: '37', name_ar: 'تندوف', name_fr: 'Tindouf' },
  { id: 38, code: '38', name_ar: 'تيسمسيلت', name_fr: 'Tissemsilt' },
  { id: 39, code: '39', name_ar: 'الوادي', name_fr: 'El Oued' },
  { id: 40, code: '40', name_ar: 'خنشلة', name_fr: 'Khenchela' },
  { id: 41, code: '41', name_ar: 'سوق أهراس', name_fr: 'Souk Ahras' },
  { id: 42, code: '42', name_ar: 'تيبازة', name_fr: 'Tipaza' },
  { id: 43, code: '43', name_ar: 'ميلة', name_fr: 'Mila' },
  { id: 44, code: '44', name_ar: 'عين الدفلى', name_fr: 'Aïn Defla' },
  { id: 45, code: '45', name_ar: 'النعامة', name_fr: 'Naâma' },
  { id: 46, code: '46', name_ar: 'عين تموشنت', name_fr: 'Aïn Témouchent' },
  { id: 47, code: '47', name_ar: 'غرداية', name_fr: 'Ghardaïa' },
  { id: 48, code: '48', name_ar: 'غليزان', name_fr: 'Relizane' },
  { id: 49, code: '49', name_ar: 'تيميمون', name_fr: 'Timimoun' },
  { id: 50, code: '50', name_ar: 'برج باجي مختار', name_fr: 'Bordj Badji Mokhtar' },
  { id: 51, code: '51', name_ar: 'أولاد جلال', name_fr: 'Ouled Djellal' },
  { id: 52, code: '52', name_ar: 'بني عباس', name_fr: 'Béni Abbès' },
  { id: 53, code: '53', name_ar: 'عين صالح', name_fr: 'In Salah' },
  { id: 54, code: '54', name_ar: 'عين قزام', name_fr: 'In Guezzam' },
  { id: 55, code: '55', name_ar: 'توقرت', name_fr: 'Touggourt' },
  { id: 56, code: '56', name_ar: 'جانت', name_fr: 'Djanet' },
  { id: 57, code: '57', name_ar: 'المغير', name_fr: 'El M\'Ghair' },
  { id: 58, code: '58', name_ar: 'المنيعة', name_fr: 'El Meniaa' }
];

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

export interface AwarenessArticle {
  id: number;
  title: string;
  category: string;
  topic?: string;
  author?: string;
  summary: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  tags?: string;
  status: 'published' | 'draft';
  is_featured: number | boolean;
  created_by?: number;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
  has_file?: number;
  publisher_first_name?: string;
  publisher_last_name?: string;
}

export type ServiceCategory = 'psychological' | 'legal' | 'social' | 'treatment' | string;
export type RequestStatus = 'NEW' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'AWAITING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'NOT_REQUIRED' | string;
export interface Service {
  id: number;
  provider_id: number;
  title: string;
  description: string;
  amount_dzd: number;
  category: ServiceCategory;
  is_active: boolean;
  provider_name?: string;
}
export interface Provider {
  id: number;
  first_name: string;
  last_name: string;
  role_slug: string;
  wilaya_name?: string;
}
export interface CareRequest {
  id: number;
  case_file_id: number;
  number_case: string;
  client_name: string;
  provider_id: number;
  provider_name: string;
  service_id: number;
  service_title: string;
  amount_dzd: number;
  payment_status: PaymentStatus;
  status: RequestStatus;
  priority: PriorityLevel;
  description: string;
  created_at: string;
  rejection_reason?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  assigned_staff_id?: number;
  assigned_staff_first_name?: string;
  assigned_staff_last_name?: string;
  assigned_staff_role_slug?: string;
  refund_status?: string;
  refund_request_status?: string;
}
export interface CareRequestDetail {
  request: CareRequest;
  history: Array<{ id?: number; status?: string; note?: string; created_at?: string; actor_name?: string }>;
  reports: Array<{
    id?: number;
    assessment?: string;
    professional_notes?: string;
    recommendations?: string;
    treatment_plan?: string;
    next_appointment?: string;
    client_summary?: string;
    final_evaluation?: string;
    created_at?: string;
  }>;
}
export interface RequestStats {
  pending: number;
  accepted: number;
  rejected: number;
  in_progress: number;
  upcoming: number;
  paid: number;
  revenue_dzd: number;
}
export interface PaymentRecord {
  id: number;
  request_id: number;
  user_id?: number;
  provider_id?: number;
  amount_dzd?: number;
  amount?: number;
  currency?: string;
  payment_method?: string;
  transaction_id?: string;
  status: PaymentStatus;
  created_at: string;
  paid_at?: string;
  client_name?: string;
  provider_name?: string;
  service_title?: string;
  refund_status?: string | null;
}
export interface ProviderStaff {
  staff_user_id: number;
  first_name: string;
  last_name: string;
  role_slug: string;
  email: string;
  is_active: boolean;
}
