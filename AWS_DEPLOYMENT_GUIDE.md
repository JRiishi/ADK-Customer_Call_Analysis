# Cust-AI AWS Deployment Guide

**Version:** 1.0  
**Last Updated:** February 2026  
**Estimated Time:** 2-3 hours (first deployment)

---

## Table of Contents

1. [Prerequisites & Local Setup](#1-prerequisites--local-setup)
2. [Backend Dockerization](#2-backend-dockerization)
3. [Local Docker Testing](#3-local-docker-testing)
4. [AWS ECR Setup](#4-aws-ecr-setup)
5. [AWS ECS Cluster Setup](#5-aws-ecs-cluster-setup)
6. [ECS Task Definition](#6-ecs-task-definition)
7. [Application Load Balancer (ALB)](#7-application-load-balancer-alb)
8. [ECS Service Creation](#8-ecs-service-creation)
9. [Backend Verification](#9-backend-verification)
10. [Frontend S3 Deployment](#10-frontend-s3-deployment)
11. [CloudFront CDN Setup](#11-cloudfront-cdn-setup)
12. [Final Validation](#12-final-validation)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites & Local Setup

### 1.1 Required Tools Installation

**On macOS:**

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
rm AWSCLIV2.pkg

# Verify AWS CLI
aws --version
# Expected output: aws-cli/2.x.x Python/3.x.x Darwin/...

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/
# OR via Homebrew:
brew install --cask docker

# Start Docker Desktop manually from Applications
# Wait until Docker icon in menu bar shows "Docker Desktop is running"

# Verify Docker
docker --version
# Expected output: Docker version 24.x.x or higher

docker ps
# Expected output: CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
# (empty table is OK, no error message means Docker is running)

# Install Node.js (for frontend build)
brew install node@20

# Verify Node
node --version
# Expected output: v20.x.x

npm --version
# Expected output: 10.x.x
```

### 1.2 AWS Account Setup

**Step 1: Create AWS Account (if needed)**
- Go to: https://aws.amazon.com/
- Click "Create an AWS Account"
- Complete signup with credit card (required)

**Step 2: Create IAM User (DO NOT use root account)**

1. Log into AWS Console: https://console.aws.amazon.com/
2. Search "IAM" in the top search bar → Click "IAM"
3. Left sidebar → Click "Users"
4. Click "Create user"
5. User name: `cust-ai-deployer`
6. Check ✓ "Provide user access to the AWS Management Console"
7. Select "I want to create an IAM user"
8. Set a password
9. Uncheck "User must create a new password at next sign-in"
10. Click "Next"
11. Select "Attach policies directly"
12. Search and check these policies:
    - `AmazonEC2ContainerRegistryFullAccess`
    - `AmazonECS_FullAccess`
    - `ElasticLoadBalancingFullAccess`
    - `AmazonS3FullAccess`
    - `CloudFrontFullAccess`
    - `CloudWatchLogsFullAccess`
    - `AmazonBedrockFullAccess`
    - `AmazonTranscribeFullAccess`
    - `AmazonVPCFullAccess`
13. Click "Next" → Click "Create user"
14. **IMPORTANT:** Download the CSV or copy credentials now

**Step 3: Create Access Keys for CLI**

1. Click on user `cust-ai-deployer`
2. Tab "Security credentials"
3. Scroll to "Access keys" → Click "Create access key"
4. Select "Command Line Interface (CLI)"
5. Check ✓ "I understand the above recommendation..."
6. Click "Next" → Click "Create access key"
7. **CRITICAL:** Copy both:
   - Access key ID: `AKIA...`
   - Secret access key: `...` (shown only once)
8. Click "Download .csv file" as backup

### 1.3 Configure AWS CLI

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID [None]: AKIA... (paste your access key)
AWS Secret Access Key [None]: ... (paste your secret key)
Default region name [None]: us-east-1
Default output format [None]: json
```

**Verify configuration:**
```bash
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/cust-ai-deployer"
}
```

**If you see an error:** Your credentials are wrong. Run `aws configure` again.

### 1.4 Select AWS Region

This guide uses `us-east-1` (N. Virginia). If you need a different region:
- Replace `us-east-1` with your region in ALL commands
- Verify Bedrock availability: https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-regions.html

**Set region as environment variable (for this terminal session):**
```bash
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
```

### 1.5 Navigate to Project

```bash
cd /Users/riishabhjain/Desktop/Project\ Cust-AI

# Verify you're in the right place
ls -la
# Expected: Should see backend/ and frontend/ directories
```

---

## 2. Backend Dockerization

### 2.1 Create Dockerfile

```bash
cat > backend/Dockerfile << 'EOF'
# ===========================================
# Cust-AI Backend Dockerfile
# ===========================================

# Stage 1: Base image with Python
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies
# - ffmpeg: Required for audio processing (pydub)
# - curl: For healthchecks
# - gcc/build-essential: For compiling Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first (Docker layer caching optimization)
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces image size
# --timeout increased for large packages
RUN pip install --no-cache-dir --timeout 120 -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY scripts/ ./scripts/

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port (documentation only, actual port binding at runtime)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run uvicorn
# --host 0.0.0.0: Listen on all interfaces (required for Docker)
# --port 8000: Application port
# --workers 2: Number of worker processes (adjust based on CPU)
# --timeout-keep-alive 120: Keep connections alive for WebSockets
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--timeout-keep-alive", "120"]
EOF
```

### 2.2 Create .dockerignore

```bash
cat > backend/.dockerignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.venv/
ENV/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Git
.git/
.gitignore

# Testing
.pytest_cache/
.coverage
htmlcov/

# Environment files (secrets must NOT be in image)
.env
.env.*
!.env.example

# Logs
*.log
logs/

# Uploads (will be mounted/managed separately)
uploads/*
!uploads/.gitkeep

# Documentation
*.md
docs/

# Legacy code not needed in production
legacy_src/
EOF
```

### 2.3 Verify Backend Has Health Endpoint

Check if health endpoint exists:

```bash
grep -r "health" backend/app/main.py
```

If NOT found, add health endpoint. Open `backend/app/main.py` and ensure this exists:

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cust-ai-backend"}
```

### 2.4 Create Environment Template

```bash
cat > backend/.env.production.example << 'EOF'
# ===========================================
# Cust-AI Production Environment Variables
# ===========================================
# THESE VALUES ARE INJECTED VIA ECS, NOT BAKED INTO IMAGE

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/custai?retryWrites=true&w=majority
DATABASE_NAME=custai

# AWS Configuration (ECS Task Role provides credentials automatically)
AWS_REGION=us-east-1

# AWS Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# AWS Transcribe
TRANSCRIBE_S3_BUCKET=cust-ai-audio-uploads
TRANSCRIBE_S3_PREFIX=transcribe-input/

# Application Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-cloudfront-domain.cloudfront.net

# WebSocket Settings
WS_HEARTBEAT_INTERVAL=30
EOF
```

---

## 3. Local Docker Testing

### 3.1 Build Docker Image Locally

```bash
cd /Users/riishabhjain/Desktop/Project\ Cust-AI/backend

# Build image with tag
docker build -t cust-ai-backend:local .
```

**Expected output (last lines):**
```
 => exporting to image
 => => naming to docker.io/library/cust-ai-backend:local
```

**If build fails:**
- Read the error message carefully
- Most common issues:
  - Missing `requirements.txt` → Check file exists
  - Package installation errors → Check package versions in requirements.txt
  - Network errors → Check internet connection

### 3.2 Create Local Test Environment File

```bash
cat > backend/.env.local << 'EOF'
MONGODB_URI=mongodb://localhost:27017/custai_test
DATABASE_NAME=custai_test
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=http://localhost:5173
EOF
```

**IMPORTANT:** Replace `your_access_key_here` and `your_secret_key_here` with actual values.

### 3.3 Run Container Locally

```bash
# Run container
docker run -d \
  --name cust-ai-backend-test \
  -p 8000:8000 \
  --env-file .env.local \
  cust-ai-backend:local
```

### 3.4 Verify Container is Running

```bash
# Check container status
docker ps

# Expected output shows container with STATUS "Up X seconds"
# CONTAINER ID   IMAGE                    STATUS          PORTS
# abc123...      cust-ai-backend:local    Up 10 seconds   0.0.0.0:8000->8000/tcp
```

**If container is not listed:**
```bash
# Check stopped containers
docker ps -a

# View logs for errors
docker logs cust-ai-backend-test
```

### 3.5 Test Health Endpoint

```bash
# Wait 10 seconds for startup, then:
curl http://localhost:8000/health
```

**Expected output:**
```json
{"status":"healthy","service":"cust-ai-backend"}
```

### 3.6 Test API Docs

Open in browser: http://localhost:8000/docs

**Expected:** FastAPI Swagger UI should load.

### 3.7 Cleanup Local Test

```bash
# Stop and remove container
docker stop cust-ai-backend-test
docker rm cust-ai-backend-test
```

---

## 4. AWS ECR Setup

### 4.1 Create ECR Repository

**Via AWS Console:**

1. Go to: https://console.aws.amazon.com/ecr/
2. Ensure region is `us-east-1` (top-right dropdown)
3. Click "Get Started" or "Create repository"
4. Repository name: `cust-ai-backend`
5. Image tag mutability: `Mutable` (allows overwriting `latest` tag)
6. Scan on push: `Enabled` (security scanning)
7. Click "Create repository"

**Via CLI (alternative):**

```bash
aws ecr create-repository \
    --repository-name cust-ai-backend \
    --image-scanning-configuration scanOnPush=true \
    --region us-east-1
```

**Expected output:**
```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-east-1:123456789012:repository/cust-ai-backend",
        "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/cust-ai-backend",
        ...
    }
}
```

### 4.2 Get Repository URI

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: $AWS_ACCOUNT_ID"

# Construct repository URI
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/cust-ai-backend"
echo "Repository URI: $ECR_REPO"
```

### 4.3 Authenticate Docker to ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
```

**Expected output:**
```
Login Succeeded
```

**If login fails:**
- Error "no basic auth credentials" → Run the command exactly as shown
- Error "denied" → Check IAM permissions include `AmazonEC2ContainerRegistryFullAccess`

### 4.4 Tag and Push Image

```bash
cd /Users/riishabhjain/Desktop/Project\ Cust-AI/backend

# Tag the local image for ECR
docker tag cust-ai-backend:local ${ECR_REPO}:latest
docker tag cust-ai-backend:local ${ECR_REPO}:v1.0.0

# Push both tags
docker push ${ECR_REPO}:latest
docker push ${ECR_REPO}:v1.0.0
```

**Expected output (for each push):**
```
The push refers to repository [123456789012.dkr.ecr.us-east-1.amazonaws.com/cust-ai-backend]
abc123: Pushed
def456: Pushed
latest: digest: sha256:... size: 1234
```

### 4.5 Verify Image in ECR

**Via Console:**
1. Go to: https://console.aws.amazon.com/ecr/
2. Click `cust-ai-backend` repository
3. Verify images `latest` and `v1.0.0` are listed

**Via CLI:**
```bash
aws ecr describe-images --repository-name cust-ai-backend --region us-east-1
```

---

## 5. AWS ECS Cluster Setup

### 5.1 Create ECS Cluster

**Via AWS Console:**

1. Go to: https://console.aws.amazon.com/ecs/
2. Ensure region is `us-east-1`
3. Left sidebar → "Clusters"
4. Click "Create cluster"
5. Cluster name: `cust-ai-cluster`
6. Infrastructure: Select **AWS Fargate (serverless)** ONLY
   - Uncheck "Amazon EC2 instances" if checked
7. Monitoring: Check ✓ "Use Container Insights"
8. Click "Create"

**Wait for status: "Active"** (usually 30-60 seconds)

**Via CLI (alternative):**

```bash
aws ecs create-cluster \
    --cluster-name cust-ai-cluster \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    --settings name=containerInsights,value=enabled \
    --region us-east-1
```

### 5.2 Create CloudWatch Log Group

```bash
aws logs create-log-group \
    --log-group-name /ecs/cust-ai-backend \
    --region us-east-1
```

Set log retention (optional, saves costs):
```bash
aws logs put-retention-policy \
    --log-group-name /ecs/cust-ai-backend \
    --retention-in-days 30 \
    --region us-east-1
```

---

## 6. ECS Task Definition

### 6.1 Create ECS Task Execution Role

This role allows ECS to pull images from ECR and write logs to CloudWatch.

**Via Console:**

1. Go to: https://console.aws.amazon.com/iam/
2. Left sidebar → "Roles"
3. Click "Create role"
4. Trusted entity type: "AWS service"
5. Use case: Select "Elastic Container Service"
6. Use case dropdown: Select "Elastic Container Service Task"
7. Click "Next"
8. Search and check: `AmazonECSTaskExecutionRolePolicy`
9. Click "Next"
10. Role name: `ecsTaskExecutionRole`
11. Click "Create role"

### 6.2 Create ECS Task Role

This role allows your container to access AWS services (Bedrock, Transcribe, S3).

**Via Console:**

1. Still in IAM → "Roles" → "Create role"
2. Trusted entity type: "AWS service"
3. Use case: "Elastic Container Service"
4. Use case dropdown: "Elastic Container Service Task"
5. Click "Next"
6. Search and check these policies:
   - `AmazonBedrockFullAccess`
   - `AmazonTranscribeFullAccess`
   - `AmazonS3FullAccess`
7. Click "Next"
8. Role name: `cust-ai-task-role`
9. Click "Create role"

### 6.3 Create Task Definition JSON

```bash
cd /Users/riishabhjain/Desktop/Project\ Cust-AI

# Get your account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

cat > ecs-task-definition.json << EOF
{
    "family": "cust-ai-backend",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/cust-ai-task-role",
    "containerDefinitions": [
        {
            "name": "cust-ai-backend",
            "image": "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/cust-ai-backend:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 8000,
                    "hostPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "ENVIRONMENT", "value": "production"},
                {"name": "LOG_LEVEL", "value": "INFO"},
                {"name": "AWS_REGION", "value": "us-east-1"},
                {"name": "BEDROCK_MODEL_ID", "value": "anthropic.claude-3-sonnet-20240229-v1:0"},
                {"name": "TRANSCRIBE_S3_BUCKET", "value": "cust-ai-audio-uploads"},
                {"name": "TRANSCRIBE_S3_PREFIX", "value": "transcribe-input/"},
                {"name": "CORS_ORIGINS", "value": "*"}
            ],
            "secrets": [
                {
                    "name": "MONGODB_URI",
                    "valueFrom": "arn:aws:ssm:us-east-1:${AWS_ACCOUNT_ID}:parameter/cust-ai/mongodb-uri"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/cust-ai-backend",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
                "interval": 30,
                "timeout": 10,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF
```

**CPU/Memory Explanation:**
- `cpu: 1024` = 1 vCPU (sufficient for moderate load)
- `memory: 2048` = 2 GB RAM (handles ML model loading + concurrent requests)
- For higher traffic, increase to `cpu: 2048` and `memory: 4096`

### 6.4 Store MongoDB URI in Parameter Store

**IMPORTANT:** Never put secrets in task definitions. Use AWS Systems Manager Parameter Store.

```bash
# Replace with your actual MongoDB Atlas connection string
aws ssm put-parameter \
    --name "/cust-ai/mongodb-uri" \
    --type "SecureString" \
    --value "mongodb+srv://username:password@cluster.mongodb.net/custai?retryWrites=true&w=majority" \
    --region us-east-1
```

**Update IAM permissions for secrets:**

1. Go to: https://console.aws.amazon.com/iam/
2. Find role `ecsTaskExecutionRole`
3. Click "Add permissions" → "Create inline policy"
4. JSON tab, paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameters",
                "ssm:GetParameter"
            ],
            "Resource": "arn:aws:ssm:us-east-1:*:parameter/cust-ai/*"
        }
    ]
}
```

5. Click "Next"
6. Policy name: `CustAISecretsAccess`
7. Click "Create policy"

### 6.5 Register Task Definition

```bash
aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region us-east-1
```

**Expected output includes:**
```json
{
    "taskDefinition": {
        "taskDefinitionArn": "arn:aws:ecs:us-east-1:123456789012:task-definition/cust-ai-backend:1",
        "status": "ACTIVE"
    }
}
```

---

## 7. Application Load Balancer (ALB)

### 7.1 Identify Default VPC and Subnets

```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text --region us-east-1)
echo "VPC ID: $VPC_ID"

# Get public subnet IDs (need at least 2 in different AZs)
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=default-for-az,Values=true" \
    --query "Subnets[*].SubnetId" \
    --output text \
    --region us-east-1)
echo "Subnet IDs: $SUBNET_IDS"
```

### 7.2 Create Security Group for ALB

```bash
# Create security group
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name cust-ai-alb-sg \
    --description "Security group for Cust-AI ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region us-east-1)
echo "ALB Security Group ID: $ALB_SG_ID"

# Allow HTTP (port 80) from anywhere
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region us-east-1

# Allow HTTPS (port 443) from anywhere
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region us-east-1
```

### 7.3 Create Security Group for ECS Tasks

```bash
# Create security group
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name cust-ai-ecs-sg \
    --description "Security group for Cust-AI ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region us-east-1)
echo "ECS Security Group ID: $ECS_SG_ID"

# Allow traffic from ALB security group on port 8000
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 8000 \
    --source-group $ALB_SG_ID \
    --region us-east-1
```

### 7.4 Create Application Load Balancer

**Via Console (recommended for first time):**

1. Go to: https://console.aws.amazon.com/ec2/
2. Left sidebar → "Load Balancers" (under Load Balancing)
3. Click "Create load balancer"
4. Select "Application Load Balancer" → Click "Create"
5. Basic configuration:
   - Name: `cust-ai-alb`
   - Scheme: `Internet-facing`
   - IP address type: `IPv4`
6. Network mapping:
   - VPC: Select your default VPC
   - Mappings: Check at least 2 availability zones
   - Select the subnet for each AZ
7. Security groups:
   - Remove default SG
   - Select `cust-ai-alb-sg`
8. Listeners and routing:
   - Protocol: HTTP, Port: 80
   - Click "Create target group" (opens new tab)

### 7.5 Create Target Group

**In the new tab:**

1. Target type: Select "IP addresses"
2. Target group name: `cust-ai-backend-tg`
3. Protocol: HTTP, Port: 8000
4. VPC: Select default VPC
5. Protocol version: HTTP1
6. Health checks:
   - Protocol: HTTP
   - Path: `/health`
   - Advanced health check settings:
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 10 seconds
     - Interval: 30 seconds
     - Success codes: 200
7. Click "Next"
8. Do NOT register targets now (ECS will do this)
9. Click "Create target group"

**Return to ALB creation tab:**

10. Refresh target group dropdown
11. Select `cust-ai-backend-tg`
12. Click "Create load balancer"

**Wait for ALB state: "Active"** (2-3 minutes)

### 7.6 Get ALB DNS Name

```bash
aws elbv2 describe-load-balancers \
    --names cust-ai-alb \
    --query "LoadBalancers[0].DNSName" \
    --output text \
    --region us-east-1
```

**Save this DNS name:** `cust-ai-alb-123456789.us-east-1.elb.amazonaws.com`

### 7.7 Configure WebSocket Support (Stickiness)

WebSockets require sticky sessions for proper connection handling.

1. Go to: EC2 → Target Groups → `cust-ai-backend-tg`
2. Tab "Attributes" → Click "Edit"
3. Enable "Stickiness"
4. Stickiness type: "Load balancer generated cookie"
5. Stickiness duration: 1 day (86400 seconds)
6. Click "Save changes"

---

## 8. ECS Service Creation

### 8.1 Get Required IDs

```bash
# Get Target Group ARN
TG_ARN=$(aws elbv2 describe-target-groups \
    --names cust-ai-backend-tg \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region us-east-1)
echo "Target Group ARN: $TG_ARN"

# Get Subnet IDs (space-separated to comma-separated)
SUBNET_IDS_CSV=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=default-for-az,Values=true" \
    --query "Subnets[*].SubnetId" \
    --output text \
    --region us-east-1 | tr '\t' ',')
echo "Subnet IDs: $SUBNET_IDS_CSV"
```

### 8.2 Create ECS Service

```bash
aws ecs create-service \
    --cluster cust-ai-cluster \
    --service-name cust-ai-backend-service \
    --task-definition cust-ai-backend:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS_CSV],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=cust-ai-backend,containerPort=8000" \
    --health-check-grace-period-seconds 120 \
    --region us-east-1
```

**Parameters explained:**
- `desired-count: 2` = Run 2 instances for high availability
- `assignPublicIp: ENABLED` = Required for Fargate to pull images from ECR
- `health-check-grace-period: 120` = Give containers 2 minutes to start before health checks

### 8.3 Wait for Service to Stabilize

```bash
aws ecs wait services-stable \
    --cluster cust-ai-cluster \
    --services cust-ai-backend-service \
    --region us-east-1
```

This command blocks until the service is stable (tasks are running and healthy).

**Timeout after 10 minutes = something is wrong.** Check logs (next section).

---

## 9. Backend Verification

### 9.1 Check Service Status

```bash
aws ecs describe-services \
    --cluster cust-ai-cluster \
    --services cust-ai-backend-service \
    --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}" \
    --region us-east-1
```

**Expected output:**
```json
{
    "Status": "ACTIVE",
    "Running": 2,
    "Desired": 2,
    "Pending": 0
}
```

### 9.2 Check Task Status

```bash
# List tasks
aws ecs list-tasks \
    --cluster cust-ai-cluster \
    --service-name cust-ai-backend-service \
    --region us-east-1

# Describe tasks (get IPs, status)
TASK_ARNS=$(aws ecs list-tasks --cluster cust-ai-cluster --service-name cust-ai-backend-service --query "taskArns" --output text --region us-east-1)

aws ecs describe-tasks \
    --cluster cust-ai-cluster \
    --tasks $TASK_ARNS \
    --query "tasks[*].{TaskId:taskArn,Status:lastStatus,Health:healthStatus}" \
    --region us-east-1
```

**Expected:**
```json
[
    {"TaskId": "arn:...", "Status": "RUNNING", "Health": "HEALTHY"},
    {"TaskId": "arn:...", "Status": "RUNNING", "Health": "HEALTHY"}
]
```

### 9.3 View CloudWatch Logs

**Via Console:**
1. Go to: https://console.aws.amazon.com/cloudwatch/
2. Left sidebar → "Log groups"
3. Click `/ecs/cust-ai-backend`
4. Click latest log stream

**Via CLI:**
```bash
aws logs tail /ecs/cust-ai-backend --since 30m --follow --region us-east-1
```

### 9.4 Test Backend via ALB

```bash
# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers --names cust-ai-alb --query "LoadBalancers[0].DNSName" --output text --region us-east-1)

# Test health endpoint
curl http://${ALB_DNS}/health

# Expected: {"status":"healthy","service":"cust-ai-backend"}

# Test API docs
echo "Open in browser: http://${ALB_DNS}/docs"
```

### 9.5 Common Failures and Fixes

**Task keeps stopping (exit code 1):**
- Check CloudWatch logs for Python errors
- Usually missing environment variables or import errors

**Task stuck in PENDING:**
- Check ECR image exists
- Check security group allows outbound traffic
- Check subnets have internet access (NAT gateway or public)

**Health check failing:**
- Verify `/health` endpoint exists and returns 200
- Check security group allows port 8000 from ALB SG
- Increase `startPeriod` in task definition if app starts slowly

**503 Service Unavailable:**
- Tasks not registered in target group yet
- Wait 2-3 minutes after service creation

---

## 10. Frontend S3 Deployment

### 10.1 Build Frontend

```bash
cd /Users/riishabhjain/Desktop/Project\ Cust-AI/frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
VITE_API_BASE_URL=http://cust-ai-alb-123456789.us-east-1.elb.amazonaws.com
VITE_WS_URL=ws://cust-ai-alb-123456789.us-east-1.elb.amazonaws.com
EOF
```

**IMPORTANT:** Replace the ALB DNS with your actual ALB DNS name.

```bash
# Build production bundle
npm run build
```

**Expected output:**
```
vite v5.x.x building for production...
✓ 123 modules transformed.
dist/index.html                   0.xx kB
dist/assets/index-xxx.css        xx.xx kB
dist/assets/index-xxx.js        xxx.xx kB
✓ built in x.xxs
```

Verify build:
```bash
ls -la dist/
# Should contain: index.html, assets/, etc.
```

### 10.2 Create S3 Bucket

```bash
# Create bucket (name must be globally unique)
aws s3 mb s3://cust-ai-frontend-$(date +%s) --region us-east-1

# Store bucket name for later
S3_BUCKET="cust-ai-frontend-$(date +%s)"
echo "Bucket name: $S3_BUCKET"
```

**Alternative with specific name:**
```bash
S3_BUCKET="cust-ai-frontend-production"
aws s3 mb s3://$S3_BUCKET --region us-east-1
```

### 10.3 Configure Bucket for Static Website

```bash
# Enable static website hosting
aws s3 website s3://$S3_BUCKET \
    --index-document index.html \
    --error-document index.html \
    --region us-east-1
```

**Note:** Error document = index.html for SPA routing.

### 10.4 Set Bucket Policy for Public Read

```bash
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
        }
    ]
}
EOF

# Disable block public access (required for public bucket)
aws s3api put-public-access-block \
    --bucket $S3_BUCKET \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
    --region us-east-1

# Apply bucket policy
aws s3api put-bucket-policy \
    --bucket $S3_BUCKET \
    --policy file:///tmp/bucket-policy.json \
    --region us-east-1
```

### 10.5 Upload Frontend Build

```bash
cd /Users/riishabhjain/Desktop/Project\ Cust-AI/frontend

# Upload with correct content types
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --delete \
    --cache-control "max-age=31536000" \
    --region us-east-1

# Set correct cache for index.html (no cache for updates)
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html" \
    --region us-east-1
```

### 10.6 Get S3 Website URL

```bash
echo "S3 Website URL: http://${S3_BUCKET}.s3-website-us-east-1.amazonaws.com"
```

**Test in browser:** Open this URL. You should see your React app.

---

## 11. CloudFront CDN Setup

### 11.1 Create CloudFront Distribution

**Via AWS Console:**

1. Go to: https://console.aws.amazon.com/cloudfront/
2. Click "Create distribution"
3. Origin settings:
   - Origin domain: Select your S3 bucket from dropdown
     `cust-ai-frontend-xxx.s3.us-east-1.amazonaws.com`
   - **IMPORTANT:** Do NOT select the S3 website endpoint
   - Origin access: Select "Origin access control settings (recommended)"
   - Click "Create new OAC"
     - Name: `cust-ai-frontend-oac`
     - Signing behavior: "Sign requests"
     - Click "Create"
4. Default cache behavior:
   - Viewer protocol policy: "Redirect HTTP to HTTPS"
   - Allowed HTTP methods: "GET, HEAD"
   - Cache policy: "CachingOptimized"
5. Settings:
   - Price class: "Use only North America and Europe" (or "Use all edge locations")
   - Default root object: `index.html`
6. Click "Create distribution"

**IMPORTANT:** After creation, you'll see a yellow banner:
"S3 bucket policy needs to be updated"
Click "Copy policy" and apply it to your S3 bucket.

### 11.2 Update S3 Bucket Policy for CloudFront OAC

```bash
# Get CloudFront distribution ID
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.us-east-1.amazonaws.com']].Id" --output text)

# Get CloudFront ARN
CF_ARN="arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${CF_DIST_ID}"

cat > /tmp/bucket-policy-cf.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "${CF_ARN}"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $S3_BUCKET \
    --policy file:///tmp/bucket-policy-cf.json \
    --region us-east-1
```

### 11.3 Configure Custom Error Pages for SPA

React SPA needs all routes to return index.html:

1. Go to CloudFront distribution
2. Tab "Error pages"
3. Click "Create custom error response"
4. HTTP error code: `403`
5. Customize error response: Yes
6. Response page path: `/index.html`
7. HTTP Response code: `200`
8. Click "Create"
9. Repeat for error code `404`

### 11.4 Wait for Distribution Deployment

```bash
# Check status (takes 5-15 minutes)
aws cloudfront get-distribution --id $CF_DIST_ID --query "Distribution.Status" --output text
```

**Expected:** `Deployed`

### 11.5 Get CloudFront URL

```bash
CF_DOMAIN=$(aws cloudfront get-distribution --id $CF_DIST_ID --query "Distribution.DomainName" --output text)
echo "CloudFront URL: https://${CF_DOMAIN}"
```

**Example:** `https://d1234567890abc.cloudfront.net`

---

## 12. Final Validation

### 12.1 Update Frontend with CloudFront URL

Now update CORS in backend to allow CloudFront domain:

```bash
# Update task definition with correct CORS
# Edit ecs-task-definition.json, change CORS_ORIGINS to your CloudFront domain
# Then re-register and update service
```

**Quick fix (temporary - allows all):**
CORS_ORIGINS is already set to `*` in our task definition.

### 12.2 Validation Checklist

Run these tests:

```bash
# 1. Backend Health Check
ALB_DNS=$(aws elbv2 describe-load-balancers --names cust-ai-alb --query "LoadBalancers[0].DNSName" --output text --region us-east-1)
curl -s http://${ALB_DNS}/health | jq .
# Expected: {"status":"healthy","service":"cust-ai-backend"}

# 2. Backend API Docs
echo "Open in browser: http://${ALB_DNS}/docs"
# Expected: FastAPI Swagger UI loads

# 3. Frontend via CloudFront
CF_DOMAIN=$(aws cloudfront list-distributions --query "DistributionList.Items[0].DomainName" --output text)
echo "Open in browser: https://${CF_DOMAIN}"
# Expected: React app loads

# 4. Check ECS Tasks
aws ecs list-tasks --cluster cust-ai-cluster --service-name cust-ai-backend-service --query "taskArns" --region us-east-1
# Expected: 2 task ARNs listed

# 5. Check CloudWatch Logs
aws logs tail /ecs/cust-ai-backend --since 5m --region us-east-1
# Expected: Recent log entries without errors

# 6. WebSocket Test (if applicable)
# Open browser console on frontend:
# const ws = new WebSocket('ws://ALB_DNS/ws/live');
# ws.onopen = () => console.log('Connected!');
```

### 12.3 Final Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                         ┌───────────────────┐
│  CloudFront   │                         │  Application      │
│  (CDN)        │                         │  Load Balancer    │
│               │                         │  (ALB)            │
│  d1234.cf.net │                         │                   │
└───────┬───────┘                         └─────────┬─────────┘
        │                                           │
        ▼                                           ▼
┌───────────────┐                         ┌───────────────────┐
│  S3 Bucket    │                         │  ECS Fargate      │
│  (Frontend)   │                         │  (Backend x2)     │
│               │                         │                   │
│  React Build  │                         │  FastAPI + Agents │
└───────────────┘                         └─────────┬─────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────┐
                    │                               │               │
                    ▼                               ▼               ▼
            ┌───────────────┐             ┌──────────────┐  ┌───────────┐
            │  MongoDB      │             │  AWS         │  │  AWS      │
            │  Atlas        │             │  Bedrock     │  │ Transcribe│
            └───────────────┘             └──────────────┘  └───────────┘
```

### 12.4 URLs Reference

| Service | URL |
|---------|-----|
| Frontend (CloudFront) | `https://d1234567890abc.cloudfront.net` |
| Backend API | `http://cust-ai-alb-xxx.us-east-1.elb.amazonaws.com` |
| API Docs | `http://cust-ai-alb-xxx.us-east-1.elb.amazonaws.com/docs` |
| Health Check | `http://cust-ai-alb-xxx.us-east-1.elb.amazonaws.com/health` |
| CloudWatch Logs | AWS Console → CloudWatch → Log groups → /ecs/cust-ai-backend |

---

## 13. Troubleshooting

### 13.1 Task Fails to Start

**Symptoms:** Task status cycles between PENDING → RUNNING → STOPPED

**Diagnosis:**
```bash
# Get stopped task details
STOPPED_TASK=$(aws ecs list-tasks --cluster cust-ai-cluster --desired-status STOPPED --query "taskArns[0]" --output text --region us-east-1)
aws ecs describe-tasks --cluster cust-ai-cluster --tasks $STOPPED_TASK --query "tasks[0].stoppedReason" --output text --region us-east-1
```

**Common causes:**
1. "Essential container exited" → Check CloudWatch logs for Python errors
2. "CannotPullContainer" → ECR image doesn't exist or IAM permissions missing
3. "ResourceInitializationError" → Secrets/parameters not accessible

### 13.2 503 Service Unavailable

**Diagnosis:**
```bash
# Check target group health
TG_ARN=$(aws elbv2 describe-target-groups --names cust-ai-backend-tg --query "TargetGroups[0].TargetGroupArn" --output text --region us-east-1)
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region us-east-1
```

**Common causes:**
1. "unhealthy" → Health check failing, check /health endpoint
2. "draining" → Tasks being replaced
3. No targets → ECS service not registering tasks

### 13.3 WebSocket Connection Fails

**Symptoms:** WebSocket connects then immediately disconnects

**Fix 1:** Ensure ALB idle timeout is sufficient
```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers --names cust-ai-alb --query "LoadBalancers[0].LoadBalancerArn" --output text --region us-east-1)

# Set idle timeout to 3600 seconds (1 hour)
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn $ALB_ARN \
    --attributes Key=idle_timeout.timeout_seconds,Value=3600 \
    --region us-east-1
```

**Fix 2:** Verify stickiness is enabled on target group (see section 7.7)

### 13.4 Frontend Can't Connect to Backend (CORS)

**Symptoms:** Browser console shows CORS errors

**Fix:** Update CORS_ORIGINS in task definition to include CloudFront domain:
```json
{"name": "CORS_ORIGINS", "value": "https://d1234567890abc.cloudfront.net"}
```

Then update the service:
```bash
aws ecs update-service \
    --cluster cust-ai-cluster \
    --service cust-ai-backend-service \
    --force-new-deployment \
    --region us-east-1
```

### 13.5 Redeploying After Code Changes

```bash
# 1. Build new Docker image
cd /Users/riishabhjain/Desktop/Project\ Cust-AI/backend
docker build -t cust-ai-backend:local .

# 2. Tag and push to ECR
docker tag cust-ai-backend:local ${ECR_REPO}:latest
docker tag cust-ai-backend:local ${ECR_REPO}:v1.0.1
docker push ${ECR_REPO}:latest
docker push ${ECR_REPO}:v1.0.1

# 3. Force ECS to pull new image
aws ecs update-service \
    --cluster cust-ai-cluster \
    --service cust-ai-backend-service \
    --force-new-deployment \
    --region us-east-1

# 4. Wait for deployment
aws ecs wait services-stable --cluster cust-ai-cluster --services cust-ai-backend-service --region us-east-1
```

### 13.6 Cost Monitoring

Set up billing alerts:

1. Go to: https://console.aws.amazon.com/billing/
2. Left sidebar → "Budgets"
3. Click "Create budget"
4. Budget type: "Cost budget"
5. Set monthly budget (e.g., $50)
6. Set alert at 80% threshold
7. Add email for notifications

**Estimated monthly costs (us-east-1):**
- ECS Fargate (2 tasks, 1vCPU, 2GB): ~$60-80
- ALB: ~$20-25
- CloudFront: ~$5-10 (low traffic)
- S3: ~$1-5
- ECR: ~$1
- CloudWatch Logs: ~$5
- **Total: ~$100-120/month**

---

## Appendix A: Quick Commands Reference

```bash
# === ECR ===
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# === ECS ===
# View service status
aws ecs describe-services --cluster cust-ai-cluster --services cust-ai-backend-service --region us-east-1

# Force new deployment
aws ecs update-service --cluster cust-ai-cluster --service cust-ai-backend-service --force-new-deployment --region us-east-1

# Scale service
aws ecs update-service --cluster cust-ai-cluster --service cust-ai-backend-service --desired-count 3 --region us-east-1

# === Logs ===
# Tail logs
aws logs tail /ecs/cust-ai-backend --follow --region us-east-1

# Search logs
aws logs filter-log-events --log-group-name /ecs/cust-ai-backend --filter-pattern "ERROR" --region us-east-1

# === S3 ===
# Sync frontend
aws s3 sync dist/ s3://$S3_BUCKET/ --delete --region us-east-1

# === CloudFront ===
# Invalidate cache (after frontend update)
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

---

## Appendix B: Environment Variables Reference

| Variable | Description | Where Set |
|----------|-------------|-----------|
| `MONGODB_URI` | MongoDB connection string | SSM Parameter Store |
| `DATABASE_NAME` | Database name | ECS Task Definition |
| `AWS_REGION` | AWS region | ECS Task Definition |
| `BEDROCK_MODEL_ID` | Bedrock model identifier | ECS Task Definition |
| `TRANSCRIBE_S3_BUCKET` | S3 bucket for audio files | ECS Task Definition |
| `TRANSCRIBE_S3_PREFIX` | S3 prefix for transcribe input | ECS Task Definition |
| `ENVIRONMENT` | production/development | ECS Task Definition |
| `LOG_LEVEL` | INFO/DEBUG/WARNING | ECS Task Definition |
| `CORS_ORIGINS` | Allowed origins for CORS | ECS Task Definition |

---

**End of Deployment Guide**
