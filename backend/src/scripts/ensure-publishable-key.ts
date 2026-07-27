import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  createPublishableKey,
  createSalesChannel,
} from "./seed/seed-functions"

export default async function ensurePublishableKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannel = await createSalesChannel(container)
  const key = await createPublishableKey(container, salesChannel.id)

  logger.info(`Publishable API key is ready: ${key.id}`)
}
