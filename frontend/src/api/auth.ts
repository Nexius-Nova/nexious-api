import api from './index';

export const authApi = {
  login: (username: string, password: string) =>
    api
      .post<{ access_token: string; user: { id: number; username: string; email: string; role: string } }>(
        '/auth/login',
        { username, password },
      )
      .then((r) => r.data),

  register: (username: string, email: string, password: string, code: string) =>
    api
      .post<{ id: number; username: string; email: string; role: string }>(
        '/auth/register',
        { username, email, password, code },
      )
      .then((r) => r.data),

  sendVerifyCode: (email: string, purpose: 'register' | 'reset' | 'change-email') =>
    api
      .post<{ message: string }>('/auth/send-verify-code', { email, purpose })
      .then((r) => r.data),

  resetPassword: (email: string, code: string, password: string) =>
    api
      .post<{ message: string }>('/auth/reset-password', { email, code, password })
      .then((r) => r.data),

  me: () =>
    api
      .get<{ id: number; username: string; email: string; role: string }>(
        '/auth/me',
      )
      .then((r) => r.data),
};
