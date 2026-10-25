# ConcretePOA Analysis Engine Deployment Guide (Cloud Run)

This service runs the deterministic rules engine and open-source document reading (Tesseract + Poppler) on Google Cloud Run within the **$5/month hard budget** (scales to 0 instances when idle).

---

## 1. Prerequisites (PowerShell)

Ensure the Google Cloud CLI is authenticated and configured to the target project:

```powershell
gcloud auth login
gcloud config set project concretepoa-ai
```

---

## 2. Artifact Registry Cleanup Policy (Cost & Storage Safeguard)

To keep Artifact Registry storage minimal and retain only the 2 most recent container images:

Create `cleanup-policy.json`:
```json
[
  {
    "name": "keep-latest-two",
    "action": {"type": "Keep"},
    "mostRecentVersions": {
      "keepCount": 2
    }
  }
]
```

Apply to repo `poa` in `us-east1`:
```powershell
gcloud artifacts repositories set-cleanup-policies poa `
  --project=concretepoa-ai `
  --location=us-east1 `
  --policy=cleanup-policy.json
```

---

## 3. Deploy to Cloud Run (Private & Cost-Safe)

Run from `poa-engine/`:

```powershell
cd poa-engine

gcloud run deploy poa-engine `
  --source . `
  --region us-east1 `
  --project concretepoa-ai `
  --no-allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --cpu 1 `
  --memory 1Gi `
  --concurrency 4 `
  --timeout 120
```

---

## 4. Grant Invoker Permissions to Caller Service Account

Grant `roles/run.invoker` exclusively to `poa-api-caller`:

```powershell
gcloud run services add-iam-policy-binding poa-engine `
  --region us-east1 `
  --project concretepoa-ai `
  --member "serviceAccount:poa-api-caller@concretepoa-ai.iam.gserviceaccount.com" `
  --role roles/run.invoker
```

---

## 5. Generate Service Account Key for Next.js / Vercel

Run the following commands in PowerShell to create the credential key, encode it in base64, and safely delete the temporary file:

```powershell
# 1. Create temporary key file
gcloud iam service-accounts keys create key.json `
  --iam-account poa-api-caller@concretepoa-ai.iam.gserviceaccount.com `
  --project concretepoa-ai

# 2. Get the Cloud Run Service URL
$POA_URL = (gcloud run services describe poa-engine --region us-east1 --project concretepoa-ai --format 'value(status.url)')
Write-Host "POA_ENGINE_URL: $POA_URL"

# 3. Base64 encode the JSON key for env var injection
$KEY_B64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("key.json"))
Write-Host "GCP_SA_KEY_B64: $KEY_B64"

# 4. Remove local plain key file immediately
Remove-Item key.json -Force
```

Add these environment variables to `.env.local` and in your Vercel project settings:
- `POA_ENGINE_URL`: `<The Cloud Run Service URL>`
- `GCP_SA_KEY_B64`: `<The Base64 encoded string>`
