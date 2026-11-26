$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath "$PSScriptRoot/../..").Path
$characterPath = Join-Path $projectRoot 'public/models/characters/base-a.glb'
$optimizedPath = Join-Path $projectRoot 'public/models/characters/base-a.optimized.glb'
$cliPath = Join-Path $projectRoot 'node_modules/@gltf-transform/cli/bin/cli.js'
& node $cliPath meshopt $characterPath $optimizedPath --level medium
if ($LASTEXITCODE -ne 0) { throw "GLB optimization failed with exit code $LASTEXITCODE" }
Move-Item -LiteralPath $optimizedPath -Destination $characterPath -Force
