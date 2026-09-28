export type UserRole =
  | 'admin'
  | 'psychologist'
  | 'doctor'
  | 'lawyer'
  | 'legal_advisor'
  | 'clinic'
  | 'hospital'
  | 'treatment_center'
  | 'association'
  | 'family'
  | 'patient'
  | 'user';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: number | string;
  uid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleSlug: UserRole;
  wilayaName: string | null;
  status: UserStatus | string;
  specialty?: string;
  subSpecialty?: string;
  licenseNumber?: string;
  address?: string;
  avatarUrl?: string;
  documents?: string[];
  servicesOffered?: string[];
  createdAt?: string;
  password?: string;
}

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type RequestStatus =
  | 'NEW'
  | 'PENDING_PROVIDER'
  | 'ACCEPTED'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'APPOINTMENT_CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'NOT_REQUIRED';

export interface CareRequest {
  id: number | string;
  caseNumber: string;
  clientId: number | string;
  clientName: string;
  providerId: number | string;
  providerName: string;
  serviceId: number;
  serviceTitle: string;
  category: string;
  amountDzd: number;
  priority: Priority;
  status: RequestStatus;
  rejectionReason?: string | null;
  paymentStatus: PaymentStatus;
  wilayaName: string;
  description: string;
  caseType?: string;
  attachedDocuments?: string[];
  createdAt: string;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
}

export interface PaymentTransaction {
  id: number | string;
  paymentId: string;
  orderId: string;
  clientId: number | string;
  clientName: string;
  providerId: number | string;
  providerName: string;
  serviceTitle: string;
  amountDzd: number;
  currency: string;
  paymentMethod: 'EDAHABIA' | 'CIB';
  transactionId: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  paidAt?: string | null;
}

export interface SpecialistReport {
  id: number | string;
  caseNumber: string;
  specialistId?: number | string;
  specialistName: string;
  specialty: string;
  evaluation: string;
  professionalNotes: string;
  recommendations: string;
  treatmentPlan: string;
  nextAppointment: string;
  createdAt: string;
}

export interface Appointment {
  id: number | string;
  caseNumber: string;
  clientId?: number | string;
  clientName?: string;
  specialistId?: number | string;
  specialistName: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface Message {
  id: number;
  conversationId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  caseNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface TreatmentCenter {
  id: number;
  name: string;
  wilayaName: string;
  address: string;
  phone: string;
  services: string;
}

export interface Association {
  id: number;
  name: string;
  wilayaName: string;
  address: string;
  phone: string;
  services: string;
}

export interface AwarenessArticle {
  id: number;
  title: string;
  category: string;
  author: string;
  summary: string;
  content: string;
  date: string;
}

export interface ServiceItem {
  id: number;
  title: string;
  category: string;
  description: string;
  amountDzd: number;
  providerId: number;
  providerName: string;
}

export interface PlatformNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface EmergencyResource {
  id: number;
  title: string;
  phoneNumber: string;
  description: string;
  is247: boolean;
  isPoisonCenter?: boolean;
}

export interface LegalTopic {
  id: number;
  title: string;
  plainSummary: string;
  legalReference: string; // e.g. القانون رقم 04-18 (25 ديسمبر 2004)
  lawDate: string;
  relevantArticle: string; // المادة ذات الصلة
  officialText: string; // النص الرسمي للمادة
  amendments: string[]; // التعديلات: 23-05 / 2023, 25-03 / 2025
  plainExplanation: string; // شرح مبسط
  executiveDecree: string; // المرسوم التطبيقي: المرسوم التنفيذي 07-229
  officialSource: string; // الجريدة الرسمية للجمهورية الجزائرية
  lastReviewedDate: string; // آخر مراجعة
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface LegalContentVersion {
  id: number;
  topicId: number;
  versionLabel: string;
  updatedAt: string;
  updatedBy: string;
  changeNotes: string;
}

export interface CaseFileDocument {
  id: number;
  caseNumber: string;
  clientId: number;
  clientName: string;
  providerId: number;
  providerName: string;
  fileName: string;
  fileCategory: 'تقرير طبي' | 'شهادة طبية' | 'وثيقة قضائية' | 'محضر رسمي' | 'وثيقة شخصية';
  fileSize: string;
  uploadDate: string;
  isConfidential: boolean;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface UserComplaint {
  id: number;
  userId: number;
  userName: string;
  subject: string;
  description: string;
  status: 'NEW' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
}

export const ALGERIA_WILAYAS: string[] = [
  '01. أدرار',
  '02. الشلف',
  '03. الأغواط',
  '04. أم البواقي',
  '05. باتنة',
  '06. بجاية',
  '07. بسكرة',
  '08. بشار',
  '09. البليدة',
  '10. البويرة',
  '11. تمنراست',
  '12. تبسة',
  '13. تلمسان',
  '14. تيارت',
  '15. تيزي وزو',
  '16. الجزائر العاصمة',
  '17. الجلفة',
  '18. جيجل',
  '19. سطيف',
  '20. سعيدة',
  '21. سكيكدة',
  '22. سيدي بلعباس',
  '23. عنابة',
  '24. قالمة',
  '25. قسنطينة',
  '26. المدية',
  '27. مستغانم',
  '28. المسيلة',
  '29. معسكر',
  '30. ورقلة',
  '31. وهران',
  '32. البيض',
  '33. إليزي',
  '34. برج بوعريريج',
  '35. بومرداس',
  '36. الطارف',
  '37. تندوف',
  '38. تيسمسيلت',
  '39. الوادي',
  '40. خنشلة',
  '41. سوق أهراس',
  '42. تيبازة',
  '43. ميلة',
  '44. عين الدفلى',
  '45. النعامة',
  '46. عين تيموشنت',
  '47. غرداية',
  '48. غليزان',
  '49. تيميمون',
  '50. برج باجي مختار',
  '51. أولاد جلال',
  '52. بني عباس',
  '53. إن صالح',
  '54. إن قزام',
  '55. توقرت',
  '56. جانت',
  '57. المغير',
  '58. المنيعة',
];
