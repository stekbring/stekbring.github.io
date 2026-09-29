# egna10 - ger .egna10-filer egna10-ikonen i Utforskaren (bara för din Windows-användare).
# Kör om skriptet om du installerar om appen.
$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'egna10.ico'
$dir = Join-Path $env:LOCALAPPDATA 'egna10'
$ico = Join-Path $dir 'egna10.ico'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Copy-Item -Path $src -Destination $ico -Force
$iconValue = '"' + $ico + '",0'
$classes = 'HKCU:\Software\Classes'

function Set-Icon($progId) {
    $k = "$classes\$progId\DefaultIcon"
    New-Item -Path $k -Force | Out-Null
    Set-ItemProperty -Path $k -Name '(default)' -Value $iconValue
    Write-Host "  ikon satt för $progId"
}

# Egen filtyp som reserv
New-Item -Path "$classes\egna10.kortlek" -Force | Out-Null
Set-ItemProperty -Path "$classes\egna10.kortlek" -Name '(default)' -Value 'egna10-kortlek'
Set-Icon 'egna10.kortlek'

$ext = "$classes\.egna10"
if (-not (Test-Path $ext)) { New-Item -Path $ext -Force | Out-Null }
$cur = (Get-ItemProperty -Path $ext -ErrorAction SilentlyContinue).'(default)'
if (-not $cur) { Set-ItemProperty -Path $ext -Name '(default)' -Value 'egna10.kortlek' } else { Set-Icon $cur }

# Filtyper som Chrome/Edge skapade när appen installerades
$ow = "$ext\OpenWithProgids"
if (Test-Path $ow) { foreach ($p in (Get-Item $ow).Property) { if ($p) { Set-Icon $p } } }
$uc = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.egna10\UserChoice'
if (Test-Path $uc) { $p = (Get-ItemProperty $uc).ProgId; if ($p) { Set-Icon $p } }

# Be Utforskaren att rita om ikonerna
Add-Type -Namespace Win32 -Name Shell -MemberDefinition '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int e, uint f, System.IntPtr a, System.IntPtr b);'
[Win32.Shell]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
try { Start-Process -FilePath "$env:WINDIR\System32\ie4uinit.exe" -ArgumentList '-show' -WindowStyle Hidden } catch {}
Write-Host ''
Write-Host 'Klart! .egna10-filer har nu egna10-ikonen.'
