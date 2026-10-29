using CarRental.Application.Abstractions;
using CarRental.Application.Common;
using Microsoft.EntityFrameworkCore;

namespace CarRental.Application.Cars;

public interface ICarService
{
    Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken ct);
    Task<PagedResult<CarDto>> GetCarsAsync(GetCarsQuery query, CancellationToken ct);
    Task<CarDto> GetCarAsync(string id, CancellationToken ct);
}

public sealed class CarService(IAppDbContext db) : ICarService
{
    private const int MaxPageSize = 100;

    public async Task<IReadOnlyList<BrandDto>> GetBrandsAsync(CancellationToken ct)
        => await db.Brands.AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto(b.Name, b.Slug, b.LogoUrl))
            .ToListAsync(ct);

    public async Task<PagedResult<CarDto>> GetCarsAsync(GetCarsQuery query, CancellationToken ct)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var cars = db.Cars.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Brand))
        {
            var slug = query.Brand.Trim().ToLowerInvariant();
            cars = cars.Where(c => c.BrandSlug == slug);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            cars = cars.Where(c => c.Model.Contains(term) || c.Brand.Name.Contains(term));
        }

        if (query.MinPrice is not null) cars = cars.Where(c => c.PricePerDay >= query.MinPrice);
        if (query.MaxPrice is not null) cars = cars.Where(c => c.PricePerDay <= query.MaxPrice);

        var total = await cars.CountAsync(ct);

        var items = await cars
            .OrderBy(c => c.Brand.Name).ThenBy(c => c.Model)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CarDto(
                c.Id, c.Brand.Name, c.BrandSlug, c.Model, c.Year, c.Type, c.Seats, c.Transmission, c.FuelType,
                c.PricePerDay, c.ImageUrl, c.Features, c.Rating, c.TopSpeed, c.Doors, c.Wifi, c.Sensor, c.Bluetooth))
            .ToListAsync(ct);

        return new PagedResult<CarDto>(items, page, pageSize, total);
    }

    public async Task<CarDto> GetCarAsync(string id, CancellationToken ct)
        => await db.Cars.AsNoTracking()
               .Where(c => c.Id == id)
               .Select(c => new CarDto(
                   c.Id, c.Brand.Name, c.BrandSlug, c.Model, c.Year, c.Type, c.Seats, c.Transmission, c.FuelType,
                   c.PricePerDay, c.ImageUrl, c.Features, c.Rating, c.TopSpeed, c.Doors, c.Wifi, c.Sensor, c.Bluetooth))
               .FirstOrDefaultAsync(ct)
           ?? throw new NotFoundException("Car not found");
}
