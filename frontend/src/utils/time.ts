export function to12(h: number) {
    if (h === 0) return { h12: 12, mer: 'AM' as const };
    if (h < 12) return { h12: h, mer: 'AM' as const };
    if (h === 12) return { h12: 12, mer: 'PM' as const };
    return { h12: h - 12, mer: 'PM' as const };
}

export function to24(h12: number, mer: 'AM' | 'PM') {
    if (mer === 'AM') return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
}

export function parseTime(t: string) {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return { h24: h, m };
}

export function fmt12(t: string) {
    const p = parseTime(t);
    if (!p) return '';
    const { h12, mer } = to12(p.h24);
    return `${h12}:${String(p.m).padStart(2, '0')} ${mer}`;
}

export function calcDurationHours(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 ? diff / 60 : 0;
}

export function calcDurationMinutes(startTime: string, endTime: string): number {
    return Math.round(calcDurationHours(startTime, endTime) * 60);
}
