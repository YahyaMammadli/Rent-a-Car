using CarRental.Application.Abstractions;
using CarRental.Application.Common;
using CarRental.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarRental.Application.Auth;

public interface IAuthService
{
    Task<AuthResponse> SignUpAsync(SignUpRequest request, CancellationToken ct);
    Task<AuthResponse> SignInAsync(SignInRequest request, CancellationToken ct);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct);
    Task LogoutAsync(RefreshRequest request, CancellationToken ct);
    Task LogoutAllAsync(CancellationToken ct);
    Task<UserDto> GetMeAsync(CancellationToken ct);
}

public sealed class AuthService(
    IAppDbContext db,
    IPasswordHasher hasher,
    IJwtTokenGenerator jwt,
    ICurrentUser currentUser) : IAuthService
{
    private static readonly TimeSpan ReuseGrace = TimeSpan.FromSeconds(10);

    private static readonly TimeSpan CleanupAfter = TimeSpan.FromDays(7);

    public async Task<AuthResponse> SignUpAsync(SignUpRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("User with this email already exists");

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = hasher.Hash(request.Password)
        };

        db.Users.Add(user);
        var (refreshToken, rawRefreshToken) = NewRefreshToken(user.Id, Guid.NewGuid());

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("User with this email already exists");
        }

        return ToResponse(user, refreshToken, rawRefreshToken);
    }

    public async Task<AuthResponse> SignInAsync(SignInRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
        {
            hasher.Hash(request.Password);
            throw new UnauthorizedAppException("Invalid email or password");
        }

        if (!hasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAppException("Invalid email or password");

        await CleanupOldTokensAsync(user.Id, ct);

        var (refreshToken, rawRefreshToken) = NewRefreshToken(user.Id, Guid.NewGuid());
        await db.SaveChangesAsync(ct);

        return ToResponse(user, refreshToken, rawRefreshToken);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct)
    {
        var hash = RefreshTokenHelper.Hash(request.RefreshToken);
        var now = DateTime.UtcNow;

        var token = await db.RefreshTokens
                        .Include(t => t.User)
                        .FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
                    ?? throw new UnauthorizedAppException("Invalid refresh token");

        if (token.RevokedAtUtc is not null)
        {
            var justRotated = token.ReplacedByTokenHash is not null && now - token.RevokedAtUtc.Value <= ReuseGrace;

            if (!justRotated)
                await RevokeFamilyAsync(token.FamilyId, ct);

            throw new UnauthorizedAppException("Refresh token is no longer valid");
        }

        if (token.ExpiresAtUtc <= now)
            throw new UnauthorizedAppException("Refresh token expired");

        var (newToken, rawNewToken) = NewRefreshToken(token.UserId, token.FamilyId);
        token.RevokedAtUtc = now;
        token.ReplacedByTokenHash = newToken.TokenHash;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new UnauthorizedAppException("Refresh token is no longer valid");
        }

        return ToResponse(token.User, newToken, rawNewToken);
    }

    public async Task LogoutAsync(RefreshRequest request, CancellationToken ct)
    {
        var hash = RefreshTokenHelper.Hash(request.RefreshToken);
        var familyId = await db.RefreshTokens
            .Where(t => t.TokenHash == hash)
            .Select(t => (Guid?)t.FamilyId)
            .FirstOrDefaultAsync(ct);

        if (familyId is not null)
            await RevokeFamilyAsync(familyId.Value, ct);
    }

    public async Task LogoutAllAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        DateTime? now = DateTime.UtcNow;

        await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAtUtc, now), ct);
    }

    public async Task<UserDto> GetMeAsync(CancellationToken ct)
    {
        var id = currentUser.UserId;
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct)
                   ?? throw new UnauthorizedAppException();
        return UserDto.From(user);
    }

    private (RefreshToken Entity, string Raw) NewRefreshToken(Guid userId, Guid familyId)
    {
        var raw = RefreshTokenHelper.Generate();
        var entity = new RefreshToken
        {
            UserId = userId,
            FamilyId = familyId,
            TokenHash = RefreshTokenHelper.Hash(raw),
            ExpiresAtUtc = DateTime.UtcNow.Add(jwt.RefreshTokenLifetime)
        };

        db.RefreshTokens.Add(entity);
        return (entity, raw);
    }

    private async Task RevokeFamilyAsync(Guid familyId, CancellationToken ct)
    {
        DateTime? now = DateTime.UtcNow;

        await db.RefreshTokens
            .Where(t => t.FamilyId == familyId && t.RevokedAtUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAtUtc, now), ct);
    }

    private async Task CleanupOldTokensAsync(Guid userId, CancellationToken ct)
    {
        var threshold = DateTime.UtcNow - CleanupAfter;

        await db.RefreshTokens
            .Where(t => t.UserId == userId &&
                        (t.ExpiresAtUtc < threshold || (t.RevokedAtUtc != null && t.RevokedAtUtc < threshold)))
            .ExecuteDeleteAsync(ct);
    }

    private AuthResponse ToResponse(User user, RefreshToken refreshToken, string rawRefreshToken)
    {
        var access = jwt.Generate(user);
        return new AuthResponse(
            access.Value,
            access.ExpiresAtUtc,
            rawRefreshToken,
            refreshToken.ExpiresAtUtc,
            UserDto.From(user));
    }
}
