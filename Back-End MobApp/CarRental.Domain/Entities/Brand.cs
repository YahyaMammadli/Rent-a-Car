namespace CarRental.Domain.Entities;

public class Brand
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }

    public ICollection<Car> Cars { get; set; } = new List<Car>();
}
