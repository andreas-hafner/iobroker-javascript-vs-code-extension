import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { runTests } from 'vscode-test';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		if (!fs.existsSync("test-data")){
			fs.mkdirSync("test-data");
		}

		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foo-'));

		// Download VS Code, unzip it and run the integration test
		await runTests({ 
			extensionDevelopmentPath, 
			extensionTestsPath,
			launchArgs: [tempDir]
		});

		fs.rmdirSync(tempDir, { recursive: true });
	} catch (err) {
		console.error(`Failed to run tests: ${err}`);
		process.exit(1);
	}
}

main();
