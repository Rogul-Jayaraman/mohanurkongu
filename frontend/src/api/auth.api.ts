import api from '../lib/api';
import { 
  LoginData, 
  SignupData, 
  LoginResult, 
  SignupResult, 
  VerificationResult,
  ApiResponse 
} from '../types/auth';

export const authApi = {
  verifyRegistrationOtp: async (email: string, otp: string): Promise<ApiResponse<VerificationResult>> => {
    const response = await api.post<ApiResponse<VerificationResult>>('/auth/verify-registration-otp', { email, otp });
    return response as any;
  },

  signup: async (data: SignupData): Promise<ApiResponse<SignupResult>> => {
    const response = await api.post<ApiResponse<SignupResult>>('/auth/signup', data);
    return response as any;
  },

  login: async (data: LoginData): Promise<ApiResponse<LoginResult>> => {
    const response = await api.post<ApiResponse<LoginResult>>('/auth/login', data);
    return response as any;
  },

  adminLogin: async (data: LoginData): Promise<ApiResponse<LoginResult>> => {
    const response = await api.post<ApiResponse<LoginResult>>('/auth/admin-login', data);
    return response as any;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return response as any;
  },

  resetPassword: async (email: string, otp: string, password: string): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/reset-password', { email, otp, password });
    return response as any;
  },

  sendRegistrationOtp: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/send-registration-otp', { email });
    return response as any;
  },
};
