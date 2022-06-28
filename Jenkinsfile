#!/usr/bin/env groovy

def installBuildRequirements(){
	def nodeHome = tool 'nodejs-lts'
	env.PATH="${env.PATH}:${nodeHome}/bin"
	sh "npm install -g typescript"
	sh "npm install -g vsce@1.83.0"
}

def buildVscodeExtension(){
	sh "npm install"
	sh "npm run vscode:prepublish"
}

node('rhel8'){

	stage 'Checkout fabric8-analytics-vscode-extension code'
	deleteDir()
	git url: 'https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension.git'

	stage 'install fabric8-analytics-vscode-extension build requirements'
	installBuildRequirements()

	stage 'Build fabric8-analytics-vscode-extension'
	sh "npm install"
	sh "npm run vscode:prepublish"

	stage 'Test fabric8-analytics-vscode-extension for staging'
	wrap([$class: 'Xvnc']) {
		sh "npm run test-compile"
		sh "npm test --silent"
	}

	stage "Package fabric8-analytics-vscode-extension"
	def packageJson = readJSON file: 'package.json'
	sh "vsce package -o fabric8-analytics-${packageJson.version}-${env.BUILD_NUMBER}.vsix"

	def vsix = findFiles(glob: '**.vsix')
	
	stage 'Upload fabric8-analytics-vscode-extension to snapshots'
	sh "sftp -C ${UPLOAD_LOCATION}/snapshots/vscode-dependency-analytics/ <<< \$'put -p ${vsix[0].path}'"
	
	// Publishing part
	if(publishToMarketPlace.equals('true')){
		timeout(time:5, unit:'DAYS') {
			input message:'Approve deployment?', submitter: 'jparsai'
		}
		
		stage "Publish to Marketplace"

		// VS Code Marketplace
		withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
			sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
		}
		
		stage 'Upload fabric8-analytics-vscode-extension to stable'
		
		// jboss tools download locations
		sh "sftp -C ${UPLOAD_LOCATION}/stable/vscode-dependency-analytics/ <<< \$'put -p ${vsix[0].path}'"
	}

	if(publishToOVSX.equals('true')){
		
		stage "Publish to OVSX"
		
		sh "npm install -g ovsx"
		withCredentials([[$class: 'StringBinding', credentialsId: 'open-vsx-access-token', variable: 'OVSX_TOKEN']]) {
			sh 'ovsx publish -p ${OVSX_TOKEN}' + " ${vsix[0].path}"
		}
	}

	archive includes:"**.vsix"
}
