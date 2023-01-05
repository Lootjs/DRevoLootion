const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { findTranslation } = require('./helpers');

module.exports = {
    provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const findReg = linePrefix.match(/\$?t\((.*)/);

        if (findReg.length < 1) {
            return;
        }

        const key = findReg[1].replaceAll('\'', '').slice(0, -1);
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const ws = workspaceFolders[0];
        const localeDir = vscode.Uri.joinPath(ws.uri, vscode.workspace.getConfiguration().drevolootion.localesDirectory);
        const localeFile = `${vscode.workspace.getConfiguration().drevolootion.defaultLocale}.json`;
        const fullUri = path.resolve(localeDir.fsPath, localeFile);
        const content = fs.readFileSync(fullUri, 'utf8');
        const dict = JSON.parse(content);
        const foundKey = key.length > 0 ? findTranslation(key, dict) : dict;

        if (typeof foundKey === 'string') {
            return;
        }

        const completes = Object.keys(foundKey).map(str => {
            const translateKey = (key.length ? key + '.' : '') + str;
            const translate = findTranslation(translateKey, dict);
            const isText = typeof translate === 'string';
            let completeIt = new vscode.CompletionItem(String(str));
            completeIt.kind = isText ? vscode.CompletionItemKind.Text : vscode.CompletionItemKind.Field;
            completeIt.detail = isText ? translate : 'object';
            completeIt.insertText = str;

            return completeIt;
        });

        return completes;
    }
  }