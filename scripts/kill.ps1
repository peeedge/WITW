# Stop local WitW processes (Vite dev/preview, the data fetch, and their npm/esbuild children).
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\kill.ps1
#    or: .\kill.cmd
#    or: npm run kill

$ErrorActionPreference = "Continue"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path.TrimEnd("\")

$shellNames = @(
    "powershell.exe",
    "pwsh.exe",
    "cursor.exe",
    "Code.exe",
    "WindowsTerminal.exe",
    "explorer.exe",
    "OpenConsole.exe"
)

function Test-MentionsRoot([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
    $normalized = $Text.Replace("/", "\")
    return $normalized.IndexOf($root, [StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Test-RepoToolPath([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
    $normalized = $Text.Replace("/", "\")
    foreach ($suffix in @("\node_modules\", "\scripts\")) {
        $marker = $root + $suffix
        if ($normalized.IndexOf($marker, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $true
        }
    }
    return $false
}

function Test-WitwSeed($Proc) {
    $name = $Proc.Name
    if ($shellNames -contains $name) { return $false }
    if ($Proc.ProcessId -eq $PID) { return $false }
    if ($name -notin @("node.exe", "esbuild.exe")) { return $false }

    # Match the program being run (Vite, esbuild, fetch-data), not an editor
    # that merely has this folder open.
    return (Test-RepoToolPath $Proc.ExecutablePath) -or (Test-RepoToolPath $Proc.CommandLine)
}

$all = @(Get-CimInstance Win32_Process)
$byId = @{}
foreach ($proc in $all) {
    $byId[$proc.ProcessId] = $proc
}

$selected = @{}
foreach ($proc in $all) {
    if (-not (Test-WitwSeed $proc)) { continue }
    $selected[$proc.ProcessId] = $proc

    $current = $proc
    for ($i = 0; $i -lt 8; $i++) {
        $parent = $byId[$current.ParentProcessId]
        if (-not $parent) { break }
        if ($shellNames -contains $parent.Name) { break }

        $parentText = "$($parent.CommandLine) $($parent.ExecutablePath)"
        $isToolchain = $parent.Name -in @("node.exe", "esbuild.exe", "cmd.exe") -and
            ((Test-MentionsRoot $parentText) -or ($parent.CommandLine -match "(?i)(npm-cli\.js|\bvite\b|\besbuild\b)"))
        if (-not $isToolchain) { break }

        $selected[$parent.ProcessId] = $parent
        $current = $parent
    }
}

if ($selected.Count -eq 0) {
    Write-Host "No WitW processes are running."
    exit 0
}

$roots = @($selected.Values | Where-Object { -not $selected.ContainsKey($_.ParentProcessId) })

Write-Host "Stopping $($roots.Count) WitW process tree(s):"
foreach ($proc in $roots) {
    $label = $proc.CommandLine
    if ([string]::IsNullOrWhiteSpace($label)) { $label = $proc.ExecutablePath }
    Write-Host ("  PID {0}  {1}" -f $proc.ProcessId, $label)
    & taskkill.exe /PID $proc.ProcessId /T /F 2>&1 | Out-Null
}

Write-Host "WitW processes stopped."
exit 0
