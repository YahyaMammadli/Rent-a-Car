using CarRental.Application.Abstractions;
using CarRental.Application.Common;

namespace CarRental.Api.Infrastructure;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid UserId
    {
        get
        {
            var sub = accessor.HttpContext?.User.FindFirst("sub")?.Value;
            return Guid.TryParse(sub, out var id) ? id : throw new UnauthorizedAppException();
        }
    }
}
