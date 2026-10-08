# Publishes the CV files in cv/ to the live portfolio (commit + push to main).
#
#   publish-cv.bat            -> publish once, now
#   publish-cv.bat -Watch     -> keep running; publish automatically whenever a PDF in cv/ changes
#
# Only the cv/ folder is committed, so other work in progress is never pushed by accident.
# A PDF is published only once it has stopped changing and is complete (%PDF ... %%EOF),
# so a file that is still being saved or synced by OneDrive is never uploaded half-written.

param(
    [switch]$Watch,
    [int]$IntervalSeconds = 10
)

$ErrorActionPreference = 'Stop'
# git prints UTF-8; without this, Hebrew file names (e.g. the Hebrew CV) arrive garbled
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
$Repo = $PSScriptRoot
$LogFile = Join-Path $Repo 'publish-cv.log'

function Write-Log([string]$Message) {
    $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Invoke-Git {
    # git writes progress (e.g. "To https://github.com/...") to stderr; in Windows PowerShell that
    # would count as an error, so only the exit code decides success.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git -C $Repo -c core.quotepath=false @args 2>&1 | ForEach-Object { "$_" }
        $code = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previous }
    if ($code -ne 0) { throw "git $($args[0]) failed: $($output -join ' ')" }
    return $output
}

function Get-ChangedCvFiles {
    Invoke-Git status --porcelain -- cv | Where-Object { $_ } | ForEach-Object { $_.Substring(3).Trim('"') }
}

function Test-CompletePdf([string]$Path) {
    try {
        $stream = [System.IO.File]::Open($Path, 'Open', 'Read', 'None')  # fails while another program is writing
    } catch { return $false }
    try {
        if ($stream.Length -lt 1024) { return $false }
        $head = New-Object byte[] 5
        [void]$stream.Read($head, 0, 5)
        $tailLength = [Math]::Min(1024, $stream.Length)
        [void]$stream.Seek(-$tailLength, 'End')
        $tail = New-Object byte[] $tailLength
        [void]$stream.Read($tail, 0, $tailLength)
        return ([Text.Encoding]::ASCII.GetString($head) -eq '%PDF-') -and
               ([Text.Encoding]::ASCII.GetString($tail).Contains('%%EOF'))
    } finally { $stream.Dispose() }
}

function Publish-Cv {
    $changed = @(Get-ChangedCvFiles)
    if ($changed.Count -eq 0) { Write-Log 'No CV changes to publish.'; return }

    foreach ($file in $changed) {
        $full = Join-Path $Repo $file
        if ((Test-Path $full) -and $file -like '*.pdf' -and -not (Test-CompletePdf $full)) {
            Write-Log "Skipped: $file is not a complete PDF yet (still saving?)."
            return
        }
    }

    Invoke-Git add -- cv | Out-Null
    Invoke-Git commit -m ("Update CV ({0})" -f (Get-Date -Format 'yyyy-MM-dd HH:mm')) -- cv | Out-Null
    Invoke-Git push origin main | Out-Null
    Write-Log ("Published: {0}. Live on the site in about a minute." -f ($changed -join ', '))
}

if (-not $Watch) {
    try { Publish-Cv } catch { Write-Log "ERROR: $_"; exit 1 }
    exit 0
}

Write-Log "Watching cv/ for changes (every $IntervalSeconds s). Close this window to stop."
$lastSignature = $null
while ($true) {
    try {
        $changed = @(Get-ChangedCvFiles)
        if ($changed.Count -gt 0) {
            # Publish only when the files looked the same on two checks in a row (finished saving/syncing)
            $signature = ($changed | ForEach-Object {
                $item = Get-Item -LiteralPath (Join-Path $Repo $_) -ErrorAction SilentlyContinue
                if ($item) { '{0}|{1}|{2}' -f $_, $item.Length, $item.LastWriteTimeUtc.Ticks } else { "$_|deleted" }
            }) -join ';'
            if ($signature -eq $lastSignature) { Publish-Cv; $lastSignature = $null }
            else { $lastSignature = $signature }
        } else {
            $lastSignature = $null
        }
    } catch {
        Write-Log "ERROR: $_"
    }
    Start-Sleep -Seconds $IntervalSeconds
}
