import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { IApiKeyModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const apiKeyModuleService: IApiKeyModuleService = req.scope.resolve(Modules.API_KEY);
    const apiKeys = await apiKeyModuleService.listApiKeys();
    const publishableKeys = apiKeys.filter((apiKey) => apiKey.type === 'publishable');
    const defaultApiKey =
      publishableKeys.find((apiKey) =>
        ['Webshop', 'Default Publishable API Key', 'Default publishable key'].includes(apiKey.title)
      ) ?? publishableKeys[0];
    if (!defaultApiKey) {
      res.json({});
    } else {
      res.json({ publishableApiKey: defaultApiKey.token });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
