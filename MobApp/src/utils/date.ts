const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "YYYY-MM-DD" по локальной дате. */
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM-DD" -> Date (локальная полночь). */
export const fromIsoDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
};

export const addDays = (d: Date, days: number) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    copy.setDate(copy.getDate() + days);
    return copy;
};

/** Сегодня по UTC: сервер сравнивает даты именно по UTC. */
export const todayUtc = () => {
    const now = new Date();
    return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

/** Минимально допустимая дата начала аренды: не раньше локального и не раньше серверного «сегодня». */
export const minStartDate = () => {
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const utc = todayUtc();
    return local > utc ? local : utc;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const formatIso = (iso: string) => formatDate(fromIsoDate(iso));

/** "DD/MM/YYYY" -> "YYYY-MM-DD" */
export const expiryToIso = (value: string) => {
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
};

/** "YYYY-MM-DD" -> "DD/MM/YYYY" */
export const isoToExpiry = (iso: string) => {
    const [yyyy, mm, dd] = iso.split("-");
    return `${dd}/${mm}/${yyyy}`;
};
