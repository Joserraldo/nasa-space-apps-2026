param(
  [Parameter(Mandatory = $true)][string]$Script,
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$ScriptArgs
)
$ErrorActionPreference = 'Stop'
$blenderPath = 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe'
if (-not (Test-Path -LiteralPath $blenderPath)) { throw "Blender 5.3 not found: $blenderPath" }
$resolvedScript = (Resolve-Path -LiteralPath $Script).Path
& $blenderPath -b --factory-startup --python-exit-code 1 -P $resolvedScript -- @ScriptArgs
if ($LASTEXITCODE -ne 0) { throw "Blender failed with exit code $LASTEXITCODE" }
