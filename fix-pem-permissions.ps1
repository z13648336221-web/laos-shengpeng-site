$acl = Get-Acl 'F:\hengciwebsite\hengciglobal.pem'
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule('Administrator', 'Read', 'None', 'None', 'Allow')
$acl.SetAccessRule($rule)
Set-Acl 'F:\hengciwebsite\hengciglobal.pem' $acl
Write-Host "Permissions fixed successfully"