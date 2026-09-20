import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { query, queryOne } from '../db';
import { optionalAuth, AuthenticatedRequest } from '../middleware';

const router = Router();

// Lazy Gemini client
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAI;
}

// Emergency keywords to flag critical situations
const CRITICAL_KEYWORDS = [
  'انتحار', 'جرعة زائدة', 'غيبوبة', 'اختناق', 'أفكار انتحارية', 'سلاح', 'قتل', 'إيذاء نفسي',
  'suicide', 'overdose', 'تشنجات حادة', 'نزيف', 'طوارئ'
];

router.post('/triage', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { user_input, addiction_type_hint } = req.body;

  if (!user_input || user_input.trim().length < 5) {
    res.status(422).json({
      success: false,
      message: 'يرجى تقديم وصف موجز للمشكلة أو الأعراض لتقديم التوجيه المناسب.'
    });
    return;
  }

  const text = user_input.toLowerCase();
  const isEmergency = CRITICAL_KEYWORDS.some(keyword => text.includes(keyword));

  const addictionTypes = query<{ id: number; name_ar: string }>('SELECT id, name_ar FROM addiction_types');
  const emergencies = query('SELECT * FROM emergency_resources');

  const aiClient = getGenAI();

  if (aiClient) {
    try {
      const prompt = `
أنت المساعد الذكي الإرشادي المعتمد لمنصة "الفرصة الثانية" (Second Chance Platform).
مهمتك الأساسية هي التوجيه الأولي فقط وتقديم الدعم الإنساني وتصنيف الحالة واقتراح مستوى الأولوية.

القواعد الصارمة والإلزامية للأمان الطبي:
1. يُحظر تماماً تقديم أي تشخيص طبي قاطع أو وصف أدوية أو علاجات كيميائية.
2. إذا كانت هناك مؤشرات على حالة خطر داهم أو أفكار إيذاء للنفس، يجب التنبيه فوراً لأرقام الطوارئ (1099 خط الإرشاد الوطني، 14 الحماية المدنية، 1055 الدرك الوطني).
3. ركز على طمأنة المستخدم والتأكيد على سرية المنصة وتوجيهه لفتح ملف حالة أو حجز موعد مع أخصائي نفسي أو محامٍ.

أنواع الإدمان المتاحة في النظام:
${addictionTypes.map(a => `- المعرف ${a.id}: ${a.name_ar}`).join('\n')}

نص المستخدم:
"${user_input}"

المطلوب: أجب بصيغة JSON حصراً بالتنسيق التالي:
{
  "guidance_message": "رسالة توجيهية هادئة ومساندة باللغة العربية الفصحى تشرح الخطوة الأولى المناسبة وتذكر بأن هذا توجيه أولي وليس بديلاً عن الاستشارة الطبية",
  "suggested_addiction_type_id": رقم المعرف الأنسب من القائمة أعلاه,
  "suggested_priority": "Critical" أو "High" أو "Medium" أو "Low",
  "recommended_action": "open_case" أو "emergency_contact" أو "consult_specialist",
  "is_critical": true أو false
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      res.json({
        success: true,
        data: {
          ...parsed,
          emergency_contacts: isEmergency || parsed.is_critical ? emergencies : []
        }
      });
      return;
    } catch (err) {
      console.warn('Gemini API call failed, falling back to rule-based engine:', err);
    }
  }

  // Resilient Rule-Based Fallback
  let suggestedPriority = 'Medium';
  let suggestedAddictionTypeId = 1;
  let recommendedAction = 'open_case';

  if (isEmergency) {
    suggestedPriority = 'Critical';
    recommendedAction = 'emergency_contact';
  } else if (text.includes('مهدئ') || text.includes('أقراص') || text.includes('دواء') || text.includes('بريغابالين')) {
    suggestedAddictionTypeId = 3;
    suggestedPriority = 'High';
  } else if (text.includes('كحول') || text.includes('خمر')) {
    suggestedAddictionTypeId = 2;
    suggestedPriority = 'High';
  } else if (text.includes('شاشة') || text.includes('ألعاب') || text.includes('هاتف')) {
    suggestedAddictionTypeId = 4;
    suggestedPriority = 'Low';
  } else if (text.includes('قمار') || text.includes('رهان')) {
    suggestedAddictionTypeId = 5;
    suggestedPriority = 'Medium';
  }

  const guidance = isEmergency
    ? 'تنبيه عاجل: تبدو الحالة بحاجة إلى تدخل فوري. نرجو منك التوجه لأقرب مصلحة استعجالات أو الاتصال فوراً بالرقم الأخضر 1099 أو الحماية المدنية 14. المنصة توفر أيضاً إمكانية فتح ملف حالة فورية لتكليف فريق التدخل والمتابعة.'
    : 'أهلاً بك في منصة الفرصة الثانية. نقدّر شجاعتك في طلب المساعدة وسريتك التامة مضمونة بنسبة 100%. نوصي بفتح ملف حالة لتخصيص أخصائي نفسي أو استشارة قانونية مناسبة لوضع خطة تعافٍ مدروسة خطوة بخطوة.';

  res.json({
    success: true,
    data: {
      guidance_message: guidance,
      suggested_addiction_type_id: suggestedAddictionTypeId,
      suggested_priority: suggestedPriority,
      recommended_action: recommendedAction,
      is_critical: isEmergency,
      emergency_contacts: isEmergency ? emergencies : []
    }
  });
});

export default router;
