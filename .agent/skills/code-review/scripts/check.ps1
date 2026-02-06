
# Code Review Check Script
# Automates the quality gates defined in code-review/SKILL.md

$ErrorActionPreference = "Stop"

function Test-NpmScript {
    param($scriptName)
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($pkg.scripts.$scriptName) {
        Write-Host "Running $scriptName..." -ForegroundColor Cyan
        npm run $scriptName
        if ($LASTEXITCODE -ne 0) {
            Write-Error "$scriptName failed"
        }
    } else {
        Write-Host "Skipping $scriptName (not defined in package.json)" -ForegroundColor DarkGray
    }
}

try {
    if (-not (Test-Path "package.json")) {
        Write-Warning "No package.json found. Skipping npm checks."
        exit
    }

    Test-NpmScript "lint"
    Test-NpmScript "typecheck"
    Test-NpmScript "test"
    
    # Optional: Security audit (non-blocking for now, or configurable)
    # Write-Host "Running npm audit..." -ForegroundColor Cyan
    # npm audit --audit-level=high

    Write-Host "✅ All code review checks passed!" -ForegroundColor Green
} catch {
    Write-Error "❌ Code review checks failed: $_"
    exit 1
}
