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
        const range: (number | string)[] = [];
        const rangeWithDots: (number | string)[] = [];

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
        <div className="bg-white border-t border-gold/10 px-5 py-3">
            <div className="flex items-center justify-between gap-4">
                <div className="hidden sm:flex items-center gap-3">
                    <div className="text-[11px] font-bold text-rosewood/40 bg-ivory/50 rounded-lg px-3 py-1.5 border border-gold/10">
                        {totalItems === 0 ? 'No records' :
                         `${itemsPerPage * (currentPage - 1) + 1}-${Math.min(itemsPerPage * currentPage, totalItems)} of ${totalItems}`}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center text-rosewood/30 hover:text-rosewood hover:bg-rosewood/5 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        title="First page"
                    >
                        <ChevronsLeft size={14} />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center text-rosewood/30 hover:text-rosewood hover:bg-rosewood/5 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Previous page"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    <div className="hidden sm:flex items-center gap-1 mx-1">
                        {getVisiblePages().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className="w-5 text-center text-rosewood/20 text-[10px] font-bold">...</span>
                                ) : (
                                    <button
                                        onClick={() => onPageChange(page as number)}
                                        className={`min-w-[32px] h-8 flex items-center justify-center text-[11px] font-bold rounded-lg transition-all active:scale-95 ${
                                            currentPage === page
                                                ? 'bg-rosewood-gradient text-white shadow-sm shadow-rosewood/20'
                                                : 'text-rosewood/40 hover:text-rosewood hover:bg-rosewood/5'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="sm:hidden text-[11px] font-bold text-rosewood/50 px-2 tabular-nums">
                        {currentPage} / {totalPages}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center text-rosewood/30 hover:text-rosewood hover:bg-rosewood/5 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Next page"
                    >
                        <ChevronRight size={14} />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center text-rosewood/30 hover:text-rosewood hover:bg-rosewood/5 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Last page"
                    >
                        <ChevronsRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
