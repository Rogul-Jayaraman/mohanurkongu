import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import signupHeroImg from '@/assets/images/auth/signup_hero.jpeg';
import { useLanguage } from '@/context/LanguageContext';
import type { SignupData } from '@/types/auth';
import { validateSignupStep } from '@/utils/validators/auth';
import {
    SignupNameForm,
    SignupEmailForm,
    SignupPhoneForm,
    SignupPasswordForm,
    SignupTermsForm,
    SignupSubmitForm
} from '@/components/forms/auth/SignupForm';
import { useSignup, useSendRegistrationOtp, useVerifyRegistrationOtp } from '@/hooks/auth/useAuth';
import { OtpVerificationModal } from '@/components/modals/auth/OtpVerificationModal';

export const signupContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

export const signupItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

/**
 * SignupHero – visual hero section for the signup page (45% width).
 */
export const SignupHero: React.FC = () => {
    const { t, language } = useLanguage();

    return (
        <section className="hidden lg:flex relative w-[45%] lg:min-h-0 flex-col justify-center items-center p-6 lg:pl-12 lg:pr-2 lg:py-6 overflow-hidden">
            <img
                alt="Traditional South Indian Wedding"
                className="absolute inset-0 object-cover h-full w-full"
                src={signupHeroImg}
            />
            <div className="absolute inset-0 bg-linear-to-br from-gold/20 to-rosewood/70 opacity-90 backdrop-blur-[1px]"></div>

            <div className="ornament-corner absolute top-6 left-6 opacity-80"></div>
            <div className="ornament-corner absolute top-6 right-6 rotate-90 opacity-80"></div>
            <div className="ornament-corner absolute bottom-6 right-6 rotate-180 opacity-80"></div>
            <div className="ornament-corner absolute bottom-6 left-6 -rotate-90 opacity-80"></div>

            <div className="relative z-10 text-center space-y-6 max-w-md">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="material-symbols-outlined text-gold text-3xl! mb-2 drop-shadow-md">hive</span>
                </motion.div>

                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={`font-serif font-bold leading-tight drop-shadow-sm text-white ${
                        language === 'ta' ? 'text-3xl lg:text-4xl' : 'text-2xl lg:text-3xl'
                    }`}
                >
                    {t('signup.hero.title')}
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="h-[2px] w-full bg-linear-to-r from-transparent via-gold/40 to-transparent my-4"
                ></motion.div>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className={`font-script text-gold font-semibold drop-shadow-sm tracking-wider ${
                        language === 'ta' ? 'text-3xl' : 'text-4xl'
                    }`}
                >
                    {t('signup.hero.tags')}
                </motion.p>

                <div className="grid grid-cols-3 gap-4 pt-10">
                    {[
                        { icon: 'verified_user', label: t('signup.hero.feat1') },
                        { icon: 'diamond', label: t('signup.hero.feat2') },
                        { icon: 'lock_person', label: t('signup.hero.feat3') }
                    ].map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + index * 0.1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-14 h-14 rounded-full border border-gold/60 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg hover:border-gold transition-colors">
                                <span className="material-symbols-outlined text-gold text-3xl">{item.icon}</span>
                            </div>
                            <span className="text-[10px] mt-2 font-bold tracking-[0.2em] uppercase text-white drop-shadow-md text-center">{item.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/**
 * SignupFormWrapper – orchestrates state, mutations, and composes sub-forms.
 */
export const SignupFormWrapper: React.FC = () => {
    const navigate = useNavigate();
    const { t, language, translateError } = useLanguage();

    const signupMutation = useSignup();
    const sendOtpMutation = useSendRegistrationOtp();
    const verifyOtpMutation = useVerifyRegistrationOtp();

    const [isOTPSent, setIsOTPSent] = useState(false);
    const [isOTPVerified, setIsOTPVerified] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

    const [otpValue, setOtpValue] = useState('');
    const [verificationToken, setVerificationToken] = useState<string | null>(null);

    const [formData, setFormData] = useState<SignupData>({
        firstNameEn: '',
        lastNameEn: '',
        firstNameTa: '',
        lastNameTa: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof SignupData, string>>>({});
    const [otpError, setOtpError] = useState<string | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [isNameFocused, setIsNameFocused] = useState<'first' | 'last' | null>(null);

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    const handleSendOTP = () => {
        if (!isValidEmail) return;
        setGeneralError(null);
        sendOtpMutation.mutate(formData.email, {
            onSuccess: (response: any) => {
                if (response.success) {
                    setIsOTPSent(true);
                    setIsOTPVerified(false);
                    setIsOtpModalOpen(true);
                    setGeneralError(null);
                }
            },
            onError: (error: any) => {
                setGeneralError(translateError(error?.message || 'Failed to send OTP', error?.code));
            }
        });
    };

    const handleResendOTP = () => {
        setGeneralError(null);
        sendOtpMutation.mutate(formData.email, {
            onSuccess: (response: any) => {
                if (response.success) {
                    setGeneralError(null);
                }
            },
            onError: (error: any) => {
                setGeneralError(translateError(error?.message || 'Failed to send OTP', error?.code));
            }
        });
    };

    const handleCloseOtpModal = () => {
        setIsOtpModalOpen(false);
        if (!isOTPVerified) {
            setIsOTPSent(false);
            setOtpValue('');
            setOtpError(null);
        }
    };

    const handleVerifyOTP = () => {
        if (!otpValue || otpValue.length !== 6) return;
        verifyOtpMutation.mutate({ email: formData.email, otp: otpValue }, {
            onSuccess: (response: any) => {
                if (response.success && response.data?.verificationToken) {
                    setVerificationToken(response.data.verificationToken);
                    setIsOTPVerified(true);
                    setIsOtpModalOpen(false);
                    setGeneralError(null);
                    setOtpError(null);
                }
            },
            onError: (error: any) => {
                setOtpError(translateError(error?.message || 'Invalid OTP', error?.code));
            }
        });
    };

    const handleFieldChange = (field: keyof SignupData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
        if (field === 'email' && (isOTPSent || isOTPVerified)) {
            setIsOTPSent(false);
            setIsOTPVerified(false);
        }
        if ((field === 'password' || field === 'confirmPassword') && errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
        if (generalError) setGeneralError(null);
    };

    const handleFirstNameChange = (value: string) => {
        let val = value;
        if (language === 'en' && val.length > 0) {
            val = val.charAt(0).toUpperCase() + val.slice(1);
        }
        if (language === 'en') {
            setFormData(prev => ({ ...prev, firstNameEn: val }));
            if (errors.firstNameEn) setErrors(prev => ({ ...prev, firstNameEn: undefined }));
        } else {
            setFormData(prev => ({ ...prev, firstNameTa: val }));
            if (errors.firstNameTa) setErrors(prev => ({ ...prev, firstNameTa: undefined }));
        }
    };

    const handleLastNameChange = (value: string) => {
        let val = value;
        if (language === 'en' && val.length > 0) {
            val = val.charAt(0).toUpperCase() + val.slice(1);
        }
        if (language === 'en') {
            setFormData(prev => ({ ...prev, lastNameEn: val }));
            if (errors.lastNameEn) setErrors(prev => ({ ...prev, lastNameEn: undefined }));
        } else {
            setFormData(prev => ({ ...prev, lastNameTa: val }));
            if (errors.lastNameTa) setErrors(prev => ({ ...prev, lastNameTa: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        if (!isOTPVerified) {
            setGeneralError(t('signup.verifyEmailFirst'));
            return;
        }
        const newErrors = validateSignupStep(1, formData);
        const translatedErrors: Partial<Record<keyof SignupData, string>> = {};
        (Object.keys(newErrors) as Array<keyof SignupData>).forEach(key => {
            translatedErrors[key] = t(newErrors[key]!);
        });
        setErrors(translatedErrors);
        if (Object.keys(newErrors).length === 0) {
            const { confirmPassword, termsAccepted, ...cleanData } = formData;
            signupMutation.mutate({ ...cleanData, verificationToken: verificationToken! } as SignupData, {
                onSuccess: (response: any) => {
                    if (response.success && response.data) {
                        navigate('/manamaalai/login', { state: { message: 'Signup successful. Please login to continue.' } });
                    }
                },
                onError: (error: any) => {
                    const apiError = error;
                    if (apiError?.fieldErrors && typeof apiError.fieldErrors === 'object') {
                        setErrors(apiError.fieldErrors);
                    } else {
                        setGeneralError(translateError(apiError?.message || 'Signup failed', apiError?.code));
                    }
                }
            });
        }
    };

    const currentFirstName = language === 'en' ? formData.firstNameEn : formData.firstNameTa;
    const currentAlternateFirstName = language === 'en' ? formData.firstNameTa : formData.firstNameEn;
    const currentFirstNameField = language === 'en' ? 'firstNameEn' : 'firstNameTa';
    const currentAlternateFirstNameField = language === 'en' ? 'firstNameTa' : 'firstNameEn';

    const currentLastName = language === 'en' ? formData.lastNameEn : formData.lastNameTa;
    const currentAlternateLastName = language === 'en' ? formData.lastNameTa : formData.lastNameEn;
    const currentLastNameField = language === 'en' ? 'lastNameEn' : 'lastNameTa';
    const currentAlternateLastNameField = language === 'en' ? 'lastNameTa' : 'lastNameEn';

    const sendButtonText = isOTPSent ? t('signup.resend') : t('common.verify');

    return (
        <section className="w-full lg:w-[55%] bg-white p-6 sm:p-10 lg:p-12 overflow-hidden relative flex flex-col items-center justify-center min-h-[calc(100vh-140px)] lg:min-h-[750px]">
            <div className="absolute inset-0 kolam-watermark pointer-events-none opacity-[0.25]"></div>

            <motion.div
                variants={signupContainerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-lg mx-auto"
            >
                <motion.div variants={signupItemVariants} className="mb-8 text-center">
                    <span className="material-symbols-outlined text-rosewood text-4xl mb-2 drop-shadow-sm">grass</span>
                    <h3 className="font-serif text-3xl font-bold text-rosewood">{t('signup.title')}</h3>
                    <p className="text-slate-500 text-sm font-medium font-manrope mt-1 uppercase tracking-wider">
                        {t('signup.subtitle')}
                    </p>
                </motion.div>

                <div className="space-y-5">
                    {generalError && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-red-600 text-xs font-bold text-center">
                            {generalError}
                        </div>
                    )}

                    <motion.div variants={signupItemVariants}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SignupNameForm
                                label={t('signup.firstName')}
                                placeholder=''
                                value={currentFirstName}
                                alternateValue={currentAlternateFirstName}
                                error={errors[currentFirstNameField as keyof SignupData] as string}
                                targetLanguage={language === 'en' ? 'en' : 'ta'}
                                isFocused={isNameFocused === 'first'}
                                onChange={() => {}}
                                onAutoCapitalizeChange={handleFirstNameChange}
                                onPreviewChange={(confirmed: string) => {
                                    setFormData(prev => ({ ...prev, [currentAlternateFirstNameField]: confirmed }));
                                    if (errors[currentAlternateFirstNameField as keyof SignupData]) setErrors(prev => ({ ...prev, [currentAlternateFirstNameField]: undefined }));
                                }}
                                onFocus={() => setIsNameFocused('first')}
                                onBlur={() => setIsNameFocused(null)}
                            />
                            <SignupNameForm
                                label={t('signup.lastName')}
                                placeholder=''
                                value={currentLastName}
                                alternateValue={currentAlternateLastName}
                                error={errors[currentLastNameField as keyof SignupData] as string}
                                targetLanguage={language === 'en' ? 'en' : 'ta'}
                                isFocused={isNameFocused === 'last'}
                                onChange={() => {}}
                                onAutoCapitalizeChange={handleLastNameChange}
                                onPreviewChange={(confirmed: string) => {
                                    setFormData(prev => ({ ...prev, [currentAlternateLastNameField]: confirmed }));
                                    if (errors[currentAlternateLastNameField as keyof SignupData]) setErrors(prev => ({ ...prev, [currentAlternateLastNameField]: undefined }));
                                }}
                                onFocus={() => setIsNameFocused('last')}
                                onBlur={() => setIsNameFocused(null)}
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={signupItemVariants}>
                        <SignupEmailForm
                            label={t('signup.email')}
                            placeholder=''
                            value={formData.email}
                            error={errors.email}
                            isValidEmail={isValidEmail}
                            isOTPVerified={isOTPVerified}
                            sendIsPending={sendOtpMutation.isPending}
                            verifyIsPending={verifyOtpMutation.isPending}
                            sendButtonText={sendButtonText}
                            resendText={t('signup.resend')}
                            verifyText={t('common.verify')}
                            verifiedText={t('common.verified')}
                            verified={isOTPVerified}
                            onSendOTP={handleSendOTP}
                            onChange={(value: string) => handleFieldChange('email', value)}
                        />
                    </motion.div>

                    <OtpVerificationModal
                        isOpen={isOtpModalOpen}
                        onClose={handleCloseOtpModal}
                        email={formData.email}
                        otp={otpValue}
                        error={otpError ?? undefined}
                        verifyIsPending={verifyOtpMutation.isPending}
                        sendIsPending={sendOtpMutation.isPending}
                        otpBtnText={t('signup.otpBtn')}
                        verifyingText={t('signup.verifying')}
                        otpVerifySuccessText={t('signup.otpVerifySuccess')}
                        otpInfoText={t('signup.otpInfo')}
                        resendText={t('signup.resend')}
                        isOTPVerified={isOTPVerified}
                        onOTPChange={(value: string) => setOtpValue(value)}
                        onVerify={handleVerifyOTP}
                        onResend={handleResendOTP}
                    />

                    <motion.div variants={signupItemVariants}>
                        <SignupPhoneForm
                            label={t('signup.phone')}
                            value={formData.phone}
                            error={errors.phone}
                            onChange={(value: string) => handleFieldChange('phone', value)}
                        />
                    </motion.div>

                    <motion.div variants={signupItemVariants}>
                        <SignupPasswordForm
                            passwordLabel={t('signup.password')}
                            passwordPlaceholder=''
                            confirmPasswordLabel={t('signup.confirmPassword')}
                            confirmPasswordPlaceholder=''
                            passwordValue={formData.password}
                            confirmPasswordValue={formData.confirmPassword || ''}
                            passwordError={errors.password}
                            confirmPasswordError={errors.confirmPassword}
                            onPasswordChange={(value: string) => handleFieldChange('password', value)}
                            onConfirmPasswordChange={(value: string) => handleFieldChange('confirmPassword', value)}
                        />
                    </motion.div>

                    <motion.div variants={signupItemVariants}>
                        <SignupTermsForm
                            termsText={t('signup.terms')}
                            checked={formData.termsAccepted}
                            error={errors.termsAccepted}
                            onChange={(checked: boolean) => handleFieldChange('termsAccepted', checked)}
                        />
                    </motion.div>

                    <motion.div variants={signupItemVariants}>
                        <SignupSubmitForm
                            submitText={t('signup.submit')}
                            awaitingVerifyText={t('signup.awaitingVerify')}
                            verifyEmailFirstText={t('signup.verifyEmailFirst')}
                            alreadyText={t('signup.already')}
                            isOTPVerified={isOTPVerified}
                            isOTPSent={isOTPSent}
                                signupIsPending={signupMutation.isPending}
                                verifyIsPending={verifyOtpMutation.isPending}
                            onSubmit={handleSubmit}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};
