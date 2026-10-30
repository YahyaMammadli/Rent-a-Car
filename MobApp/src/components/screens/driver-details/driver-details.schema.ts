import { z } from "zod";

// DD/MM/YYYY, дата должна быть в будущем (права не просрочены)
const parseExpiry = (value: string): Date | null => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const valid =
        date.getFullYear() === Number(yyyy) &&
        date.getMonth() === Number(mm) - 1 &&
        date.getDate() === Number(dd);
    return valid ? date : null;
};

export const personalDataSchema = z.object({
    fullName: z.string().trim().min(2, "Full name is required"),
    phone: z.string().trim().regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number"),
    address: z.string().trim().min(3, "Address is required"),
    nationalId: z.string().trim().min(5, "National identity number is required"),
});

export const licenceSchema = z.object({
    licenceNumber: z.string().trim().min(5, "Licence number is required"),
    expiryDate: z
        .string()
        .refine((v) => parseExpiry(v) !== null, "Use format DD/MM/YYYY")
        .refine((v) => {
            const date = parseExpiry(v);
            return date !== null && date.getTime() > Date.now();
        }, "Licence is expired"),
    licencePhoto: z.string().min(1, "Upload a photo of your licence"),
});

export const driverDetailsSchema = personalDataSchema.extend(licenceSchema.shape);

export type DriverDetailsSchema = z.infer<typeof driverDetailsSchema>;

export const PERSONAL_FIELDS = ["fullName", "phone", "address", "nationalId"] as const;
