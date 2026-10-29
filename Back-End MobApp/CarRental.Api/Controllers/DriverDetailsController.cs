using CarRental.Api.Forms;
using CarRental.Application.Drivers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarRental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/driver-details")]
public sealed class DriverDetailsController(IDriverDetailsService service) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<DriverDetailsDto>> GetMine(CancellationToken ct)
    {
        var details = await service.GetMyAsync(ct);
        return details is null ? NotFound() : Ok(details);
    }

    [HttpPut("me")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<DriverDetailsDto>> Upsert([FromForm] UpsertDriverDetailsForm form, CancellationToken ct)
    {
        await using var photo = form.LicencePhoto?.OpenReadStream();
        return Ok(await service.UpsertAsync(form, photo, ct));
    }

    [HttpGet("me/licence-photo")]
    public async Task<IActionResult> GetLicencePhoto(CancellationToken ct)
    {
        var photo = await service.GetMyLicencePhotoAsync(ct);
        Response.Headers.CacheControl = "private, no-store";
        return File(photo.Content, photo.ContentType);
    }
}
