import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Package as PackageIcon, CheckCircle2, XCircle, Settings2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { MandapamPackage } from '@/services/mandapamService';
import { NewPackageModal } from '@/modals/admin/NewPackageModal';
import { PackageGrid } from '@/components/features/admin/mandapam/packages/PackageGrid';
import { toast } from 'sonner';
import { useAdminPackagesQuery, useTogglePackageStatusMutation } from '@/hooks/queries/useAdminMandapam';

// ═══════════════════════════════════════════════════════════
// PackagesHeader
// ═══════════════════════════════════════════════════════════
const PackagesHeader: React.FC<{ stats: { total: number; active: number; inactive: number }; onAdd: () => void }> = ({ stats, onAdd }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
            {[
                { label: 'Total', value: stats.total, color: 'bg-rosewood' },
                { label: 'Active', value: stats.active, color: 'bg-sage' },
                { label: 'Paused', value: stats.inactive, color: 'bg-stone-300' }
            ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 py-4 px-6 bg-ivory border border-slate-100 rounded-xl shadow-xs">
                    <div className={`w-1 h-6 rounded-full ${stat.color}`} />
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-slate-900 leading-none">{stat.value}</span>
                        <span className="text-[10px] font-bold text-rosewood uppercase tracking-widest">{stat.label}</span>
                    </div>
                </div>
            ))}
        </div>
        <button onClick={onAdd} className="shrink-0 inline-flex items-center justify-center gap-3 px-6 py-4 bg-rosewood text-white font-black text-sm rounded-2xl hover:bg-rosewood-dark hover:shadow-2xl hover:shadow-rosewood/20 transition-all active:scale-95">
            <Plus size={18} /> Create Package
        </button>
    </div>
);

// ═══════════════════════════════════════════════════════════
// EmptyPackagesState
// ═══════════════════════════════════════════════════════════
const EmptyPackagesState: React.FC<{ isTamil: boolean; onAdd: () => void }> = ({ isTamil, onAdd }) => (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-4xl p-16 text-center">
        <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm"><Plus size={32} /></div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{isTamil ? 'தொகுப்புகள் இல்லை' : 'No Packages Yet'}</h3>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">{isTamil ? 'முதல் மண்டபம் தொகுப்பை உருவாக்கவும்' : 'Create your first mandapam package to get started.'}</p>
        <button onClick={onAdd} className="px-8 py-3 bg-rosewood text-white font-bold rounded-xl hover:bg-rosewood-dark transition-all">{isTamil ? 'தொகுப்பை உருவாக்கு' : 'Create First Package'}</button>
    </div>
);

// ═══════════════════════════════════════════════════════════
// LoadingState
// ═══════════════════════════════════════════════════════════
const LoadingState: React.FC<{ isTamil: boolean }> = ({ isTamil }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-rosewood animate-spin" />
        <p className="text-slate-500 font-medium">{isTamil ? 'தொகுப்புகள் ஏற்றுகிறது...' : 'Loading packages...'}</p>
    </div>
);

// ═══════════════════════════════════════════════════════════
// ErrorState
// ═══════════════════════════════════════════════════════════
const ErrorState: React.FC<{ error: any; isTamil: boolean; onRetry: () => void }> = ({ error, isTamil, onRetry }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">{isTamil ? 'பிழை ஏற்பட்டது' : 'Something went wrong'}</h3>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">{typeof error === 'string' ? error : (isTamil ? 'தொகுப்புகளை ஏற்றும்போது பிழை' : 'Failed to load packages')}</p>
        <button onClick={onRetry} className="px-6 py-2.5 bg-rosewood text-white rounded-lg font-semibold hover:bg-rosewood-dark transition-all">{isTamil ? 'மீண்டும் முயற்சி' : 'Retry Now'}</button>
    </div>
);

// ═══════════════════════════════════════════════════════════
// PackageManagement (Main Orchestrator)
// ═══════════════════════════════════════════════════════════
const PackageManagement: React.FC = () => {
    const { t } = useLanguage();
    const isTamil = t('common.language') === 'ta';
    const [isPackageModalOpen, setIsPackageModalOpen] = React.useState(false);
    const [selectedPackage, setSelectedPackage] = React.useState<MandapamPackage | null>(null);

    const { data: packages = [], isLoading, error, refetch } = useAdminPackagesQuery();
    const toggleStatusMutation = useTogglePackageStatusMutation();

    const stats = React.useMemo(() => {
        const active = packages.filter(p => p.isActive).length;
        return { total: packages.length, active, inactive: packages.length - active };
    }, [packages]);

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        toggleStatusMutation.mutate({ id, isActive: !currentStatus }, {
            onSuccess: () => toast.success(t('adminMandapam.packages.updateSuccess') || 'Package status updated'),
            onError: (err: any) => toast.error(err.message || t('adminMandapam.packages.somethingWentWrong'))
        });
    };

    const handleSavePackage = () => { setIsPackageModalOpen(false); refetch(); };

    if (isLoading) return <LoadingState isTamil={isTamil} />;
    if (error) return <ErrorState error={error} isTamil={isTamil} onRetry={() => refetch()} />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <PackagesHeader stats={stats} onAdd={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} />
            <div className="relative pt-4">
                {packages.length > 0 ? (
                    <PackageGrid t={t} packages={packages} onEdit={(pkg) => { setSelectedPackage(pkg); setIsPackageModalOpen(true); }} onToggleStatus={handleToggleStatus} />
                ) : (
                    <EmptyPackagesState isTamil={isTamil} onAdd={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} />
                )}
            </div>
            <NewPackageModal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} t={t} pkg={selectedPackage as any} onSuccess={handleSavePackage} />
        </motion.div>
    );
};

export default PackageManagement;
