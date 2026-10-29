using System.ComponentModel.DataAnnotations;
using CarRental.Application.Abstractions;
using CarRental.Application.Auth;
using CarRental.Application.Common;
using CarRental.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarRental.Application.Profiles;

public sealed class UpdateProfileRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;
}

public sealed record AvatarResult(Stream Content, string ContentType);

public interface IProfileService
{
    Task<UserDto> UpdateAsync(UpdateProfileRequest request, CancellationToken ct);
    Task<UserDto> SetAvatarAsync(Stream avatar, CancellationToken ct);
    Task<UserDto> RemoveAvatarAsync(CancellationToken ct);
    Task<AvatarResult> GetAvatarAsync(CancellationToken ct);
}

public sealed class ProfileService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IFileStorage storage) : IProfileService
{
    public async Task<UserDto> UpdateAsync(UpdateProfileRequest request, CancellationToken ct)
    {
        var user = await GetUserAsync(ct);
        user.Name = request.Name.Trim();
        await db.SaveChangesAsync(ct);
        return UserDto.From(user);
    }

    public async Task<UserDto> SetAvatarAsync(Stream avatar, CancellationToken ct)
    {
        var user = await GetUserAsync(ct);
        var newPath = await SavePhotoAsync(avatar, user.Id, ct);
        var oldPath = user.AvatarPath;

        user.AvatarPath = newPath;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            storage.Delete(newPath);
            throw;
        }

        if (!string.IsNullOrEmpty(oldPath)) storage.Delete(oldPath);
        return UserDto.From(user);
    }

    public async Task<UserDto> RemoveAvatarAsync(CancellationToken ct)
    {
        var user = await GetUserAsync(ct);
        var oldPath = user.AvatarPath;

        user.AvatarPath = null;
        await db.SaveChangesAsync(ct);

        if (!string.IsNullOrEmpty(oldPath)) storage.Delete(oldPath);
        return UserDto.From(user);
    }

    public async Task<AvatarResult> GetAvatarAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        var path = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.AvatarPath)
            .FirstOrDefaultAsync(ct);

        if (string.IsNullOrEmpty(path)) throw new NotFoundException("Avatar not found");

        try
        {
            return new AvatarResult(storage.OpenRead(path), ImageValidator.ContentTypeFromExtension(path));
        }
        catch (FileNotFoundException)
        {
            throw new NotFoundException("Avatar not found");
        }
    }

    private async Task<User> GetUserAsync(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        return await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
               ?? throw new UnauthorizedAppException();
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
                throw ValidationAppException.For("Avatar", "Photo must be 5 MB or smaller");
        }

        if (buffer.Length == 0)
            throw ValidationAppException.For("Avatar", "Photo is empty");

        var bytes = buffer.GetBuffer();
        if (!ImageValidator.TryDetect(bytes.AsSpan(0, (int)Math.Min(buffer.Length, 16)), out var extension, out _))
            throw ValidationAppException.For("Avatar", "Only JPEG, PNG or WEBP images are allowed");

        buffer.Position = 0;
        return await storage.SaveAsync(buffer, $"avatars/{userId:N}", extension, ct);
    }
}
