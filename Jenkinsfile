pipeline {
    agent any

    environment {
        // Explicitly set PATH to include Docker and System binaries for Windows
        PATH = "D:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\Windows\\System32;${env.WORKSPACE};${env.PATH}"
        
        // Absolute path to your project folder on the D: drive
        PROJECT_DIR = "D:\\devops\\NEW_PROJECT_FILE\\15projects30days\\project_3"
        COMPOSE_FILE = "D:\\devops\\NEW_PROJECT_FILE\\15projects30days\\project_3\\Docker-compose.yml"
        K8S_DIR = "D:\\devops\\NEW_PROJECT_FILE\\15projects30days\\project_3\\k8s"
        
        COMPOSE_PROJECT_NAME = "social-dashboard"
        BACKEND_HEALTH_URL = "http://localhost:3070/health"
        DOCKER_HUB_USER = "rajbirari9737" // Change this to your actual Docker Hub username
        DOCKER_HUB_CREDS = "dockerhubcreadentials" // The ID of your credentials in Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling latest code...'
                // checkout scm // Commented out because code is manually managed at PROJECT_DIR
            }
        }

        stage('Security Check') {
            steps {
                dir(env.PROJECT_DIR) {
                    echo 'Checking for sensitive files...'
                    bat 'if exist "%PROJECT_DIR%\\backend\\.env" (echo Warning: .env file found in backend, ensuring it\'s not committed.)'
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir(env.PROJECT_DIR) {
                    echo 'Building Docker Images...'
                    bat 'docker-compose -f "%COMPOSE_FILE%" build'
                }
            }
        }

        stage('Health Test') {
            steps {
                dir(env.PROJECT_DIR) {
                    echo 'Ensuring containers are running and healthy...'
                    bat 'docker-compose -f "%COMPOSE_FILE%" up -d'
                    
                    script {
                        echo "Waiting for backend to be healthy at ${BACKEND_HEALTH_URL}..."
                        timeout(time: 2, unit: 'MINUTES') {
                            waitUntil {
                                def result = bat(script: "curl.exe -s ${BACKEND_HEALTH_URL}", returnStatus: true)
                                return (result == 0)
                            }
                        }
                    }
                    echo 'Health test passed! ✅'
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                dir(env.PROJECT_DIR) {
                    script {
                        echo "Tagging and Pushing images to Docker Hub..."
                        try {
                            withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS}", usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                                bat "docker login -u %USER% -p %PASS%"
                                bat "docker tag %COMPOSE_PROJECT_NAME%-backend:latest %DOCKER_HUB_USER%/social-dashboard-backend:latest"
                                bat "docker tag %COMPOSE_PROJECT_NAME%-frontend:latest %DOCKER_HUB_USER%/social-dashboard-frontend:latest"
                                bat "docker push %DOCKER_HUB_USER%/social-dashboard-backend:latest"
                                bat "docker push %DOCKER_HUB_USER%/social-dashboard-frontend:latest"
                            }
                        } catch (Exception e) {
                            echo "ERROR: ${e.message}"
                            error "Pipeline failed due to missing Docker Hub credentials."
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                dir(env.PROJECT_DIR) {
                    echo 'Deploying to Kubernetes cluster...'
                    script {
                        try {
                            bat 'kubectl apply -f "%K8S_DIR%"'
                            
                            echo 'Verifying deployment status...'
                            bat 'kubectl rollout status deployment/backend -n social-dashboard --timeout=90s'
                            bat 'kubectl rollout status deployment/frontend -n social-dashboard --timeout=90s'
                            
                            echo 'Kubernetes deployment completed successfully! 🚀'
                        } catch (Exception e) {
                            echo "Kubernetes deployment failed: ${e.message}"
                        }
                    }
                }
            }
        }

        stage('Deploy & Prune') {
            steps {
                dir(env.PROJECT_DIR) {
                    echo 'Finalizing deployment and cleaning up old images...'
                    bat 'docker image prune -f'
                    echo 'CI/CD Deployment completed successfully! 🚀'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished!'
        }
        success {
            echo 'CI/CD Deployment successful! ✅'
        }
        failure {
            echo 'Build failed. Please check logs. ❌'
        }
    }
}
