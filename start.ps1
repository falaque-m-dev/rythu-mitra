# -----------------------------------------------------------------
# start.ps1  –  Starts both the Rythu Mitra backend (Podman) and
#                the Next.js frontend (port 3100) with a single command.
# -----------------------------------------------------------------

# 1️⃣ Make sure the .env file is present (it already contains the Gemini key)
if (-not (Test-Path .env)) {
    Write-Error "❌  .env file not found in the project root."
    exit 1
}

# 2️⃣ Start / restart the API container (port 3000) – it reads .env for GEMINI_API_KEY_ONE/TWO or GEMINI_API_KEY
$containerName = "rhythu-api"
if (podman container exists $containerName) {
    Write-Host "🔁  Restarting existing API container `$containerName`"
    podman restart $containerName
} else {
    Write-Host "🟢  Starting API container..."
    podman run -d `
        -p 3000:3000 `
        --env-file .env `
        --name $containerName `
        localhost/rythu-mitra:latest
}

# 3️⃣ Start the Next.js dev server (frontend)
Write-Host "🟢  Starting Next.js dev server (frontend)…"
npm --prefix apps/web run dev

# 4️⃣ Show the URLs the user should open
Write-Host "========================================"
Write-Host "  Rythu Mitra is now running 🚀"
Write-Host "========================================"
Write-Host "  • API (backend)      : http://127.0.0.1:3000"
Write-Host "  • Web (frontend)    : http://localhost:3100"
Write-Host "  • Press Ctrl‑C in this console to stop"
Write-Host "========================================"

# Keep the console alive so the backend container stays up.
# When the user presses Ctrl‑C the script (and the container) will stop.
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")