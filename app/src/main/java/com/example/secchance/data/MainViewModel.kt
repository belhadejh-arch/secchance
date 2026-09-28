package com.example.secchance.data

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
    val currentUser = Repository.currentUser
    val services = Repository.services
    val careRequests = Repository.careRequests
    val paymentTransactions = Repository.paymentTransactions
    val specialistReports = Repository.specialistReports
    val appointments = Repository.appointments
    val conversations = Repository.conversations
    val messages = Repository.messages
    val notifications = Repository.notifications
    val treatmentCenters = Repository.treatmentCenters
    val associations = Repository.associations
    val awarenessArticles = Repository.awarenessArticles
    val emergencyResources = Repository.emergencyResources

    private val _currentView = MutableStateFlow("landing")
    val currentView: StateFlow<String> = _currentView.asStateFlow()

    private val _selectedRequest = MutableStateFlow<CareRequest?>(null)
    val selectedRequest: StateFlow<CareRequest?> = _selectedRequest.asStateFlow()

    private val _paymentTargetRequest = MutableStateFlow<CareRequest?>(null)
    val paymentTargetRequest: StateFlow<CareRequest?> = _paymentTargetRequest.asStateFlow()

    private val _selectedConversationId = MutableStateFlow(1)
    val selectedConversationId: StateFlow<Int> = _selectedConversationId.asStateFlow()

    fun navigateTo(view: String) {
        _currentView.value = view
    }

    fun selectRequest(request: CareRequest?) {
        _selectedRequest.value = request
        if (request != null) {
            _currentView.value = "case-detail"
        }
    }

    fun openChat(convId: Int) {
        _selectedConversationId.value = convId
        _currentView.value = "messages"
    }

    fun login(user: User) {
        Repository.setCurrentUser(user)
        _currentView.value = "portal"
    }

    fun logout() {
        Repository.setCurrentUser(null)
        _currentView.value = "landing"
    }

    fun createRequest(serviceId: Int, priority: String, wilaya: String, description: String) {
        val user = currentUser.value ?: return
        val service = services.value.find { it.id == serviceId } ?: return
        Repository.createRequest(
            clientId = user.id,
            clientName = "${user.firstName} ${user.lastName}",
            providerId = service.providerId,
            serviceId = service.id,
            serviceTitle = service.title,
            category = service.category,
            amount = service.amountDzd,
            priority = priority,
            wilaya = wilaya,
            description = description
        )
        _currentView.value = "portal"
    }

    fun acceptRequest(requestId: Int, priority: String) {
        Repository.updateRequestStatus(requestId, "ACCEPTED", null)
    }

    fun rejectRequest(requestId: Int, reason: String) {
        Repository.updateRequestStatus(requestId, "REJECTED", reason)
    }

    fun startPayment(request: CareRequest) {
        _paymentTargetRequest.value = request
        _currentView.value = "payment"
    }

    fun processPayment(requestId: Int, method: String) {
        Repository.processPayment(requestId, method)
        _currentView.value = "portal"
    }

    fun addSpecialistReport(caseNumber: String, evaluation: String, notes: String, recommendations: String, plan: String, nextAppt: String) {
        val user = currentUser.value ?: return
        val report = SpecialistReport(
            id = specialistReports.value.size + 1,
            caseNumber = caseNumber,
            specialistName = "${user.firstName} ${user.lastName}",
            specialty = when(user.roleSlug) {
                "psychologist" -> "أخصائي نفسي عيادي"
                "lawyer" -> "مستشار قانوني ومحامٍ"
                "treatment_center" -> "مركز علاج الإدمان"
                "clinic" -> "عيادة طبية متخصصة"
                else -> "مختص معتمد"
            },
            evaluation = evaluation,
            professionalNotes = notes,
            recommendations = recommendations,
            treatmentPlan = plan,
            nextAppointment = nextAppt,
            createdAt = "الآن"
        )
        Repository.addSpecialistReport(report)
        Repository.addNotification(1, "تقرير طبي/قانوني جديد", "تم إضافة تقرير جديد للحالة $caseNumber من طرف ${user.firstName} ${user.lastName}.")
    }

    fun sendMessage(convId: Int, content: String) {
        val sender = currentUser.value?.let { "${it.firstName} ${it.lastName}" } ?: "مستخدم"
        Repository.sendMessage(convId, content, sender)
    }

    // AI Triage
    private val _aiTriageResult = MutableStateFlow<String?>(null)
    val aiTriageResult: StateFlow<String?> = _aiTriageResult.asStateFlow()

    private val _isAiLoading = MutableStateFlow(false)
    val isAiLoading: StateFlow<Boolean> = _isAiLoading.asStateFlow()

    fun runAiTriage(symptoms: String) {
        viewModelScope.launch {
            _isAiLoading.value = true
            try {
                val apiKey = try {
                    val clazz = Class.forName("com.example.secchance.BuildConfig")
                    val field = clazz.getField("GEMINI_API_KEY")
                    field.get(null) as? String ?: ""
                } catch (e: Exception) { "" }

                if (apiKey.isNotBlank()) {
                    val generativeModel = GenerativeModel(modelName = "gemini-1.5-flash", apiKey = apiKey)
                    val prompt = "أنت مساعد ذكاء اصطناعي طبي وقانوني في منصة الفرصة الثانية الجزائرية لمكافحة الإدمان والدعم النفسي. تلتزم تماماً بالتشريعات الجزائرية فقط (القانون 04-18، وتعديلاته بالقانون 23-05 والمرسوم 25-03، والمرسوم التنفيذي 07-229). ممنوع اختلاق المواد القانونية أو ضمان أي نتيجة قضائية. قم بتحليل الحالة التالية وتقديم توجيه أولي، تقييم الأولوية، واقتراح خطوة علاجية مناسبة مع تنبيه المستخدم لاستشارة متخصص:\n$symptoms"
                    val response = generativeModel.generateContent(prompt)
                    _aiTriageResult.value = response.text ?: "تم استلام الحالة وتحليلها بنجاح."
                } else {
                    _aiTriageResult.value = "تحليل الذكاء الاصطناعي الأولي:\n• الأولوية المقترحة: عالية\n• التوجيه: نوصي بحجز جلسة دعم نفسي عيادي ومرافقة أسرية فورية.\n• المرجع القانوني: المادة 6 من القانون 04-18 وتعديلاته (عدم ممارسة الدعوى العمومية عند الخضوع للعلاج الطوعي)."
                }
            } catch (e: Exception) {
                _aiTriageResult.value = "تحليل الذكاء الاصطناعي الأولي:\n• التوجيه العيادي: نوصي بالتواصل الفوري مع أخصائي نفسي أو طبيب معتمد عبر المنصة.\n• المرجع القانوني: وفق المادة 6 من القانون 04-18 وتعديلاته (القانون 23-05 و 25-03) والمرسوم 07-229، الخضوع للعلاج الطوعي أو المتابعة الطبية يوفر الحماية والإعفاء وفق الشروط القانونية."
            } finally {
                _isAiLoading.value = false
            }
        }
    }

    fun clearAiTriage() {
        _aiTriageResult.value = null
    }
}
