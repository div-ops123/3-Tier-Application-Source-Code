pipeline {
    agent any

    // Makes sure tools are available in the pipeline PATH
    tools {
        nodejs 'node18'  // matches the name in Jenkins > Manage Jenkins > Global Tool Configuration
    }

    environment {
        DOCKER_REGISTRY = "http://13.246.180.57:5001"   // Nexus IP on created repo port
        // IMAGE_NAME =
        // IMAGE_TAG = "${env.BUILD_ID}"
    }

    stages {
        stage('Checkout Code') {
            steps{
                echo "Cloning repository ..."
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
    }

    post {
        success {
            // echo "Pipeline completed successfully! Image: ${DOCKER_REGISTRY }/${IMAGE_NAME}:${IMAGE_TAG}"
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs above for details."
        }
    }
}