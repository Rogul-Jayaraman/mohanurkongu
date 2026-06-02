import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminProfileCard } from '@/components/features/admin/matrimony/ProfileCard';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/ui/layout/SectionHeader';
import { EmptyState } from '@/components/ui/feedback/EmptyState';
import { AdminProfileCardSkeleton } from '@/components/features/admin/matrimony/ProfileCardSkeleton';
import { useVerificationQueueQuery } from '@/queries/useProfileQueries';
import { useApproveProfileMutation, useRejectProfileMutation } from '@/queries/useAdminMutations';

const VerificationQueuePreview: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const queueQuery = useVerificationQueueQuery();
    const approveMut = useApproveProfileMutation();
    const rejectMut = useRejectProfileMutation();

    const profiles: any[] = (queueQuery.data as any)?.profiles ?? [];
    const isLoading = queueQuery.isPending;

    const handleAccept = (id: string) => {
        approveMut.mutate(id);
    };
    const handleReject = (id: string) => {
        rejectMut.mutate({ id, reasonEn: 'Rejected from queue preview' });
    };

    return (
        <div className="w-full space-y-6">
            <SectionHeader 
                title={t('adminMatrimony.verification.queueTitle')}
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
                    message={t('adminMatrimony.verification.queueCleared')}
                    icon={ShieldCheck}
                />
            )}
        </div>
    );
};

export default VerificationQueuePreview;

