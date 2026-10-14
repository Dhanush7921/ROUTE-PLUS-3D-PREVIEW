# Run inside the NEW project after extracting it. Never copies or edits sibling projects.
$ErrorActionPreference = 'Stop'
$ExpectedName = 'ROUTE-PLUS-3D-PREVIEW'
$TargetRepo = 'Dhanush7921/ROUTE-PLUS-3D-PREVIEW'
$TargetUrl = 'https://github.com/Dhanush7921/ROUTE-PLUS-3D-PREVIEW.git'
$ProjectRoot = $PSScriptRoot
if ((Split-Path $ProjectRoot -Leaf) -cne $ExpectedName) { throw "Run this only from a folder named $ExpectedName." }
Set-Location -LiteralPath $ProjectRoot
foreach ($Command in @('git', 'gh', 'node')) {
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) { throw "Install $Command, then run this helper again." }
}
function Run-Checked([string]$Program, [string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Program failed. Stopped without continuing." }
}
Run-Checked 'node' @('scripts/check-public.mjs')
Run-Checked 'node' @('tests/verify.mjs')
Run-Checked 'gh' @('auth', 'status')
# Refuse to inherit an ancestor repository. Initialize only inside this new folder.
if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot '.git'))) {
  Run-Checked 'git' @('init', '-b', 'main')
}
$GitRoot = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($GitRoot) -ne [IO.Path]::GetFullPath($ProjectRoot)) { throw 'Wrong repository root.' }
$Remotes = @(& git remote)
foreach ($Remote in $Remotes) {
  $Url = (& git remote get-url $Remote).Trim()
  $PushUrl = (& git remote get-url --push $Remote).Trim()
  if ($Url -cne $TargetUrl -or $PushUrl -cne $TargetUrl) { throw 'Unexpected remote found. No remote was changed and nothing was pushed.' }
}
if ($Remotes -notcontains 'origin') { Run-Checked 'git' @('remote','add','origin',$TargetUrl) }
$Branch = (& git symbolic-ref --short HEAD).Trim()
if ($Branch -cne 'main') { throw 'Expected main. No branch was renamed.' }
# A missing/inaccessible repository is never silently replaced.
& gh repo view $TargetRepo --json nameWithOwner 2>$null
if ($LASTEXITCODE -ne 0) { Run-Checked 'gh' @('repo','create',$TargetRepo,'--public','--description','Independent cinematic ROUTE+ offline preview') }
$ExistingRefs = @(& git ls-remote $TargetUrl)
if ($LASTEXITCODE -ne 0) { throw 'Cannot verify target repository. Nothing pushed.' }
if ($ExistingRefs.Count -gt 0) { throw 'Target repository already contains history. This first-publish helper refuses to overwrite or merge it.' }
Run-Checked 'git' @('add','--','index.html','404.html','.nojekyll','.gitignore','assets','scripts','tests','.github','README.md','REPORT.md','SOURCE.json','PUBLISH-3D-ONLY.ps1')
Run-Checked 'git' @('commit','-m','Build independent ROUTE+ cinematic nature preview')
# Enable Pages before the first push so the workflow can configure and deploy it.
& gh api "repos/$TargetRepo/pages" --silent 2>$null
if ($LASTEXITCODE -ne 0) { Run-Checked 'gh' @('api','--method','POST',"repos/$TargetRepo/pages",'-f','build_type=workflow') }
Run-Checked 'git' @('push',$TargetUrl,'HEAD:refs/heads/main')
Write-Host 'Pushed only ROUTE-PLUS-3D-PREVIEW. Open the Actions link below and wait for a successful deployment:'
Write-Host "https://github.com/$TargetRepo/actions"
Write-Host 'This helper does not claim the site is live. Check the successful deploy job for the actual URL.'
