import {
  User,
  ServiceItem,
  CareRequest,
  PaymentTransaction,
  SpecialistReport,
  Appointment,
  Conversation,
  Message,
  PlatformNotification,
  TreatmentCenter,
  Association,
  AwarenessArticle,
  EmergencyResource,
} from '../types';

export const initialUsers: User[] = [
  {
    id: 1,
    firstName: 'محمد',
    lastName: 'بن خالد',
    email: 'family@secchance.dz',
    phone: '0555123456',
    roleSlug: 'family',
    wilayaName: 'الجزائر العاصمة',
    status: 'active',
  },
  {
    id: 2,
    firstName: 'د. أمين',
    lastName: 'منصوري',
    email: 'psy@secchance.dz',
    phone: '0666987654',
    roleSlug: 'psychologist',
    wilayaName: 'وهران',
    status: 'active',
  },
  {
    id: 3,
    firstName: 'أستاذ ياسين',
    lastName: 'بوعلام',
    email: 'lawyer@secchance.dz',
    phone: '0771122334',
    roleSlug: 'lawyer',
    wilayaName: 'قسنطينة',
    status: 'active',
  },
  {
    id: 4,
    firstName: 'مركز الأمل',
    lastName: 'العلاجي',
    email: 'treatment_center@secchance.dz',
    phone: '021334455',
    roleSlug: 'treatment_center',
    wilayaName: 'البليدة',
    status: 'active',
  },
  {
    id: 5,
    firstName: 'العيادة الطبية المتخصصة',
    lastName: 'الشفاء',
    email: 'clinic@secchance.dz',
    phone: '021445566',
    roleSlug: 'clinic',
    wilayaName: 'الجزائر العاصمة',
    status: 'active',
  },
  {
    id: 6,
    firstName: 'جمعية النجاة',
    lastName: 'الخيرية',
    email: 'assoc@secchance.dz',
    phone: '031445566',
    roleSlug: 'association',
    wilayaName: 'عنابة',
    status: 'active',
  },
  {
    id: 7,
    firstName: 'المشرف العام',
    lastName: 'الإدارة',
    email: 'admin@secchance.dz',
    phone: '0550000000',
    roleSlug: 'admin',
    wilayaName: 'الجزائر العاصمة',
    status: 'active',
  },
];

export const initialServices: ServiceItem[] = [
  {
    id: 1,
    title: 'جلسة دعم نفسي وتوجيه عيادي فردي',
    category: 'psychological',
    description: 'جلسة سرية مع أخصائي نفسي عيادي معتمد لمدة 50 دقيقة عبر الإنترنت أو حضورياً.',
    amountDzd: 2500,
    providerId: 2,
    providerName: 'د. أمين منصوري',
  },
  {
    id: 2,
    title: 'استشارة قانونية وإرشاد حقوقي وفق القانون 04-18',
    category: 'legal',
    description: 'دراسة وضعية الحالة وتقديم استشارة قانونية حول التدابير العلاجية والمادة 6.',
    amountDzd: 3000,
    providerId: 3,
    providerName: 'أستاذ ياسين بوعلام',
  },
  {
    id: 3,
    title: 'مرافقة شاملة وإدخال لمركز علاجي متخصص',
    category: 'treatment',
    description: 'تنسيق كامل مع مراكز علاج الإدمان المعتمدة لتوفير سرير رعاية وإزالة السموم.',
    amountDzd: 5000,
    providerId: 4,
    providerName: 'مركز الأمل العلاجي',
  },
  {
    id: 4,
    title: 'استشارة طبية وعيادية متخصصة',
    category: 'medical',
    description: 'فحص طبي شامل واستشارة طبية عيادية لإزالة السموم والمتابعة.',
    amountDzd: 4000,
    providerId: 5,
    providerName: 'العيادة الطبية المتخصصة الشفاء',
  },
  {
    id: 5,
    title: 'برنامج الإرشاد الأسري والتوعية المنزلية',
    category: 'social',
    description: 'جلسات إرشادية مخصصة لأفراد الأسرة لكيفية التعامل مع المتعافي ودعم استقرار البيت.',
    amountDzd: 2000,
    providerId: 6,
    providerName: 'جمعية النجاة الخيرية',
  },
];

export const initialCareRequests: CareRequest[] = [
  {
    id: 1,
    caseNumber: 'SC-2026-8891',
    clientId: 1,
    clientName: 'محمد بن خالد',
    providerId: 2,
    providerName: 'د. أمين منصوري',
    serviceId: 1,
    serviceTitle: 'جلسة دعم نفسي وتوجيه عيادي فردي',
    category: 'psychological',
    amountDzd: 2500,
    priority: 'High',
    status: 'PAID',
    rejectionReason: null,
    paymentStatus: 'PAID',
    wilayaName: 'الجزائر العاصمة',
    description:
      'حالة متابعة عاجلة لشاب يبلغ من العمر 22 سنة يعاني من إدمان المؤثرات العقلية وسط الأسرة، مع رغبة أكيدة في العلاج والمتابعة النفسية.',
    createdAt: '2026-09-25',
    appointmentDate: '2026-10-02',
    appointmentTime: '10:00 صباحاً',
  },
  {
    id: 2,
    caseNumber: 'SC-2026-4420',
    clientId: 1,
    clientName: 'محمد بن خالد',
    providerId: 3,
    providerName: 'أستاذ ياسين بوعلام',
    serviceId: 2,
    serviceTitle: 'استشارة قانونية وإرشاد حقوقي وفق القانون 04-18',
    category: 'legal',
    amountDzd: 3000,
    priority: 'Critical',
    status: 'WAITING_PAYMENT',
    rejectionReason: null,
    paymentStatus: 'PENDING',
    wilayaName: 'الجزائر العاصمة',
    description:
      'طلب استشارة قانونية ودعم نفسي لحماية الأسرة ومواكبة ابن قاصر وقع في فخ الإدمان.',
    createdAt: '2026-09-27',
    appointmentDate: null,
    appointmentTime: null,
  },
];

export const initialPaymentTransactions: PaymentTransaction[] = [
  {
    id: 1,
    paymentId: 'PAY-8891-DZ',
    orderId: 'ORD-1001',
    clientId: 1,
    clientName: 'محمد بن خالد',
    providerId: 2,
    providerName: 'د. أمين منصوري',
    serviceTitle: 'جلسة دعم نفسي وتوجيه عيادي فردي',
    amountDzd: 2500,
    currency: 'DZD',
    paymentMethod: 'EDAHABIA',
    transactionId: 'TXN-998811',
    status: 'SUCCESSFUL',
    createdAt: '2026-09-25',
    paidAt: '2026-09-25',
  },
];

export const initialSpecialistReports: SpecialistReport[] = [
  {
    id: 1,
    caseNumber: 'SC-2026-8891',
    specialistName: 'د. أمين منصوري',
    specialty: 'أخصائي نفسي عيادي',
    evaluation: 'تقييم أولي إيجابي مع رغبة قوية في العلاج وتجاوز مرحلة الاعتماد.',
    professionalNotes:
      'الحالة مستقرة نسبياً وتحتاج إلى متابعة أسبوعية وجلسات دعم معرفي سلوكي.',
    recommendations: 'مواصلة جلسات الدعم الفردي مع إشراك الأسرة في برامج الإرشاد.',
    treatmentPlan: 'خطة علاجية مقسمة على 6 أسابيع من الإرشاد العيادي.',
    nextAppointment: '2026-10-09',
    createdAt: '2026-09-26',
  },
];

export const initialAppointments: Appointment[] = [
  {
    id: 1,
    caseNumber: 'SC-2026-8891',
    specialistName: 'د. أمين منصوري',
    specialty: 'أخصائي نفسي عيادي',
    date: '2026-10-02',
    time: '10:00 صباحاً',
    type: 'جلسة دعم نفسي أولية',
    status: 'CONFIRMED',
  },
  {
    id: 2,
    caseNumber: 'SC-2026-8891',
    specialistName: 'أستاذ ياسين بوعلام',
    specialty: 'مستشار قانوني ومحامٍ',
    date: '2026-10-04',
    time: '02:00 بعد الظهر',
    type: 'استشارة قانونية وتوجيه',
    status: 'PENDING',
  },
];

export const initialConversations: Conversation[] = [
  {
    id: 1,
    title: 'غرفة المتابعة النفسية والطبية',
    caseNumber: 'SC-2026-8891',
    lastMessage: 'مرحباً بك أخي محمد، تم تحديد موعد الجلسة الأولى مع الدكتور أمين.',
    lastMessageTime: 'منذ 10 دقائق',
    unreadCount: 2,
  },
  {
    id: 2,
    title: 'الاستشارة القانونية وحماية الأسرة',
    caseNumber: 'SC-2026-4420',
    lastMessage: 'تم استلام ملف الحالة وجاري دراسته من طرف الأستاذ ياسين.',
    lastMessageTime: 'منذ ساعة',
    unreadCount: 0,
  },
];

export const initialMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      conversationId: 1,
      senderName: 'د. أمين منصوري',
      content: 'أهلاً بك في منصة الفرصة الثانية. نحن هنا لمساعدتكم بكل سرية واحترافية.',
      timestamp: '10:00 ص',
      isFromMe: false,
    },
    {
      id: 2,
      conversationId: 1,
      senderName: 'محمد بن خالد',
      content: 'شكراً جزيلاً دكتور، نحن بحاجة ماسة للتوجيه والمتابعة لعلاج ابننا.',
      timestamp: '10:05 ص',
      isFromMe: true,
    },
    {
      id: 3,
      conversationId: 1,
      senderName: 'د. أمين منصوري',
      content: 'تم تحديد موعد الجلسة الأولى بنجاح.',
      timestamp: '10:10 ص',
      isFromMe: false,
    },
  ],
  2: [
    {
      id: 4,
      conversationId: 2,
      senderName: 'أستاذ ياسين بوعلام',
      content: 'تم استلام ملف الحالة وجاري دراسته.',
      timestamp: '09:30 ص',
      isFromMe: false,
    },
  ],
};

export const initialNotifications: PlatformNotification[] = [
  {
    id: 1,
    userId: 1,
    title: 'مرحباً بك في المنصة',
    message: 'تم تسجيل حسابك بنجاح في منصة الفرصة الثانية.',
    timestamp: '2026-09-25',
    isRead: true,
  },
  {
    id: 2,
    userId: 2,
    title: 'طلب خدمة جديد',
    message: 'لديك طلب جديد للحالة SC-2026-8891 بانتظار القبول.',
    timestamp: '2026-09-25',
    isRead: false,
  },
];

export const initialTreatmentCenters: TreatmentCenter[] = [
  {
    id: 1,
    name: 'مركز الوسيط لعلاج الإدمان - الحراش',
    wilayaName: 'الجزائر العاصمة',
    address: 'شارع محمد بلوزداد، الحراش',
    phone: '021-52-33-44',
    services: 'علاج نفسي، إزالة السموم، رعاية نهارية',
  },
  {
    id: 2,
    name: 'المؤسسة الاستشفائية المتخصصة - البليدة',
    wilayaName: 'البليدة',
    address: 'طريق المدية، البليدة',
    phone: '025-41-22-11',
    services: 'علاج نفسي عيادي، استشفاء داخلي',
  },
  {
    id: 3,
    name: 'مركز الرعاية الاجتماعية وعلاج الإدمان - وهران',
    wilayaName: 'وهران',
    address: 'حي الصديقية، وهران',
    phone: '041-33-22-11',
    services: 'دعم نفسي، إعادة إدماج',
  },
];

export const initialAssociations: Association[] = [
  {
    id: 1,
    name: 'الجمعية الوطنية لمكافحة الإدمان',
    wilayaName: 'الجزائر العاصمة',
    address: 'حي المامونية، الجزائر',
    phone: '021-73-11-22',
    services: 'توعية ميدانية، إرشاد أسري',
  },
  {
    id: 2,
    name: 'جمعية الأمل لعائلات المدمنين',
    wilayaName: 'البليدة',
    address: 'وسط المدينة، البليدة',
    phone: '025-99-88-77',
    services: 'دعم نفسي جماعي، استماع للأسر',
  },
];

export const initialAwarenessArticles: AwarenessArticle[] = [
  {
    id: 1,
    title: 'العلاج الطوعي والمادة 6 من القانون 04-18 وتعديلاته (القانون 23-05 و 25-03)',
    category: 'تشريع جزائري رسمي',
    author: 'دائرة الشؤون القانونية بالمنصة',
    summary:
      'شرح المادة 6: لا تمارس الدعوى العمومية ضد الأشخاص الذين استهلكوا المخدرات أو المؤثرات العقلية إذا ثبت أنهم خضعوا لعلاج مزيل للتسمم أو كانوا تحت المتابعة الطبية منذ حدوث الوقائع المنسوبة إليهم.',
    content:
      'استناداً إلى القانون 04-18 المؤرخ في 25 ديسمبر 2004 المتعلق بالوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها، المعدل والمتمم بالقانون 23-05 (7 مايو 2023) والقانون 25-03 (1 يوليو 2025)، تُعد المادة 6 الأساس القانوني للعلاج الطوعي كبديل عن المتابعة الجزائية، بشرط إثبات الخضوع للعلاج أو المتابعة الطبية منذ حدوث الوقائع.',
    date: '2026-09-28',
  },
  {
    id: 2,
    title: 'كيفية تطبيق المادة 6 وفق المرسوم التنفيذي 07-229',
    category: 'إجراءات تطبيقية',
    author: 'اللجنة الوطنية للوقاية',
    summary:
      'يحدد المرسوم التنفيذي رقم 07-229 المؤرخ في 30 يوليو 2007 كيفيات تطبيق المادة 6 المتعلقة بالعلاج المزيل للتسمم.',
    content:
      'عند انتهاء العلاج المزيل للتسمم، تُسلَّم للمعني شهادة طبية تثبت خضوعه للعلاج أو المتابعة الطبية، وترسل نسخة منها إلى وكيل الجمهورية المختص وفقاً للإجراءات التنظيمية والقانونية السارية.',
    date: '2026-09-28',
  },
];

export const initialEmergencyResources: EmergencyResource[] = [
  {
    id: 1,
    title: 'المركز الوطني لعلم السموم (Centre Anti Poison)',
    phoneNumber: '1032',
    description:
      'الرقم الأخضر الوطني للطوارئ الطبية والتسمومات وحالات الجرعات الزائدة على مدار الساعة',
    is247: true,
  },
  {
    id: 2,
    title: 'الرقم الأخضر الوطني للدرك الوطني',
    phoneNumber: '1055',
    description:
      'مساعدة فورية وتبليغ عن شبكات ترويج المخدرات بحرية وسرية تامة',
    is247: true,
  },
  {
    id: 3,
    title: 'نجدة الشرطة الجزائرية',
    phoneNumber: '1548',
    description: 'للطوارئ الأمنية والحالات الحرجة على مدار الساعة',
    is247: true,
  },
  {
    id: 4,
    title: 'الحماية المدنية',
    phoneNumber: '14',
    description: 'للحالات الطبية الاستعجالية والإنقاذ والإسعاف السريع',
    is247: true,
  },
];
