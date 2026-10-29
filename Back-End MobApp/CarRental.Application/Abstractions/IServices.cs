using CarRental.Domain.Entities;

namespace CarRental.Application.Abstractions;

public sealed record AccessToken(string Value, DateTime ExpiresAtUtc);

public interface IJwtTokenGenerator
{
    AccessToken Generate(User user);

    TimeSpan RefreshTokenLifetime { get; }
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface ICurrentUser
{
    Guid UserId { get; }
}

public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken cancellationToken);
    Stream OpenRead(string relativePath);
    void Delete(string relativePath);
}
