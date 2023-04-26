const vscode = require('vscode');
const untranslatedStorage = require('./untranslatedStorage');
const {SUPPORTED_LANG_IDS} = require('./constants');

const scanDocumentHandler = (event, dataProvider) => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    let excludeFile = false;

    if (workspaceFolders.length > 0) {
        const ws = workspaceFolders[0];
        const localeDir = vscode.Uri.joinPath(ws.uri, vscode.workspace.getConfiguration().drevolootion.localesDirectory);

        excludeFile = event.document.uri.path.indexOf(localeDir.path) !== -1
    }

    if (!excludeFile) {
        const filename = event.document.uri.path.split('/').pop();
        excludeFile = filename.indexOf('.spec.') !== -1
    }

    if (!SUPPORTED_LANG_IDS.includes(event.document.languageId) || excludeFile) {
        return;
    }

    const documentLines = event.document.getText().split("\n");
    const findWords = documentLines
        .filter(line => {
            return line.indexOf('* ') === -1 && 
                line.indexOf('<!--') === -1 &&
                line.indexOf('//') === -1;
        })
        .filter(line => {
            return line.match(/([А-я]+)/);
        }).map(line => {
            return line.trim();
        }).filter(line => {
            return line.match(/\s/);
        }).map(line => {
            const match = line.match(/([А-я\s]+)/g).find(chunk => {
                return chunk.trim();
            });

            return match;
        });

    if (findWords.length) {
        untranslatedStorage.setStorage(findWords);
        dataProvider.refresh();
        vscode.window.showWarningMessage(`Found ${findWords.length} untranslated words. Example: "${findWords[0]}"`)
    }
};

module.exports = scanDocumentHandler;