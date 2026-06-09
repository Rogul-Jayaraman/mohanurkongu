import React from 'react';
import { Search, X, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';
import { PROFILE_STATUS_FILTER_TABS } from '@/constants/admin/profileStatus';

interface ProfileFilterProps {
  t: any;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  genderFilter: string;
  setGenderFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  onClear: () => void;
}

const GENDER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'regNo', label: 'Registration No' },
];

export const ProfileFilter: React.FC<ProfileFilterProps> = ({
  t, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  genderFilter, setGenderFilter, dateFrom, setDateFrom, dateTo, setDateTo,
  sortBy, setSortBy, sortOrder, setSortOrder, onClear,
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const hasActiveFilters = genderFilter || dateFrom || dateTo || sortBy !== 'createdAt' || sortOrder !== 'desc';

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl border border-gold/10 rounded-2xl shadow-sm shadow-rosewood/5">
        {/* Search bar + Filters button */}
        <div className="p-4 pb-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('adminMatrimony.profiles.searchPlaceholder') || 'Search by name, reg no...'}
                className="w-full pl-11 pr-10 py-3 bg-ivory/60 border border-gold/10 rounded-xl text-sm font-medium text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-rosewood/30 hover:text-rosewood transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shrink-0 ${
                hasActiveFilters
                  ? 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20'
                  : 'bg-white/60 text-rosewood/60 border-gold/10 hover:border-gold/30 hover:text-rosewood/80'
              }`}
            >
              <Filter size={14} />
              {t('adminMatrimony.common.filters') || 'Filters'}
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white/80" />}
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="px-4 py-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {PROFILE_STATUS_FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap ${
                    statusFilter === tab.value ? tab.active : `bg-white/60 ${tab.color}`
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter modal */}
      <ModalShell
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        icon={<Filter size={24} className="text-rosewood" />}
        title={t('adminMatrimony.common.filters') || 'Filters'}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => { onClear(); setDrawerOpen(false); }}
              className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm active:scale-[0.97]"
            >
              {t('adminMatrimony.common.clearFilters') || 'Clear All Filters'}
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rosewood to-dark-rosewood text-ivory font-bold rounded-xl hover:shadow-xl transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-[0.97]"
            >
              {t('adminMatrimony.common.apply') || 'Apply Filters'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Gender */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              {t('adminMatrimony.profiles.gender') || 'Gender'}
            </label>
            <div className="relative">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-sm font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rosewood/30 pointer-events-none" />
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              {t('adminMatrimony.profiles.dateRange') || 'Date Range'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-xs font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-xs font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
                />
              </div>
            </div>
            <div className="flex text-[10px] font-medium text-rosewood/30 justify-between px-1">
              <span>{t('adminMatrimony.profiles.from') || 'From'}</span>
              <span>{t('adminMatrimony.profiles.to') || 'To'}</span>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              {t('adminMatrimony.profiles.sortBy') || 'Sort By'}
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-sm font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rosewood/30 pointer-events-none" />
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              {t('adminMatrimony.profiles.sortOrder') || 'Sort Order'}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder('asc')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                  sortOrder === 'asc'
                    ? 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20'
                    : 'bg-ivory/60 text-rosewood/50 border-gold/10 hover:border-gold/30 hover:text-rosewood/80'
                }`}
              >
                <ArrowUpDown size={14} className="rotate-180" />
                {t('adminMatrimony.common.asc') || 'Asc'}
              </button>
              <button
                onClick={() => setSortOrder('desc')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                  sortOrder === 'desc'
                    ? 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20'
                    : 'bg-ivory/60 text-rosewood/50 border-gold/10 hover:border-gold/30 hover:text-rosewood/80'
                }`}
              >
                <ArrowUpDown size={14} />
                {t('adminMatrimony.common.desc') || 'Desc'}
              </button>
            </div>
          </div>
        </div>
      </ModalShell>
    </>
  );
};
