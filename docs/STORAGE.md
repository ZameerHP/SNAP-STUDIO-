# Database and photo storage allowances

Verified against official Cloudflare documentation on 27 September 2026.

This Site uses D1 for structured records and R2 for original uploaded images/videos. The Sites-managed account quota and billing entitlement are not exposed by the available project tools. Do not promise that Cloudflare's direct-account free allowances below are automatically allocated to this ChatGPT Site.

If deployed under your own Cloudflare account:

| Product | Published free allowance |
| --- | --- |
| D1 | 500 MB maximum per database; 5 GB total across the free account's databases |
| D1 reads | 5 million rows read per day |
| D1 writes | 100,000 rows written per day |
| R2 Standard | 10 GB-month of storage per month |
| R2 operations | 1 million Class A and 10 million Class B operations per month |
| R2 Internet egress | No egress charge |

D1 counts rows scanned, not visitors or just query count. Index writes also count. Free D1 operation limits can block queries until reset; storage ceilings block additional storage until addressed. R2 allowances concern average stored volume, not a fresh permanent 10 GB addition every month. Compute/hosting requests and other products have their own limits and costs.

Approximate illustration only: 10 GB could hold about 2,000 photos averaging 5 MB, or 1,000 photos averaging 10 MB, before allowing for videos/other stored files. Real capacity depends on actual media sizes and retention. This application's per-file upload maximum is 25 MB regardless of the storage product's higher object limits.

Structured records are usually much smaller than photographs, but no reliable client-count limit follows from GB alone: each client can have many messages, files, invoice items and audit entries. The current dashboard also needs pagination/query tuning before operating a very large studio catalogue.

Official references:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/r2/pricing/
