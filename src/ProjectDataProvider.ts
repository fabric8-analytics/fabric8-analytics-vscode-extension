import { exec } from "child_process";
import * as path from "path";
import { window } from "vscode";
import { Utils } from "./Utils";

export module  ProjectDataProvider {

    export let effectivef8PomWs: any;
    export let effectivef8Pom: any;

    effectivef8PomWs = (item, cb) => {
        let pomXmlFilePath: string = null;
        pomXmlFilePath = item.fsPath;
        const cmd: string = [
            Utils.getMavenExecutable(),
            "io.github.stackinfo:stackinfo-maven-plugin:0.2:prepare",
            "-f",
            `"${item}"`
        ].join(" ");
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if (error) {
                //window.showErrorMessage(`Error occurred in generating effective pom.\n${error}`);
                cb(false);
            } else {
                console.log("effe pom generation TS ");
                console.log(new Date());
                //window.showInformationMessage(`Successfully generated effective pom.\n`);
                cb(true);
            }
        });
    }

    effectivef8Pom = (item,cb) => {
        let pomXmlFilePath: string = null;
        let filepath: string = "target/pom.xml";
        pomXmlFilePath = item.fsPath;
        const cmd: string = [
            Utils.getMavenExecutable(),
            "help:effective-pom",
            "-f",
            `"${pomXmlFilePath}"`,
            `-Doutput="${filepath}"`
        ].join(" ");
        exec(cmd, (error: Error, _stdout: string, _stderr: string): void => {
            if (error) {
                //window.showErrorMessage(`Error occurred in generating effective pom.\n${error}`);
                cb(false);
            } else {
               // window.showInformationMessage(`Successfully generated effective pom.\n`);
                let ePomPathList: any = pomXmlFilePath.toLowerCase().split("pom.xml");
                if(ePomPathList.length>0){
                    let ePomPath: string = ePomPathList[0] + filepath;
                    cb(ePomPath);
                }else{
                    cb(false);
                }
            }
        });
    }
    
}