import React from 'react';
import { Filter, XCircle, CheckCircle2, Plus } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { TableActionDropdown } from '@/components/ui/table/TableActionDropdown';

interface BookingsFilterProps {
    t: any;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    isFilterOpen: boolean;
    setIsFilterOpen: (isOpen: boolean) => void;
    onAdd?: () => void;
}

export const BookingsFilter: React.FC<BookingsFilterProps> = ({
    t, searchQuery, setSearchQuery, statusFilter, setStatusFilter, isFilterOpen, setIsFilterOpen, onAdd
}) => {
    return (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="grow">
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    placeholder={t('common:search')}
                    className="w-full"
                />
            </div>
            
            <div className="flex flex-row items-center gap-3">
                <div className="flex-1 lg:flex-none">
                    <TableActionDropdown 
                        variant="filter"
                        triggerLabel={statusFilter === 'All' ? (t('adminMandapam.bookings.filter') || 'Filter') : (t(`adminMandapam.bookings.${statusFilter.toLowerCase()}`) || statusFilter)}
                        triggerIcon={Filter}
                        triggerClassName="w-full lg:w-auto justify-center"
                        items={['All', 'Upcoming', 'Completed', 'Cancelled'].map((status) => ({
                            label: status === 'All' ? (t('adminMandapam.bookings.allStatus') || 'All Statuses') : (t(`adminMandapam.bookings.${status.toLowerCase()}`) || status),
                            icon: status === 'Cancelled' ? XCircle : (status === 'Completed' ? CheckCircle2 : Filter),
                            onClick: () => { setStatusFilter(status); setIsFilterOpen(false); },
                            className: statusFilter === status ? 'font-bold text-rosewood bg-rosewood/5' : ''
                        }))}
                    />
                </div>
                
                {onAdd && (
                    <button 
                        onClick={onAdd} 
                        className="flex-1 sm:flex-none btn-shine flex items-center justify-center gap-2 px-6 py-2.5 bg-rosewood text-white font-black rounded-xl hover:shadow-lg transition-all text-xs border border-rosewood/20 whitespace-nowrap shadow-sm"
                    >
                        <Plus size={16} strokeWidth={3} /> 
                        <span className="hidden xs:inline">{t('adminMandapam.bookings.addNewBooking') || 'Add New'}</span>
                        <span className="xs:hidden">{t('common.add') || 'Add'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

