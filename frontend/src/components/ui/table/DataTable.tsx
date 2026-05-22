import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Inbox, AlertCircle } from 'lucide-react';
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
        icon?: LucideIcon;
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

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gold/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-ivory border-b border-gold/20 sticky top-0 z-10">
                            <tr>
                                {columns.map((column, idx) => (
                                    <th 
                                        key={idx} 
                                        className={`py-4 px-6 text-sm font-bold text-rosewood whitespace-nowrap ${column.headerClassName || ''}`}
                                        style={{ width: column.width }}
                                    >
                                        {typeof column.header === 'string' ? column.header : String(column.header || '')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gold/5">
                            <AnimatePresence mode="popLayout">
                                {error ? (
                                    <tr>
                                        <td colSpan={columns.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center px-6">
                                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
                                                    <AlertCircle size={32} />
                                                </div>
                                                <h3 className="text-xl font-serif font-bold text-red-900/60 uppercase tracking-wider">
                                                    {t('adminMatrimony.common.errorTitle') || 'Something went wrong'}
                                                </h3>
                                                <p className="text-sm text-red-600/60 mt-2 max-w-sm mx-auto">
                                                    {error}
                                                </p>
                                                {onRetry && (
                                                    <button 
                                                        onClick={onRetry}
                                                        className="mt-6 px-6 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                                                    >
                                                        {t('adminMatrimony.common.tryAgain') || 'Try Again'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : loading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                                                <p className="mt-4 text-rosewood/60 font-medium">
                                                    {t('adminMatrimony.common.loading') || 'Loading data...'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : data.length > 0 ? (
                                    data.map((item, index) => (
                                        <motion.tr
                                            key={getRowKey(item, index)}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => onRowClick && onRowClick(item)}
                                            className={`group hover:bg-ivory/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                        >
                                            {columns.map((column, colIdx) => (
                                                <td 
                                                    key={colIdx} 
                                                    className={`py-3 px-6 text-sm text-slate-700 ${column.className || ''}`}
                                                >
                                                    {column.render ? column.render(item, index) : (column.key ? String(item[column.key as keyof T] || '') : null)}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))
                                ) : (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td colSpan={columns.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mb-4">
                                                    <EmptyIcon className="text-gold/40" size={32} />
                                                </div>
                                                <h3 className="text-xl font-serif font-bold text-rosewood/60">
                                                    {emptyState?.title || t('adminMatrimony.common.noRecords') || 'No records found'}
                                                </h3>
                                                {emptyState?.description && (
                                                    <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                                                        {emptyState.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Pagination */}
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
