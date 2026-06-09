import React from 'react';
import { Search, X, Filter, ChevronDown, CircleDot, CheckCircle, Ban } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';

const ACCOUNT_STATUS_TABS: { value: string; label: string; icon: React.ElementType; color: string; active: string }[] = [
  {
    value: 'All', label: 'All', icon: CircleDot,
    color: 'text-rosewood/50 border-transparent hover:border-gold/30 hover:text-rosewood/80',
    active: 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20',
  },
  {
    value: 'ACTIVE', label: 'Active', icon: CheckCircle,
    color: 'text-emerald-600/70 border-transparent hover:border-emerald-300 hover:text-emerald-700',
    active: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-300/30',
  },
  {
    value: 'SUSPENDED', label: 'Suspended', icon: Ban,
    color: 'text-amber-600/70 border-transparent hover:border-amber-300 hover:text-amber-700',
    active: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-300/30',
  },
];

const PLAN_OPTIONS = [
  { value: '', label: 'All Plans' },
  { value: 'BRONZE', label: 'Bronze' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'PLATINUM', label: 'Platinum' },
];

const VERIFIED_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

interface AccountFilterProps {
  t: any;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  planFilter: string;
  setPlanFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  emailVerified: string;
  setEmailVerified: (v: string) => void;
  onClear: () => void;
}

export const AccountFilter: React.FC<AccountFilterProps> = ({
  t, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  planFilter, setPlanFilter, dateFrom, setDateFrom, dateTo, setDateTo,
  emailVerified, setEmailVerified, onClear,
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const hasActiveFilters = planFilter || dateFrom || dateTo || emailVerified;

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl border border-gold/10 rounded-2xl shadow-sm shadow-rosewood/5">
        <div className="p-4 pb-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, phone or email..."
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
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white/80" />}
            </button>
          </div>
        </div>

        <div className="px-4 py-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {ACCOUNT_STATUS_TABS.map((tab) => {
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

      <ModalShell
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        icon={<Filter size={24} className="text-rosewood" />}
        title="Filters"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => { onClear(); setDrawerOpen(false); }}
              className="flex-1 px-6 py-3 border border-gold/20 text-rosewood font-bold rounded-xl hover:bg-ivory transition-all text-sm active:scale-[0.97]"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rosewood to-dark-rosewood text-ivory font-bold rounded-xl hover:shadow-xl transition-all text-sm shadow-lg shadow-rosewood/20 active:scale-[0.97]"
            >
              Apply Filters
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              Membership Plan
            </label>
            <div className="relative">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-ivory/60 border border-gold/10 rounded-xl text-sm font-medium text-rosewood focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
              >
                {PLAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rosewood/30 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              Date Range (Joined)
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
              <span>From</span>
              <span>To</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-rosewood/50 uppercase tracking-wider">
              Email Verified
            </label>
            <div className="flex gap-2">
              {VERIFIED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEmailVerified(opt.value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                    emailVerified === opt.value
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
  );
};

export default AccountFilter;
