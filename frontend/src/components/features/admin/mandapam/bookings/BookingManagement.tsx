import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminPageLayout } from '@/components/ui/layout/AdminPageLayout';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { BookingsTable } from '@/components/features/admin/mandapam/bookings/BookingsTable';
import { useNavigate } from 'react-router-dom';
import { useBookingList } from '@/queries/useMandapamQueries';
import { Loader2, Filter, ChevronDown } from 'lucide-react';
import { BOOKING_STATUS_FILTER_TABS } from '@/constants/booking';

const BookingManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const filters = useMemo(() => {
    const f: Record<string, unknown> = { page: currentPage, limit: itemsPerPage };
    if (statusFilter !== 'All') f.status = statusFilter;
    if (searchQuery) f.search = searchQuery;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (packageCode) f.packageCode = packageCode;
    if (paymentStatus) f.paymentStatus = paymentStatus;
    return f;
  }, [currentPage, statusFilter, searchQuery, dateFrom, dateTo, packageCode, paymentStatus]);

  const { data, isLoading, isFetching, error, refetch } = useBookingList(filters);

  const bookings = data?.bookings ?? [];
  const totalItems = data?.meta?.total ?? 0;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPackageCode('');
    setPaymentStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = dateFrom || dateTo || packageCode || paymentStatus;

  const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PENDING', label: 'Pending' },
  ];

  return (
    <>
      <AdminPageLayout
        searchQuery={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        searchPlaceholder={t('adminMandapam.bookings.searchPlaceholder') || 'Search by name, phone, or booking number...'}
        statusTabs={BOOKING_STATUS_FILTER_TABS}
        activeStatus={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        filterButton={
          <>
            <button
              onClick={() => setDrawerOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shrink-0 ${
                hasActiveFilters
                  ? 'bg-rosewood-gradient text-ivory border-rosewood shadow-md shadow-rosewood/20'
                  : 'bg-white/60 text-rosewood/60 border-gold/10 hover:border-gold/30 hover:text-rosewood/80'
              }`}
            >
              <Filter size={14} />
              {t('adminMandapam.bookings.filters') || 'Filters'}
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white/80" />}
            </button>
            <ModalShell
              isOpen={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              icon={<Filter size={24} className="text-rosewood" />}
              title={t('adminMandapam.bookings.filters') || 'Filters'}
              size="sm"
              footer={
                <div className="flex gap-3">
                  <button
                    onClick={() => { handleClearFilters(); setDrawerOpen(false); }}
                    className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm active:scale-[0.97]"
                  >
                    {t('adminMandapam.bookings.clearFilters') || 'Clear All Filters'}
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1 px-6 py-3 bg-rosewood-gradient text-ivory font-bold rounded-xl hover:shadow-xl transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-[0.97]"
                  >
                    {t('adminMandapam.bookings.apply') || 'Apply Filters'}
                  </button>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
                    {t('adminMandapam.bookings.dateRange') || 'Date Range'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-xs font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-xs font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
                    {t('adminMandapam.bookings.packageCode') || 'Package Code'}
                  </label>
                  <div className="relative">
                    <select
                      value={packageCode}
                      onChange={(e) => { setPackageCode(e.target.value); setCurrentPage(1); }}
                      className="w-full appearance-none px-4 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-sm font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
                    >
                      <option value="">All Packages</option>
                      <option value="PKG-G">Gold</option>
                      <option value="PKG-S">Silver</option>
                      <option value="PKG-B">Bronze</option>
                      <option value="PKG-P">Platinum</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rosewood/30 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
                    {t('adminMandapam.bookings.paymentStatus') || 'Payment Status'}
                  </label>
                  <div className="flex gap-2">
                    {PAYMENT_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setPaymentStatus(opt.value); setCurrentPage(1); }}
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                          paymentStatus === opt.value
                            ? 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20'
                            : 'bg-ivory/60 text-rosewood/50 border-gold/10 hover:border-gold/30 hover:text-rosewood/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ModalShell>
          </>
        }
      >
        {/* Loading overlay for refetches */}
        <div className="relative">
          {isFetching && bookings.length > 0 && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-xl shadow-sm border border-gold/10">
                <Loader2 size={14} className="animate-spin text-rosewood/60" />
                <span className="text-xs font-bold text-rosewood/60">Refreshing...</span>
              </div>
            </div>
          )}
          <BookingsTable
            t={t}
            language={language}
            bookings={bookings}
            loading={isLoading && bookings.length === 0}
            error={error ? (error as Error).message : null}
            onRetry={() => refetch()}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onViewDetails={(b) => navigate(`/admin/mandapam/bookings/${b.id}`)}
          />
        </div>
      </AdminPageLayout>
    </>
  );
};

export default BookingManagement;
