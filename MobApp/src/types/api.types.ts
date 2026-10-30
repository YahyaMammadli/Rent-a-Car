export type PagedResult<T> = {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
};

export type DriverDetails = {
    fullName: string;
    phone: string;
    address: string;
    nationalId: string;
    licenceNumber: string;
    licenceExpiry: string; // YYYY-MM-DD
    licencePhotoUrl: string;
    updatedAtUtc: string;
};

export type Booking = {
    id: string;
    carId: string;
    carName: string;
    carImage: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;
    days: number;
    totalPrice: number;
    status: "Confirmed" | "Cancelled";
    createdAtUtc: string;
};
