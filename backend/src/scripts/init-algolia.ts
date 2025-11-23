import { algoliasearch } from "algoliasearch";
import * as path from "path";
import * as fs from "fs";

async function initAlgolia() {
  const algoliaApiKey = process.env.ALGOLIA_API_KEY;
  const algoliaAppId = process.env.ALGOLIA_APP_ID;

  if (!algoliaApiKey || !algoliaAppId) {
    console.log("[ALGOLIA] Credentials not found, skipping index initialization");
    return;
  }

  try {
    const client = algoliasearch(algoliaAppId, algoliaApiKey);
    const indexName = "products";

    console.log(`[ALGOLIA] Checking if index '${indexName}' exists...`);

    // Try to get the index settings to check if it exists
    try {
      await client.getSettings({ indexName });
      console.log(`[ALGOLIA] Index '${indexName}' already exists`);
    } catch (error: any) {
      // Index doesn't exist, create it
      if (error.status === 404) {
        console.log(`[ALGOLIA] Index '${indexName}' not found, creating...`);

        // Load configuration from algolia-config.json
        const configPath = path.join(process.cwd(), "algolia-config.json");

        let indexConfig = {};
        if (fs.existsSync(configPath)) {
          const configFile = fs.readFileSync(configPath, "utf-8");
          const config = JSON.parse(configFile);
          indexConfig = config.settings;
          console.log("[ALGOLIA] Loaded configuration from algolia-config.json");
        } else {
          console.warn(
            "[ALGOLIA] algolia-config.json not found, creating index with default settings"
          );
        }

        // Apply settings to create and configure the index
        await client.setSettings({
          indexName,
          indexSettings: indexConfig,
        });

        console.log(
          `[ALGOLIA] Index '${indexName}' created and configured successfully`
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`[ALGOLIA] Failed to initialize index: ${error}`);
    // Don't throw - we don't want to prevent the application from starting
  }
}

initAlgolia()
  .then(() => {
    console.log("[ALGOLIA] Initialization complete");
  })
  .catch((error) => {
    console.error("[ALGOLIA] Initialization failed:", error);
  });
