namespace CarRental.Application.Common;

public abstract class AppException(string message) : Exception(message);

public sealed class NotFoundException(string message) : AppException(message);

public sealed class ConflictException(string message) : AppException(message);

public sealed class UnauthorizedAppException(string message = "Unauthorized") : AppException(message);

public sealed class ValidationAppException : AppException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationAppException(IReadOnlyDictionary<string, string[]> errors) : base("One or more validation errors occurred.")
        => Errors = errors;

    public static ValidationAppException For(string field, string message)
        => new(new Dictionary<string, string[]> { [field] = [message] });
}
