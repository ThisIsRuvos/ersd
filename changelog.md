# Change Log: eRSD Release 1.5.0

### Breaking Changes
- Removed eRSD Version 1 and Version 2 download functionality
- Removed v1/v2 UI components from specification download page
- Removed v1/v2 API endpoints (v1specification, v2specification, v2supplemental)
- Removed v2 change preview functionality
- Removed v1/v2 configuration properties
- Updated API documentation to reflect v3-only endpoints

### UI/UX Updates
- Removed Version 1 and Version 2 radio button options from specification download page
- Removed Version 2 tab from change preview page
- Removed sunsetting alert banner from home page (no longer needed as v1/v2 are removed)
- Simplified specification download interface to only support Version 3
- Updated API documentation to show only Version 3 endpoints

### Backend Changes
- Removed v1specification and v2specification API endpoints
- Removed v2supplemental API endpoint
- Removed v1/v2 release notes download handlers
- Removed v1/v2 S3 key configuration and handling
- Removed v2 draft change preview functionality
- Simplified download controller to only handle Version 3 specifications

### Configuration Updates
- Removed all v1/v2 related configuration properties from server-config.ts
- Removed v1/v2 configuration keys from default.json
- Updated docker-compose.yml to remove v1/v2 environment variables
- Removed serveV2Supplemental configuration flag

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

