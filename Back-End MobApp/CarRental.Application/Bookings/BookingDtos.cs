using System.ComponentModel.DataAnnotations;

namespace CarRental.Application.Bookings;

public sealed class CreateBookingRequest
{
    [Required, StringLength(100)]
    public string CarId { get; init; } = string.Empty;

    public DateOnly StartDate { get; init; }

    public DateOnly EndDate { get; init; }
}

public sealed record BookingDto(
    Guid Id,
    string CarId,
    string CarName,
    string CarImage,
    DateOnly StartDate,
    DateOnly EndDate,
    int Days,
    decimal TotalPrice,
    string Status,
    DateTime CreatedAtUtc);
