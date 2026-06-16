import React from 'react';
import { Search, X, CalendarCheck, Clock, AlertTriangle, ClipboardCheck, Ban, CircleDot } from 'lucide-react';
import { BOOKING_STATUS_FILTER_TABS } from '@/constants/booking';

interface BookingsFilterProps {
  t: any;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  All: <CircleDot size={14} />,
  CONFIRMED: <CalendarCheck size={14} />,
  IN_PROGRESS: <Clock size={14} />,
  SETTLEMENT_PENDING: <AlertTriangle size={14} />,
  COMPLETED: <ClipboardCheck size={14} />,
  CANCELLED: <Ban size={14} />,
};

const STATUS_TABS = BOOKING_STATUS_FILTER_TABS.map(tab => ({
  ...tab,
  icon: STATUS_ICONS[tab.value] || <CircleDot size={14} />,
}));

export const BookingsFilter: React.FC<BookingsFilterProps> = ({
  t, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-gold/10 rounded-2xl shadow-sm shadow-rosewood/5">
      {/* Search bar */}
      <div className="p-4 pb-0">
        <div className="relative w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('adminMandapam.bookings.searchPlaceholder') || 'Search by name, phone, or booking number...'}
            className="w-full pl-11 pr-10 py-3 bg-ivory/60 border border-gold/10 rounded-xl text-sm font-medium text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/5 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-rosewood/30 hover:text-rosewood transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Status tabs — always visible */}
      <div className="px-4 py-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap ${
                statusFilter === tab.value ? tab.active : `bg-white/60 ${tab.color}`
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
