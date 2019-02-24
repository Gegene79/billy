pipeline {
    
    agent any

    environment {
        PACKAGE_NAME = "package_${BUILD_ID}.tar.gz"
        TARGET_PATH = "/mnt/sdb/billy"
        TARGET_HOST = "fabien@petitbilly"
        ENV_PATH = "/home/fabien/billy"
        TEMP_PATH = "/home/jenkins"
        ENV_STORE = "${env.TARGET_HOST}:${env.ENV_PATH}"
        SW_PATH = "${env.TEMP_PATH}/dist_${BUILD_ID}"        
    }

    stages {

        /*
        stage('Test') {
            steps {
                echo 'Retreive test environment file'
                sh "scp -BCp -P 979 ${env.ENV_STORE}/node_petitbilly_test.env ${WORKSPACE}/.env"
                echo 'Install modules'
                sh 'npm install'
                echo 'Launch app'
                sh 'npm start &'
                sleep 5
                echo 'Launch test'
                sh 'npm test'
            }
        }
        */
        stage('Empaquetar') {
            /*    
            when {
                branch 'master'
            }
            */
            steps {
                echo "Retrieve production env file"
                sh "scp -BCp -P 979 ${env.TARGET_HOST}:${env.ENV_PATH}/node_billy_pro.env ./node/src/.env \
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
                
                echo "Sending package to ${env.TARGET_HOST}"
                sh "scp -BCp -P 979 ${env.PACKAGE_NAME} ${env.TARGET_HOST}:${env.TEMP_PATH}/"

                echo "Deflate ${env.TEMP_PATH}/${env.PACKAGE_NAME}"
                sh "ssh -l jenkins -p 979 petitbilly \"mkdir ${env.SW_PATH} && \
                    tar -xzvf ${env.TEMP_PATH}/${env.PACKAGE_NAME} -C ${env.SW_PATH} \
                    && rm -f ${env.TEMP_PATH}/${env.PACKAGE_NAME}\""
                
                echo "Stop Dockers"
                sh "ssh -l jenkins -p 979 petitbilly \"cd ${env.TARGET_PATH} \
                        && sudo docker-compose stop \""
                
                echo "Exchange ${env.SW_PATH}/ and ${env.TARGET_PATH}/ and build Docker"
                sh "ssh -l jenkins -p 979 petitbilly \"cd ${env.TARGET_PATH} \
                        && rm -rf ${env.TARGET_PATH}/* \
                        && mv ${env.SW_PATH}/* ${env.TARGET_PATH}/ \
                        && cd ${env.SW_PATH} && rm -rf ${env.SW_PATH} \
                        && cd ${env.TARGET_PATH} \
                        && sudo docker-compose build \""
                
                echo "Restart Dockers"
                sh "ssh -l jenkins -p 979 petitbilly \"cd ${env.TARGET_PATH} \
                        && sudo docker-compose up -d\""
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