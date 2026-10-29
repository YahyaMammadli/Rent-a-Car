using CarRental.Application.Auth;
using CarRental.Application.Bookings;
using CarRental.Application.Cars;
using CarRental.Application.Drivers;
using CarRental.Application.Profiles;
using Microsoft.Extensions.DependencyInjection;

namespace CarRental.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICarService, CarService>();
        services.AddScoped<IDriverDetailsService, DriverDetailsService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IProfileService, ProfileService>();
        return services;
    }
}
