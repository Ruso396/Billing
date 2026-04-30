export type UserRole = 'superadmin' | 'admin' | 'cashier';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  company_id: number | null;
}

export interface LoginResponse {
  status: boolean;
  role?: UserRole;
  token?: string;
  message?: string;
  data?: AuthUser;
}

export interface ApiEnvelope<T> {
  status: boolean;
  message?: string;
  data?: T;
}
