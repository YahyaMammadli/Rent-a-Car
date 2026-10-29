using CarRental.Application.Cars;
using CarRental.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace CarRental.Api.Controllers;

[ApiController]
public sealed class CarsController(ICarService cars) : ControllerBase
{
    [HttpGet("api/brands")]
    public async Task<ActionResult<IReadOnlyList<BrandDto>>> GetBrands(CancellationToken ct)
        => Ok(await cars.GetBrandsAsync(ct));

    [HttpGet("api/cars")]
    public async Task<ActionResult<PagedResult<CarDto>>> GetCars([FromQuery] GetCarsQuery query, CancellationToken ct)
        => Ok(await cars.GetCarsAsync(query, ct));

    [HttpGet("api/cars/{id}")]
    public async Task<ActionResult<CarDto>> GetCar(string id, CancellationToken ct)
        => Ok(await cars.GetCarAsync(id, ct));
}
