
ROOT_DIR=$(git rev-parse --show-toplevel)
cd "$ROOT_DIR" || exit 1
PROPERTY_FILE=${1:-.env}

# https://stackoverflow.com/questions/19331497/set-environment-variables-from-file-of-key-value-pairs
# take all your .env settings and turn them into environment variables
export $(grep -v '^#' "${PROPERTY_FILE}" | xargs)

# Upload policy for Ngrok server if available, otherwise call dev environment.
NGROK_URL=$(curl --silent --show-error http://127.0.0.1:4040/api/tunnels | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p')
SERVICES_BASE_URL="${NGROK_URL:-services.dev.ecompliance.dev}"
SERVICES_BASE_URL="https://${SERVICES_BASE_URL}"


if [ -z "${INFRA_ENVIRONMENT_NAME}" ]; then
  echo "Environment name must be set. Exiting with error"
  exit 1
fi

# Print Parameters and Run Upgrade
echo "----------------------------------------------------"
echo "Running Azure AD Policy Updater"
echo "Updating Azure AD Tenant \"${AZURE_AD_TENANT_NAME}\" identified by ${AZURE_AD_TENANT_ID}"
echo "Using policies prefixed by B2C_1A_${INFRA_ENVIRONMENT_NAME}"
echo "Using client id ${AZURE_AD_CLIENT_ID}"
echo "Using callback url ${SERVICES_BASE_URL}"
echo "----------------------------------------------------"


pwsh infra/azuread/scripts/DeployToB2C.ps1 \
  -ClientID "${AZURE_AD_CLIENT_ID}" -ClientSecret "${AZURE_AD_CLIENT_SECRET}" \
  -TenantId "${AZURE_AD_TENANT_ID}" -TenantName "${AZURE_AD_TENANT_NAME}" \
  -ServicesBaseUrl "${SERVICES_BASE_URL}" \
  -EnvironmentName "${INFRA_ENVIRONMENT_NAME}" \
  -ProxyIdentityExperienceAppId "${PROXY_IDENTITY_EXPERIENCE_APP_ID}" \
  -IdentityExperienceAppId "${IDENTITY_EXPERIENCE_APP_ID}" \
  -B2CExtensionsObjectId "${B2C_EXTENSIONS_OBJECT_ID}" \
  -B2CExtensionsClientId "${B2C_EXTENSIONS_CLIENT_ID}" \
  -Folder "${ROOT_DIR}/infra/azuread/policies/" \
  -RequireEmailVerification "${AZURE_AD_REQUIRE_EMAIL_VERIFICATION}"
