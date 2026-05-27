import React, { useState, useRef, useCallback, useEffect } from 'react';

interface WeightInputProps {
  label: string;
  value?: number | null;
  onChange: (val: number | undefined) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}

const MIN = 30;
const MAX = 150;

function validateWeight(raw: string, required: boolean): string | null {
  if (!raw) return required ? 'Weight is required' : null;
  if (!/^\d+(\.\d?)?$/.test(raw)) return 'Enter a valid weight';
  if (raw.includes('.') && raw.split('.')[1].length > 1) return 'Maximum 1 decimal place allowed';
  const num = parseFloat(raw);
  if (isNaN(num) || num <= 0) return 'Enter a valid weight';
  if (num < MIN) return `Weight must be at least ${MIN} kg`;
  if (num > MAX) return `Weight cannot exceed ${MAX} kg`;
  return null;
}

function cleanInput(raw: string): string {
  let val = raw.replace(/\s/g, '');
  const dotCount = (val.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = val.split('.');
    val = parts[0] + '.' + parts.slice(1).join('');
  }
  val = val.replace(/[^0-9.]/g, '');
  if (val.startsWith('0') && val.length > 1 && val[1] !== '.') {
    val = val.replace(/^0+/, '');
  }
  if (val.startsWith('.')) val = '0' + val;
  return val;
}

const WeightInput: React.FC<WeightInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
}) => {
  const [rawInput, setRawInput] = useState(value != null ? value.toString() : '');
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!touched && value != null) {
      let val = value;
      if (val < MIN) val = MIN;
      else if (val > MAX) val = MAX;
      setRawInput(val.toString());
    }
  }, [value, touched]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanInput(e.target.value);
    if (cleaned.length <= 5) setRawInput(cleaned);
  }, []);

  const handleBlur = useCallback(() => {
    setTouched(true);
    const err = validateWeight(rawInput, required);
    setInternalError(err);
    if (!err && rawInput) {
      const num = parseFloat(rawInput);
      if (!isNaN(num)) {
        onChange(num);
      }
    } else if (!rawInput && !required) {
      onChange(undefined);
    }
    onBlur?.();
  }, [rawInput, onChange, onBlur, required]);

  const handleFocus = useCallback(() => {
    setTouched(false);
    setInternalError(null);
  }, []);

  const displayError = touched ? (internalError || error) : error;

  return (
    <div className="space-y-2 group text-left">
      <label className="block text-[11px] sm:text-xs font-bold text-rosewood tracking-tight ml-1">
        {label}
        {required && <span className="text-gold ml-1 text-xs">*</span>}
      </label>
      <div className="relative h-14">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 z-10">
          <span className="material-symbols-outlined text-[20px] text-input-icon">monitor_weight</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={rawInput}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="0"
          autoComplete="off"
          maxLength={5}
          className={`
            w-full h-full pl-12 pr-12 rounded-xl border transition-all text-sm font-input-text
            placeholder:text-input-placeholder text-input-text bg-input-bg outline-none
            ${displayError
              ? 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/5'
              : 'border-input-border focus:border-input-focus focus:ring-4 focus:ring-input-ring shadow-sm shadow-input-shadow hover:border-input-border-hover'
            }
          `}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <span className="font-black text-[10px] text-slate-300 group-hover:text-rosewood transition-colors">kg</span>
        </div>
      </div>
      {displayError ? (
        <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
          {displayError}
        </p>
      ) : (
        <p className="text-[9px] text-slate-400 font-medium ml-2">
          Enter weight between {MIN} kg and {MAX} kg
        </p>
      )}
    </div>
  );
};

export default WeightInput;
