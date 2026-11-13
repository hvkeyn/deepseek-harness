# Draw the edition badge on one installer brand bitmap.
#
# The installer brand artwork is a bitmap, so the edition marker is painted into
# the image at packaging time rather than rendered by the native window. The
# badge sits on the wordmark baseline, right of the wordmark, and mirrors the
# application's inverted pill: the mark's ink fills the pill and the label takes
# the inverted colour.

Add-Type -AssemblyName System.Drawing

function Add-InstallerEditionBadge {
    param(
        [Parameter(Mandatory = $true)][Drawing.Graphics]$Graphics,
        [Parameter(Mandatory = $true)][Drawing.Bitmap]$Bitmap,
        [switch]$Dark,
        [ValidateSet('Wordmark', 'Below')][string]$Placement = 'Wordmark',
        [string]$Text = 'HVKeyn Edition'
    )

    $scale = $Bitmap.Width / 600.0
    if ($Placement -eq 'Below') { $scale = $Bitmap.Width / 164.0 }
    $bandTop = [int]($Bitmap.Height * 0.72)
    $bandBottom = [int]($Bitmap.Height * 0.95)
    $gap = [int](12 * $scale)

    # Find the artwork's right edge inside the lower band; the whale mark sits above it.
    $right = 0
    for ($y = $bandTop; $y -lt $bandBottom; $y++) {
        for ($x = $Bitmap.Width - 1; $x -gt $right; $x--) {
            $pixel = $Bitmap.GetPixel($x, $y)
            $sum = $pixel.R + $pixel.G + $pixel.B
            if ($Dark) { $isInk = $sum -gt 700 } else { $isInk = $sum -lt 700 }
            if ($isInk) { $right = $x; break }
        }
    }
    if ($Placement -eq 'Below') {
        # The narrow uninstaller panel carries its artwork as one card: centre the marker under it.
        $bottom = 0
        for ($y = $Bitmap.Height - 1; $y -ge $bandTop; $y--) {
            for ($x = 0; $x -lt $Bitmap.Width; $x++) {
                $pixel = $Bitmap.GetPixel($x, $y)
                $sum = $pixel.R + $pixel.G + $pixel.B
                if ($sum -lt 700) { $bottom = $y; break }
            }
            if ($bottom -ne 0) { break }
        }
        if ($bottom -eq 0) { $bottom = [int]($Bitmap.Height * 0.6) }
        $bandTop = $bottom + $gap
        $bandBottom = $bandTop
    }
    elseif ($right -eq 0) { return }

    $gap = [int](12 * $scale)
    $pillHeight = [double](14 * $scale)
    $padding = [double](5 * $scale)
    $font = New-Object Drawing.Font('Segoe UI', [double](9 * $scale), [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
    $format = [Drawing.StringFormat]::new()
    $format.Alignment = [Drawing.StringAlignment]::Center
    $format.LineAlignment = [Drawing.StringAlignment]::Center
    $textBrush = $null
    $path = $null
    try {
        $measured = $Graphics.MeasureString($Text, $font, [Drawing.PointF]::new(0, 0), $format)
        $pillWidth = [int]($measured.Width + 2 * $padding)
        if ($Placement -eq 'Below') {
            $x = [int](($Bitmap.Width - $pillWidth) / 2)
            $y = [int]$bandTop
        }
        else {
            $x = [int]($right + $gap)
            if (($x + $pillWidth) -ge $Bitmap.Width) {
                $x = [Math]::Max(0, $Bitmap.Width - $pillWidth - [int](4 * $scale))
            }
            $y = [int](($bandTop + $bandBottom) / 2 - $pillHeight / 2)
        }
        $radius = [int](3 * $scale)
        $diameter = 2 * $radius
        $path = New-Object Drawing.Drawing2D.GraphicsPath
        $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
        $path.AddArc($x + $pillWidth - $diameter, $y, $diameter, $diameter, 270, 90)
        $path.AddArc($x + $pillWidth - $diameter, $y + $pillHeight - $diameter, $diameter, $diameter, 0, 90)
        $path.AddArc($x, $y + $pillHeight - $diameter, $diameter, $diameter, 90, 90)
        $path.CloseFigure()
        if ($Dark) { $fill = [Drawing.ColorTranslator]::FromHtml('#f9fafb') } else { $fill = [Drawing.ColorTranslator]::FromHtml('#0f1115') }
        $brush = New-Object Drawing.SolidBrush($fill)
        try { $Graphics.FillPath($brush, $path) } finally { $brush.Dispose() }
        if ($Dark) { $ink = [Drawing.ColorTranslator]::FromHtml('#353638') } else { $ink = [Drawing.Color]::White }
        $textBrush = New-Object Drawing.SolidBrush($ink)
        $Graphics.DrawString($Text, $font, $textBrush, [Drawing.RectangleF]::new([float]$x, [float]$y, [float]$pillWidth, [float]$pillHeight), $format)
    }
    finally {
        if ($null -ne $textBrush) { $textBrush.Dispose() }
        if ($null -ne $path) { $path.Dispose() }
        $format.Dispose()
        $font.Dispose()
    }
}
