import React from 'react';
import { Plus } from 'lucide-react';

interface SectionHeaderAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
}

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: SectionHeaderAction;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, action }) => {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
                <h2 className="text-2xl font-bold text-rosewood tracking-tight">{title}</h2>
                {description && (
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
                )}
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rosewood text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-all shrink-0"
                >
                    {action.icon ?? <Plus size={18} />}
                    {action.label}
                </button>
            )}
        </div>
    );
};
