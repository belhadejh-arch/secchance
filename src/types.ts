export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleSlug: 'admin' | 'psychologist' | 'lawyer' | 'treatment_center' | 'clinic' | 'association' | 'family' | 'patient';
  wilayaName: string | null;
  status: string;
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
  id: number;
  caseNumber: string;
  clientId: number;
  clientName: string;
  providerId: number;
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
  createdAt: string;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
}

export interface PaymentTransaction {
  id: number;
  paymentId: string;
  orderId: string;
  clientId: number;
  clientName: string;
  providerId: number;
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
  id: number;
  caseNumber: string;
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
  id: number;
  caseNumber: string;
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
];
