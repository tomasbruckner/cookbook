# Build the Astro site to dist/
Write-Host "Building site..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed with exit code $LASTEXITCODE" }

# Deploy static assets to Cloudflare Workers
Write-Host "Deploying to Cloudflare Workers..."
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { throw "deploy failed with exit code $LASTEXITCODE" }
