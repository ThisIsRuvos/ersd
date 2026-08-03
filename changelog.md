# Change Log: eRSD Release 1.5.3

### UI/UX Updates
- Updated RCTC Spreadsheet deprecation notice to state availability ends by Q1, 2027 (was late 2026)
- Updated hidden site version value to eRSD Version: 1.5.3

### Security
- Remediated ECR/Inspector findings for the kds-portal container image
- Upgraded vulnerable runtime dependencies including axios, multer, dompurify, nodemailer, lodash/lodash-es, tmp, qs, uuid, mermaid, body-parser, and related transitive packages
- Upgraded Angular packages to 20.3.26 to pick up security backports
- Moved esbuild to devDependencies and removed it from the runtime image (clears Go stdlib findings)
- Removed emoji-toolkit Composer/PHP vendor artifacts from the production image
- Added npm overrides to pin secure transitive dependency versions
- Scoped path-to-regexp and body-parser security pins to the 0.1.x / 1.x lines so NestJS Express 5 (router@2) keeps path-to-regexp@8 and no longer crashes with `pathRegexp.match is not a function`
- Upgraded Node.js runtime from 20.20.2 to 22.23.1 (OpenSSL 3.5.7) to address bundled OpenSSL findings
- Removed Node headers/docs from the runtime image

### Configuration Updates
- Switched Dockerfile to official node:22.23.1-trixie-slim base image
- Pruned npm/corepack from the runtime image and tightened production node_modules cleanup

---

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

---

# Change Log: eRSD Release 1.4.6

### UI/UX Updates
- Updated home page with comprehensive information about eRSD Version 3 as the current and recommended specification
- Added sunsetting information for eRSD Versions 1 and 2 (scheduled for January 31, 2026)
- Updated preview section wording to clarify that change previews do not include new trigger codes
- Fixed selection inconsistency issue where default version selection was set to v1 instead of v3
- Improved eRSD description and terminology throughout the application

### Dependencies
- Upgraded Angular framework from version 18 to version 20
- Updated @ng-bootstrap/ng-bootstrap from version 17 to version 19
- Updated various npm packages to resolve vulnerabilities
- Added @angular/cdk and @popperjs/core dependencies

### Configuration Updates
- Updated Dockerfile configuration
- Updated docker-compose.yml configuration

---
