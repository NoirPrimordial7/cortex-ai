param([Parameter(Mandatory)][string]$Document, [Parameter(Mandatory)][string]$Pdf)
$source = (Resolve-Path -LiteralPath $Document).Path
$destination = [IO.Path]::GetFullPath($Pdf)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.AutomationSecurity = 3
try {
    $doc = $word.Documents.Open($source, $false, $true)
    try {
        $doc.ExportAsFixedFormat($destination, 17, $false, 0, 0, 1, 1, 0, $true)
    } finally { $doc.Close(0) }
} finally { $word.Quit() }
