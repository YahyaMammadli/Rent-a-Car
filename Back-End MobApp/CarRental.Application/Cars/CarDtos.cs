namespace CarRental.Application.Cars;

public sealed class GetCarsQuery
{
    public string? Brand { get; init; }
    public string? Search { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public sealed record CarDto(
    string Id,
    string Brand,
    string BrandSlug,
    string Model,
    int Year,
    string Type,
    int Seats,
    string Transmission,
    string FuelType,
    decimal PricePerDay,
    string Image,
    List<string> Features,
    double? Rating,
    int? TopSpeed,
    int? Doors,
    bool? Wifi,
    bool? Sensor,
    string? Bluetooth);

public sealed record BrandDto(string Name, string Slug, string? Image);
