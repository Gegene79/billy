pipeline {
    
    agent any

    environment {
        PACKAGE_NAME = "package_${BUILD_ID}.tar.gz"
        TARGET_PATH = "/var/www/node"
        TARGET_HOST = "fabien@petitbilly"
        ENV_PATH = "/home/fabien/env"
        ENV_STORE = "${env.TARGET_HOST}:${env.ENV_PATH}"
        SW_PATH = "${env.TARGET_PATH}/dist_${BUILD_ID}"
                
    }

    stages {

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

        stage('Empaquetar') {

            when {
                branch 'master'
            }

            steps {
                echo "Packaging... ${env.PACKAGE_NAME}"
                sh "ls -lah && tar --exclude=node_modules -czvf ${env.PACKAGE_NAME} *"
            }
        }

        stage('Deploy') {

            when {
                branch 'master'
            }
            
            steps {
                
                echo "Sending package to ${env.TARGET_HOST}"
                sh "scp -BCp -P 979 ${env.PACKAGE_NAME} ${env.TARGET_HOST}:${env.TARGET_PATH}/ && rm -f ${env.PACKAGE_NAME}"
                echo "Deflate ${env.TARGET_PATH}/${env.PACKAGE_NAME}"
                sh "ssh -l fabien -p 979 petitbilly \"mkdir ${env.SW_PATH} && tar -xzvf ${env.TARGET_PATH}/${env.PACKAGE_NAME} -C ${env.SW_PATH} && rm -f ${env.TARGET_PATH}/${env.PACKAGE_NAME}\""
                echo "Retreive production env file and install ${env.TARGET_PATH}/${env.PACKAGE_NAME}"
                sh "ssh -l fabien -p 979 petitbilly \"cd ${env.SW_PATH} \
                        && cp ${env.ENV_PATH}/node_petitbilly_pro.env ./.env \
                        && chmod 640 .env \
                        && npm install\""
                echo "Exchange ${env.SW_PATH} and ${env.TARGET_PATH}/monitor/"
                sh "ssh -l fabien -p 979 petitbilly \" \
                        sudo systemctl stop node-monitor \
                        && rm -rf ${env.TARGET_PATH}/monitor_old \
                        && mv ${env.TARGET_PATH}/monitor ${env.TARGET_PATH}/monitor_old \
                        && mv ${env.SW_PATH} ${env.TARGET_PATH}/monitor \
                        && sudo systemctl start node-monitor \""
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