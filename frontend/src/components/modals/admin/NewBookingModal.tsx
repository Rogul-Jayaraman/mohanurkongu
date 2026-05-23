import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calendar, CheckCircle2, ChevronRight, ChevronLeft, Package as PackageIcon, Info, User, Clock, Wallet, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TransliteratedInputPreview } from '@/components/ui/forms/TransliteratedInputPreview';
import { Input } from '@/components/ui/forms/Input';
import { EmailField } from '@/components/ui/forms/EmailField';
import { PhoneInput } from '@/components/ui/forms/PhoneInput';
import { stubCreateBooking, stubFetchPackages } from '@/utils/stubs';
import type { MandapamPackage as Package } from '@/types/admin-types';
import { useLanguage } from '@/context/LanguageContext';
import { TFunction } from 'i18next';

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    t: TFunction;
    initialDate?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose, onSuccess, t, initialDate }) => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const [step, setStep] = useState(1);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [paymentType, setPaymentType] = useState<'FULL' | 'ADVANCE' | 'NOT_PAID'>('FULL');
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        eventTitle: '',
        date: '',
        session: 'FULL_DAY' as 'FULL_DAY' | 'MORNING' | 'EVENING',
        packageId: '',
        paymentMode: 'CASH' as 'CASH' | 'UPI' | 'BANK_TRANSFER',
        advance: ''
    });

    const [transliteratedData, setTransliteratedData] = useState({
        name: '',
        eventTitle: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchPackages();
            if (initialDate) {
                setFormData(prev => ({ ...prev, date: initialDate }));
            }
        }
    }, [isOpen, initialDate]);

    const fetchPackages = async () => {
        setLoadingPackages(true);
        stubFetchPackages().then(setPackages).finally(() => setLoadingPackages(false));
    };

    const updateForm = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateTransliteratedData = (field: 'name' | 'eventTitle', value: string) => {
        setTransliteratedData(prev => ({ ...prev, [field]: value }));
    };

    const handleConfirmBooking = () => {
        const paidAmount = paymentType === 'ADVANCE'
            ? Number(formData.advance.replace(/,/g, ''))
            : (paymentType === 'FULL' ? (packages.find(p => p.id === formData.packageId)?.price || 0) : 0);
        setIsCreating(true);
        stubCreateBooking({
            contactNameEn: isTamil ? transliteratedData.name : formData.name,
            contactNameTa: isTamil ? formData.name : transliteratedData.name,
            phone: formData.phone,
            eventTitleEn: isTamil ? transliteratedData.eventTitle : formData.eventTitle,
            eventTitleTa: isTamil ? formData.eventTitle : transliteratedData.eventTitle,
            email: formData.email,
            addressEn: formData.address,
            addressTa: formData.address,
            date: formData.date,
            session: formData.session,
            packageId: formData.packageId,
            paymentStatus: paymentType === 'FULL' ? 'FULLY_PAID' : (paymentType === 'ADVANCE' ? 'ADVANCE' : 'NOT_PAID'),
            paymentMode: paymentType === 'NOT_PAID' ? 'CASH' : formData.paymentMode,
            paidAmount,
        }).then(() => {
            toast.success(t('adminMandapam.bookings.createSuccess') || 'Booking created successfully');
            onSuccess?.();
            onClose();
        }).catch((err: any) => toast.error(err.message || 'Failed to create booking'))
        .finally(() => setIsCreating(false));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 5));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const steps = [
        { id: 1, name: t('adminMandapam.bookings.client') || 'Client', icon: User },
        { id: 2, name: t('adminMandapam.bookings.event') || 'Event', icon: Calendar },
        { id: 3, name: t('adminMandapam.bookings.package') || 'Package', icon: PackageIcon },
        { id: 4, name: t('adminMandapam.bookings.payment') || 'Payment', icon: Wallet },
        { id: 5, name: t('adminMandapam.bookings.summary') || 'Summary', icon: CheckCircle2 }
    ];

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-rosewood/40 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-5xl bg-white rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[640px]"
            >
                {/* Left Sidebar - Step Indicator */}
                <div className="w-full md:w-80 bg-rosewood p-8 text-white hidden md:flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-gold/20 flex items-center justify-center border border-gold/30">
                                <PackageIcon className="text-gold" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">{t('adminMandapam.bookings.addNewBooking') || 'New Booking'}</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {steps.map((s) => (
                                <div key={s.id} className={`flex items-center gap-4 transition-all duration-500 ${step === s.id ? 'opacity-100 translate-x-1' : 'opacity-30'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${step === s.id ? 'bg-gold border-gold text-rosewood shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-110' : 'border-white/20 text-white'}`}>
                                        <s.icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">{t('adminMandapam.bookings.step') || 'Step'} 0{s.id}</p>
                                        <p className="text-sm font-black tracking-tight">{s.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Summary */}
                    <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-4 opacity-50">{t('adminMandapam.bookings.latestEntry') || 'LATEST ENTRY'}</h4>
                        <div className="space-y-3">
                            {formData.name && (
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40 font-bold">{t('adminMandapam.bookings.client') || 'Client'}</span>
                                    <span className="font-black truncate ml-2 text-white">{formData.name}</span>
                                </div>
                            )}
                            {formData.eventTitle && (
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40 font-bold">{t('adminMandapam.bookings.event') || 'Event'}</span>
                                    <span className="font-black truncate ml-2 text-gold">{formData.eventTitle}</span>
                                </div>
                            )}
                            {formData.date && (
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40 font-bold">{t('adminMandapam.bookings.date') || 'Date'}</span>
                                    <span className="font-black text-white">{formData.date}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-ivory/20">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-rosewood/5 flex justify-between items-center bg-white/50 backdrop-blur-xl">
                        <div>
                            <h2 className="text-xl font-black text-rosewood tracking-tighter">{steps[step-1].name}</h2>
                            <p className="text-[10px] font-bold text-rosewood/40 uppercase tracking-[0.2em]">{t(`adminMandapam.bookings.step`) || 'Step'} {step} / 5</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-rosewood/5 rounded-full transition-colors text-rosewood/40 hover:text-rosewood">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto space-y-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Input 
                                                label={t('adminMandapam.bookings.fullName') || 'Full Name'}
                                                name="name"
                                                type="text" 
                                                value={formData.name} 
                                                onChange={(e) => updateForm('name', e.target.value)} 
                                                targetLanguage={isTamil ? 'ta' : 'en'}
                                                placeholder={t('adminMandapam.bookings.fullNamePlaceholder') || 'e.g. Rajesh Kumar'} 
                                                icon="person"
                                            />
                                            <TransliteratedInputPreview 
                                                text={formData.name} 
                                                onPreviewChange={(value) => updateTransliteratedData('name', value)}
                                            />
                                        </div>
                                        <PhoneInput 
                                            label={t('adminMandapam.bookings.phoneNumber') || 'Phone Number'}
                                            name="phone"
                                            defaultValue={formData.phone}
                                            onChange={(full) => updateForm('phone', full)}
                                            required
                                        />
                                        <EmailField 
                                            label={t('adminMandapam.bookings.emailAddress') || 'Email Address'}
                                            name="email"
                                            icon="mail"
                                            value={formData.email}
                                            onChange={(e) => updateForm('email', e.target.value)}
                                            placeholder="rajesh@example.com"
                                        />
                                        <Input 
                                            label={t('adminMandapam.bookings.address') || 'Address'}
                                            name="address"
                                            type="text" 
                                            value={formData.address} 
                                            onChange={(e) => updateForm('address', e.target.value)} 
                                            targetLanguage={isTamil ? 'ta' : 'en'}
                                            placeholder={t('adminMandapam.bookings.addressPlaceholder') || 'Enter full address...'} 
                                            icon="location_on"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto space-y-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Input 
                                                label={t('adminMandapam.bookings.eventTitle') || 'Event Title'}
                                                name="eventTitle"
                                                type="text" 
                                                value={formData.eventTitle} 
                                                onChange={(e) => updateForm('eventTitle', e.target.value)} 
                                                targetLanguage={isTamil ? 'ta' : 'en'}
                                                placeholder={t('adminMandapam.bookings.eventTitlePlaceholder') || 'e.g. Wedding Ceremony'} 
                                                icon="celebration"
                                            />
                                            <TransliteratedInputPreview 
                                                text={formData.eventTitle} 
                                                onPreviewChange={(value) => updateTransliteratedData('eventTitle', value)}
                                            />
                                        </div>
                                        <Input 
                                            label={t('adminMandapam.bookings.eventDateLabel') || 'Event Date'}
                                            name="date"
                                            type="date" 
                                            value={formData.date} 
                                            onChange={(e) => updateForm('date', e.target.value)} 
                                            icon="event"
                                        />
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.sessionLabel') || 'Session'}</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'MORNING', label: t('adminMandapam.bookings.morning') || 'Morning' },
                                                    { id: 'EVENING', label: t('adminMandapam.bookings.evening') || 'Evening' },
                                                    { id: 'FULL_DAY', label: t('adminMandapam.bookings.fullDay') || 'Full Day' }
                                                ].map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => updateForm('session', s.id)}
                                                        className={`py-4 flex flex-col items-center gap-2 rounded-3xl border transition-all duration-300 ${formData.session === s.id ? 'bg-gold border-gold text-rosewood shadow-xl shadow-gold/20' : 'bg-white border-rosewood/5 text-rosewood hover:border-gold/30 hover:bg-gold/5'}`}
                                                    >
                                                        <Clock size={20} opacity={0.5} />
                                                        <span className="text-[11px] font-black uppercase tracking-wider">{s.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-6">
                                    {loadingPackages ? (
                                        <div className="flex flex-col items-center py-24">
                                            <Loader2 className="w-10 h-10 text-rosewood animate-spin mb-4" />
                                            <p className="text-rosewood/40 font-black text-[10px] uppercase tracking-widest">{t('adminMandapam.bookings.gatheringPackages') || 'Gathering Packages...'}</p>
                                        </div>
                                    ) : packages.length === 0 ? (
                                        <div className="flex flex-col items-center py-20 text-center border-2 border-dashed border-gold/20 rounded-3xl">
                                            <div className="w-16 h-16 bg-rosewood/5 rounded-full flex items-center justify-center mb-4 text-rosewood/20">
                                                <PackageIcon size={32} />
                                            </div>
                                            <p className="text-rosewood font-black tracking-tight">{t('adminMandapam.bookings.noPackagesAvailable') || 'No packages available'}</p>
                                            <p className="text-[10px] text-rosewood/40 mt-1 uppercase tracking-widest">{t('adminMandapam.bookings.noPackagesDesc') || 'Create a package in settings first'}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {packages.map((pkg) => (
                                                <button
                                                    key={pkg.id}
                                                    onClick={() => updateForm('packageId', pkg.id)}
                                                    className={`group p-4 rounded-3xl border text-left transition-all duration-500 overflow-hidden relative ${formData.packageId === pkg.id ? 'bg-rosewood border-rosewood text-white shadow-2xl shadow-rosewood/30 translate-y-[-4px]' : 'bg-white border-rosewood/5 text-rosewood hover:border-gold/30 hover:shadow-xl'}`}
                                                >
                                                    {formData.packageId === pkg.id && (
                                                        <motion.div layoutId="pkg-glow" className="absolute inset-0 bg-linear-to-r from-gold/20 via-transparent to-transparent" />
                                                    )}
                                                    <div className="relative flex justify-between items-center">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${formData.packageId === pkg.id ? 'text-gold' : 'text-rosewood/40'}`}>CURATED PLAN</span>
                                                            </div>
                                                            <h3 className="text-xl font-black tracking-tight">{isTamil ? pkg.nameTa : pkg.nameEn}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-baseline justify-end gap-1">
                                                                <span className={`text-xs font-bold ${formData.packageId === pkg.id ? 'text-gold/60' : 'text-rosewood/30'}`}>₹</span>
                                                                <span className="text-2xl font-black tracking-tighter">{pkg.price.toLocaleString('en-IN')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`mt-4 pt-4 border-t ${formData.packageId === pkg.id ? 'border-white/10' : 'border-rosewood/5'} flex flex-wrap gap-2`}>
                                                        {(isTamil ? pkg.featuresTa : pkg.featuresEn).slice(0, 3).map((f: any, i: number) => (
                                                            <span key={i} className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${formData.packageId === pkg.id ? 'bg-white/10 text-white/70' : 'bg-rosewood/5 text-rosewood/40'}`}>
                                                                {f}
                                                            </span>
                                                        ))}
                                                        {(pkg.featuresEn?.length ?? 0) > 3 && <span className="text-[9px] font-black text-gold/60 self-center">+{(pkg.featuresEn?.length ?? 0) - 3} MORE</span>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.payment') || 'Payment'}</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                { id: 'FULL', title: t('adminMandapam.bookings.fullyPaid') || 'Fully Paid', desc: t('adminMandapam.bookings.paymentFullDesc') || 'Secure full amount now', icon: Wallet },
                                                { id: 'ADVANCE', title: t('adminMandapam.bookings.advanceAmount') || 'Advance Amount', desc: t('adminMandapam.bookings.paymentAdvanceDesc') || 'Pay partial deposit', icon: Clock },
                                                { id: 'NOT_PAID', title: t('adminMandapam.bookings.notPaid') || 'Not Paid', desc: t('adminMandapam.bookings.paymentNotPaidDesc') || 'No payment collected', icon: AlertCircle },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setPaymentType(type.id as any)}
                                                    className={`p-4 rounded-3xl border text-left transition-all duration-500 relative overflow-hidden ${paymentType === type.id ? 'bg-gold border-gold text-rosewood shadow-2xl shadow-gold/30' : 'bg-white border-rosewood/5 text-rosewood hover:border-gold/30'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${paymentType === type.id ? 'bg-rosewood/10 text-rosewood' : 'bg-rosewood/5 text-rosewood/40'}`}>
                                                        <type.icon size={20} />
                                                    </div>
                                                    <h3 className="text-md font-black tracking-tight leading-tight">{type.title}</h3>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${paymentType === type.id ? 'text-rosewood/60' : 'text-rosewood/30'}`}>{type.desc}</p>
                                                    {paymentType === type.id && (
                                                        <div className="absolute top-6 right-6 w-6 h-6 rounded-full bg-rosewood text-white flex items-center justify-center">
                                                            <Check size={14} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {paymentType !== 'NOT_PAID' && (
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-rosewood/30 uppercase tracking-[0.2em] block ml-1">{t('adminMandapam.bookings.paymentMode') || 'Payment Mode'}</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'CASH', label: t('adminMandapam.bookings.cash') || 'Cash' },
                                                    { id: 'UPI', label: t('adminMandapam.bookings.upi') || 'UPI / QR' },
                                                    { id: 'BANK_TRANSFER', label: t('adminMandapam.bookings.netBanking') || 'Net Banking' },
                                                ].map((mode) => (
                                                    <button 
                                                        key={mode.id} 
                                                        onClick={() => updateForm('paymentMode', mode.id)}
                                                        className={`py-4 rounded-3xl border transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${formData.paymentMode === mode.id ? 'bg-rosewood border-rosewood text-white shadow-xl shadow-rosewood/20' : 'bg-white border-rosewood/5 text-rosewood hover:bg-gold/5'}`}
                                                    >
                                                        {mode.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {paymentType === 'ADVANCE' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-2">
                                            <Input 
                                                label={t('adminMandapam.bookings.advanceDeposit') || 'Advance Deposit'}
                                                name="advance"
                                                type="text" 
                                                inputMode="decimal"
                                                value={formData.advance} 
                                                onChange={(e) => updateForm('advance', e.target.value)} 
                                                placeholder="5,000"
                                                icon="currency_rupee"
                                                autoFormat={true}
                                            />
                                            {formData.advance && Number(formData.advance.replace(/,/g, '')) > 0 && (
                                                <div className="px-6 py-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-black text-amber-800/40 tracking-wider block mb-0.5 uppercase">{t('adminMandapam.bookings.depositToSecure') || 'DEPOSIT TO SECURE'}</span>
                                                        <span className="text-xl font-black text-amber-900">
                                                            ₹ {Number(formData.advance.replace(/,/g, '')).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                    <CheckCircle2 className="text-amber-400" size={24} />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {step === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { title: t('adminMandapam.bookings.userIdentity') || 'User Identity', items: [[t('adminMandapam.bookings.fullName') || 'Full Name', formData.name], [t('adminMandapam.bookings.phoneNumber') || 'Phone', formData.phone], [t('adminMandapam.bookings.emailAddress') || 'Email', formData.email || '—']] },
                                            { title: t('adminMandapam.bookings.eventContext') || 'Event Context', items: [[t('adminMandapam.bookings.eventTitle') || 'Title', formData.eventTitle], [t('adminMandapam.bookings.eventDateLabel') || 'Date', formData.date], [t('adminMandapam.bookings.sessionLabel') || 'Session', t(`adminMandapam.bookings.${formData.session.toLowerCase()}`) || formData.session]] },
                                            { title: t('adminMandapam.bookings.serviceDetails') || 'Service Details', items: [[t('adminMandapam.bookings.package') || 'Package', isTamil ? (packages.find(p => p.id === formData.packageId)?.nameTa || '—') : (packages.find(p => p.id === formData.packageId)?.nameEn || '—')]] },
                                            { title: t('adminMandapam.bookings.settlement') || 'Settlement', items: [[t('adminMandapam.bookings.status') || 'Status', t(`adminMandapam.bookings.${paymentType === 'FULL' ? 'fullyPaid' : (paymentType === 'ADVANCE' ? 'advance' : 'notPaid')}`)], ...(paymentType === 'ADVANCE' ? [[t('adminMandapam.bookings.advanceAmount') || 'Amount', `₹${formData.advance}`]] : [])] },
                                        ].map(({ title, items }) => (
                                            <div key={title} className="p-4 rounded-3xl bg-ivory/30 border border-gold/10 shadow-sm">
                                                <h4 className="text-[10px] font-black text-rosewood/40 uppercase tracking-widest mb-4">{title}</h4>
                                                <div className="space-y-2.5">
                                                    {(items as [string, string][]).map(([label, value]) => (
                                                        <div key={label} className="flex justify-between items-baseline">
                                                            <span className="text-[11px] font-bold text-rosewood/40 uppercase">{label}</span>
                                                            <span className="text-xs font-black text-rosewood text-right truncate ml-4">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black text-rosewood uppercase tracking-tight">{t('adminMandapam.bookings.everythingCorrect') || 'Everything looks correct?'}</p>
                                            <p className="text-[10px] font-bold text-rosewood/40 uppercase tracking-widest">{t('adminMandapam.bookings.confirmationNote') || 'A confirmation message will be sent to the user.'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    <div className="px-8 py-6 border-t border-rosewood/5 flex justify-between bg-white/50 backdrop-blur-xl">
                        <button
                            onClick={prevStep}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-rosewood/40 hover:text-rosewood hover:bg-rosewood/5'}`}
                        >
                            <ChevronLeft size={16} strokeWidth={3} />
                            {t('common.back') || 'Back'}
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex gap-1.5 mr-2">
                                {steps.map((s) => (
                                    <div key={s.id} className={`h-1 rounded-full transition-all duration-500 ${step === s.id ? 'w-8 bg-gold' : 'w-2 bg-rosewood/10'}`} />
                                ))}
                            </div>
                            
                            {step === 5 ? (
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={isCreating}
                                    className="flex items-center gap-3 bg-rosewood px-10 py-4 rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-rosewood/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={16} /> : (
                                        <>
                                            {t('adminMandapam.bookings.confirmBooking') || 'Confirm Booking'}
                                            <ChevronRight size={16} strokeWidth={3} />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    disabled={(step === 1 && (!formData.name || !formData.phone)) || (step === 2 && (!formData.eventTitle || !formData.date)) || (step === 3 && !formData.packageId)}
                                    className="flex items-center gap-3 bg-rosewood px-10 py-4 rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-rosewood/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                                >
                                    {t('common.continue') || 'Continue'}
                                    <ChevronRight size={16} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
