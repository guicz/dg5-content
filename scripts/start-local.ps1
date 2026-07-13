$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot ".runtime"
$portableJava = Get-ChildItem (Join-Path $projectRoot ".tools") -Directory -Filter "jdk-21*" -ErrorAction SilentlyContinue | Select-Object -First 1
$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpmCommand) {
  $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
}

if (-not $pnpmCommand) {
  throw "pnpm nao encontrado. Instale Node.js 22 e execute: corepack enable"
}
$pnpm = $pnpmCommand.Source

if ($portableJava) {
  $env:JAVA_HOME = $portableJava.FullName
  $env:PATH = "$($portableJava.FullName)\bin;$env:PATH"
} elseif (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  throw "Java 21 nao encontrado. Ele e necessario para os emuladores Firebase."
}

New-Item -ItemType Directory -Force -Path $runtime | Out-Null

if (-not (Get-NetTCPConnection -State Listen -LocalPort 5177 -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $pnpm -ArgumentList @("dev") -WorkingDirectory $projectRoot -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtime "vite.out.log") `
    -RedirectStandardError (Join-Path $runtime "vite.err.log") | Out-Null
}

if (-not (Get-NetTCPConnection -State Listen -LocalPort 4000 -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $pnpm -ArgumentList @("emulators") -WorkingDirectory $projectRoot -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtime "emulators.out.log") `
    -RedirectStandardError (Join-Path $runtime "emulators.err.log") | Out-Null
}

Write-Host "DG5 Content Intelligence iniciando:" -ForegroundColor Yellow
Write-Host "App:      http://localhost:5177/"
Write-Host "Firebase: http://localhost:4000/"
Write-Host "Logs:     $runtime"
