# Build the Astro site to dist/
Write-Host "Building site..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed with exit code $LASTEXITCODE" }

# Serve dist/ locally the way Cloudflare Workers will
Write-Host "Starting local preview server..."
npx wrangler dev
