$path = 'd:\PROJECTS\pharma label designer\frontend\src\context\LabelContext.jsx'
$content = Get-Content $path
# keep lines 1 to 776 (index 0 to 775)
# skip lines 777 to 819 (index 776 to 818)
# keep lines 820 to end (index 819 to count-1)
$trimmed = $content[0..775] + $content[819..($content.Length - 1)]
$trimmed | Set-Content $path
