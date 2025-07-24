pipeline {
  agent any

  environment {
    BACK_IMAGE = "flask-backend:latest"
    FRONT_IMAGE = "react-frontend:latest"
  }

   triggers {
      githubPush() 
    }

  stages {

    stage('Cloner le projet') {
      steps {
        git branch: 'docx', url: 'https://github.com/Ab-Amm/CV2DC.git'
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
    

    stage('Créer .env') {
      steps {
        writeFile file: 'server/.env', text: '''
FLASK_ENV=development
PORT=5000
'''
      }
    }

    stage('Nettoyer les anciens conteneurs') {
      steps {
        bat 'docker rm -f react-frontend flask-backend || exit 0'
      }
    }


    stage('Tests') {
      steps {
        // Ajoute ici tes tests si tu en as
        echo "Running tests..."
      }
    }
    
       
    stage('Analyse SonarQube Backend') {
      steps {
        dir('server') {
          withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
            bat 'sonar-scanner'
          }
        }
      }
    }

   
   stage('Analyse SonarQube Frontend') {
    steps {
      dir('front') { // adapte le dossier si ton frontend est ailleurs
        withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
          // Run tests + coverage
          bat 'npm install'
          // Scanner Sonar avec couverture
          bat 'sonar-scanner'
        }
      }
    }
  }


    stage('Lancer Docker Compose') {
      steps {
        bat 'docker-compose down || exit 0'
        bat 'docker-compose up -d'
      }
    }

    

  }

  post {
    always {
      echo 'Pipeline terminé.'
    }
  }
}
