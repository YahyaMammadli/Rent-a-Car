namespace CarRental.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "CarRental.Api";
    public string Audience { get; set; } = "CarRental.App";

    public string Secret { get; set; } = string.Empty;

    public int ExpiresMinutes { get; set; } = 15;

    public int RefreshTokenDays { get; set; } = 30;
}
