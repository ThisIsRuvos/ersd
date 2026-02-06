#!/bin/bash

# ERSD Portal - Build and Deploy to ECR Script
# This script builds an AMD64 Docker image and pushes it to AWS ECR

set -e  # Exit on any error

# Configuration
AWS_PROFILE="sandbox"
AWS_REGION="us-east-1"
ECR_REGISTRY="703861148810.dkr.ecr.us-east-1.amazonaws.com"
IMAGE_NAME="kds/kds-portal"
VERSION="${1:-1.5.0}"  # Default to 1.5.0, or use first argument

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ERSD Portal Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Version: ${YELLOW}${VERSION}${NC}"
echo -e "Registry: ${YELLOW}${ECR_REGISTRY}${NC}"
echo ""

# Step 1: Build AMD64 image
echo -e "${GREEN}Step 1: Building AMD64 Docker image...${NC}"
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t ${IMAGE_NAME}:${VERSION} \
  --load .

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Step 2: Verify architecture
echo -e "${GREEN}Step 2: Verifying image architecture...${NC}"
ARCH=$(docker image inspect ${IMAGE_NAME}:${VERSION} --format '{{.Architecture}}')
if [ "$ARCH" != "amd64" ]; then
    echo -e "${RED}Error: Expected amd64 but got ${ARCH}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Architecture confirmed: ${ARCH}${NC}"
echo ""

# Step 3: Test the image locally
echo -e "${GREEN}Step 3: Testing image locally...${NC}"
TEST_CONTAINER="ersd-test-${VERSION}"

# Stop and remove any existing test container
docker stop ${TEST_CONTAINER} 2>/dev/null || true
docker rm ${TEST_CONTAINER} 2>/dev/null || true

# Start test container
docker run --rm -d --name ${TEST_CONTAINER} -p 3336:3333 ${IMAGE_NAME}:${VERSION}

# Wait for container to start
echo "Waiting for container to start..."
sleep 5

# Test health check endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3336/)
if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}Health check failed! HTTP ${HTTP_CODE}${NC}"
    docker logs ${TEST_CONTAINER}
    docker stop ${TEST_CONTAINER}
    exit 1
fi

echo -e "${GREEN}✓ Health check passed (HTTP ${HTTP_CODE})${NC}"

# Stop test container
docker stop ${TEST_CONTAINER}
echo ""

# Step 4: Tag for ECR
echo -e "${GREEN}Step 4: Tagging image for ECR...${NC}"
docker tag ${IMAGE_NAME}:${VERSION} ${ECR_REGISTRY}/${IMAGE_NAME}:${VERSION}
echo -e "${GREEN}✓ Image tagged${NC}"
echo ""

# Step 5: Login to ECR
echo -e "${GREEN}Step 5: Logging into ECR...${NC}"
export AWS_PROFILE=${AWS_PROFILE}
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

if [ $? -ne 0 ]; then
    echo -e "${RED}ECR login failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Logged into ECR${NC}"
echo ""

# Step 6: Push to ECR
echo -e "${GREEN}Step 6: Pushing image to ECR...${NC}"
docker push ${ECR_REGISTRY}/${IMAGE_NAME}:${VERSION}

if [ $? -ne 0 ]; then
    echo -e "${RED}Push to ECR failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Image pushed to ECR${NC}"
echo ""

# Step 7: Verify in ECR
echo -e "${GREEN}Step 7: Verifying image in ECR...${NC}"
IMAGE_INFO=$(aws ecr describe-images \
  --repository-name ${IMAGE_NAME} \
  --image-ids imageTag=${VERSION} \
  --region ${AWS_REGION} \
  --query 'imageDetails[0].{digest:imageDigest,size:imageSizeInBytes,pushed:imagePushedAt}' \
  --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Image verified in ECR${NC}"
    echo "$IMAGE_INFO" | jq .
else
    echo -e "${YELLOW}Warning: Could not verify image in ECR${NC}"
fi
echo ""

# Success summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Image: ${YELLOW}${ECR_REGISTRY}/${IMAGE_NAME}:${VERSION}${NC}"
echo -e "Architecture: ${YELLOW}linux/amd64${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Update ECS task definition to use this image"
echo -e "2. Deploy the updated task definition to your ECS service"
echo ""
