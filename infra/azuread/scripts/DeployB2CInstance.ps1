[CmdletBinding()]
Param(
    [Parameter(Mandatory=$true)][string]$Namespace,
    [Parameter(Mandatory=$true)][string]$ClientSecret
)

try {
    $json = Get-Content -Raw -Path "../environments/${Namespace}.json" | ConvertFrom-Json;
    $parameters = @{
        'ClientSecret' = $ClientSecret;
        'ClientId' = $json.AppRegistrationClientId;
        'TenantId' = $json.AzureAdTenantId;
        'TenantName' = $json.AzureAdTenantName;
        'ServicesBaseUrl' = $json.ServicesBaseUrl;
        'EnvironmentName' = $json.PolicyPrefix;
        'ProxyIdentityExperienceAppId' = $json.ProxyIdentityExperienceAppId;
        'IdentityExperienceAppId' = $json.IdentityExperienceAppId;
        'B2CExtensionsObjectId' = $json.B2CExtensionsObjectId;
        'B2CExtensionsClientId' = $json.B2CExtensionsClientId;
        'Folder' = "../policies/";
        'RequireEmailVerification' = $json.RequireEmailVerification;
    }
    ./DeployToB2C.ps1 @parameters
} catch {
    Write-Error -Message $_ -ErrorAction Stop
    exit 1
}

exit 0