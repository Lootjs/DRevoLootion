// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');

const findTranslation = (word, dictionary) => {
	return word.split('.').reduce((o,i)=> o[i], dictionary);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "drevolootion" is now active!');
	const hoverTranslation = {
		async provideHover(document, position) {
			const line = document.lineAt(position.line);
			const findReg = line.text.match(/\$?t\(.*?\)/);
			if (findReg.length > 0) {
				const fnInvoke = findReg[0];
				const keys = fnInvoke.match(/'(.*?)'/);
				const key = keys[0].replaceAll('\'', '');
				let messages = {};
				const workspaceFolders = vscode.workspace.workspaceFolders;
				let mdString = '';

				if (workspaceFolders.length > 0) {
					const ws = workspaceFolders[0];
					try {
					const localeDir = vscode.Uri.joinPath(ws.uri, 'src/assets/locales');
      				const localeFiles = await vscode.workspace.fs.readDirectory(localeDir);
							console.log(localeDir);
					for (let [localeFile] of localeFiles) {
						const locale = localeFile.replace('.json', '');
						console.log(locale);
						const localeFilePath = vscode.Uri.joinPath(localeDir, localeFile);
						const content = fs.readFileSync(localeFilePath.fsPath);
						messages[locale] = JSON.parse(content);
						const translate = findTranslation(key, messages[locale]);
						console.log(translate);
						mdString += `*${locale}*: ${translate}\n\n`;
					  }
					} catch (e) { console.log(e) };
				}

				return new vscode.Hover(
					new vscode.MarkdownString(mdString)
				);
			}
		}
	};

	const disposable = vscode.languages.registerHoverProvider(['javascript', 'vue'], hoverTranslation);
	
	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
