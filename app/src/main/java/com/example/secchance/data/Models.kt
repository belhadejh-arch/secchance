package com.example.secchance.data

data class User(
    val id: Int,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String,
    val roleSlug: String, // 'admin', 'psychologist', 'lawyer', 'treatment_center', 'clinic', 'association', 'family', 'patient'
    val wilayaName: String?,
    val status: String = "active"
)

data class CareRequest(
    val id: Int,
    val caseNumber: String,
    val clientId: Int,
    val clientName: String,
    val providerId: Int,
    val providerName: String,
    val serviceId: Int,
    val serviceTitle: String,
    val category: String, // 'psychological', 'legal', 'treatment', 'social', 'medical'
    val amountDzd: Int,
    val priority: String, // 'Critical', 'High', 'Medium', 'Low'
    val status: String, // 'NEW', 'PENDING_PROVIDER', 'ACCEPTED', 'WAITING_PAYMENT', 'PAID', 'APPOINTMENT_CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'
    val rejectionReason: String? = null,
    val paymentStatus: String, // 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'NOT_REQUIRED'
    val wilayaName: String,
    val description: String,
    val createdAt: String,
    val appointmentDate: String? = null,
    val appointmentTime: String? = null
)

data class PaymentTransaction(
    val id: Int,
    val paymentId: String,
    val orderId: String,
    val clientId: Int,
    val clientName: String,
    val providerId: Int,
    val providerName: String,
    val serviceTitle: String,
    val amountDzd: Int,
    val currency: String = "DZD",
    val paymentMethod: String, // 'EDAHABIA', 'CIB'
    val transactionId: String,
    val status: String, // 'SUCCESSFUL', 'FAILED', 'PENDING', 'REFUNDED', 'CANCELLED'
    val createdAt: String,
    val paidAt: String? = null
)

data class SpecialistReport(
    val id: Int,
    val caseNumber: String,
    val specialistName: String,
    val specialty: String,
    val evaluation: String,
    val professionalNotes: String,
    val recommendations: String,
    val treatmentPlan: String,
    val nextAppointment: String,
    val createdAt: String
)

data class Appointment(
    val id: Int,
    val caseNumber: String,
    val specialistName: String,
    val specialty: String,
    val date: String,
    val time: String,
    val type: String,
    val status: String // 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
)

data class Message(
    val id: Int,
    val conversationId: Int,
    val senderName: String,
    val content: String,
    val timestamp: String,
    val isFromMe: Boolean
)

data class Conversation(
    val id: Int,
    val title: String,
    val caseNumber: String,
    val lastMessage: String,
    val lastMessageTime: String,
    val unreadCount: Int
)

data class TreatmentCenter(
    val id: Int,
    val name: String,
    val wilayaName: String,
    val address: String,
    val phone: String,
    val services: String
)

data class Association(
    val id: Int,
    val name: String,
    val wilayaName: String,
    val address: String,
    val phone: String,
    val services: String
)

data class AwarenessArticle(
    val id: Int,
    val title: String,
    val category: String,
    val author: String,
    val summary: String,
    val content: String,
    val date: String
)

data class ServiceItem(
    val id: Int,
    val title: String,
    val category: String,
    val description: String,
    val amountDzd: Int,
    val providerId: Int,
    val providerName: String
)

data class PlatformNotification(
    val id: Int,
    val userId: Int,
    val title: String,
    val message: String,
    val timestamp: String,
    val isRead: Boolean = false
)

data class EmergencyResource(
    val id: Int,
    val title: String,
    val phoneNumber: String,
    val description: String,
    val is247: Boolean
)

val ALGERIA_WILAYAS = listOf(
    "01. أدرار", "02. الشلف", "03. الأغواط", "04. أم البواقي", "05. باتنة", "06. بجاية", "07. بسكرة", "08. بشار",
    "09. البليدة", "10. البويرة", "11. تمنراست", "12. تبسة", "13. تلمسان", "14. تيارت", "15. تيزي وزو", "16. الجزائر العاصمة",
    "17. الجلفة", "18. جيجل", "19. سطيف", "20. سعيدة", "21. سكيكدة", "22. سيدي بلعباس", "23. عنابة", "24. قالمة",
    "25. قسنطينة", "26. المدية", "27. مستغانم", "28. المسيلة", "29. معسكر", "30. ورقلة", "31. وهران", "32. البيض",
    "33. إليزي", "34. برج بوعريريج", "35. بومرداس", "36. الطارف", "37. تندوف", "38. تيسمسيلت", "39. الوادي", "40. خنشلة",
    "41. سوق أهراس", "42. تيبازة", "43. ميلة", "44. عين الدفلى", "45. النيامة", "46. عين تيموشنت", "47. غرداية", "48. غليزان"
)
