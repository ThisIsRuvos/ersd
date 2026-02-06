# ERSD Portal - Deployment Guide

## Quick Deploy

To build and deploy the current version to ECR:

```bash
./deploy-to-ecr.sh
```

To deploy a specific version:

```bash
./deploy-to-ecr.sh 1.5.1
```

## What the Script Does

The `deploy-to-ecr.sh` script performs the following steps:

1. **Build** - Builds an AMD64 Docker image (compatible with ECS x86_64 instances)
2. **Verify** - Confirms the image architecture is AMD64
3. **Test** - Runs the container locally and tests the health check endpoint
4. **Tag** - Tags the image for AWS ECR
5. **Login** - Authenticates with AWS ECR
6. **Push** - Pushes the image to ECR
7. **Verify** - Confirms the image is available in ECR

## Prerequisites

- Docker with buildx support
- AWS CLI configured with `sandbox` profile
- Permissions to push to ECR repository `kds/kds-portal`

## Configuration

The script uses these default values (edit the script to change):

```bash
AWS_PROFILE="sandbox"
AWS_REGION="us-east-1"
ECR_REGISTRY="703861148810.dkr.ecr.us-east-1.amazonaws.com"
IMAGE_NAME="kds/kds-portal"
```

## Manual Build Process

If you need to build manually without the script:

```bash
# 1. Build AMD64 image
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t kds/kds-portal:1.5.0 \
  --load .

# 2. Test locally
docker run --rm -d --name ersd-test -p 3333:3333 kds/kds-portal:1.5.0
curl -I http://localhost:3333/
docker stop ersd-test

# 3. Tag for ECR
docker tag kds/kds-portal:1.5.0 \
  703861148810.dkr.ecr.us-east-1.amazonaws.com/kds/kds-portal:1.5.0

# 4. Login to ECR
export AWS_PROFILE=sandbox
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  703861148810.dkr.ecr.us-east-1.amazonaws.com

# 5. Push to ECR
docker push 703861148810.dkr.ecr.us-east-1.amazonaws.com/kds/kds-portal:1.5.0
```

## Deploying to ECS

After pushing to ECR:

1. Go to **ECS Console** → **Task Definitions** → **ERSD-PORTAL**
2. Create a new revision (or update existing revision 82)
3. Update the container image to: `703861148810.dkr.ecr.us-east-1.amazonaws.com/kds/kds-portal:1.5.0`
4. Save the task definition
5. Update the **ERSD-PORTAL** service to use the new task definition revision
6. Monitor deployment in the ECS Events tab

## Troubleshooting

### Architecture Mismatch Error

If you see: `no matching manifest for linux/amd64`

**Solution**: The image was built for ARM64 instead of AMD64. Always use:
```bash
docker buildx build --platform linux/amd64 ...
```

### Health Check Failures

If ECS tasks fail health checks:

**Check**: Verify the root path returns 200 OK:
```bash
docker run --rm -d --name test -p 3333:3333 kds/kds-portal:1.5.0
curl -I http://localhost:3333/
docker stop test
```

The response should be `HTTP/1.1 200 OK`.

### ECR Permission Denied

**Solution**: Ensure your AWS profile has these permissions:
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecr:PutImage`
- `ecr:BatchCheckLayerAvailability`

## Version History

### 1.5.0 (Current)
- Fixed health check (root path `/` returns 200 OK)
- Built for AMD64 architecture (compatible with ECS x86_64)
- Upgraded NX to version 22 (compatible with Angular 20)

### 1.4.6
- Previous stable version
