# Script para sincronizar las clases en la BD de Railway usando un túnel SSH.
# Abre un túnel a la base de datos, ejecuta el seed y cierra el túnel.

$ErrorActionPreference = 'Stop'

Write-Host "=== Sincronizando clases en Railway ===" -ForegroundColor Cyan

# 1. Abrir el túnel SSH a la base de datos en segundo plano
Write-Host "Abriendo túnel SSH a la base de datos..." -ForegroundColor Yellow
$railwayCmd = "C:\Users\ruis\AppData\Roaming\npm\railway.cmd"
$tunnelProcess = Start-Process -FilePath $railwayCmd -ArgumentList "connect", "postgres", "--tunnel-only", "--port", "5433" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\rfa-tunnel.log" -RedirectStandardError "$env:TEMP\rfa-tunnel-err.log"


# 2. Esperar a que el puerto 5433 esté disponible
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $test = New-Object System.Net.Sockets.TcpClient
        $test.Connect("127.0.0.1", 5433)
        $test.Close()
        $ready = $true
        break
    } catch {
        # Puerto aún no disponible
    }
}

if (-not $ready) {
    Write-Host "ERROR: No se pudo abrir el túnel a la base de datos." -ForegroundColor Red
    if (Test-Path "$env:TEMP\rfa-tunnel-err.log") {
        Get-Content "$env:TEMP\rfa-tunnel-err.log"
    }
    Stop-Process -Id $tunnelProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Túnel abierto en localhost:5433" -ForegroundColor Green

# 3. Construir la URL de conexión local usando las credenciales de la BD
# La URL interna usa postgres.railway.internal; con el túnel usamos localhost:5433
# Las credenciales se obtienen de la variable DATABASE_URL del proyecto Railway.
# Si no está disponible en el entorno, se obtienen de `railway variables`.
$internalUrl = $env:DATABASE_URL
if (-not $internalUrl) {
    # Obtener la DATABASE_URL del proyecto de Railway (formato JSON para parseo limpio)
    $varsJson = railway variables --json 2>&1 | Out-String
    try {
        $vars = $varsJson | ConvertFrom-Json
        $internalUrl = $vars.DATABASE_URL
    } catch {
        Write-Host "AVISO: No se pudo parsear DATABASE_URL de railway variables." -ForegroundColor Yellow
    }
}

if (-not $internalUrl) {
    Write-Host "ERROR: No se pudo obtener DATABASE_URL." -ForegroundColor Red
    Stop-Process -Id $tunnelProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Reemplazar el hostname interno por localhost:5433
$localUrl = $internalUrl -replace "postgres\.railway\.internal:5432", "localhost:5433"
Write-Host "Conectando a: $localUrl" -ForegroundColor Gray


# 4. Ejecutar el seed con la URL local
$env:DATABASE_URL = $localUrl
Write-Host "`nEjecutando seed de clases..." -ForegroundColor Yellow
node scripts/seed-classes-railway.js
$seedExitCode = $LASTEXITCODE

# 5. Cerrar el túnel
Write-Host "`nCerrando túnel..." -ForegroundColor Yellow
Stop-Process -Id $tunnelProcess.Id -Force -ErrorAction SilentlyContinue

if ($seedExitCode -ne 0) {
    Write-Host "ERROR: El seed falló con código $seedExitCode" -ForegroundColor Red
    exit $seedExitCode
}

Write-Host "`n=== Sincronización completada ===" -ForegroundColor Green
