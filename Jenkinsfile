pipeline {
    
    agent any

    environment {
        PACKAGE_NAME = "package_${BUILD_ID}.tar.gz"
        ENV_PATH = "/home/fabien/billy"
        TEMP_PATH = "/home/jenkins"
        ENV_STORE = "${env.TARGET_HOST}:${env.ENV_PATH}"
        SW_PATH = "${env.TEMP_PATH}/dist_${BUILD_ID}"        
    }

    stages {

        stage('Preparar'){
            steps {
                script {
                    prop = readProperties file: '${env.TEMP_PATH}/conf/petitbilly.conf'
                    echo "Ejecutando build ${JOB_NAME} # ${BUILD_NUMBER} and deploy on ${prop.TARGET_USER}@${prop.TARGET_HOST}:${prop.TARGET_PORT}"
                /*
                TARGET_USER=jenkins
                TARGET_HOST=petitbilly
                TARGET_PORT=979
                TARGET_ENV=/home/fabien/billy/env/.env
                TARGET_PATH=/mnt/sdb/billy/
                */
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
                sh "scp -BCp -P ${prop.TARGET_PORT} ${prop.TARGET_USER}@${prop.TARGET_HOST}:${prop.TARGET_ENV} ./node/src/.env \
                    && chmod 640 ./node/src/.env"
                echo "Package ${env.PACKAGE_NAME}"
                sh "ls -lah && tar --exclude=node_modules -czvf ${env.PACKAGE_NAME} *"
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
                sh "scp -BCp -P ${prop.TARGET_PORT} ${env.PACKAGE_NAME} ${env.TARGET_HOST}:${env.TEMP_PATH}/"

                echo "Deflate ${env.TEMP_PATH}/${env.PACKAGE_NAME}"
                sh "ssh -p 979 ${env.TARGET_HOST} \"mkdir ${env.SW_PATH} && \
                    tar -xzvf ${env.TEMP_PATH}/${env.PACKAGE_NAME} -C ${env.SW_PATH} \
                    && rm -f ${env.TEMP_PATH}/${env.PACKAGE_NAME}\""
                
                echo "Stop Dockers"
                sh "ssh -p 979 ${env.TARGET_HOST} \"cd ${env.TARGET_PATH} \
                        && sudo docker-compose down \""
                
                echo "Exchange ${env.SW_PATH}/ and ${env.TARGET_PATH}/ and build Docker"
                sh "ssh -p 979 ${env.TARGET_HOST} \"cd ${env.TARGET_PATH} \
                        && rm -rf ${env.TARGET_PATH}/* \
                        && mv ${env.SW_PATH}/* ${env.TARGET_PATH}/ \
                        && cd ${env.SW_PATH} && rm -rf ${env.SW_PATH} \
                        && cd ${env.TARGET_PATH} \
                        && chown -R jenkins:famille * && chmod -R 755 * \
                        && sudo docker-compose build \""
                
                echo "Restart Dockers"
                sh "ssh -p 979 ${env.TARGET_HOST} \"cd ${env.TARGET_PATH} \
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