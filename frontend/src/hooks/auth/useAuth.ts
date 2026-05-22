import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { LoginData, SignupData, LoginResult, SignupResult, VerificationResult, ApiResponse } from '../../types/auth';

export const useLogin = () => {
    return useMutation<ApiResponse<LoginResult>, any, LoginData>({
        mutationFn: (data: LoginData) => authApi.login(data),
    });
};

export const useAdminLogin = () => {
    return useMutation<ApiResponse<LoginResult>, any, LoginData>({
        mutationFn: (data: LoginData) => authApi.adminLogin(data),
    });
};

export const useSignup = () => {
    return useMutation<ApiResponse<SignupResult>, any, SignupData>({
        mutationFn: (data: SignupData) => authApi.signup(data),
    });
};

export const useForgotPassword = () => {
    return useMutation<ApiResponse<null>, any, string>({
        mutationFn: (email: string) => authApi.forgotPassword(email),
    });
};

export const useResetPassword = () => {
    return useMutation<ApiResponse<null>, any, any>({
        mutationFn: ({ email, otp, password }: any) => authApi.resetPassword(email, otp, password),
    });
};

export const useVerifyRegistrationOtp = () => {
    return useMutation<ApiResponse<VerificationResult>, any, { email: string; otp: string }>({
        mutationFn: ({ email, otp }: { email: string; otp: string }) => authApi.verifyRegistrationOtp(email, otp),
    });
};

export const useSendRegistrationOtp = () => {
    return useMutation<ApiResponse<{ message: string }>, any, string>({
        mutationFn: (email: string) => authApi.sendRegistrationOtp(email),
    });
};
