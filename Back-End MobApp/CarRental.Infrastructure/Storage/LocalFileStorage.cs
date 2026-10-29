using CarRental.Application.Abstractions;
using Microsoft.Extensions.Options;

namespace CarRental.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string RootPath { get; set; } = "App_Data/uploads";
}

public sealed class LocalFileStorage(IOptions<StorageOptions> options) : IFileStorage
{
    private readonly string _root = Path.GetFullPath(options.Value.RootPath)
                                        .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

    public async Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken cancellationToken)
    {
        var relative = $"{folder.Trim('/')}/{Guid.NewGuid():N}{extension}";
        var fullPath = Resolve(relative);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var file = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await content.CopyToAsync(file, cancellationToken);

        return relative;
    }

    public Stream OpenRead(string relativePath)
    {
        var fullPath = Resolve(relativePath);
        if (!File.Exists(fullPath)) throw new FileNotFoundException("File not found", relativePath);
        return new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
    }

    public void Delete(string relativePath)
    {
        try
        {
            var fullPath = Resolve(relativePath);
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch (IOException)
        {
        }
    }

    private string Resolve(string relativePath)
    {
        var full = Path.GetFullPath(Path.Combine(_root, relativePath));
        if (!full.StartsWith(_root, StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid storage path");
        return full;
    }
}
