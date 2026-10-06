# Health Kiosk Setup Guide

Use this guide to continue developing the Health Kiosk project on another laptop.

## 1. Install the prerequisites

Install the following software:

- Git
- XAMPP or another environment with PHP and MySQL
- Composer
- Node.js and npm

Make sure `git`, `php`, `composer`, `node`, and `npm` are available from PowerShell.

## 2. Clone the private repository

Sign in to GitHub as `Filart-09102005` or use an account that has been added as a repository collaborator. Then run:

```powershell
git clone https://github.com/Filart-09102005/Health-Kiosk.git
cd Health-Kiosk
```

## 3. Install the project dependencies

```powershell
composer install
npm install
```

## 4. Create the local environment file

The real `.env` file is intentionally excluded from GitHub because it contains secrets.

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

Open `.env` and configure the local application URL, MySQL database, mail server, Supabase connection, and any kiosk integrations that the laptop will use.

Never commit `.env`, passwords, tokens, private keys, or production database exports.

## 5. Create and initialize the database

Start MySQL in XAMPP and create an empty database whose name matches `DB_DATABASE` in `.env`. Then run:

```powershell
php artisan migrate --seed
```

This creates a fresh development database. Existing records from another laptop are not stored in GitHub. If those records are needed, transfer the database separately through a secure SQL export and import.

## 6. Start the development services

The Composer development command starts Laravel, the queue worker, the application log viewer, and Vite together:

```powershell
composer run dev
```

Alternatively, run the frontend and backend in separate PowerShell terminals:

```powershell
npm run dev
```

```powershell
php artisan serve
```

## 7. Configure kiosk hardware when needed

The real serial-bridge configuration is also excluded from GitHub. On the kiosk laptop, create it from the tracked template:

```powershell
Copy-Item scripts/config.example.json scripts/config.json
```

Update the COM port and URLs, then set `bridge_token` to the same secret value used for `KIOSK_BRIDGE_TOKEN` in `.env`.

If QZ Tray signing is used for thermal printing, securely copy the required certificate and private key to the paths configured in `.env`. Do not add the private key to Git.

## 8. Build and test

```powershell
npm run build
php artisan test
```

## 9. Continue development with Git

Pull the latest work before editing:

```powershell
git pull origin main
```

After making changes, save them to GitHub:

```powershell
git add -A
git commit -m "Describe your changes"
git push origin main
```

