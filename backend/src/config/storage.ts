type Environment = Record<string, string | undefined>

const S3_KEYS = [
  "S3_FILE_URL",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ENDPOINT",
] as const

const MINIO_KEYS = [
  "MINIO_ENDPOINT",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_BUCKET",
] as const

const present = (env: Environment, keys: readonly string[]) =>
  keys.filter((key) => Boolean(env[key]?.trim()))

const absoluteHttpUrl = (value: string, name: string) => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL with a hostname`)
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
    throw new Error(`${name} must be an absolute HTTP(S) URL with a hostname`)
  }
  return url.toString().replace(/\/$/, "")
}

const booleanValue = (value: string | undefined, name: string) => {
  if (value === undefined || value === "") return undefined
  if (value === "true") return true
  if (value === "false") return false
  throw new Error(`${name} must be either "true" or "false"`)
}

export type StorageConfig =
  | { kind: "local" }
  | {
      kind: "s3"
      options: {
        file_url: string
        access_key_id: string
        secret_access_key: string
        region: string
        bucket: string
        endpoint: string
        acl: false | string
        additional_client_config?: { forcePathStyle: boolean }
      }
    }

export function resolveStorageConfig(
  env: Environment = process.env,
): StorageConfig {
  const s3Present = present(env, [...S3_KEYS, "S3_FORCE_PATH_STYLE", "S3_ACL"])
  const minioPresent = present(env, MINIO_KEYS)

  if (s3Present.length && minioPresent.length) {
    throw new Error(
      "Do not mix S3_* and legacy MINIO_* storage variables. Configure one complete storage contract.",
    )
  }

  if (s3Present.length) {
    const missing = S3_KEYS.filter((key) => !env[key]?.trim())
    if (missing.length) {
      throw new Error(
        `Incomplete S3 configuration. Missing: ${missing.join(", ")}`,
      )
    }
    const aclValue = env.S3_ACL?.trim()
    if (aclValue && aclValue.toLowerCase() !== "false") {
      throw new Error(
        'S3_ACL must be "false" for Railway Bucket (ACL headers are unsupported)',
      )
    }
    const forcePathStyle = booleanValue(
      env.S3_FORCE_PATH_STYLE,
      "S3_FORCE_PATH_STYLE",
    )
    return {
      kind: "s3",
      options: {
        file_url: absoluteHttpUrl(env.S3_FILE_URL!, "S3_FILE_URL"),
        access_key_id: env.S3_ACCESS_KEY_ID!,
        secret_access_key: env.S3_SECRET_ACCESS_KEY!,
        region: env.S3_REGION!,
        bucket: env.S3_BUCKET!,
        endpoint: absoluteHttpUrl(env.S3_ENDPOINT!, "S3_ENDPOINT"),
        acl: false,
        ...(forcePathStyle === undefined
          ? {}
          : { additional_client_config: { forcePathStyle } }),
      },
    }
  }

  if (minioPresent.length) {
    const required = MINIO_KEYS.slice(0, 3)
    const missing = required.filter((key) => !env[key]?.trim())
    if (missing.length) {
      throw new Error(
        `Incomplete legacy MINIO configuration. Missing: ${missing.join(", ")}`,
      )
    }
    const rawEndpoint = env.MINIO_ENDPOINT!
    const endpoint = absoluteHttpUrl(
      rawEndpoint.includes("://") ? rawEndpoint : `https://${rawEndpoint}`,
      "MINIO_ENDPOINT",
    )
    const bucket = env.MINIO_BUCKET?.trim() || "medusa-media"
    return {
      kind: "s3",
      options: {
        file_url: `${endpoint}/${bucket}`,
        access_key_id: env.MINIO_ACCESS_KEY!,
        secret_access_key: env.MINIO_SECRET_KEY!,
        region: "us-east-1",
        bucket,
        endpoint,
        acl: false,
        additional_client_config: { forcePathStyle: true },
      },
    }
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "Production storage is not configured. Provide the complete S3_* contract; refusing ephemeral local storage.",
    )
  }

  return { kind: "local" }
}
