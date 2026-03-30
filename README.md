# 📊 Social Dashboard - Project 3

A containerized, full-stack Social Media Management Dashboard built for high performance and reliability. This project features a automated Jenkins CI/CD pipeline and is fully optimized for local Kubernetes deployment (Minikube/Docker Desktop) without any cloud dependencies.

## 🚀 Tech Stack

- **Frontend**: React (Vite), Recharts, Axios
- **Backend**: Node.js (Express), JSON Web Tokens (JWT)
- **Database**: PostgreSQL 15
- **Task Queue**: Redis + Bull (Post Scheduling)
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (K8s)
- **CI/CD**: Jenkins on Windows

## ✨ Key Features

- **Followers Growth Graph**: Real-time visualization of your social media metrics using Recharts.
- **Smart Post Scheduling**: Schedule posts for the future; a background worker (Bull + Redis) updates the status automatically.
- **Automated CI/CD**: Seamlessly build, test, and deploy from Jenkins directly to your local environments.
- **Kubernetes Ready**: Fully optimized manifests with resource limits and health probes.
- **Zero AWS Dependency**: Designed to run 100% locally or on any generic K8s cluster.

## 📋 Prerequisites

- **Docker Desktop** (with Kubernetes enabled)
- **Node.js** (v20+)
- **Jenkins** (running on Windows)
- **kubectl** (installed and in your PATH)

## 🐳 Local Development (Docker Compose)

To run the whole stack quickly on your local machine:

1. **Clone the project** (to your `D:` drive for Jenkins compatibility).
2. **Start the containers**:
   ```bash
   docker-compose up -d
   ```
3. **Access the Apps**:
   - **Frontend**: [http://localhost:8080](http://localhost:8080)
   - **Backend API**: [http://localhost:3070](http://localhost:3070)
   - **Health Check**: [http://localhost:3070/health](http://localhost:3070/health)

## 🏗️ CI/CD Pipeline (Jenkins)

The included `Jenkinsfile` is designed for Windows-based Jenkins agents and local execution:

- **Security Check**: Scans for internal sensitive files like `.env`.
- **Docker Build**: Automated image creation for Backend and Frontend.
- **Health Test**: Verifies the stack is healthy before pushing images.
- **Push to Docker Hub**: Tags and pushes to your registry (e.g., `rajbirari9737/...`).
- **Deploy to K8s**: Automatically applies manifests and verifies rollout status.

> [!IMPORTANT]
> The pipeline is configured to execute within your `D:` drive project directory to avoid any path conflicts with the default Jenkins workspace on the `C:` drive.

## ☸️ Kubernetes Deployment

Deploy to your local cluster manually using:

```bash
kubectl apply -f k8s/
```

- **Namespace**: `social-dashboard`
- **Frontend URL**: [http://localhost:30080](http://localhost:30080) (via NodePort)

## 🔍 Troubleshooting

- **Empty Graph?**: Click the **"✨ Generate Sample Metrics"** button on the dashboard to populate the database.
- **Deployment Hanging?**: We've added resource limits (`100m CPU / 128Mi RAM`) and `imagePullPolicy: IfNotPresent` to ensure K8s doesn't hang while trying to download images.
- **Jenkins Drive Error**: Ensure the `PROJECT_DIR` in the `Jenkinsfile` points to your actual code location on the `D:` drive.

---
*Created as part of the 15 Projects in 30 Days DevOps Series.*
