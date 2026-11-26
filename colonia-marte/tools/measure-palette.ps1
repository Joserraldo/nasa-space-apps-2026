$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force node_modules/.cache/palette | Out-Null
$samples = node tools/measure-palette.mjs --regions | ConvertFrom-Json
foreach ($sample in $samples) {
    $x, $y, $width, $height = $sample.region
    $filter = "format=rgb24,crop=${width}:${height}:${x}:${y},scale=1:1:flags=area"
    & ffmpeg -v error -i "docs/referencias/$($sample.frame)" -vf $filter `
        -frames:v 1 -f rawvideo -pix_fmt rgb24 -y "node_modules/.cache/palette/$($sample.id).rgb"
    if ($LASTEXITCODE -ne 0) { throw "Measurement failed: $($sample.id)" }
}
node tools/measure-palette.mjs
if ($LASTEXITCODE -ne 0) { throw "Palette generation failed" }
