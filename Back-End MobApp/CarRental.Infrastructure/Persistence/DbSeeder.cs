using System.Text.Json;
using CarRental.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarRental.Infrastructure.Persistence;

public static class DbSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Brands.AnyAsync(ct)) return;

        var dir = Path.Combine(AppContext.BaseDirectory, "Seed");

        var brands = JsonSerializer.Deserialize<List<BrandSeed>>(
            await File.ReadAllTextAsync(Path.Combine(dir, "brands.json"), ct), JsonOptions) ?? [];
        var cars = JsonSerializer.Deserialize<List<CarSeed>>(
            await File.ReadAllTextAsync(Path.Combine(dir, "cars.json"), ct), JsonOptions) ?? [];

        db.Brands.AddRange(brands.Select(b => new Brand { Slug = b.Slug, Name = b.Name, LogoUrl = b.LogoUrl }));

        db.Cars.AddRange(cars.Select(c => new Car
        {
            Id = c.Id,
            BrandSlug = c.BrandSlug,
            Model = c.Model,
            Year = c.Year,
            Type = c.Type,
            Seats = c.Seats,
            Transmission = c.Transmission,
            FuelType = c.FuelType,
            PricePerDay = c.PricePerDay,
            ImageUrl = c.ImageUrl,
            Features = c.Features ?? [],
            Rating = c.Rating,
            TopSpeed = c.TopSpeed,
            Doors = c.Doors,
            Wifi = c.Wifi,
            Sensor = c.Sensor,
            Bluetooth = c.Bluetooth
        }));

        await db.SaveChangesAsync(ct);
    }

    private sealed record BrandSeed(string Slug, string Name, string? LogoUrl);

    private sealed record CarSeed(
        string Id, string BrandSlug, string Model, int Year, string Type, int Seats,
        string Transmission, string FuelType, decimal PricePerDay, string ImageUrl, List<string>? Features,
        double? Rating, int? TopSpeed, int? Doors, bool? Wifi, bool? Sensor, string? Bluetooth);
}
