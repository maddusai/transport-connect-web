const API_BASE_URL = 'http://localhost:8080/api';
const TOKEN_STORAGE_KEY = 'transport_connect_jwt_token';
const CURRENT_USER_KEY = 'transport_connect_current_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getCurrentUser(): any | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API Error (${response.status})`);
  }

  return data as T;
}

export const apiClient = {
  // Auth
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone: string;
    companyName?: string;
    city?: string;
    gstNumber?: string;
    role: string;
  }) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (identifier: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),

  // Vehicles
  getAvailableVehicles: (city?: string) =>
    request<any[]>(city ? `/vehicles?city=${encodeURIComponent(city)}` : '/vehicles'),
  getMyVehicles: () => request<any[]>('/vehicles/my'),
  addVehicle: (payload: any) => request<any>('/vehicles', { method: 'POST', body: JSON.stringify(payload) }),
  updateVehicleStatus: (id: number, status: string) =>
    request<any>(`/vehicles/${id}/status?status=${status}`, { method: 'PATCH' }),

  // Freight Loads
  getOpenLoads: () => request<any[]>('/loads'),
  getMyLoads: () => request<any[]>('/loads/my'),
  createLoad: (payload: any) => request<any>('/loads', { method: 'POST', body: JSON.stringify(payload) }),
  acceptLoad: (id: number) => request<any>(`/loads/${id}/accept`, { method: 'POST' }),
  updateLoadStatus: (id: number, status: string) =>
    request<any>(`/loads/${id}/status?status=${status}`, { method: 'PATCH' }),

  // Bookings & Live GPS
  createBooking: (payload: any) => request<any>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: () => request<any[]>('/bookings/my'),
  updateBookingStatus: (id: number, status: string) =>
    request<any>(`/bookings/${id}/status?status=${status}`, { method: 'PATCH' }),
  updateBookingLocation: (id: number, payload: any) =>
    request<any>(`/bookings/${id}/location`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Trip Chat
  getChatMessages: (bookingId: number) => request<any[]>(`/bookings/${bookingId}/chat`),
  sendChatMessage: (bookingId: number, message: string) =>
    request<any>(`/bookings/${bookingId}/chat`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Quotations
  submitQuotation: (payload: {
    loadId: number;
    truckNumber?: string;
    offeredAmount: number;
    etaDays?: string;
    notes?: string;
  }) => request<any>('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
  getMyQuotations: () => request<any[]>('/quotations/my'),
  getQuotationsByLoad: (loadId: number) => request<any[]>(`/quotations/load/${loadId}`),
  decideQuotation: (id: number, status: 'ACCEPTED' | 'REJECTED') =>
    request<any>(`/quotations/${id}/decision?status=${status}`, { method: 'PATCH' }),

  // Payments
  submitPayment: (payload: {
    loadId?: number;
    bookingId?: number;
    amount: number;
    transactionNumber: string;
    slipFileName?: string;
  }) => request<any>('/payments', { method: 'POST', body: JSON.stringify(payload) }),
  getMyPayments: () => request<any[]>('/payments/my'),
  getAllPayments: () => request<any[]>('/payments'),
  verifyPayment: (id: number, status: 'VERIFIED' | 'REJECTED') =>
    request<any>(`/payments/${id}/verify?status=${status}`, { method: 'PATCH' }),

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  getAdminUsers: () => request<any[]>('/admin/users'),
};