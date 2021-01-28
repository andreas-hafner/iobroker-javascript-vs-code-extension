import * as assert from 'assert';
import * as sinon from 'sinon';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('iobroker-javascript.connect', async () => {

		let mockShowInputBox = sinon.stub(vscode.window, 'showInputBox');
		mockShowInputBox
			.onFirstCall().resolves("http://localhost")
			.onSecondCall().resolves("8081")
			.onThirdCall().resolves("/");

		let mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');

		mockQuickPick
			.onFirstCall().resolves({label: "Yes"})
			.onSecondCall().resolves({label: "Yes"});
		
		await vscode.commands.executeCommand("iobroker-javascript.connect");
		const configFile = await vscode.workspace.findFiles(".iobroker-config.json");
		
		if(configFile.length !== 1) {
			assert.fail("Couldn't find iobroker-config.json");
		}
	});

	test('iobroker-javascript.downloadAll', async() => {
		await vscode.commands.executeCommand("iobroker-javascript.downloadAll");
		
		const scriptFiles = await vscode.workspace.findFiles("**/*.js");
		console.log(`Found ${scriptFiles.length} js files`);
		if(scriptFiles.length === 0) {
			assert.fail("Couldn't find any downloaded script files");
		}
	});

	test('iobroker-javascript.download', async() => {

	});

	test('iobroker-javascript.upload', async() => {

	});

	test('iobroker-javascript.startScript', async() => {

	});

	test('iobroker-javascript.stopScript', async() => {

	});

	test('iobroker-javascript.updateTypeDefinition', async() => {

	});
});
