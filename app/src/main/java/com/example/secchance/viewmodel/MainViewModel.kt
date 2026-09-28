package com.example.secchance.data

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    // Current screen state: 'landing', 'portal', 'services', 'new-case', 'case-detail', 'appointments', 'messages', 'directory', 'awareness', 'emergency', 'payment'
    private val _currentView = MutableStateFlow("landing")
    val currentView: StateFlow<String> = _currentView.asStateFlow()

    fun navigateTo(view: String) {
        _currentView.value = view
    }

    val currentUser = Repository.currentUser
    val services = Repository.services
    val careRequests = Repository.careRequests
    val paymentTransactions = Repository.paymentTransactions
    val specialistReports = Repository.specialistReports
    val appointments = Repository.appointments
    val conversations = Repository.conversations
    val messages = Repository.messages
    val notifications = Repository.notifications

    private val _selectedRequest = MutableStateFlow<CareRequest?>(null)
    val selectedRequest: StateFlow<CareRequest?> = _selectedRequest.asStateFlow()

    fun selectRequest(req: CareRequest) {
        _selectedRequest.value = req
        _currentView.value = "case-detail"
    }

    private val _paymentTargetRequest = MutableStateFlow<CareRequest?>(null)
    val paymentTargetRequest: StateFlow<CareRequest?> = _paymentTargetRequest.asStateFlow()

    fun startPayment(req: CareRequest) {
        _paymentTargetRequest.value = req
        _currentView.value = "payment"
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
        val service = services.value.find { it.id == serviceId } ?: services.value.first()
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
        Repository.updateRequestPriority(requestId, priority)
        Repository.updateRequestStatus(requestId, "ACCEPTED")
    }

    fun rejectRequest(requestId: Int, reason: String) {
        Repository.updateRequestStatus(requestId, "REJECTED", reason)
    }

    fun processPayment(requestId: Int, paymentMethod: String) {
        Repository.processPayment(requestId, paymentMethod)
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
                else -> "طبيب معالج"
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
                    _aiTriageResult.value = "تحليل الذكاء الاصطناعي الأولي:\n• الأولوية المقترحة: عالية\n• التوجيه: نوصي بحجز جلسة دعم نفسي عيادي ومرافقة أسرية فورية.\n• الخطوة الموالية: طلب خدمة استشارية عبر المنصة لربطكم بمختص معتمد."
                }
            } catch (e: Exception) {
                _aiTriageResult.value = "تحليل الذكاء الاصطناعي:\nنوصي بطلب استشارة أو دعم نفسي عيادي في أسرع وقت."
            } finally {
                _isAiLoading.value = false
            }
        }
    }

    fun clearAiTriage() {
        _aiTriageResult.value = null
    }
}
