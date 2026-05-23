import React, { useState, useEffect, useCallback, useRef } from 'react';

interface LocationSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface LocationAutocompleteProps {
  onSelect: (loc: { displayName: string; latitude: number; longitude: number }) => void;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const INPUT_BASE = "w-full h-14 pl-12 pr-11 bg-input-bg border-2 border-input-border rounded-xl outline-none transition-all font-input-text text-sm text-input-text shadow-xl shadow-input-shadow hover:border-input-border-hover focus:border-input-focus focus:ring-4 focus:ring-input-ring placeholder:text-input-placeholder";

const MOCK_LOCATIONS: LocationSuggestion[] = [
  { displayName: 'Chennai, Tamil Nadu, India', latitude: 13.0827, longitude: 80.2707 },
  { displayName: 'Coimbatore, Tamil Nadu, India', latitude: 11.0168, longitude: 76.9558 },
  { displayName: 'Madurai, Tamil Nadu, India', latitude: 9.9252, longitude: 78.1198 },
  { displayName: 'Salem, Tamil Nadu, India', latitude: 11.6643, longitude: 78.1460 },
  { displayName: 'Namakkal, Tamil Nadu, India', latitude: 11.2290, longitude: 78.1665 },
  { displayName: 'Erode, Tamil Nadu, India', latitude: 11.3410, longitude: 77.7172 },
  { displayName: 'Tiruppur, Tamil Nadu, India', latitude: 11.1085, longitude: 77.3411 },
  { displayName: 'Bangalore, Karnataka, India', latitude: 12.9716, longitude: 77.5946 },
  { displayName: 'Mohanur, Tamil Nadu, India', latitude: 11.0800, longitude: 78.1400 },
];

export default function LocationAutocomplete({ onSelect, label, value, onChange }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState(false);
  const error = null;
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    const filtered = MOCK_LOCATIONS.filter(l =>
      l.displayName.toLowerCase().includes(q.toLowerCase())
    );
    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setActiveIndex(-1);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (selected) return;
    const timer = setTimeout(() => fetchSuggestions(value), 400);
    return () => clearTimeout(timer);
  }, [value, fetchSuggestions, selected]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((s: LocationSuggestion) => {
    onChange(s.displayName);
    setSelected(true);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(s);
  }, [onChange, onSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelected(false);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape' && selected) {
        setSelected(false);
        onChange('');
        inputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setSelected(false);
    inputRef.current?.focus();
  };

  const hasValue = value.length > 0;
  const showDropdown = isOpen && suggestions.length > 0;

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <div className="flex items-center justify-start gap-2 px-1 mb-2">
          <label className="block text-xs font-input-label text-input-label tracking-tight">
            {label}
            <span className="text-gold ml-1">*</span>
          </label>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 z-10 pointer-events-none">
          <span className="material-symbols-outlined text-[20px] font-variation-medium text-input-icon">
            {selected ? 'check_circle' : 'search'}
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder="Search city in India..."
          autoComplete="off"
          className={INPUT_BASE}
        />

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isSearching && (
            <div className="w-4 h-4 border-2 border-input-icon border-t-transparent rounded-full animate-spin" />
          )}
          {!isSearching && hasValue && (
            <button
              type="button"
              onClick={handleClear}
              tabIndex={-1}
              className="text-input-icon/50 hover:text-input-icon transition-colors p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!isSearching && hasValue && !showDropdown && !selected && value.length >= 2 && (
        <div className="mt-2 px-1">
          <p className="text-[11px] font-medium text-slate-400 italic">
            No locations found. Type more or try a different name.
          </p>
        </div>
      )}

      {showDropdown && (
        <ul
          className="absolute z-20 mt-1.5 w-full bg-dropdown-menu-bg border border-dropdown-menu-border rounded-xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.latitude}-${s.longitude}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3.5 py-3 rounded-lg text-sm cursor-pointer transition-all border-b border-slate-100 last:border-0 ${
                i === activeIndex
                  ? 'bg-dropdown-option-hover text-input-label font-bold shadow-sm'
                  : 'text-input-text hover:bg-dropdown-option-hover font-medium'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 text-base shrink-0 ${i === activeIndex ? 'text-input-icon' : 'text-input-icon/40'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </span>
                <span className="leading-snug">{s.displayName}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
