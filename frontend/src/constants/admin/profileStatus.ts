import { CircleDot, FileEdit, Clock, CheckCircle, XCircle, Archive, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PROFILE_STATUS_FILTER_TABS: { value: string; label: string; color: string; active: string; icon: LucideIcon }[] = [
  {
    value: 'All',
    label: 'All',
    icon: CircleDot,
    color: 'text-rosewood/50 border-transparent hover:border-gold/30 hover:text-rosewood/80',
    active: 'bg-rosewood text-white border-rosewood shadow-md shadow-rosewood/20',
  },
  {
    value: 'DRAFT',
    label: 'Draft',
    icon: FileEdit,
    color: 'text-blue-600/70 border-transparent hover:border-blue-300 hover:text-blue-700',
    active: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300/30',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600/70 border-transparent hover:border-amber-300 hover:text-amber-700',
    active: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-300/30',
  },
  {
    value: 'ACTIVE',
    label: 'Active',
    icon: CheckCircle,
    color: 'text-emerald-600/70 border-transparent hover:border-emerald-300 hover:text-emerald-700',
    active: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-300/30',
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    icon: XCircle,
    color: 'text-rose-600/70 border-transparent hover:border-rose-300 hover:text-rose-700',
    active: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-300/30',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    icon: Archive,
    color: 'text-slate-600/70 border-transparent hover:border-slate-300 hover:text-slate-700',
    active: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-300/30',
  },
  {
    value: 'DELETED',
    label: 'Deleted',
    icon: Trash2,
    color: 'text-red-600/70 border-transparent hover:border-red-300 hover:text-red-700',
    active: 'bg-red-600 text-white border-red-600 shadow-md shadow-red-300/30',
  },
];
