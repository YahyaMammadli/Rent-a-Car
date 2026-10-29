using CarRental.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarRental.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        b.Property(x => x.AvatarPath).HasMaxLength(300);
        b.HasIndex(x => x.Email).IsUnique();

        b.HasOne(x => x.DriverDetails)
            .WithOne(x => x.User)
            .HasForeignKey<DriverDetails>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> b)
    {
        b.HasKey(x => x.Slug);
        b.Property(x => x.Slug).HasMaxLength(100);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.LogoUrl).HasMaxLength(500);
    }
}

public sealed class CarConfiguration : IEntityTypeConfiguration<Car>
{
    public void Configure(EntityTypeBuilder<Car> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(100);
        b.Property(x => x.BrandSlug).HasMaxLength(100).IsRequired();
        b.Property(x => x.Model).HasMaxLength(100).IsRequired();
        b.Property(x => x.Type).HasMaxLength(100).IsRequired();
        b.Property(x => x.Transmission).HasMaxLength(50).IsRequired();
        b.Property(x => x.FuelType).HasMaxLength(50).IsRequired();
        b.Property(x => x.PricePerDay).HasPrecision(18, 2);
        b.Property(x => x.ImageUrl).HasMaxLength(1000).IsRequired();
        b.Property(x => x.Bluetooth).HasMaxLength(20);

        b.HasOne(x => x.Brand)
            .WithMany(x => x.Cars)
            .HasForeignKey(x => x.BrandSlug)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class DriverDetailsConfiguration : IEntityTypeConfiguration<DriverDetails>
{
    public void Configure(EntityTypeBuilder<DriverDetails> b)
    {
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.UserId).IsUnique();
        b.Property(x => x.FullName).HasMaxLength(100).IsRequired();
        b.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        b.Property(x => x.Address).HasMaxLength(300).IsRequired();
        b.Property(x => x.NationalId).HasMaxLength(50).IsRequired();
        b.Property(x => x.LicenceNumber).HasMaxLength(50).IsRequired();
        b.Property(x => x.LicencePhotoPath).HasMaxLength(300).IsRequired();
    }
}

public sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.CarId).HasMaxLength(100).IsRequired();
        b.Property(x => x.TotalPrice).HasPrecision(18, 2);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

        b.HasIndex(x => new { x.CarId, x.StartDate, x.EndDate });
        b.HasIndex(x => x.UserId);

        b.HasOne(x => x.User)
            .WithMany(x => x.Bookings)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Car)
            .WithMany(x => x.Bookings)
            .HasForeignKey(x => x.CarId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(64);
        b.Property(x => x.RowVersion).IsRowVersion();

        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.FamilyId);
        b.HasIndex(x => x.UserId);

        b.HasOne(x => x.User)
            .WithMany(x => x.RefreshTokens)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
