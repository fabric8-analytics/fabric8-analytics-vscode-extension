import { pypiWithVulnsUITest } from "../manifestFileTests/pypiWithVulns";
import { npmWithVulnsUITest } from "../manifestFileTests/npmWithVulns";
import { goWithVulnsUITest } from "../manifestFileTests/goWithVulns";
import { mavenWithVulnsUITest } from "../manifestFileTests/mavenWithVulns";
import { pypiWithoutVulnsUITest } from "../manifestFileTests/pypiWithoutVulns";
import { npmWithoutVulnsUITest } from "../manifestFileTests/npmWithoutVulns";
import { goWithoutVulnsUITest } from "../manifestFileTests/goWithoutVulns";
import { mavenWithoutVulnsUITest } from "../manifestFileTests/mavenWithoutVulns";

function testWithVulns() {
    describe('pypi tests with vulns', pypiWithVulnsUITest)
    describe('npm tests with vulns', npmWithVulnsUITest)
    describe('go tests with vulns', goWithVulnsUITest)
    describe('maven tests with vulns', mavenWithVulnsUITest)
}

function testWithoutVulns() {
    describe('pypi tests without vulns', pypiWithoutVulnsUITest);
    describe('npm tests without vulns', npmWithoutVulnsUITest);
    describe('go tests without vulns', goWithoutVulnsUITest);
    describe('maven tests without vulns', mavenWithoutVulnsUITest);
}

export {
    testWithVulns,
    testWithoutVulns
}