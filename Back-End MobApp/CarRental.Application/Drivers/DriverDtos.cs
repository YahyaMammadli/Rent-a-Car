using System.ComponentModel.DataAnnotations;

namespace CarRental.Application.Drivers;

public class UpsertDriverDetailsRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\+?[0-9\s-]{7,15}$", ErrorMessage = "Invalid phone number")]
    public string Phone { get; set; } = string.Empty;

    [Required, StringLength(300, MinimumLength = 3)]
    public string Address { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 5)]
    public string NationalId { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 5)]
    public string LicenceNumber { get; set; } = string.Empty;

    public DateOnly LicenceExpiry { get; set; }
}

public sealed record DriverDetailsDto(
    string FullName,
    string Phone,
    string Address,
    string NationalId,
    string LicenceNumber,
    DateOnly LicenceExpiry,
    string LicencePhotoUrl,
    DateTime UpdatedAtUtc);

public sealed record LicencePhotoResult(Stream Content, string ContentType);
