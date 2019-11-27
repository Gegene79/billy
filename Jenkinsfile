pipeline {
    
    agent any

    environment {
        PACKAGE_NAME = "package_${BUILD_ID}.tar.gz"
        CONF_PATH = "/home/jenkins"      
    }

    stages {

        stage('Preparar'){
            steps {
                script {
                    prop = readProperties file: "${env.CONF_PATH}/conf/petitbilly.conf"
                    echo "Ejecutando build ${JOB_NAME} # ${BUILD_NUMBER} and deploy on ${prop.TARGET_USER}@${prop.TARGET_HOST}:${prop.TARGET_PORT}"
                }
            }
        }
        stage('Empaquetar') {
            /*    
            when {
                branch 'master'
            }
            */  
            steps {
                echo "Retrieve production env file"
                sh "scp -BCp -P ${prop.TARGET_PORT} ${prop.TARGET_USER}@${prop.TARGET_HOST}:${prop.TARGET_ENV} ./.env \
                    && chmod 640 ./.env"
                echo "Package ${env.PACKAGE_NAME}"
                sh "ls -lah && tar --exclude=node_modules -czvf ${env.PACKAGE_NAME} ."
            }
        }

        stage('Deploy') {
            /*
            when {
                branch 'master'
            }
            */
            steps {
                
                echo "Sending package to ${prop.TARGET_HOST}"
                sh "scp -BCp -P ${prop.TARGET_PORT} ${env.PACKAGE_NAME} ${prop.TARGET_HOST}:${prop.TARGET_PATH}/"

                echo "Stop Dockers"
                sh "ssh -p ${prop.TARGET_PORT} ${prop.TARGET_HOST} \"cd ${prop.TARGET_PATH} \
                        && sudo docker-compose down \""

                echo "Deflate ${prop.TARGET_PATH}/${env.PACKAGE_NAME} and Build"
                sh "ssh -p ${prop.TARGET_PORT} ${prop.TARGET_HOST} \"rm -rf ${prop.TARGET_PATH}/current/* && \
                    tar -xzvf ${prop.TARGET_PATH}/${env.PACKAGE_NAME} -C ${prop.TARGET_PATH}/current \
                    && cd ${prop.TARGET_PATH}/current \
                    && chown -R ${prop.TARGET_USER}:${prop.TARGET_GROUP} * && chmod -R 750 * \
                    && sudo docker-compose build \""
                
                echo "Restart Dockers"
                sh "ssh -p ${prop.TARGET_PORT} ${prop.TARGET_HOST} \"cd ${prop.TARGET_PATH} \
                        && sudo docker-compose up -d\""
                
                echo "Tidy up workspace"
                cleanWs()
                echo "Done."                    
            }
        }
        
    }

    post {
        failure {
            echo 'Tidying up on error....'
            cleanWs()
        }
    }
}