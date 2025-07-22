pipeline {
  agent any

  environment {
    BACK_IMAGE = "flask-backend:latest"
    FRONT_IMAGE = "react-frontend:latest"
  }

  stages {

    stage('Cloner le projet') {
      steps {
        git credentialsId: 'github-token-id', url: 'https://github.com/Ab-Amm/CV2DC.git'
      }
    }

    stage('Build Backend Docker') {
      steps {
        dir('backend') {
          script {
            docker.build(env.BACK_IMAGE, '.')
          }
        }
      }
    }

    stage('Build Frontend Docker') {
      steps {
        dir('frontend') {
          script {
            docker.build(env.FRONT_IMAGE, '.')
          }
        }
      }
    }

    stage('Lancer Docker Compose') {
      steps {
        sh 'docker-compose down || true'
        sh 'docker-compose up -d'
      }
    }

    stage('Tests') {
      steps {
        // Ajoute ici tes tests si tu en as
        echo "Running tests..."
      }
    }

  }

  post {
    always {
      echo 'Pipeline terminé.'
    }
  }
}
