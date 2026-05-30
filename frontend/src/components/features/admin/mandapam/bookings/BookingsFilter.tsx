import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import type { BookingStatus } from '@/types/mandapam';

interface BookingsFilterProps {
  t: any;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (v: boolean) => void;
  onAdd: () => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'EVENT_IN_PROGRESS', label: 'In Progress' },
  { value: 'EVENT_COMPLETED', label: 'Completed' },
  { value: 'SETTLEMENT_PENDING', label: 'Settlement Pending' },
  { value: 'COMPLETED', label: 'Settled' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const BookingsFilter: React.FC<BookingsFilterProps> = ({
  t, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  isFilterOpen, setIsFilterOpen, onAdd,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rosewood/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('adminMandapam.bookings.searchPlaceholder') || 'Search by name, phone, or booking #...'}
            className="w-full pl-11 pr-4 py-3 bg-white/20 backdrop-blur-xl border-2 border-gold/20 rounded-xl text-sm font-medium text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:border-gold/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-rosewood/30 hover:text-rosewood">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${isFilterOpen ? 'bg-rosewood text-white border-rosewood' : 'bg-white/20 text-rosewood/60 border-gold/20 hover:border-gold/40'}`}
          >
            <SlidersHorizontal size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('adminMandapam.bookings.filters') || 'Filters'}</span>
          </button>
          <button
            onClick={onAdd}
            className="px-6 py-3 rounded-xl bg-rosewood text-white font-black text-[10px] uppercase tracking-widest hover:bg-rosewood/90 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus size={14} />
            {t('adminMandapam.bookings.addNewBooking') || 'New Booking'}
          </button>
        </div>
      </div>
      {isFilterOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                statusFilter === opt.value
                  ? 'bg-rosewood text-white border-rosewood'
                  : 'bg-white/10 text-rosewood/50 border-gold/10 hover:border-gold/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};
