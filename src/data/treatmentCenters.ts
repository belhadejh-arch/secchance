export interface TreatmentCenterData {
  id: number;
  wilayaCode: string;
  wilayaName: string;
  name: string;
  phone?: string;
  phones?: string[];
  description?: string;
}

export const TREATMENT_CENTERS_NOTICE =
  '⚠️ ملاحظة مهمة: بعض أرقام ومواقع المراكز المتداولة على الإنترنت قديمة، لذلك اتصل بالمركز قبل ما تتنقل للتأكد من العنوان ورقم الاستقبال والخدمات المتوفرة.';

export const ALGERIA_TREATMENT_CENTERS: TreatmentCenterData[] = [
  {
    id: 1,
    wilayaCode: '01',
    wilayaName: 'أدرار',
    name: 'المركز الوسيط لعلاج المدمنين – EPSP أدرار',
    phone: '049 96 68 52',
    phones: ['049 96 68 52']
  },
  {
    id: 2,
    wilayaCode: '02',
    wilayaName: 'الشلف',
    name: 'المركز الوسيط لمعالجة المدمنين – EPSP أولاد فارس',
    phone: '027 77 20 74',
    phones: ['027 77 20 74']
  },
  {
    id: 3,
    wilayaCode: '03',
    wilayaName: 'الأغواط',
    name: 'المركز الوسيط لعلاج الإدمان – EPSP الأغواط',
    phone: '029 90 65 09',
    phones: ['029 90 65 09']
  },
  {
    id: 4,
    wilayaCode: '04',
    wilayaName: 'أم البواقي',
    name: 'مصلحة الوقاية والمتابعة النفسية لعلاج الإدمان – EPSP أم البواقي',
    description: 'مصلحة الوقاية والمتابعة النفسية لعلاج الإدمان'
  },
  {
    id: 5,
    wilayaCode: '05',
    wilayaName: 'باتنة',
    name: 'المركز الوسيط لمكافحة الإدمان – حملة 1',
    phone: '033 23 68 61',
    phones: ['033 23 68 61']
  },
  {
    id: 6,
    wilayaCode: '06',
    wilayaName: 'بجاية',
    name: 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – مدينة بجاية',
    phone: '034 20 76 51 / 034 20 78 63',
    phones: ['034 20 76 51', '034 20 78 63']
  },
  {
    id: 7,
    wilayaCode: '07',
    wilayaName: 'بسكرة',
    name: 'الملحقة الجوارية للتكفل بمرضى الإدمان – وسط بسكرة',
    phone: '033 75 59 58',
    phones: ['033 75 59 58']
  },
  {
    id: 8,
    wilayaCode: '08',
    wilayaName: 'بشار',
    name: 'المركز الوسيط لعلاج الإدمان – EPSP بشار',
    phone: '049 38 37 885',
    phones: ['049 38 37 885']
  },
  {
    id: 9,
    wilayaCode: '09',
    wilayaName: 'البليدة',
    name: 'مركز علاج الإدمان الجواري بالأربعاء – طريق بوقرة',
    phone: '025 33 00 81',
    phones: ['025 33 00 81']
  },
  {
    id: 10,
    wilayaCode: '10',
    wilayaName: 'الجزائر العاصمة',
    name: 'المركز الوسيط لعلاج الإدمان بالشراقة (CISA)',
    phone: '021 29 56 53',
    phones: ['021 29 56 53']
  },
  {
    id: 11,
    wilayaCode: '11',
    wilayaName: 'تمنراست',
    name: 'مصلحة المتابعة والتكفل بحالات الإدمان – EPSP تمنراست',
    phone: '029 34 53 58',
    phones: ['029 34 53 58']
  },
  {
    id: 12,
    wilayaCode: '12',
    wilayaName: 'تبسة',
    name: 'المركز الوسيط لمكافحة الإدمان – تبسة',
    phone: '0542 47 09 29',
    phones: ['0542 47 09 29']
  },
  {
    id: 13,
    wilayaCode: '13',
    wilayaName: 'تلمسان',
    name: 'المركز الوسيط لمكافحة الإدمان "محمد خيرات"',
    description: 'المركز يقدم التكفل الطبي والنفسي والتوجيه وإعادة الإدماج.'
  },
  {
    id: 14,
    wilayaCode: '14',
    wilayaName: 'تيارت',
    name: 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – تيارت'
  },
  {
    id: 15,
    wilayaCode: '15',
    wilayaName: 'تيزي وزو',
    name: 'مركز التكفل والمرافقة النفسية لمرضى الإدمان – تيزي وزو'
  },
  {
    id: 16,
    wilayaCode: '16',
    wilayaName: 'الجزائر العاصمة – المحمدية',
    name: 'مركز الوقاية والعلاج النفسي بالمحمدية',
    phone: '0555 51 74 89',
    phones: ['0555 51 74 89']
  },
  {
    id: 17,
    wilayaCode: '17',
    wilayaName: 'الجلفة',
    name: 'المركز الوسيط لعلاج المدمنين – الجلفة',
    phone: '027 90 97 38',
    phones: ['027 90 97 38']
  },
  {
    id: 18,
    wilayaCode: '18',
    wilayaName: 'جيجل',
    name: 'المركز الوسيط لعلاج الإدمان – حي قرية موسى',
    phone: '034 50 27 27 / 034 50 28 28',
    phones: ['034 50 27 27', '034 50 28 28']
  },
  {
    id: 19,
    wilayaCode: '19',
    wilayaName: 'سطيف',
    name: 'المركز الوسيط لعلاج الإدمان – سطيف',
    phone: '036 91 76 67',
    phones: ['036 91 76 67']
  },
  {
    id: 20,
    wilayaCode: '20',
    wilayaName: 'سعيدة',
    name: 'المركز الوسيط لعلاج الإدمان – حي الزيتون',
    phone: '048 47 18 52 / 048 51 51 88',
    phones: ['048 47 18 52', '048 51 51 88']
  },
  {
    id: 21,
    wilayaCode: '21',
    wilayaName: 'سكيكدة',
    name: 'المركز الوسيط لمعالجة المدمنين (CISA سكيكدة) – وسط الولاية'
  },
  {
    id: 22,
    wilayaCode: '22',
    wilayaName: 'سيدي بلعباس',
    name: 'مصلحة التكفل النفسي وطب الإدمان – EPSP سيدي بلعباس'
  },
  {
    id: 23,
    wilayaCode: '23',
    wilayaName: 'عنابة',
    name: 'المركز الوسيط لعلاج الإدمان برحال – بلدية برحال'
  },
  {
    id: 24,
    wilayaCode: '24',
    wilayaName: 'قالمة',
    name: 'الملحقة الجوارية للمرافقة النفسية وعلاج الإدمان – قالمة وسط'
  },
  {
    id: 25,
    wilayaCode: '25',
    wilayaName: 'قسنطينة',
    name: 'المركز الوسيط لعلاج الإدمان "زواغي سليمان" – حي زواغي سليمان',
    phone: '031 53 00 84',
    phones: ['031 53 00 84'],
    description: '📍 الملحقة الصحية ببلدية الخروب'
  },
  {
    id: 26,
    wilayaCode: '26',
    wilayaName: 'المدية',
    name: 'مركز التوجيه والمتابعة لمرضى الإدمان – EPSP المدية'
  },
  {
    id: 27,
    wilayaCode: '27',
    wilayaName: 'مستغانم',
    name: 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – مستغانم'
  },
  {
    id: 28,
    wilayaCode: '28',
    wilayaName: 'المسيلة',
    name: 'مركز المتابعة النفسية والعلاج الجواري للإدمان – المسيلة'
  },
  {
    id: 29,
    wilayaCode: '29',
    wilayaName: 'معسكر',
    name: 'المركز الوسيط لمكافحة الإدمان – مدينة معسكر وسط'
  },
  {
    id: 30,
    wilayaCode: '30',
    wilayaName: 'ورقلة',
    name: 'المركز الوسيط لعلاج المدمنين (CISA ورقلة) – EPSP ورقلة وسط'
  },
  {
    id: 31,
    wilayaCode: '31',
    wilayaName: 'وهران',
    name: 'المركز الوسيط لمعالجة الإدمان – حي الصديقية',
    description: '🏥 تتوفر أيضًا مصلحة الاستشفاء والحجز الداخلي لإزالة السموم بالمستشفى الجامعي.'
  },
  {
    id: 32,
    wilayaCode: '32',
    wilayaName: 'البيض',
    name: 'الملحقة الجوارية للتكفل والمتابعة النفسية – EPSP البيض وسط'
  },
  {
    id: 33,
    wilayaCode: '33',
    wilayaName: 'إليزي',
    name: 'مصلحة المتابعة النفسية والتوجيه لمرضى الإدمان – الهياكل الصحية الجوارية'
  },
  {
    id: 34,
    wilayaCode: '34',
    wilayaName: 'برج بوعريريج',
    name: 'المركز الوسيط لعلاج الإدمان – عاصمة الولاية'
  },
  {
    id: 35,
    wilayaCode: '35',
    wilayaName: 'بومرداس',
    name: 'مركز المتابعة النفسية والعلاج الجواري (CISA) – وسط بومرداس'
  },
  {
    id: 36,
    wilayaCode: '36',
    wilayaName: 'الطارف',
    name: 'المركز الوسيط لمعالجة المدمنين – وسط ولاية الطارف'
  },
  {
    id: 37,
    wilayaCode: '37',
    wilayaName: 'تندوف',
    name: 'مصلحة الاستقبال والتوجيه النفسي لحالات الإدمان – EPSP تندوف'
  },
  {
    id: 38,
    wilayaCode: '38',
    wilayaName: 'تيسمسيلت',
    name: 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – تسمسيلت وسط'
  },
  {
    id: 39,
    wilayaCode: '39',
    wilayaName: 'الوادي',
    name: 'مركز معالجة الإدمان الجواري – وسط ولاية الوادي'
  },
  {
    id: 40,
    wilayaCode: '40',
    wilayaName: 'خنشلة',
    name: 'المركز الوسيط لعلاج وتوجيه المدمنين – مدينة خنشلة وسط'
  }
];
