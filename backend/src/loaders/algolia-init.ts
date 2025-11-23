import { LoaderOptions } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { algoliasearch } from "algoliasearch";
import * as path from "path";
import * as fs from "fs";

// Add debugging to see if this file is even loaded
console.log("[ALGOLIA LOADER] File is being loaded");

export default async function algoliaInitLoader({
  container,
}: LoaderOptions): Promise<void> {
  console.log("[ALGOLIA LOADER] Function is being executed");
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info("[ALGOLIA LOADER] Starting Algolia initialization");
  const algoliaApiKey = process.env.ALGOLIA_API_KEY;
  const algoliaAppId = process.env.ALGOLIA_APP_ID;

  if (!algoliaApiKey || !algoliaAppId) {
    logger.info("Algolia credentials not found, skipping index initialization");
    return;
  }

  try {
    const client = algoliasearch(algoliaAppId, algoliaApiKey);
    const indexName = "products";

    logger.info(`Checking if Algolia index '${indexName}' exists...`);

    // Try to get the index settings to check if it exists
    try {
      await client.getSettings({ indexName });
      logger.info(`Algolia index '${indexName}' already exists`);
    } catch (error: any) {
      // Index doesn't exist, create it
      if (error.status === 404) {
        logger.info(`Algolia index '${indexName}' not found, creating...`);

        // Load configuration from algolia-config.json
        const configPath = path.join(
          process.cwd(),
          "algolia-config.json"
        );

        let indexConfig = {};
        if (fs.existsSync(configPath)) {
          const configFile = fs.readFileSync(configPath, "utf-8");
          const config = JSON.parse(configFile);
          indexConfig = config.settings;
          logger.info("Loaded Algolia configuration from algolia-config.json");
        } else {
          logger.warn(
            "algolia-config.json not found, creating index with default settings"
          );
        }

        // Apply settings to create and configure the index
        await client.setSettings({
          indexName,
          indexSettings: indexConfig,
        });

        logger.info(
          `Algolia index '${indexName}' created and configured successfully`
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error(`Failed to initialize Algolia index: ${error}`);
    // Don't throw - we don't want to prevent the application from starting
  }
}
