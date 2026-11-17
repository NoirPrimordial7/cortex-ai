param([string]$ModelDirectory = (Join-Path $PSScriptRoot '../outputs/minilm'))

$ErrorActionPreference = 'Stop'
$revision = 'c9745ed1d9f207416be6d2e6f8de32d1f16199bf'
$baseUrl = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/$revision"
$artifacts = @(
    @{ Name = 'model.onnx'; Source = 'onnx/model.onnx'; SHA256 = '6fd5d72fe4589f189f8ebc006442dbb529bb7ce38f8082112682524616046452' },
    @{ Name = 'tokenizer.json'; Source = 'tokenizer.json'; SHA256 = 'be50c3628f2bf5bb5e3a7f17b1f74611b2561a3a27eeab05e5aa30f411572037' }
)
New-Item -ItemType Directory -Path $ModelDirectory -Force | Out-Null
foreach ($artifact in $artifacts) {
    $target = Join-Path $ModelDirectory $artifact.Name
    if ((Test-Path -LiteralPath $target -PathType Leaf) -and
        (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -eq $artifact.SHA256) {
        continue
    }
    $temporary = "$target.download"
    try {
        curl.exe --fail --location --silent --show-error --max-time 300 "$baseUrl/$($artifact.Source)" -o $temporary
        if ($LASTEXITCODE -ne 0 -or
            (Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $artifact.SHA256) {
            throw "Download or hash verification failed for $($artifact.Name)"
        }
        Move-Item -LiteralPath $temporary -Destination $target -Force
    } finally {
        if (Test-Path -LiteralPath $temporary -PathType Leaf) {
            Remove-Item -LiteralPath $temporary
        }
    }
}
(Resolve-Path -LiteralPath $ModelDirectory).Path
