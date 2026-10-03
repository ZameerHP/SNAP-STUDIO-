# Connect the studio's Square account

This integration sends buyers to a Square-hosted checkout page. Production payments are processed for the seller account associated with the configured token/location. The studio can see those transactions in its Square Dashboard and supported Square app views; bank payouts follow Square's rules. No Stripe account or Stripe key is used.

## Values to configure

| Variable | Where to obtain it | Secret? |
| --- | --- | --- |
| `SQUARE_ACCESS_TOKEN` | Studio owner's Developer Console → application → Credentials → matching environment | Yes |
| `SQUARE_LOCATION_ID` | Same application's Locations section | No |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Same application's Webhooks → subscription → Signature Key | Yes |
| `SQUARE_ENVIRONMENT` | Set `sandbox` for testing, `production` for real payments | No |
| `SQUARE_WEBHOOK_URL` | Exact URL registered in the webhook subscription | No |
| `SITE_URL` | Canonical HTTPS site origin, without a path | No |

Current values for the two URLs:

```
SITE_URL=https://YOUR-SITE.vercel.app
SQUARE_WEBHOOK_URL=https://YOUR-SITE.vercel.app/api/webhooks/square
```

Add these to Sites runtime environment variables, mark the token and signature key as secrets, then redeploy. The studio dashboard deliberately has no secret-key text fields. The repository's `.env.example` documents names; local `.env` is for local development only. Do not put tokens into frontend variables, committed files, or chat messages.

## Set up the application

1. The studio owner signs in at https://developer.squareup.com/apps and creates/selects the studio application.
2. Start in Sandbox. Copy that environment's access token and an active location ID. Production later requires an activated seller account/location capable of card processing.
3. Add a webhook subscription using the exact callback URL above. Subscribe to `payment.created`, `payment.updated`, `refund.created`, and `refund.updated`. Copy its Signature Key. Use API version `2026-09-16`.
4. Configure server variables. Invoice currency must equal the Square location's currency. CAD is the website's default; verify the seller location rather than assuming its country.
5. The owner must deliberately enable public Site access before Square can deliver callbacks. Dashboard and private-media authorization still apply inside the app. Public access has not been enabled by this change.
6. Run Sandbox acceptance checks before switching the token, location, subscription/signature key, and environment together to Production.

A browser Application ID and application secret are not needed for this hosted-checkout implementation. They would be relevant to a different implementation such as embedded Web Payments SDK or multi-seller OAuth. For this custom single-seller integration, use an application created in the studio seller's account. An application belonging to an unrelated account needs a proper OAuth seller authorization flow, which this build does not implement.

## APIs and events

- Checkout API creates/reuses/cancels payment links with durable idempotency keys.
- Orders API checks the order's reference, amount, currency, state, and location.
- Payments API re-fetches payment status and cumulative refunds.
- Locations API verifies an active card-processing location and invoice currency.
- Webhook notifications are authenticated with HMAC-SHA256 over the exact URL plus raw body.
- Relevant OAuth permissions if later adding OAuth: `ORDERS_READ`, `ORDERS_WRITE`, `PAYMENTS_READ`, `PAYMENTS_WRITE`, `MERCHANT_PROFILE_READ`.

The server calculates all payable amounts from invoice data. A client cannot submit its own price. Repeat events cannot double-count a payment, and older refund notifications cannot reduce the recorded refund. Redirects never prove payment. Link requests are serialized per invoice; a retry recovers the same persisted Square request. Amount changes cancel the old Square order before a replacement link is issued.

Refunds are performed in Square. The webhook updates the website invoice's net paid balance. Unrelated in-person Square sales do not automatically pay website invoices. Website-generated PDF invoices are not Square Invoices API records.

## Acceptance tests still requiring credentials

- Deposit, remaining balance, and full payment.
- Failed/cancelled checkout and reopening a checkout.
- Multiple browser tabs/pay clicks; switch deposit/full amount.
- Interrupted API request and retry without creating a second order.
- Completed payment arriving before/after the browser return.
- Repeated callbacks and invalid signatures.
- Partial/full refunds, including out-of-order notifications.
- Wrong invoice currency and inactive/wrong Square location.

Local regression tests and a production build cannot replace these account-level checks. Production funds have not been tested or collected. Square processing fees apply; consult the seller's country-specific account pricing.

## Official documentation

- https://developer.squareup.com/docs/build-basics/access-tokens
- https://developer.squareup.com/reference/square/checkout-api/create-payment-link
- https://developer.squareup.com/docs/checkout-api/manage-checkout
- https://developer.squareup.com/docs/webhooks/step3validate
- https://developer.squareup.com/reference/square/payments-api/get-payment
- https://developer.squareup.com/docs/locations-api
