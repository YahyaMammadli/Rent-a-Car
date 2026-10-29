namespace CarRental.Application.Common;

public static class ImageValidator
{
    public const int MaxBytes = 5 * 1024 * 1024;

    public static bool TryDetect(ReadOnlySpan<byte> header, out string extension, out string contentType)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            extension = ".jpg"; contentType = "image/jpeg"; return true;
        }

        if (header.Length >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
            && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
        {
            extension = ".png"; contentType = "image/png"; return true;
        }

        if (header.Length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
            && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P')
        {
            extension = ".webp"; contentType = "image/webp"; return true;
        }

        extension = string.Empty; contentType = string.Empty; return false;
    }

    public static string ContentTypeFromExtension(string path) => Path.GetExtension(path).ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        _ => "application/octet-stream"
    };
}
