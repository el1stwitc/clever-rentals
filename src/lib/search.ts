export type StaySearch = {
  from?: string;
  to?: string;
  adults?: number;
  children?: number;
};

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const parseStaySearch = (s: Record<string, unknown>): StaySearch => {
  const num = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
  };
  return {
    from: typeof s.from === "string" && dateRe.test(s.from) ? s.from : undefined,
    to: typeof s.to === "string" && dateRe.test(s.to) ? s.to : undefined,
    adults: num(s.adults, 1, 8),
    children: num(s.children, 0, 4),
  };
};
