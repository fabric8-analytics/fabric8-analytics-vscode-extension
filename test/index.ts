import { join, resolve } from "path"
import { sync } from "glob"

const Mocha = require('mocha');
const NYC = require('nyc');

// eslint-disable-next-line @typescript-eslint/no-var-requires

// Recommended modules, loading them here to speed up NYC init
// and minimize risk of race condition
import "ts-node/register"

export async function run(): Promise<void> {
  const testsRoot = __dirname

  // Setup coverage pre-test, including post-test hook to report
  const nyc = new NYC({
    cwd: join(__dirname, "..", "src"),
    reporter: ["text", "text-summary", "lcov"],
    all: true,
    silent: false,
    instrument: true,
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    reportDir: join(__dirname, "..", "..", 'coverage'), // remove attribute for report to be saved in ./out/src/
    tempDir: join(__dirname, "..", "..", '.nyc_output'), // remove attribute for output to be saved in ./out/src/
    exclude: ['exhortServices.js', 'exhortServices_rewire.js', 'redhatTelemetry.js', 'redhatTelemetry_rewire.js']
  })
  await nyc.wrap()

  // Debug which files will be included/excluded
  // console.log('Glob verification', await nyc.exclude.glob(nyc.cwd));

  await nyc.createTempDirectory()
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true
  })

  // Add all files to the test suite
  const files = sync("**/**.test.js", { cwd: testsRoot })
  files.forEach(f => mocha.addFile(resolve(testsRoot, f)))

  const failures: number = await new Promise(executor => mocha.run(executor))
  await nyc.writeCoverageFile()

  // Capture text-summary reporter's output and log it in console
  console.log(await captureStdout(nyc.report.bind(nyc)));

  if (failures > 0) {
    throw new Error(`${failures} tests failed.`);
  }
}

async function captureStdout(fn: () => any) {
  let w = process.stdout.write, buffer = '';
  process.stdout.write = (s) => { buffer = buffer + s; return true; };
  await fn();
  process.stdout.write = w;
  return buffer;
}