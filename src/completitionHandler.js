const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { findTranslation, hasInlineTranslations, extractInlineDict } = require('./helpers');

const collectCompletes = (foundKey, key, dict) => {
    return Object.keys(foundKey).map(str => {
        const translateKey = (key.length ? key + '.' : '') + str;
        const translate = findTranslation(translateKey, dict);
        const isText = typeof translate === 'string';
        let completeIt = new vscode.CompletionItem(String(str));
        completeIt.kind = isText ? vscode.CompletionItemKind.Text : vscode.CompletionItemKind.Field;
        completeIt.detail = isText ? translate : 'object';
        completeIt.insertText = str;

        return completeIt
    });
}

module.exports = {
    provideCompletionItems(doc, position) {
        const linePrefix = doc.lineAt(position).text.substring(0, position.character);
        const findReg = linePrefix.match(/\$?t\((.*)/);
        const fileContent = doc.getText();

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
        let dict = JSON.parse(content);
        let foundKey = key.length > 0 ? findTranslation(key, dict) : dict;

        if (typeof foundKey === 'string') {
            return;
        }

        if (hasInlineTranslations(fileContent)) {
            const inlineDict = extractInlineDict(fileContent);
            const defaultDict = inlineDict[vscode.workspace.getConfiguration().drevolootion.defaultLocale];
            const appendDict = key.length > 0 ? findTranslation(key, defaultDict) : defaultDict;

            if (typeof appendDict !== 'string') {
                if (foundKey) {
                    Object.assign(foundKey, appendDict)
                    Object.assign(dict, defaultDict)
                } else {
                    foundKey = appendDict
                    dict = defaultDict
                }
            }
        }

        return collectCompletes(foundKey, key, dict);
    }
  }
