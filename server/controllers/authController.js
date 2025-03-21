import "dotenv/config";
import { Composio } from "composio-core";
import { OpenAIToolSet } from "composio-core";

async function getURL(api_key) {
    try {
        const toolset = new OpenAIToolSet({ apiKey: api_key });

        const integration = await toolset.integrations.get({
            integrationId: "ff99cc1f-2507-4e50-b8e1-26906d514407",
        });
        const expectedInputFields = await toolset.integrations.getRequiredParams(
            integration.id
        );
        // Collect auth params from your users
        console.log(expectedInputFields);
        const connectedAccount = await toolset.connectedAccounts.initiate({
            integrationId: integration.id,
            entityId: "default",
        });

        // connected account properties:
        // connectionStatus (string), connectedAccountId (string), redirectUrl (string | null)
        console.log(connectedAccount.redirectUrl);

        return connectedAccount.redirectUrl;
    } catch (error) {
        console.error("Error in getURL:", error);
        throw error;
    }
}

export const googleAuthentication = async (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: "API key is missing"
            });
        }

        console.log("Starting authentication with API key:", apiKey);

        const composio = new Composio({ apiKey });
        
        // Verify API key is valid before proceeding
        try {
            const app = await composio.apps.get({ appKey: "gmail" });
            if (!app) {
                throw new Error("Failed to fetch Gmail app");
            }
            console.log("Gmail app fetched successfully:", app);

            const integration = await composio.integrations.create({
                appId: app.appId,
                authConfig: {
                    client_id: "96725622524-0v0n8jmolg92jf6lcciqnjqb0aljdoed.apps.googleusercontent.com",
                    client_secret: "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",
                    oauth_redirect_uri: "https://backend.composio.dev/api/v1/auth-apps/add",
                    scopes: "https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/userinfo.profile",
                },
                authScheme: "OAUTH2",
                forceNewIntegration: true,
                name: "gmail_1",
                useComposioAuth: false,
            });

            console.log("Integration created successfully:", integration);

            const url = await getURL(apiKey);
            if (!url) {
                throw new Error("Failed to generate authorization URL");
            }

            return res.status(200).json({
                success: true,
                url: url
            });

        } catch (error) {
            console.error("API operation failed:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to process API key"
            });
        }

    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message || "Unknown error occurred"
        });
    }
};
