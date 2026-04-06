# Change Log: eRSD Release 1.5.1

### Breaking Changes
- Removed eRSD Version 1 and Version 2 download functionality
- Removed v1/v2 UI components from specification download page
- Removed v1/v2 API endpoints; v1specification, v2specification, and v2supplemental now return HTTP 410 Gone
- Removed legacy FHIR Bundle endpoint (returns HTTP 410 Gone with migration guidance)
- Removed v2 change preview functionality
- Removed v1/v2 configuration properties and S3 key mappings
- Updated API documentation to reflect v3-only endpoints

### UI/UX Updates
- Simplified specification download page to only support Version 3
- Replaced version radio buttons with dedicated JSON and XML download buttons
- Removed Version 2 tab from change preview page
- Removed sunsetting alert banner from home page (no longer needed as v1/v2 are removed)
- Simplified home page messaging to reflect eRSD v3 as the sole actively supported specification
- Added RCTC Spreadsheet deprecation notice on the specification download page
- Updated footer version to 1.5.0

### Backend Changes
- Replaced v1/v2 specification endpoints with HTTP 410 Gone responses directing users to v3
- Added v1supplemental and v2supplemental Gone endpoints for completeness
- Added FHIR Bundle endpoint returning HTTP 410 Gone with migration instructions
- Added `/api/health` health check endpoint
- Removed v1/v2 S3 key resolution from JSON and XML download handlers
- Added version guard on S3 JSON/XML endpoints rejecting v1/v2 requests with 410 Gone
- Simplified markdown endpoint to only fetch v3 change preview summary
- Simplified change preview download handlers to only support v3 drafts
- Simplified release notes download to only support v3
- Added SPA fallback routing to serve index.html for non-API routes
- Fixed bug in handleExcelFileInput incorrectly resetting bundleFile instead of excelFile

### Configuration Updates
- Removed all v1/v2 related configuration properties from server-config.ts
- Removed v1/v2 configuration keys from default.json
- Removed serveV2Supplemental configuration flag
- Updated docker-compose.yml to remove v1/v2 environment variables and payload keys
- Updated auth certificate in default.json and docker-compose.yml

### Build & Dependencies
- Added `--legacy-peer-deps` flag to npm install in Dockerfile
- Updated package version from 1.4.6 to 1.5.0
- Upgraded nx from ^19.8.0 to ^22.1.3
- Upgraded @nx/nest from ^19.8.0 to ^22.1.3
- Upgraded @nx/workspace from ^19.8.0 to ^22.1.3
- Updated dev script to use `nx run-many` for parallel builds
- Added symlinks for assets and config directories
