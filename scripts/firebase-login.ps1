$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpmCommand) {
  $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
}
if (-not $pnpmCommand) {
  throw "pnpm nao encontrado. Instale Node.js 22 e execute: corepack enable"
}
$pnpm = $pnpmCommand.Source

Set-Location -LiteralPath $projectRoot
$null = New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot ".runtime")
$transcript = Join-Path $projectRoot ".runtime\firebase-login.transcript.log"
Start-Transcript -Path $transcript -Append | Out-Null

& $pnpm firebase login

if ($LASTEXITCODE -eq 0) {
  Write-Host "Firebase CLI autenticada com sucesso." -ForegroundColor Green
} else {
  Write-Host "A autenticacao nao foi concluida." -ForegroundColor Yellow
}

Stop-Transcript | Out-Null
Read-Host "Pressione Enter para fechar"
