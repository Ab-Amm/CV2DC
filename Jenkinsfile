pipeline {
  agent any

  environment {
    BACK_IMAGE = "flask-backend:latest"
    FRONT_IMAGE = "react-frontend:latest"
  }

  stages {

    stage('Cloner le projet') {
      steps {
        git url: 'https://github.com/Ab-Amm/CV2DC.git'
      }
    }

    stage('Build Backend Docker') {
      steps {
        dir('server') {
          script {
            docker.build(env.BACK_IMAGE, '.')
          }
        }
      }
    }

    stage('Build Frontend Docker') {
      steps {
        dir('front') {
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
