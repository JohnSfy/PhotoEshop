# PowerShell script to rename .js files to .jsx and update imports

Write-Host "Renaming .js files to .jsx files..." -ForegroundColor Green

# Rename component files
Get-ChildItem -Path "src\components" -Filter "*.js" | ForEach-Object {
    $newName = $_.Name -replace '\.js$', '.jsx'
    Rename-Item $_.FullName $newName
    Write-Host "Renamed: $($_.Name) -> $newName" -ForegroundColor Yellow
}

# Rename context files
Get-ChildItem -Path "src\context" -Filter "*.js" | ForEach-Object {
    $newName = $_.Name -replace '\.js$', '.jsx'
    Rename-Item $_.FullName $newName
    Write-Host "Renamed: $($_.Name) -> $newName" -ForegroundColor Yellow
}

# Rename main files
if (Test-Path "src\index.js") {
    Rename-Item "src\index.js" "src\index.jsx"
    Write-Host "Renamed: index.js -> index.jsx" -ForegroundColor Yellow
}

if (Test-Path "src\App.js") {
    Rename-Item "src\App.js" "src\App.jsx"
    Write-Host "Renamed: App.js -> App.jsx" -ForegroundColor Yellow
}

Write-Host "All files renamed successfully!" -ForegroundColor Green
Write-Host "Now you need to manually update import statements in your files to use .jsx extensions." -ForegroundColor Cyan
