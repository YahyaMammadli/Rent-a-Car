# Car Rental

A car rental mobile app (Expo / React Native) with an ASP.NET Core API and a SQL Server database.

```
Back-End MobApp/   ASP.NET Core API (.NET, EF Core, SQL Server LocalDB)
MobApp/            Expo / React Native app
```

## 1. Backend (`Back-End MobApp`)

```powershell
dotnet run --project CarRental.Api
```

- Keep the window open. On the first start the `CarRental_DB` database (LocalDB) is created, migrations are applied and brands and cars are seeded.
- The server listens on `0.0.0.0:5080` (all network interfaces), so it is reachable via both `localhost` and your computer's IP address.
- Check it: `http://localhost:5080/swagger` and `http://<IPv4>:5080/api/brands`.

To use a real phone, open the port once (PowerShell as administrator):

```powershell
New-NetFirewallRule -DisplayName "CarRental API 5080" -Direction Inbound -Protocol TCP -LocalPort 5080 -Action Allow
```

## 2. App (`MobApp`)

```powershell
npm install
```

Create `MobApp/.env` (use the IPv4 address from `ipconfig`):

```
EXPO_PUBLIC_API_URL=http://192.168.0.197:5080
```

Other values:

| Target | URL |
|---|---|
| Real phone | `http://<your computer IPv4>:5080` (same Wi-Fi network) |
| Android emulator | `http://10.0.2.2:5080` |
| iOS simulator / browser | `http://localhost:5080` |

Start the app:

```powershell
npx expo start -c
```

Restart it after every change to `.env`: environment variables are read only at startup.

## Where data is stored

| Data | Location |
|---|---|
| Accounts, password hashes, sessions | SQL Server database |
| Brands, cars, prices | SQL Server database (initial data in `CarRental.Infrastructure/Seed/*.json`) |
| Bookings, driver details | SQL Server database |
| Avatars, licence photos | Files in `CarRental.Api/App_Data/uploads`, paths stored in the database |
| Selected theme | On the device |

Car images and brand logos are stored in the database as URLs.

## Troubleshooting

- **`ERR_CONNECTION_REFUSED` on `http://<IP>:5080`**: the API is not running, or the port is blocked by the firewall. Restart the backend and run the firewall command above.
- **The app shows "Cannot reach the server"**: check `EXPO_PUBLIC_API_URL`, make sure the phone and the computer are on the same Wi-Fi network, and restart `npx expo start -c`.
