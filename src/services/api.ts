import {
  User,
  Institution,
  FDRRecord,
  FdrDocument,
  RenewalRequest,
  ReleaseRequest,
  AuditLog,
  SystemNotification,
  SystemSettings,
} from '../types';

let authToken: string | null = localStorage.getItem('fdr_token') || null;

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('fdr_token', token);
  } else {
    localStorage.removeItem('fdr_token');
  }
}

export function getToken(): string | null {
  return authToken || localStorage.getItem('fdr_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error) {
        errorMsg = errJson.error;
        if (errJson.details && Array.isArray(errJson.details)) {
          errorMsg += `: ${errJson.details.join(', ')}`;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(identifier: string, password: string, loginType: 'INSTITUTE' | 'AICTE_DEPT' = 'INSTITUTE'): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, loginType }),
    });
    setToken(res.token);
    return res;
  },

  async trackApplication(ref: string): Promise<any> {
    return request(`/api/fdr/track/${encodeURIComponent(ref)}`);
  },

  async validateAttachments(id: string, status: 'VERIFIED' | 'DEFICIENT', remarks?: string): Promise<any> {
    return request(`/api/fdr/${id}/validate-attachments`, {
      method: 'POST',
      body: JSON.stringify({ status, remarks }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },

  async getDemoAccounts(): Promise<{ demoAccounts: any[] }> {
    return request<{ demoAccounts: any[] }>('/api/auth/demo-accounts');
  },

  async switchDemoAccount(userId: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    setToken(res.token);
    return res;
  },

  // FDRs
  async getFdrs(params: Record<string, string> = {}): Promise<{
    data: FDRRecord[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/fdr?${qs}`);
  },

  async getFdrById(id: string): Promise<{ record: FDRRecord; duplicateAnalysis: any }> {
    return request(`/api/fdr/${id}`);
  },

  async createFdr(data: any): Promise<{ record: FDRRecord; duplicateWarning: any }> {
    return request('/api/fdr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFdr(id: string, data: any): Promise<{ record: FDRRecord }> {
    return request(`/api/fdr/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async submitFdr(id: string, notes?: string): Promise<{ record: FDRRecord; message: string }> {
    return request(`/api/fdr/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async deleteDraftFdr(id: string): Promise<{ message: string }> {
    return request(`/api/fdr/${id}`, { method: 'DELETE' });
  },

  // Scrutiny Reviews
  async getVerificationQueue(): Promise<{
    queue: FDRRecord[];
    stats: { totalPending: number; correctionAwaitingResubmit: number; recentlyApproved: number };
  }> {
    return request('/api/reviews/queue');
  },

  async startReview(id: string): Promise<{ record: FDRRecord }> {
    return request(`/api/reviews/${id}/start-review`, { method: 'POST' });
  },

  async approveFdr(id: string, notes?: string): Promise<{ record: FDRRecord }> {
    return request(`/api/reviews/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async requestCorrection(id: string, correctionRequirements: string, reasonCategory?: string): Promise<{ record: FDRRecord }> {
    return request(`/api/reviews/${id}/request-correction`, {
      method: 'POST',
      body: JSON.stringify({ correctionRequirements, reasonCategory }),
    });
  },

  async rejectFdr(id: string, rejectionReason: string, reasonCategory?: string): Promise<{ record: FDRRecord }> {
    return request(`/api/reviews/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, reasonCategory }),
    });
  },

  // Lifecycle (Renewal / Release)
  async getLifecycleRequests(): Promise<{
    renewalRequests: RenewalRequest[];
    releaseRequests: ReleaseRequest[];
  }> {
    return request('/api/lifecycle/requests');
  },

  async submitRenewalRequest(fdrId: string, data: any): Promise<{ renewalRequest: RenewalRequest }> {
    return request(`/api/lifecycle/fdr/${fdrId}/renewal-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitReleaseRequest(fdrId: string, data: any): Promise<{ releaseRequest: ReleaseRequest }> {
    return request(`/api/lifecycle/fdr/${fdrId}/release-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async decideLifecycleRequest(type: 'renewal' | 'release', id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    return request(`/api/lifecycle/requests/${type}/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  },

  // Documents
  async getAllDocuments(): Promise<{ documents: any[] }> {
    return request('/api/documents');
  },

  async uploadDocument(formData: FormData): Promise<{ document: FdrDocument; ocrAnalysis: any }> {
    return request('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getDownloadUrl(docId: string): string {
    const token = getToken();
    return `/api/documents/${docId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  async extractOcrSample(sampleText: string, fileName?: string): Promise<any> {
    return request('/api/documents/extract-ocr', {
      method: 'POST',
      body: JSON.stringify({ sampleText, fileName }),
    });
  },

  // Maturity
  async getMaturityOverview(): Promise<any> {
    return request('/api/maturity/overview');
  },

  async triggerMaturityEvaluation(): Promise<any> {
    return request('/api/maturity/trigger-evaluation', { method: 'POST' });
  },

  async getNotifications(): Promise<{ notifications: SystemNotification[] }> {
    return request('/api/maturity/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/api/maturity/notifications/${id}/mark-read`, { method: 'POST' });
  },

  // Reports
  async getReportSummary(): Promise<any> {
    return request('/api/reports/fdr-summary');
  },

  // Admin
  async getAuditLogs(params: Record<string, string> = {}): Promise<{ auditLogs: AuditLog[]; total: number }> {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/admin/audit-logs?${qs}`);
  },

  async getUsers(): Promise<{ users: User[] }> {
    return request('/api/admin/users');
  },

  async toggleUserStatus(id: string): Promise<{ success: boolean; isActive: boolean }> {
    return request(`/api/admin/users/${id}/toggle-status`, { method: 'PATCH' });
  },

  async getInstitutions(): Promise<{ institutions: Institution[] }> {
    return request('/api/admin/institutions');
  },

  async getSettings(): Promise<{ settings: SystemSettings }> {
    return request('/api/admin/settings');
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<{ settings: SystemSettings }> {
    return request('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async resetDemoData(): Promise<void> {
    await request('/api/admin/reset-demo-data', { method: 'POST' });
  },

  // Test Suite
  async runAutomatedTests(): Promise<any> {
    return request('/api/test-suite/run');
  },
};
