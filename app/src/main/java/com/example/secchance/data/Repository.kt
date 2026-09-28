package com.example.secchance.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object Repository {
    private val _currentUser = MutableStateFlow<User?>(
        User(1, "محمد", "بن خالد", "family@secchance.dz", "0555123456", "family", "الجزائر العاصمة", "active")
    )
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    fun setCurrentUser(user: User?) {
        _currentUser.value = user
    }

    val sampleUsers = listOf(
        User(1, "محمد", "بن خالد", "family@secchance.dz", "0555123456", "family", "الجزائر العاصمة", "active"),
        User(2, "د. أمين", "منصوري", "psy@secchance.dz", "0666987654", "psychologist", "وهران", "active"),
        User(3, "أستاذ ياسين", "بوعلام", "lawyer@secchance.dz", "0771122334", "lawyer", "قسنطينة", "active"),
        User(4, "مركز الأمل", "العلاجي", "treatment_center", "021334455", "treatment_center", "البليدة", "active"),
        User(5, "العيادة الطبية المتخصصة", "الشفاء", "clinic@secchance.dz", "021445566", "clinic", "الجزائر العاصمة", "active"),
        User(6, "جمعية النجاة", "الخيرية", "assoc@secchance.dz", "031445566", "association", "عنابة", "active"),
        User(7, "المشرف العام", "الإدارة", "admin@secchance.dz", "0550000000", "admin", "الجزائر العاصمة", "active")
    )

    private val _services = MutableStateFlow<List<ServiceItem>>(
        listOf(
            ServiceItem(1, "جلسة دعم نفسي وتوجيه عيادي فردي", "psychological", "جلسة سرية مع أخصائي نفسي عيادي معتمد لمدة 50 دقيقة عبر الإنترنت أو حضورياً.", 2500, 2, "د. أمين منصوري"),
            ServiceItem(2, "استشارة قانونية وإرشاد حقوقي وفق القانون 04-18", "legal", "دراسة وضعية الحالة وتقديم استشارة قانونية حول التدابير العلاجية والمادة 6.", 3000, 3, "أستاذ ياسين بوعلام"),
            ServiceItem(3, "مرافقة شاملة وإدخال لمركز علاجي متخصص", "treatment", "تنسيق كامل مع مراكز علاج الإدمان المعتمدة لتوفير سرير رعاية وإزالة السموم.", 5000, 4, "مركز الأمل العلاجي"),
            ServiceItem(4, "استشارة طبية وعيادية متخصصة", "medical", "فحص طبي شامل واستشارة طبية عيادية لإزالة السموم والمتابعة.", 4000, 5, "العيادة الطبية المتخصصة الشفاء"),
            ServiceItem(5, "برنامج الإرشاد الأسري والتوعية المنزلية", "social", "جلسات إرشادية مخصصة لأفراد الأسرة لكيفية التعامل مع المتعافي ودعم استقرار البيت.", 2000, 6, "جمعية النجاة الخيرية")
        )
    )
    val services: StateFlow<List<ServiceItem>> = _services.asStateFlow()

    private val _careRequests = MutableStateFlow<List<CareRequest>>(
        listOf(
            CareRequest(
                id = 1,
                caseNumber = "SC-2026-8891",
                clientId = 1,
                clientName = "محمد بن خالد",
                providerId = 2,
                providerName = "د. أمين منصوري",
                serviceId = 1,
                serviceTitle = "جلسة دعم نفسي وتوجيه عيادي فردي",
                category = "psychological",
                amountDzd = 2500,
                priority = "High",
                status = "PAID",
                rejectionReason = null,
                paymentStatus = "PAID",
                wilayaName = "الجزائر العاصمة",
                description = "حالة متابعة عاجلة لشاب يبلغ من العمر 22 سنة يعاني من إدمان المؤثرات العقلية وسط الأسرة، مع رغبة أكيدة في العلاج والمتابعة النفسية.",
                createdAt = "2026-09-25",
                appointmentDate = "2026-10-02",
                appointmentTime = "10:00 صباحاً"
            ),
            CareRequest(
                id = 2,
                caseNumber = "SC-2026-4420",
                clientId = 1,
                clientName = "محمد بن خالد",
                providerId = 3,
                providerName = "أستاذ ياسين بوعلام",
                serviceId = 2,
                serviceTitle = "استشارة قانونية وإرشاد حقوقي وفق القانون 04-18",
                category = "legal",
                amountDzd = 3000,
                priority = "Critical",
                status = "WAITING_PAYMENT",
                rejectionReason = null,
                paymentStatus = "PENDING",
                wilayaName = "الجزائر العاصمة",
                description = "طلب استشارة قانونية ودعم نفسي لحماية الأسرة ومواكبة ابن قاصر وقع في فخ الإدمان.",
                createdAt = "2026-09-27",
                appointmentDate = null,
                appointmentTime = null
            )
        )
    )
    val careRequests: StateFlow<List<CareRequest>> = _careRequests.asStateFlow()

    fun createRequest(
        clientId: Int,
        clientName: String,
        providerId: Int,
        serviceId: Int,
        serviceTitle: String,
        category: String,
        amount: Int,
        priority: String,
        wilaya: String,
        description: String
    ): CareRequest {
        val providerName = sampleUsers.find { it.id == providerId }?.let { "${it.firstName} ${it.lastName}" } ?: "مقدم الخدمة"
        val newReq = CareRequest(
            id = _careRequests.value.size + 1,
            caseNumber = "SC-2026-${(1000..9999).random()}",
            clientId = clientId,
            clientName = clientName,
            providerId = providerId,
            providerName = providerName,
            serviceId = serviceId,
            serviceTitle = serviceTitle,
            category = category,
            amountDzd = amount,
            priority = priority,
            status = "PENDING_PROVIDER",
            rejectionReason = null,
            paymentStatus = if (amount > 0) "PENDING" else "NOT_REQUIRED",
            wilayaName = wilaya,
            description = description,
            createdAt = "الآن"
        )
        _careRequests.value = listOf(newReq) + _careRequests.value
        addNotification(providerId, "طلب خدمة جديد", "لديك طلب جديد للحالة ${newReq.caseNumber} - ${serviceTitle}")
        return newReq
    }

    fun updateRequestStatus(requestId: Int, newStatus: String, rejectionReason: String? = null) {
        _careRequests.value = _careRequests.value.map { req ->
            if (req.id == requestId) {
                val updated = req.copy(
                    status = newStatus,
                    rejectionReason = rejectionReason
                )
                if (newStatus == "ACCEPTED") {
                    addNotification(req.clientId, "تم قبول طلبك", "تمت الموافقة على طلبك ${req.caseNumber} من طرف ${req.providerName}. يرجى إتمام الدفع لتأكيد الموعد.")
                } else if (newStatus == "REJECTED") {
                    addNotification(req.clientId, "تم رفض الطلب", "عذراً، تم رفض الطلب ${req.caseNumber}. السبب: ${rejectionReason ?: "غير متوفر"}")
                }
                updated
            } else req
        }
    }

    fun updateRequestPriority(requestId: Int, newPriority: String) {
        _careRequests.value = _careRequests.value.map { req ->
            if (req.id == requestId) req.copy(priority = newPriority) else req
        }
    }

    private val _paymentTransactions = MutableStateFlow<List<PaymentTransaction>>(
        listOf(
            PaymentTransaction(1, "PAY-8891-DZ", "ORD-1001", 1, "محمد بن خالد", 2, "د. أمين منصوري", "جلسة دعم نفسي وتوجيه عيادي فردي", 2500, "DZD", "EDAHABIA", "TXN-998811", "SUCCESSFUL", "2026-09-25", "2026-09-25")
        )
    )
    val paymentTransactions: StateFlow<List<PaymentTransaction>> = _paymentTransactions.asStateFlow()

    fun processPayment(requestId: Int, paymentMethod: String): PaymentTransaction {
        val req = _careRequests.value.find { it.id == requestId }!!
        val txnId = "TXN-${(100000..999999).random()}"
        val payId = "PAY-${req.caseNumber.replace("SC-", "")}-DZ"
        val orderId = "ORD-${(1000..9999).random()}"

        val txn = PaymentTransaction(
            id = _paymentTransactions.value.size + 1,
            paymentId = payId,
            orderId = orderId,
            clientId = req.clientId,
            clientName = req.clientName,
            providerId = req.providerId,
            providerName = req.providerName,
            serviceTitle = req.serviceTitle,
            amountDzd = req.amountDzd,
            paymentMethod = paymentMethod,
            transactionId = txnId,
            status = "SUCCESSFUL",
            createdAt = "الآن",
            paidAt = "الآن"
        )
        _paymentTransactions.value = listOf(txn) + _paymentTransactions.value

        _careRequests.value = _careRequests.value.map { r ->
            if (r.id == requestId) {
                r.copy(
                    status = "APPOINTMENT_CONFIRMED",
                    paymentStatus = "PAID",
                    appointmentDate = "2026-10-05",
                    appointmentTime = "11:00 صباحاً"
                )
            } else r
        }

        addAppointment(
            Appointment(
                id = _appointments.value.size + 1,
                caseNumber = req.caseNumber,
                specialistName = req.providerName,
                specialty = req.serviceTitle,
                date = "2026-10-05",
                time = "11:00 صباحاً",
                type = "مؤكد عبر الدفع الإلكتروني",
                status = "CONFIRMED"
            )
        )

        addNotification(req.clientId, "تم الدفع وتأكيد الموعد", "تمت عملية الدفع بنجاح عبر ${paymentMethod} برقم المعاملة ${txnId}. تم تأكيد موعدك.")
        addNotification(req.providerId, "دفع جديد وتأكيد موعد", "قام العميل ${req.clientName} بدفع رسوم الخدمة للحالة ${req.caseNumber}.")

        return txn
    }

    private val _specialistReports = MutableStateFlow<List<SpecialistReport>>(
        listOf(
            SpecialistReport(
                1,
                "SC-2026-8891",
                "د. أمين منصوري",
                "أخصائي نفسي عيادي",
                "تقييم أولي إيجابي مع رغبة قوية في العلاج وتجاوز مرحلة الاعتماد.",
                "الحالة مستقرة نسبياً وتحتاج إلى متابعة أسبوعية وجلسات دعم معرفي سلوكي.",
                "مواصلة جلسات الدعم الفردي مع إشراك الأسرة في برامج الإرشاد.",
                "خطة علاجية مقسمة على 6 أسابيع من الإرشاد العيادي.",
                "2026-10-09",
                "2026-09-26"
            )
        )
    )
    val specialistReports: StateFlow<List<SpecialistReport>> = _specialistReports.asStateFlow()

    fun addSpecialistReport(report: SpecialistReport) {
        _specialistReports.value = listOf(report) + _specialistReports.value
    }

    private val _appointments = MutableStateFlow<List<Appointment>>(
        listOf(
            Appointment(1, "SC-2026-8891", "د. أمين منصوري", "أخصائي نفسي عيادي", "2026-10-02", "10:00 صباحاً", "جلسة دعم نفسي أولية", "CONFIRMED"),
            Appointment(2, "SC-2026-8891", "أستاذ ياسين بوعلام", "مستشار قانوني ومحامٍ", "2026-10-04", "02:00 بعد الظهر", "استشارة قانونية وتوجيه", "PENDING")
        )
    )
    val appointments: StateFlow<List<Appointment>> = _appointments.asStateFlow()

    fun addAppointment(appt: Appointment) {
        _appointments.value = _appointments.value + appt
    }

    private val _conversations = MutableStateFlow<List<Conversation>>(
        listOf(
            Conversation(1, "غرفة المتابعة النفسية والطبية", "SC-2026-8891", "مرحباً بك أخي محمد، تم تحديد موعد الجلسة الأولى مع الدكتور أمين.", "منذ 10 دقائق", 2),
            Conversation(2, "الاستشارة القانونية وحماية الأسرة", "SC-2026-4420", "تم استلام ملف الحالة وجاري دراسته من طرف الأستاذ ياسين.", "منذ ساعة", 0)
        )
    )
    val conversations: StateFlow<List<Conversation>> = _conversations.asStateFlow()

    private val _messages = MutableStateFlow<Map<Int, List<Message>>>(
        mapOf(
            1 to listOf(
                Message(1, 1, "د. أمين منصوري", "أهلاً بك في منصة الفرصة الثانية. نحن هنا لمساعدتكم بكل سرية واحترافية.", "10:00 ص", false),
                Message(2, 1, "محمد بن خالد", "شكراً جزيلاً دكتور، نحن بحاجة ماسة للتوجيه والمتابعة لعلاج ابننا.", "10:05 ص", true),
                Message(3, 1, "د. أمين منصوري", "تم تحديد موعد الجلسة الأولى بنجاح.", "10:10 ص", false)
            ),
            2 to listOf(
                Message(4, 2, "أستاذ ياسين بوعلام", "تم استلام ملف الحالة وجاري دراسته.", "09:30 ص", false)
            )
        )
    )
    val messages: StateFlow<Map<Int, List<Message>>> = _messages.asStateFlow()

    fun sendMessage(convId: Int, content: String, senderName: String) {
        val currentMap = _messages.value.toMutableMap()
        val list = currentMap[convId].orEmpty().toMutableList()
        list.add(Message(id = list.size + 1, conversationId = convId, senderName = senderName, content = content, timestamp = "الآن", isFromMe = true))
        currentMap[convId] = list
        _messages.value = currentMap
    }

    private val _notifications = MutableStateFlow<List<PlatformNotification>>(
        listOf(
            PlatformNotification(1, 1, "مرحباً بك في المنصة", "تم تسجيل حسابك بنجاح في منصة الفرصة الثانية.", "2026-09-25", true),
            PlatformNotification(2, 2, "طلب خدمة جديد", "لديك طلب جديد للحالة SC-2026-8891 بانتظار القبول.", "2026-09-25", false)
        )
    )
    val notifications: StateFlow<List<PlatformNotification>> = _notifications.asStateFlow()

    fun addNotification(userId: Int, title: String, message: String) {
        val notif = PlatformNotification(
            id = _notifications.value.size + 1,
            userId = userId,
            title = title,
            message = message,
            timestamp = "الآن",
            isRead = false
        )
        _notifications.value = listOf(notif) + _notifications.value
    }

    val treatmentCenters = listOf(
        TreatmentCenter(1, "مركز الوسيط لعلاج الإدمان - الحراش", "الجزائر العاصمة", "شارع محمد بلوزداد، الحراش", "021-52-33-44", "علاج نفسي، إزالة السموم، رعاية نهارية"),
        TreatmentCenter(2, "المؤسسة الاستشفائية المتخصصة - البليدة", "البليدة", "طريق المدية، البليدة", "025-41-22-11", "علاج نفسي عيادي، استشفاء داخلي"),
        TreatmentCenter(3, "مركز الرعاية الاجتماعية وعلاج الإدمان - وهران", "وهران", "حي الصديقية، وهران", "041-33-22-11", "دعم نفسي، إعادة إدماج")
    )

    val associations = listOf(
        Association(1, "الجمعية الوطنية لمكافحة الإدمان", "الجزائر العاصمة", "حي المامونية، الجزائر", "021-73-11-22", "توعية ميدانية، إرشاد أسري"),
        Association(2, "جمعية الأمل لعائلات المدمنين", "البليدة", "وسط المدينة، البليدة", "025-99-88-77", "دعم نفسي جماعي، استماع للأسر")
    )

    val awarenessArticles = listOf(
        AwarenessArticle(
            1,
            "العلاج الطوعي والمادة 6 من القانون 04-18 وتعديلاته (القانون 23-05 و 25-03)",
            "تشريع جزائري رسمي",
            "دائرة الشؤون القانونية بالمنصة",
            "شرح المادة 6: لا تمارس الدعوى العمومية ضد الأشخاص الذين استهلكوا المخدرات أو المؤثرات العقلية إذا ثبت أنهم خضعوا لعلاج مزيل للتسمم أو كانوا تحت المتابعة الطبية منذ حدوث الوقائع المنسوبة إليهم.",
            "استناداً إلى القانون 04-18 المؤرخ في 25 ديسمبر 2004 المتعلق بالوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها، المعدل والمتمم بالقانون 23-05 (7 مايو 2023) والقانون 25-03 (1 يوليو 2025)، تُعد المادة 6 الأساس القانوني للعلاج الطوعي كبديل عن المتابعة الجزائية، بشرط إثبات الخضوع للعلاج أو المتابعة الطبية منذ حدوث الوقائع.",
            "2026-09-28"
        ),
        AwarenessArticle(
            2,
            "كيفية تطبيق المادة 6 وفق المرسوم التنفيذي 07-229",
            "إجراءات تطبيقية",
            "اللجنة الوطنية للوقاية",
            "يحدد المرسوم التنفيذي رقم 07-229 المؤرخ في 30 يوليو 2007 كيفيات تطبيق المادة 6 المتعلقة بالعلاج المزيل للتسمم.",
            "عند انتهاء العلاج المزيل للتسمم، تُسلَّم للمعني شهادة طبية تثبت خضوعه للعلاج أو المتابعة الطبية، وترسل نسخة منها إلى وكيل الجمهورية المختص وفقاً للإجراءات التنظيمية والقانونية السارية.",
            "2026-09-28"
        )
    )

    val emergencyResources = listOf(
        com.example.secchance.data.EmergencyResource(1, "المركز الوطني لعلم السموم (Centre Anti Poison)", "1032", "الرقم الأخضر الوطني للطوارئ الطبية والتسمومات وحالات الجرعات الزائدة على مدار الساعة", true),
        com.example.secchance.data.EmergencyResource(2, "الرقم الأخضر الوطني للدرك الوطني", "1055", "مساعدة فورية وتبليغ عن شبكات ترويج المخدرات بحرية وسرية تامة", true),
        com.example.secchance.data.EmergencyResource(3, "نجدة الشرطة الجزائرية", "1548", "للطوارئ الأمنية والحالات الحرجة على مدار الساعة", true),
        com.example.secchance.data.EmergencyResource(4, "الحماية المدنية", "14", "للحالات الطبية الاستعجالية والإنقاذ والإسعاف السريع", true)
    )
}
