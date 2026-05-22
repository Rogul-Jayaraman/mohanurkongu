import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className="bg-ivory border-t border-gold-soft/10 px-4 py-2">
            <div className="flex items-center justify-between gap-4">
                {/* Results info */}
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold text-rosewood uppercase tracking-widest bg-gold-soft/5 px-2 py-0.5 rounded-full border border-gold-soft/10">
                        {totalItems === 0 ? 'No records' : 
                         `${itemsPerPage * (currentPage - 1) + 1}-${Math.min(itemsPerPage * currentPage, totalItems)} of ${totalItems}`}
                    </div>
                </div>

                {/* Pagination controls */}
                <div className="flex items-center gap-1">
                    {/* Previous page */}
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-7 h-7 flex items-center justify-center text-rosewood/60 hover:text-rosewood hover:bg-gold-soft/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-transparent hover:border-gold-soft/20"
                        title="Previous page"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1 mx-1">
                        {getVisiblePages().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className="w-4 text-center text-rosewood/40 text-[10px] font-black">...</span>
                                ) : (
                                    <button
                                        onClick={() => onPageChange(page as number)}
                                        className={`w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-lg transition-all ${
                                            currentPage === page
                                                ? 'bg-rosewood text-white shadow-sm ring-2 ring-rosewood/10'
                                                : 'text-rosewood/60 hover:text-rosewood hover:bg-gold-soft/10 border border-transparent hover:border-gold-soft/20'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Compact mobile page info */}
                    <div className="sm:hidden text-[10px] font-black text-rosewood px-2 tabular-nums">
                        {currentPage} / {totalPages}
                    </div>

                    {/* Next page */}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-7 h-7 flex items-center justify-center text-rosewood/60 hover:text-rosewood hover:bg-gold-soft/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-transparent hover:border-gold-soft/20"
                        title="Next page"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};