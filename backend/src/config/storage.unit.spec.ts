import { resolveStorageConfig } from "./storage"

const complete = {
  NODE_ENV: "production",
  S3_FILE_URL: "https://media.example.com",
  S3_ACCESS_KEY_ID: "access",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_REGION: "auto",
  S3_BUCKET: "bucket-id",
  S3_ENDPOINT: "https://storage.example.com",
}

describe("resolveStorageConfig", () => {
  it("uses Railway-compatible defaults without ACL or path-style headers", () => {
    expect(resolveStorageConfig(complete)).toMatchObject({
      kind: "s3",
      options: { acl: false, bucket: "bucket-id" },
    })
    expect((resolveStorageConfig(complete) as any).options)
      .not.toHaveProperty("additional_client_config")
  })

  it("rejects partial S3 configuration", () => {
    expect(() =>
      resolveStorageConfig({ NODE_ENV: "production", S3_BUCKET: "bucket" }),
    ).toThrow("Incomplete S3 configuration")
  })

  it("rejects a missing proxy hostname", () => {
    expect(() =>
      resolveStorageConfig({ ...complete, S3_FILE_URL: "https://" }),
    ).toThrow("S3_FILE_URL must be an absolute HTTP(S) URL with a hostname")
  })

  it("rejects mixed new and legacy variables", () => {
    expect(() =>
      resolveStorageConfig({ ...complete, MINIO_ENDPOINT: "minio:9000" }),
    ).toThrow("Do not mix S3_* and legacy MINIO_*")
  })

  it("maps a complete legacy MinIO contract to the stock S3 provider", () => {
    expect(
      resolveStorageConfig({
        NODE_ENV: "production",
        MINIO_ENDPOINT: "minio.example.com",
        MINIO_ACCESS_KEY: "access",
        MINIO_SECRET_KEY: "secret",
        MINIO_BUCKET: "legacy",
      }),
    ).toMatchObject({
      kind: "s3",
      options: {
        endpoint: "https://minio.example.com",
        file_url: "https://minio.example.com/legacy",
        bucket: "legacy",
        acl: false,
        additional_client_config: { forcePathStyle: true },
      },
    })
  })
})
