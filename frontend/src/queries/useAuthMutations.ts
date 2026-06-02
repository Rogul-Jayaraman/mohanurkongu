import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  login,
  logout,
  logoutAll,
  register,
  refresh,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resetPassword,
  changePassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
} from '../api/auth.api';
import { adminLogin } from '../api/admin.api';
import { queryKeys, LOGOUT_REMOVE_KEYS } from './queryKeys';
import { showErrorToast } from './mutationUtils';
import api from '../lib/api';

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('session', JSON.stringify({ accessToken: data.accessToken, sessionId: data.sessionId }));
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      qc.invalidateQueries({ queryKey: queryKeys.membership.mine() });
      qc.invalidateQueries({ queryKey: queryKeys.membership.caps() });
    },
    onError: (err) => showErrorToast(err, 'Login failed'),
  });
}

export function useAdminLoginMutation() {
  return useMutation({
    mutationFn: adminLogin,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
    onError: (err) => showErrorToast(err, 'Registration failed'),
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      qc.removeQueries({ queryKey: LOGOUT_REMOVE_KEYS, exact: false });
      localStorage.removeItem('session');
      void api.post('/auth/clear').catch(() => {});
    },
  });
}

export function useLogoutAllMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutAll,
    onSettled: () => {
      qc.removeQueries({ queryKey: LOGOUT_REMOVE_KEYS, exact: false });
      localStorage.removeItem('session');
    },
  });
}

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: (args: { email: string; kind: 'register' | 'reset' }) =>
      args.kind === 'register' ? sendRegistrationOtp({ email: args.email }) : sendPasswordResetOtp({ email: args.email }),
    onError: (err) => showErrorToast(err, 'Could not send code'),
  });
}

export function useVerifyOtpMutation() {
  return useMutation<{ verificationToken?: string; resetToken?: string }, Error, { email: string; otp: string; kind: 'register' | 'reset' }>({
    mutationFn: (args) =>
      args.kind === 'register'
        ? verifyRegistrationOtp({ email: args.email, otp: args.otp })
        : verifyPasswordResetOtp({ email: args.email, otp: args.otp }),
    onError: (err) => showErrorToast(err, 'Invalid code'),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => toast.success('Password reset. Please sign in.'),
    onError: (err) => showErrorToast(err, 'Could not reset password'),
  });
}

export function useChangePasswordMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Password changed');
    },
    onError: (err) => showErrorToast(err, 'Could not change password'),
  });
}

export function useRefreshTokenMutation() {
  return useMutation({
    mutationFn: refresh,
  });
}
