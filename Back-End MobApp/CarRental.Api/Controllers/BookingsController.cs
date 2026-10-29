using CarRental.Application.Bookings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarRental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookings")]
public sealed class BookingsController(IBookingService bookings) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest request, CancellationToken ct)
    {
        var booking = await bookings.CreateAsync(request, ct);
        return Created($"/api/bookings/{booking.Id}", booking);
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyList<BookingDto>>> GetMine(CancellationToken ct)
        => Ok(await bookings.GetMyAsync(ct));

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<BookingDto>> Cancel(Guid id, CancellationToken ct)
        => Ok(await bookings.CancelAsync(id, ct));
}
