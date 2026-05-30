import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ModalShell } from '@/components/ui/modals/ModalShell';

interface IconPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (iconName: string) => void;
}

const ICONS = [
    'meeting_room', 'chair', 'table_restaurant', 'local_parking', 'wifi', 'ac_unit',
    'kitchen', 'bathtub', 'deck', 'outdoor_grill', 'music_note', 'videocam',
    'mic', 'theater_comedy', 'stadium', 'pool', 'child_care', 'accessible',
    'elevator', 'escalator', 'security', 'smoke_free', 'fire_extinguisher', 'eco',
    'light', 'sound', 'restaurant', 'cake', 'diamond', 'star',
    'favorite', 'celebration', 'nightlight', 'sunny', 'cloud', 'water',
    'forest', 'cabin', 'festival', 'spa', 'dance', 'camera_alt',
    'album', 'auto_awesome', 'villa', 'home', 'business', 'checkroom',
    'luggage', 'pets', 'set_meal', 'brunch_dining'
];

export const IconPicker: React.FC<IconPickerProps> = ({ isOpen, onClose, onSelect }) => {
    const [search, setSearch] = useState('');

    const filteredIcons = useMemo(
        () => ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase())),
        [search]
    );

    const handleSelect = (name: string) => {
        onSelect(name);
        onClose();
    };

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title="Select Icon"
            size="2xl"
        >
            <div className="relative mb-5">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rosewood/40" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search icons..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-xl border border-gold/20 rounded-xl text-rosewood text-sm placeholder:text-rosewood/30 outline-none focus:border-gold/50 transition-all"
                />
            </div>

            <div className="grid grid-cols-6 gap-2.5">
                {filteredIcons.map(name => (
                    <button
                        key={name}
                        onClick={() => handleSelect(name)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-gold/20 hover:border-rosewood/40 hover:bg-rosewood/5 transition-all duration-200 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-2xl text-rosewood">{name}</span>
                        <span className="text-[10px] text-rosewood/70 text-center leading-tight font-medium">{name}</span>
                    </button>
                ))}
                {filteredIcons.length === 0 && (
                    <div className="col-span-full text-center py-10 text-rosewood/40 text-sm">
                        No icons found
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
