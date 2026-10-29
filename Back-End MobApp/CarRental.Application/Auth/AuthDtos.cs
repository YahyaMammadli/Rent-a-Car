using System.ComponentModel.DataAnnotations;
using CarRental.Domain.Entities;

namespace CarRental.Application.Auth;

public sealed class SignUpRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;

    [Required, Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; init; } = string.Empty;
}

public sealed class SignInRequest
{
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(128)]
    public string Password { get; init; } = string.Empty;
}

public sealed record UserDto(Guid Id, string Name, string Email, string? AvatarUrl)
{
    public static UserDto From(User user) => new(
        user.Id,
        user.Name,
        user.Email,
        string.IsNullOrEmpty(user.AvatarPath)
            ? null
            : $"/api/profile/avatar?v={Path.GetFileNameWithoutExtension(user.AvatarPath)}");
}

public sealed class RefreshRequest
{
    [Required, StringLength(200, MinimumLength = 20)]
    public string RefreshToken { get; init; } = string.Empty;
}

public sealed record AuthResponse(
    string Token,
    DateTime ExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    UserDto User);
