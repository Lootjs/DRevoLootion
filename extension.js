const vscode = require('vscode');
const hoverHandler = require('./src/hoverHandler');
const DefinitionHandler = require('./src/definitionHandler');
const UntranslatedViewTreeDataProvider = require('./src/untranslatedView');
const scanDocumentHandler = require('./src/scanHandler');
const completitionHandler = require('./src/completitionHandler');
const {SUPPORTED_LANG_IDS} = require('./src/constants');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	if (vscode.workspace.getConfiguration().drevolootion.scanForRawString) {
		const untranslatedDataProvider = new UntranslatedViewTreeDataProvider();
		vscode.window.registerTreeDataProvider('untranslatedView', untranslatedDataProvider);

		scanDocumentHandler(vscode.window.activeTextEditor, untranslatedDataProvider);
		vscode.window.onDidChangeActiveTextEditor(event => 
			scanDocumentHandler(event, untranslatedDataProvider)
		);
	}
	const hoverDisposable = vscode.languages.registerHoverProvider(SUPPORTED_LANG_IDS, hoverHandler);
	const definitionDisposable = vscode.languages.registerDefinitionProvider(
		{ pattern: '**/*.{ts,js,vue,jsx,tsx}', scheme: 'file' }, new DefinitionHandler()
	);
	const completitionDisposable = vscode.languages.registerCompletionItemProvider(
		{ pattern: '**/*.{ts,js,vue,jsx,tsx}', scheme: 'file' }, completitionHandler, '.', '\''
	);
	context.subscriptions.push(hoverDisposable, definitionDisposable, completitionDisposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
