import {
  Appointment,
  CareRequest,
  PaymentTransaction,
  SpecialistReport,
} from '../types';

export type CustomerRequestProgressStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'ACTION_REQUIRED';

export type CustomerRequestProgressTone = 'success' | 'progress' | 'waiting' | 'action';

export interface CustomerRequestProgress {
  status: CustomerRequestProgressStatus;
  label: string;
  detail: string;
  tone: CustomerRequestProgressTone;
}

export function getCustomerRequestProgress(
  request: CareRequest,
  appointments: Appointment[] = [],
  transactions: PaymentTransaction[] = [],
  reports: SpecialistReport[] = []
): CustomerRequestProgress {
  const caseAppointments = appointments.filter(
    (appointment) => appointment.caseNumber === request.caseNumber
  );
  const completedAppointment = caseAppointments.some(
    (appointment) => appointment.status === 'COMPLETED'
  );
  const cancelledAppointments = caseAppointments.length > 0 &&
    caseAppointments.every((appointment) => appointment.status === 'CANCELLED');
  const appointment = caseAppointments.find(
    (item) => item.status === 'CONFIRMED' || item.status === 'COMPLETED'
  );
  const caseTransactions = transactions.filter(
    (transaction) => transaction.caseNumber === request.caseNumber
  );
  const paymentConfirmed =
    request.paymentStatus === 'PAID' ||
    caseTransactions.some((transaction) => transaction.status === 'SUCCESSFUL');
  const paymentFailed =
    !paymentConfirmed &&
    (request.paymentStatus === 'FAILED' ||
      request.paymentStatus === 'CANCELLED' ||
      (request.paymentStatus !== 'PROCESSING' &&
        caseTransactions.some(
          (transaction) =>
            transaction.status === 'FAILED' || transaction.status === 'CANCELLED'
        )));
  const paymentRequired = request.amountDzd > 0 && request.paymentStatus !== 'NOT_REQUIRED';
  const consultationStarted =
    request.status === 'IN_PROGRESS' ||
    reports.some((report) => report.caseNumber === request.caseNumber);

  if (request.status === 'COMPLETED' || completedAppointment) {
    return {
      status: 'COMPLETED',
      label: 'مكتمل',
      detail: 'اكتملت الاستشارة أو الخدمة بحسب سجل الطلب.',
      tone: 'success',
    };
  }

  if (request.status === 'REJECTED' || request.status === 'CANCELLED') {
    return {
      status: 'ACTION_REQUIRED',
      label: 'يحتاج إلى إجراء',
      detail:
        request.status === 'REJECTED'
          ? 'لم يُقبل الطلب. راجع سبب الرفض في تفاصيله قبل تقديم طلب آخر.'
          : 'أُلغي الطلب. راجع تفاصيله أو ابدأ طلبًا جديدًا عند الحاجة.',
      tone: 'action',
    };
  }

  if (
    consultationStarted ||
    (request.status === 'ACCEPTED' && !paymentRequired)
  ) {
    return {
      status: 'IN_PROGRESS',
      label: 'قيد التنفيذ',
      detail: 'بدأ تنفيذ الطلب أو سُجلت متابعة مهنية له.',
      tone: 'progress',
    };
  }

  if (cancelledAppointments) {
    return {
      status: 'ACTION_REQUIRED',
      label: 'يحتاج إلى إجراء',
      detail: 'أُلغي الموعد المسجل. راجع تفاصيل الطلب لمعرفة الخطوة التالية.',
      tone: 'action',
    };
  }

  if (paymentFailed) {
    return {
      status: 'ACTION_REQUIRED',
      label: 'يحتاج إلى إجراء',
      detail: 'تعذر تأكيد الدفع. أعد المحاولة من تفاصيل الطلب.',
      tone: 'action',
    };
  }

  if (
    paymentRequired &&
    !paymentConfirmed &&
    ['ACCEPTED', 'WAITING_PAYMENT'].includes(request.status) &&
    request.paymentStatus === 'PENDING'
  ) {
    return {
      status: 'ACTION_REQUIRED',
      label: 'يحتاج إلى إجراء',
      detail: 'وافق مقدم الخدمة على الطلب؛ أكمل الدفع لتأكيد الموعد.',
      tone: 'action',
    };
  }

  if (appointment || paymentConfirmed || request.status === 'PAID') {
    const appointmentDetail = appointment
      ? `تم تأكيد الموعد في ${appointment.date}${appointment.time ? `، ${appointment.time}` : ''}.`
      : 'تم تأكيد الدفع، والطلب بانتظار بدء الموعد أو تحديث حالته.';
    return {
      status: 'WAITING',
      label: 'في الانتظار',
      detail: appointmentDetail,
      tone: 'waiting',
    };
  }

  return {
    status: 'WAITING',
    label: 'في الانتظار',
    detail: 'طلبك مسجل وبانتظار مراجعة مقدم الخدمة.',
    tone: 'waiting',
  };
}
