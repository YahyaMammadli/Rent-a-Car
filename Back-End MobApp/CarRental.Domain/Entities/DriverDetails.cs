namespace CarRental.Domain.Entities;

public class DriverDetails
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;

    public string LicenceNumber { get; set; } = string.Empty;
    public DateOnly LicenceExpiry { get; set; }
    public string LicencePhotoPath { get; set; } = string.Empty;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
