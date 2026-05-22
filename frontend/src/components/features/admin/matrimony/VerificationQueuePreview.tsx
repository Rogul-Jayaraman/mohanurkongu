import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { useAdminVerificationQuery } from '@/hooks/queries/useAdminMatrimony';
import { AdminProfileCardSkeleton } from '@/components/features/admin/matrimony/ProfileCardSkeleton';

const VerificationQueuePreview: React.FC = () => {
    const { language } = useLanguage();
    const isTamil = language === 'ta';
    const navigate = useNavigate();

    const { data, isLoading } = useAdminVerificationQuery({ limit: 4 });
    const profiles = data?.profiles || [];

    const handleAccept = (id: string) => console.log('Accepted:', id);
    const handleReject = (id: any) => console.log('Rejected:', id);

    return (
        <div className="w-full space-y-6">
            <SectionHeader 
                title={isTamil ? 'சரிபார்ப்பு வரிசை' : 'Verification Queue'}
                icon={ShieldCheck}
            />

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <AdminProfileCardSkeleton key={i} />
                    ))}
                </div>
            ) : profiles.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {profiles.map((profile: any, i: number) => (
                        <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-full"
                        >
                            <AdminProfileCard
                                profile={profile}
                                adminActions={{
                                    onAccept: handleAccept,
                                    onReject: handleReject,
                                    onView: (id) => navigate(`/admin/matrimony/profiles/${id}`)
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    message={isTamil ? 'சரிபார்ப்பு வரிசை காலியாக உள்ளது' : 'All profiles are verified. Queue cleared.'}
                    icon={ShieldCheck}
                />
            )}
        </div>
    );
};

export default VerificationQueuePreview;

