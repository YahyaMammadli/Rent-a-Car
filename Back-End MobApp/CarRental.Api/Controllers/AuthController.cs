using CarRental.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CarRental.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("sign-up")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> SignUp(SignUpRequest request, CancellationToken ct)
        => Ok(await auth.SignUpAsync(request, ct));

    [HttpPost("sign-in")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> SignIn(SignInRequest request, CancellationToken ct)
        => Ok(await auth.SignInAsync(request, ct));

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct)
        => Ok(await auth.RefreshAsync(request, ct));

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct)
    {
        await auth.LogoutAsync(request, ct);
        return NoContent();
    }

    [HttpPost("logout-all")]
    [Authorize]
    public async Task<IActionResult> LogoutAll(CancellationToken ct)
    {
        await auth.LogoutAllAsync(ct);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
        => Ok(await auth.GetMeAsync(ct));
}
