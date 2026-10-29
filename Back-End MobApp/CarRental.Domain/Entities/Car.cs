namespace CarRental.Domain.Entities;

public class Car
{
    public string Id { get; set; } = string.Empty;
    public string BrandSlug { get; set; } = string.Empty;
    public Brand Brand { get; set; } = null!;

    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Seats { get; set; }
    public string Transmission { get; set; } = string.Empty;
    public string FuelType { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> Features { get; set; } = new();

    public double? Rating { get; set; }
    public int? TopSpeed { get; set; }
    public int? Doors { get; set; }
    public bool? Wifi { get; set; }
    public bool? Sensor { get; set; }
    public string? Bluetooth { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
