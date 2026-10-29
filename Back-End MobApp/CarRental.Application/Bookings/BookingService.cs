using System.Data;
using CarRental.Application.Abstractions;
using CarRental.Application.Common;
using CarRental.Domain.Entities;
using CarRental.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarRental.Application.Bookings;

public interface IBookingService
{
    Task<BookingDto> CreateAsync(CreateBookingRequest request, CancellationToken ct);
    Task<IReadOnlyList<BookingDto>> GetMyAsync(CancellationToken ct);
    Task<BookingDto> CancelAsync(Guid id, CancellationToken ct);
}

public sealed class BookingService(IAppDbContext db, ICurrentUser currentUser) : IBookingService
{
    private const int MaxRentalDays = 90;

    public async Task<BookingDto> CreateAsync(CreateBookingRequest request, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (request.StartDate < today)
            throw ValidationAppException.For(nameof(request.StartDate), "Start date cannot be in the past");
        if (request.EndDate <= request.StartDate)
            throw ValidationAppException.For(nameof(request.EndDate), "End date must be after start date");

        var days = request.EndDate.DayNumber - request.StartDate.DayNumber;
        if (days > MaxRentalDays)
            throw ValidationAppException.For(nameof(request.EndDate), $"Maximum rental period is {MaxRentalDays} days");

        var driver = await db.DriverDetails.AsNoTracking().FirstOrDefaultAsync(d => d.UserId == userId, ct)
                     ?? throw ValidationAppException.For("DriverDetails", "Complete your driver details before booking");

        if (driver.LicenceExpiry < request.EndDate)
            throw ValidationAppException.For("DriverDetails", "Your licence expires before the end of the rental");

        var car = await db.Cars.AsNoTracking().Include(c => c.Brand).FirstOrDefaultAsync(c => c.Id == request.CarId, ct)
                  ?? throw new NotFoundException("Car not found");

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

        var overlaps = await db.Bookings.AnyAsync(b =>
            b.CarId == car.Id &&
            b.Status == BookingStatus.Confirmed &&
            b.StartDate < request.EndDate &&
            b.EndDate > request.StartDate, ct);

        if (overlaps)
            throw new ConflictException("Car is already booked for the selected dates");

        var booking = new Booking
        {
            UserId = userId,
            CarId = car.Id,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalPrice = car.PricePerDay * days,
            Status = BookingStatus.Confirmed
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        booking.Car = car;
        return ToDto(booking);
    }

    public async Task<IReadOnlyList<BookingDto>> GetMyAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var bookings = await db.Bookings.AsNoTracking()
            .Include(b => b.Car).ThenInclude(c => c.Brand)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.StartDate)
            .ToListAsync(ct);

        return bookings.Select(ToDto).ToList();
    }

    public async Task<BookingDto> CancelAsync(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var booking = await db.Bookings
                          .Include(b => b.Car).ThenInclude(c => c.Brand)
                          .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct)
                      ?? throw new NotFoundException("Booking not found");

        if (booking.Status == BookingStatus.Cancelled) return ToDto(booking);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (booking.StartDate <= today)
            throw new ConflictException("Booking has already started and cannot be cancelled");

        booking.Status = BookingStatus.Cancelled;
        await db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    private static BookingDto ToDto(Booking b) => new(
        b.Id,
        b.CarId,
        $"{b.Car.Brand.Name} {b.Car.Model}",
        b.Car.ImageUrl,
        b.StartDate,
        b.EndDate,
        b.EndDate.DayNumber - b.StartDate.DayNumber,
        b.TotalPrice,
        b.Status.ToString(),
        b.CreatedAtUtc);
}
