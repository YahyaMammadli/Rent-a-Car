using CarRental.Application.Drivers;

namespace CarRental.Api.Forms;

public sealed class UpsertDriverDetailsForm : UpsertDriverDetailsRequest
{
    public IFormFile? LicencePhoto { get; set; }
}
