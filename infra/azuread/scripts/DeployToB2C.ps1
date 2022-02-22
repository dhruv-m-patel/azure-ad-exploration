# This script is based on https://docs.microsoft.com/en-us/azure/active-directory-b2c/deploy-custom-policies-devops
#
[Cmdletbinding()]
Param(
    # pass in the client id and secret from azure
    [Parameter(Mandatory = $true)][string]$ClientID,
    [Parameter(Mandatory = $true)][string]$ClientSecret,
    # specify the tenant id and name; name is required for keeping policies up to date.
    [Parameter(Mandatory = $true)][string]$TenantId,
    [Parameter(Mandatory = $true)][string]$TenantName,
    # specify the where the files to upload are.
    [Parameter(Mandatory = $true)][string]$Folder,
    [Parameter(Mandatory = $true)][string]$ServicesBaseUrl,
    [Parameter(Mandatory = $true)][string]$EnvironmentName,
    [Parameter(Mandatory = $true)][string]$ProxyIdentityExperienceAppId,
    [Parameter(Mandatory = $true)][string]$IdentityExperienceAppId,
    [Parameter(Mandatory = $true)][string]$B2CExtensionsObjectId,
    [Parameter(Mandatory = $true)][string]$B2CExtensionsClientId,
    [Parameter(Mandatory = $false)][string]$RequireEmailVerification = 'True'
)

try {
    $body = @{grant_type = "client_credentials"; scope = "https://graph.microsoft.com/.default"; client_id = $ClientID; client_secret = $ClientSecret }

    $response = Invoke-RestMethod -Uri https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token -Method Post -Body $body
    $token = $response.access_token

    $headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
    $headers.Add("Content-Type", 'application/xml')
    $headers.Add("Authorization", 'Bearer ' + $token)

    # Get the list of files to upload
    $files = "TrustFrameworkBase.xml,TrustFrameworkLocalization.xml,TrustFrameworkExtensions.xml,TrustFrameworkJourneys.xml,SignUpOrSignin.xml,ProfileEdit.xml,PasswordReset.xml,Impersonation.xml,PasswordUpdate.xml";
    $filesArray = $files.Split(",")

    Foreach ($file in $filesArray) {

        $filePath = $Folder + $file.Trim()

        # Check if file exists
        $FileExists = Test-Path -Path $filePath -PathType Leaf

        if ($FileExists) {
            $policycontent = Get-Content $filePath

            # Change the content of the policy. For example, replace the tenant-name with your tenant name.
            $policycontent = $policycontent.Replace("yourtenant.onmicrosoft.com", $TenantName + ".onmicrosoft.com")
            $policycontent = $policycontent.Replace("ProxyIdentityExperienceFrameworkAppId", $ProxyIdentityExperienceAppId)
            $policycontent = $policycontent.Replace("https://your-services.com", $ServicesBaseUrl)
            $policycontent = $policycontent.Replace("IdentityExperienceFrameworkAppId",$IdentityExperienceAppId)
            $policycontent = $policycontent.Replace("B2C_1A_ENV", "B2C_1A_" + $EnvironmentName)
            $policycontent = $policycontent.Replace("B2CExtensionsObjectId", $B2CExtensionsObjectId)
            $policycontent = $policycontent.Replace("B2CExtensionsClientId", $B2CExtensionsClientId)
            $policycontent = $policycontent.Replace("AZURE_AD_REQUIRE_EMAIL_VERIFICATION", $RequireEmailVerification);


            # Get the policy name from the XML document
            $match = Select-String -InputObject $policycontent  -Pattern '(?<=\bPolicyId=")[^"]*'

            If ($match.matches.groups.count -ge 1) {
                $PolicyId = $match.matches.groups[0].value

                Write-Host "Uploading the" $PolicyId "policy..."

                $graphuri = 'https://graph.microsoft.com/beta/trustframework/policies/' + $PolicyId + '/$value'
                $response = Invoke-RestMethod -Uri $graphuri -Method Put -Body $policycontent -Headers $headers

                Write-Host "Policy" $PolicyId "uploaded successfully."
            }
        }
        else {
            $warning = "File " + $filePath + " couldn't be not found."
            Write-Warning -Message $warning
        }
    }
}
catch {
    Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__

    $_

    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.BaseStream.Position = 0
    $streamReader.DiscardBufferedData()
    $errResp = $streamReader.ReadToEnd()
    $streamReader.Close()

    $ErrResp

    exit 1
}

exit 0