export type Car = {
    id: string;
    brand: string;
    brandSlug: string;
    model: string;
    year: number;
    type: string;
    seats: number;
    transmission: string;
    fuelType: string;
    pricePerDay: number;
    image: string;
    features: string[];

    rating?: number | null;
    topSpeed?: number | null;
    doors?: number | null;
    wifi?: boolean | null;
    sensor?: boolean | null;
    bluetooth?: string | null;
};

export type CarBrand = {
    name: string;
    slug: string;
    image: string | null;
};
