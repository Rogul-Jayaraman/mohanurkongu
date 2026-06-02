import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { TablePagination } from '@/components/ui/table/TablePagination';
import { useLanguage } from '@/context/LanguageContext';

export interface Column<T> {
    header: string;
    key?: keyof T | string;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
    headerClassName?: string;
    width?: string;
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    rowKey?: keyof T | ((item: T) => string);
    pagination?: PaginationProps;
    loading?: boolean;
    error?: string | null;
    emptyState?: {
        icon?: React.ElementType;
        title?: string;
        description?: string;
    };
    onRowClick?: (item: T) => void;
    onRetry?: () => void;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    rowKey,
    pagination,
    loading = false,
    error = null,
    emptyState,
    onRowClick,
    onRetry,
    className = ""
}: DataTableProps<T>) {
    const { t } = useLanguage();

    const getRowKey = (item: T, index: number): string => {
        if (typeof rowKey === 'function') return rowKey(item);
        if (rowKey && item[rowKey]) return String(item[rowKey]);
        return String((item as any).id || (item as any)._id || index);
    };

    const EmptyIcon = emptyState?.icon || Inbox;

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            {columns.map((_, idx) => (
                <td key={idx} className="py-4 px-5">
                    <div className="h-4 bg-gold/5 rounded-md skeleton" />
                </td>
            ))}
        </tr>
    );

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="bg-white rounded-2xl border border-gold/10 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-rosewood/[0.03] to-rosewood/[0.01] border-b border-gold/10">
                                {columns.map((column, idx) => (
                                    <th
                                        key={idx}
                                        className={`py-4 px-5 text-[11px] font-black text-rosewood/50 uppercase tracking-wider whitespace-nowrap ${column.headerClassName || ''}`}
                                        style={{ width: column.width }}
                                    >
                                        {typeof column.header === 'string' ? column.header : String(column.header || '')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold/5">
                            {error ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-20 text-center">
                                        <div className="flex flex-col items-center px-6">
                                            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                                                <AlertCircle size={28} className="text-rose-400" />
                                            </div>
                                            <h3 className="text-base font-bold text-rose-600/80">
                                                {t('adminMatrimony.common.errorTitle') || 'Something went wrong'}
                                            </h3>
                                            <p className="text-sm text-rose-500/60 mt-1 max-w-sm mx-auto">
                                                {error}
                                            </p>
                                            {onRetry && (
                                                <button
                                                    onClick={onRetry}
                                                    className="mt-5 px-5 py-2.5 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors inline-flex items-center gap-2 border border-rose-200"
                                                >
                                                    <RefreshCw size={14} />
                                                    {t('adminMatrimony.common.tryAgain') || 'Try Again'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : data.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {data.map((item, index) => (
                                        <motion.tr
                                            key={getRowKey(item, index)}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02, duration: 0.2 }}
                                            onClick={() => onRowClick && onRowClick(item)}
                                            className={`group transition-all duration-150 ${
                                                index % 2 === 1 ? 'bg-ivory/30' : 'bg-white'
                                            } hover:bg-rosewood/[0.02] ${onRowClick ? 'cursor-pointer' : ''}`}
                                        >
                                            {columns.map((column, colIdx) => (
                                                <td
                                                    key={colIdx}
                                                    className={`py-3.5 px-5 text-sm text-slate-700 group-hover:text-rosewood/90 transition-colors ${column.className || ''}`}
                                                >
                                                    {column.render ? column.render(item, index) : (column.key ? String(item[column.key as keyof T] || '') : null)}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td colSpan={columns.length} className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mb-4 border border-gold/10">
                                                <EmptyIcon className="text-gold/30" size={28} />
                                            </div>
                                            <h3 className="text-base font-bold text-rosewood/50">
                                                {emptyState?.title || t('adminMatrimony.common.noRecords') || 'No records found'}
                                            </h3>
                                            {emptyState?.description && (
                                                <p className="text-sm text-rosewood/30 mt-1 max-w-xs mx-auto">
                                                    {emptyState.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && data.length > 0 && (
                    <TablePagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        itemsPerPage={pagination.itemsPerPage}
                        onPageChange={pagination.onPageChange}
                    />
                )}
            </div>
        </div>
    );
}
