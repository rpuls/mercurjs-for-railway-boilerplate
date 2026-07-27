
import { defineConfig, loadEnv } from '@medusajs/framework/utils'
import { resolveStorageConfig } from './src/config/storage'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())
const storage = resolveStorageConfig()
const stripeSecretKey = process.env.STRIPE_SECRET_API_KEY?.trim()
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
const stripePaymentsEnabled = Boolean(stripeSecretKey && stripeWebhookSecret)

// Mercur 1.5.3 constructs its Stripe payout client even when Stripe is not
// configured. A non-secret placeholder keeps the demo bootable; payout calls
// still fail closed at Stripe until the user supplies a real key.
if (!stripeSecretKey) {
  process.env.STRIPE_SECRET_API_KEY = "sk_test_mercur_demo_stripe_not_configured"
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(process.env.NODE_ENV === 'production' ? {
      databaseDriverOptions: {
        connection: {
          ssl: process.env.DATABASE_SSL === 'false'
            ? false
            : { rejectUnauthorized: false }
        }
      }
    } : {}),
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      // @ts-expect-error: vendorCors is not a valid config
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret'
    }
  },
  admin: {
    disable: true,
  },
  plugins: [
    {
      resolve: '@mercurjs/b2c-core',
      options: {}
    },
    {
      resolve: '@mercurjs/commission',
      options: {}
    },
    ...(process.env.ALGOLIA_API_KEY && process.env.ALGOLIA_APP_ID ? [{
      resolve: '@mercurjs/algolia',
      options: {
        apiKey: process.env.ALGOLIA_API_KEY,
        appId: process.env.ALGOLIA_APP_ID
      }
    }] : []),
    {
      resolve: '@mercurjs/reviews',
      options: {}
    },
    {
      resolve: '@mercurjs/requests',
      options: {}
    },
    {
      resolve: '@mercurjs/resend',
      options: {}
    }
  ],
  modules: [
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          ...(storage.kind === 's3' ? [{
            resolve: '@medusajs/medusa/file-s3',
            id: 's3',
            options: storage.options
          }] : [{
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${process.env.BACKEND_URL || 'http://localhost:9000'}/static`
            }
          }])
        ]
      }
    },
    ...(process.env.REDIS_URL ? [
      {
        resolve: '@medusajs/medusa/event-bus-redis',
        options: {
          redisUrl: process.env.REDIS_URL
        }
      },
      {
        resolve: '@medusajs/medusa/workflow-engine-redis',
        options: {
          redis: {
            url: process.env.REDIS_URL
          }
        }
      }
    ] : []),
    {
      resolve: '@medusajs/index'
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          ...(stripePaymentsEnabled ? [{
            resolve:
              '@mercurjs/payment-stripe-connect/providers/stripe-connect',
            id: 'stripe-connect',
            options: {
              apiKey: stripeSecretKey,
              webhookSecret: stripeWebhookSecret
            }
          }] : [])
        ]
      }
    },
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          ...(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL ? [{
            resolve: '@mercurjs/resend/providers/resend',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL
            }
          }] : []),
          {
            resolve: '@medusajs/medusa/notification-local',
            id: 'local',
            options: {
              channels: ['feed', 'seller_feed']
            }
          }
        ]
      }
    }
  ]
})
