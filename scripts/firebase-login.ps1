$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeBin = "C:\Users\Bruna\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpm = "C:\Users\Bruna\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

$env:PATH = "$nodeBin;$env:PATH"
Set-Location -LiteralPath $projectRoot
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
