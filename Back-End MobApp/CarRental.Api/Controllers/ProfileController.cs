using CarRental.Api.Forms;
using CarRental.Application.Auth;
using CarRental.Application.Common;
using CarRental.Application.Profiles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarRental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public sealed class ProfileController(IProfileService profile) : ControllerBase
{
    [HttpPut]
    public async Task<ActionResult<UserDto>> Update(UpdateProfileRequest request, CancellationToken ct)
        => Ok(await profile.UpdateAsync(request, ct));

    [HttpPut("avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<UserDto>> UploadAvatar([FromForm] UploadAvatarForm form, CancellationToken ct)
    {
        if (form.Avatar is null)
            throw ValidationAppException.For("Avatar", "Upload an image");

        await using var stream = form.Avatar.OpenReadStream();
        return Ok(await profile.SetAvatarAsync(stream, ct));
    }

    [HttpDelete("avatar")]
    public async Task<ActionResult<UserDto>> RemoveAvatar(CancellationToken ct)
        => Ok(await profile.RemoveAvatarAsync(ct));

    [HttpGet("avatar")]
    public async Task<IActionResult> GetAvatar(CancellationToken ct)
    {
        var avatar = await profile.GetAvatarAsync(ct);
        Response.Headers.CacheControl = "private, max-age=86400";
        return File(avatar.Content, avatar.ContentType);
    }
}
