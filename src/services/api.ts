const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${configuredApiUrl}/api/v1`;

export class ApiError extends Error {
  errors?: Record<string, string>;
  status?: number;

  constructor(message: string, errors?: Record<string, string>, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.status = status;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('scp_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message: string }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const resData = await response.json().catch(() => ({
    success: false,
    message: 'خطأ في معالجة استجابة الخادم'
  }));

  if (!response.ok || !resData.success) {
    throw new ApiError(
      resData.message || 'حدث خطأ أثناء معالجة الطلب',
      resData.errors,
      response.status
    );
  }

  return resData;
}

// API methods
export const api = {
  // Public
  getWilayas: () => apiRequest('/public/wilayas'),
  getAddictionTypes: () => apiRequest('/public/addiction-types'),
  getEmergencyResources: () => apiRequest('/public/emergency-resources'),
  getCenters: () => apiRequest('/public/centers'),
  getAssociations: () => apiRequest('/public/associations'),
  getPublicStats: () => apiRequest('/public/stats'),

  // Auth
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data: any) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => apiRequest('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),

  // Cases
  getCases: () => apiRequest('/cases'),
  getCaseById: (id: number) => apiRequest(`/cases/${id}`),
  createCase: (data: any) => apiRequest('/cases', { method: 'POST', body: JSON.stringify(data) }),
  updateCaseStatus: (id: number, status: string, note?: string) =>
    apiRequest(`/cases/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
  assignSpecialist: (id: number, data: any) =>
    apiRequest(`/cases/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  uploadCaseDocument: (id: number, data: any) =>
    apiRequest(`/cases/${id}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  rateCase: (id: number, rating: number, feedback?: string) =>
    apiRequest(`/cases/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }),

  // Specialists
  getSpecialistsList: () => apiRequest('/specialists/list'),
  addAssessment: (data: any) => apiRequest('/specialists/assessments', { method: 'POST', body: JSON.stringify(data) }),
  createTreatmentPlan: (data: any) => apiRequest('/specialists/treatment-plans', { method: 'POST', body: JSON.stringify(data) }),
  updateFinalEvaluation: (planId: number, final_evaluation: string) =>
    apiRequest(`/specialists/treatment-plans/${planId}/final-eval`, { method: 'PUT', body: JSON.stringify({ final_evaluation }) }),
  logTherapySession: (data: any) => apiRequest('/specialists/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateCaseProgress: (data: any) => apiRequest('/specialists/progress', { method: 'POST', body: JSON.stringify(data) }),
  submitLegalOpinion: (data: any) => apiRequest('/specialists/legal-consultation', { method: 'POST', body: JSON.stringify(data) }),
  addCenterFollowup: (data: any) => apiRequest('/specialists/center-followup', { method: 'POST', body: JSON.stringify(data) }),

  // Appointments
  getAppointments: () => apiRequest('/appointments'),
  createAppointment: (data: any) => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id: number, data: any) => apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Conversations & Messages
  getConversations: () => apiRequest('/conversations'),
  getMessages: (conversationId: number) => apiRequest(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: number, content: string, attachment_url?: string) =>
    apiRequest(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content, attachment_url }) }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: number) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),

  // Admin & Reports
  getKpis: () => apiRequest('/reports/kpis'),
  getAdminUsers: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/admin/users${q}`);
  },
  createAdminUser: (data: any) => apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserStatus: (id: number, data: any) => apiRequest(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getAuditLogs: () => apiRequest('/admin/audit-logs'),
  getSystemSettings: () => apiRequest('/admin/settings'),
  updateSystemSettings: (data: any) => apiRequest('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // AI Triage
  aiTriage: (userInput: string) => apiRequest('/ai/triage', { method: 'POST', body: JSON.stringify({ user_input: userInput }) }),
};
