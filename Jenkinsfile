pipeline {
    agent any

    // Makes sure tools are available in the pipeline PATH
    tools {
        nodejs 'node18'  // matches the name in Jenkins > Manage Jenkins > Global Tool Configuration
    }

    environment {
        DOCKER_REGISTRY = "http://13.246.180.57:5001"   // Nexus IP on created repo port
        NEXUS_PASSWORD =
        NEXUS_USERNAME =
        IMAGE_TAG = "${env.BUILD_ID}"

        // Telegram configuration
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        TELEGRAM_CHAT_ID = credentials('telegram-chat-id')
    }

    stages {
        stage('Checkout Code') {
            steps{
                echo "Cloning App repository ..."
                checkout scm
            }
        }

        // ESLint checks for code quality and bugs in your React code.
        // Prettier makes sure your code follows consistent formatting.
        stage('Lint (ESLint + Prettier)') {
            steps {
                dir('frontend') { // Navigate into the frontend directory. Because only frontend is built on React
                    echo "Installing dependencies for linting..."
                    sh 'npm install'

                    echo "Running ESLint..."
                    sh 'npm run lint'

                    echo "Running Prettier check..."
                    sh 'npm run format'
                }
            }
        }

        // Skipped for now, until app is running becos of API call
        // stage('Unit Tests') {
        //     steps {
        //         echo "Running unit tests..."
        //         dir('frontend') { sh 'npm test -- --coverage' }
        //         dir('backend') { sh 'pytest --cov=.' }
        //     }
        // }

        stage('Secret Scan') {
            steps {
                echo "Scanning for scerets ..."
                sh 'gitleaks detect --source . --config=gitleaks.toml'
                // Or use official config: gitleaks config --show > gitleaks.toml
            }
        }

        stage('Filesystem Scan') {
            steps {
                echo "Vulnerability Scanning..."
                // Suppress Known Vulns via Trivy Ignore File
                sh 'trivy fs . --exit-code 1 --severity HIGH,CRITICAL --ignorefile .trivyignore || true'
            }
        }

        stage('Static Code Analysis') {
            steps {
                echo "Static Code Ananlysing..."
                // Refers to a SonarQube server configuration name that you define in Jenkins (under Manage Jenkins → Configure System → SonarQube Servers).
                withSonarQubeEnv('MySonarQube') { sh 'sonar-scanner' }
            }
        }

        stage("Quality Gate") {
            steps {
                echo "Waiting for SonarQube results..."
                timeout(time: 1, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Dockerfile Lint') {
            steps {
                echo "Analyzing Dockerfiles..."
                dir('frontend') { sh 'hadolint Dockerfile' }
                dir('backend') { sh 'hadolint Dockerfile' }
            }
        }

        stage('Build Frontend + Backend Images') {
            steps {
                echo 'Building Images...'
                dir('frontend') { sh 'docker build -t $DOCKER_REGISTRY/frontend-devops-learning-app:$IMAGE_TAG .' }
                dir('backend') { sh 'docker build -t $DOCKER_REGISTRY/backend-devops-learning-app:$IMAGE_TAG .' }
            }
        }

        stage('Image Scan') {
            steps {
                echo 'Scanning Docker Images...'
                sh 'trivy image $DOCKER_REGISTRY/frontend-devops-learning-app:$IMAGE_TAG'
                sh 'trivy image $DOCKER_REGISTRY/backend-devops-learning-app:$IMAGE_TAG'
            }
        }

        stage('Push Images to Nexus') {
            steps {
                echo 'Pushing images to Nexus Private Repo...'
                sh 'docker login $DOCKER_REGISTRY -u $NEXUS_USERNAME -p $NEXUS_PASSWORD'
                sh 'docker push $DOCKER_REGISTRY/frontend-devops-learning-app:$IMAGE_TAG'
                sh 'docker push $DOCKER_REGISTRY/backend-devops-learning-app:$IMAGE_TAG'
            }
        }

        stage('Update Manifest Repo') {
            steps {
                echo 'Updating Manifest Repo...'
                sh 'git clone https://github.com/div-ops123/hybrid-manifests.git'
                sh 'cd hybrid-manifests/devops-learning-manifest'
                // patch image
            }
        }

    }

    post {
        success {
            // echo "CI Pipeline for 'DevOps Learning Platform App' completed successfully! Image: ${DOCKER_REGISTRY }/${IMAGE_NAME}:${IMAGE_TAG}"
            echo "CI Pipeline for 'DevOps Learning Platform App' completed successfully!"
        }
        
        failure {
            script {
                env.CURRENT_BUILD_NUMBER = "${currentBuild.number}"
                env.GIT_MESSAGE = sh(returnStdout: true, script: "git log -n 1 --format=%s ${GIT_COMMIT}").trim()
                env.GIT_AUTHOR = sh(returnStdout: true, script: "git log -n 1 --format=%ae ${GIT_COMMIT}").trim()
                env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short ${GIT_COMMIT}").trim()
                env.GIT_INFO = "Branch(Version): ${GIT_BRANCH}\nLast Message: ${GIT_MESSAGE}\nAuthor: ${GIT_AUTHOR}\nCommit: ${GIT_COMMIT_SHORT}"
                env.TEXT_BREAK = "--------------------------------------------------------------"
                env.TEXT_FAILURE_BUILD = "${TEXT_BREAK}\n${GIT_INFO}\n${JOB_NAME}\nBuild #${CURRENT_BUILD_NUMBER} Failed."
            }
            // Calls Telegram API directly, no plugin required
            // sh "curl --location --request POST 'https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage' --form text='${TEXT_FAILURE_BUILD}' --form chat_id='${TELEGRAM_CHAT_ID}'"
            sh """
            curl --location --request POST 'https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage' \
            --form "text=${TEXT_FAILURE_BUILD}" \
            --form "chat_id=${TELEGRAM_CHAT_ID}" \
            --form "parse_mode=Markdown"
            """

        }
    }
}
