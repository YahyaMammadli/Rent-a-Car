using CarRental.Application.Abstractions;
using CarRental.Application.Common;
using CarRental.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarRental.Application.Drivers;

public interface IDriverDetailsService
{
    Task<DriverDetailsDto?> GetMyAsync(CancellationToken ct);
    Task<DriverDetailsDto> UpsertAsync(UpsertDriverDetailsRequest request, Stream? licencePhoto, CancellationToken ct);
    Task<LicencePhotoResult> GetMyLicencePhotoAsync(CancellationToken ct);
}

public sealed class DriverDetailsService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IFileStorage storage) : IDriverDetailsService
{
    public const string PhotoUrl = "/api/driver-details/me/licence-photo";

    public async Task<DriverDetailsDto?> GetMyAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var details = await db.DriverDetails.AsNoTracking().FirstOrDefaultAsync(d => d.UserId == userId, ct);
        return details is null ? null : ToDto(details);
    }

    public async Task<DriverDetailsDto> UpsertAsync(
        UpsertDriverDetailsRequest request, Stream? licencePhoto, CancellationToken ct)
    {
        var userId = currentUser.UserId;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.LicenceExpiry <= today)
            throw ValidationAppException.For(nameof(request.LicenceExpiry), "Licence is expired");

        var details = await db.DriverDetails.FirstOrDefaultAsync(d => d.UserId == userId, ct);
        var isNew = details is null;

        if (licencePhoto is null && isNew)
            throw ValidationAppException.For("LicencePhoto", "Upload a photo of your licence");

        string? newPhotoPath = null;
        if (licencePhoto is not null)
            newPhotoPath = await SavePhotoAsync(licencePhoto, userId, ct);

        var oldPhotoPath = details?.LicencePhotoPath;

        if (details is null)
        {
            details = new DriverDetails { UserId = userId };
            db.DriverDetails.Add(details);
        }

        details.FullName = request.FullName.Trim();
        details.Phone = request.Phone.Trim();
        details.Address = request.Address.Trim();
        details.NationalId = request.NationalId.Trim();
        details.LicenceNumber = request.LicenceNumber.Trim();
        details.LicenceExpiry = request.LicenceExpiry;
        details.UpdatedAtUtc = DateTime.UtcNow;
        if (newPhotoPath is not null) details.LicencePhotoPath = newPhotoPath;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            if (newPhotoPath is not null) storage.Delete(newPhotoPath);
            throw;
        }

        if (newPhotoPath is not null && !string.IsNullOrEmpty(oldPhotoPath))
            storage.Delete(oldPhotoPath);

        return ToDto(details);
    }

    public async Task<LicencePhotoResult> GetMyLicencePhotoAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var path = await db.DriverDetails.AsNoTracking()
            .Where(d => d.UserId == userId)
            .Select(d => d.LicencePhotoPath)
            .FirstOrDefaultAsync(ct);

        if (string.IsNullOrEmpty(path)) throw new NotFoundException("Licence photo not found");

        try
        {
            return new LicencePhotoResult(storage.OpenRead(path), ImageValidator.ContentTypeFromExtension(path));
        }
        catch (FileNotFoundException)
        {
            throw new NotFoundException("Licence photo not found");
        }
    }

    private async Task<string> SavePhotoAsync(Stream source, Guid userId, CancellationToken ct)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await source.ReadAsync(chunk, ct)) > 0)
        {
            buffer.Write(chunk, 0, read);
            if (buffer.Length > ImageValidator.MaxBytes)
                throw ValidationAppException.For("LicencePhoto", "Photo must be 5 MB or smaller");
        }

        if (buffer.Length == 0)
            throw ValidationAppException.For("LicencePhoto", "Photo is empty");

        var bytes = buffer.GetBuffer();
        if (!ImageValidator.TryDetect(bytes.AsSpan(0, (int)Math.Min(buffer.Length, 16)), out var extension, out _))
            throw ValidationAppException.For("LicencePhoto", "Only JPEG, PNG or WEBP images are allowed");

        buffer.Position = 0;
        return await storage.SaveAsync(buffer, $"licences/{userId:N}", extension, ct);
    }

    private static DriverDetailsDto ToDto(DriverDetails d) => new(
        d.FullName, d.Phone, d.Address, d.NationalId, d.LicenceNumber, d.LicenceExpiry, PhotoUrl, d.UpdatedAtUtc);
}
