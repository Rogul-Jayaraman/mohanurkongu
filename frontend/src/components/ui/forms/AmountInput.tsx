import React, { useState, useRef, useCallback, useEffect } from 'react';

interface AmountInputProps {
  label: string;
  value?: number | null;
  onChange: (val: number | undefined) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  maxDigits?: number;
}

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 999999999;
const DEFAULT_MAX_DIGITS = 9;

function formatIndian(numStr: string): string {
  const cleaned = numStr.replace(/^0+(?=\d)/, '');
  if (!cleaned || cleaned === '0') return '0';
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return numStr;
  return num.toLocaleString('en-IN');
}

function validateAmount(
  raw: string,
  required: boolean,
  min: number,
  max: number,
  allowDecimal: boolean,
  maxDigits: number
): string | null {
  if (!raw) return required ? 'Amount is required' : null;
  if (allowDecimal) {
    if (!/^\d+(\.\d{0,2})?$/.test(raw)) return 'Enter a valid amount';
    if (raw.includes('.') && raw.split('.')[1].length > 2) return 'Maximum 2 decimal places allowed';
  } else {
    if (!/^\d+$/.test(raw)) return 'Enter a valid amount';
  }
  const digitStr = raw.replace('.', '');
  if (digitStr.length > maxDigits) return `Maximum ${maxDigits} digits allowed`;
  const num = parseFloat(raw);
  if (isNaN(num) || num < 0) return 'Enter a valid amount';
  if (num < min) return `Amount must be at least ₹${min.toLocaleString('en-IN')}`;
  if (num > max) return `Amount cannot exceed ₹${max.toLocaleString('en-IN')}`;
  return null;
}

function cleanAmountInput(raw: string, allowDecimal: boolean): string {
  let val = raw.replace(/\s/g, '').replace(/₹/g, '').replace(/[^0-9.]/g, '');
  const dotCount = (val.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = val.split('.');
    val = parts[0] + '.' + parts.slice(1).join('');
  }
  if (!allowDecimal && val.includes('.')) val = val.replace('.', '');
  if (val.startsWith('0') && val.length > 1 && val[1] !== '.') val = val.replace(/^0+/, '');
  if (val.startsWith('.')) val = '0' + val;
  return val;
}

const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  allowDecimal = false,
  maxDigits = DEFAULT_MAX_DIGITS,
}) => {
  const [rawInput, setRawInput] = useState(value != null ? String(Math.floor(value)) : '');
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!touched && value != null) {
      setRawInput(String(Math.floor(value)));
    }
  }, [value, touched]);

  const displayValue = isFocused ? rawInput : (rawInput ? formatIndian(rawInput) : '');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanAmountInput(e.target.value, allowDecimal);
    const digitCount = cleaned.replace('.', '').length;
    if (digitCount <= maxDigits) setRawInput(cleaned);
  }, [allowDecimal, maxDigits]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTouched(true);
    const err = validateAmount(rawInput, required, min, max, allowDecimal, maxDigits);
    setInternalError(err);
    if (!err && rawInput) {
      const num = allowDecimal ? parseFloat(rawInput) : parseInt(rawInput, 10);
      if (!isNaN(num)) onChange(num);
    } else if (!rawInput && !required) {
      onChange(undefined);
    }
    onBlur?.();
  }, [rawInput, onChange, onBlur, required, min, max, allowDecimal, maxDigits]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
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
          <span className="material-symbols-outlined text-[20px] text-input-icon">payments</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="0"
          autoComplete="off"
          className={`
            w-full h-full pl-12 pr-4 rounded-xl border transition-all text-sm font-input-text
            placeholder:text-input-placeholder text-input-text bg-input-bg outline-none
            ${displayError
              ? 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/5'
              : 'border-input-border focus:border-input-focus focus:ring-4 focus:ring-input-ring shadow-sm shadow-input-shadow hover:border-input-border-hover'
            }
          `}
        />
      </div>
      {displayError && (
        <p className="text-[10px] font-bold text-red-500 ml-2 animate-in fade-in slide-in-from-top-1">
          {displayError}
        </p>
      )}
    </div>
  );
};

export default AmountInput;
