const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { findTranslation } = require('./helpers');

module.exports = class DefinitionProvider {
    provideDefinition(document, position) {
        const wordRange = document.getWordRangeAtPosition(position)
        const clickedRelativeUri = document.getText(wordRange)
        const containingLine = document.lineAt(position.line).text;

        const findReg = containingLine.match(/\$?t\(.*?\)/g);
        if (findReg.length === 0) {
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders.length === 0) {
            return;
        }
        const ws = workspaceFolders[0];
        const findHoveredFunctionInvoke = findReg.find(part => part.indexOf(clickedRelativeUri) !== -1);
        const fnInvoke = findHoveredFunctionInvoke || findReg[0];
        const keys = fnInvoke.match(/'(.*?)'/);
        const key = keys[0].replaceAll('\'', '');
        if (key) {
            const localeDir = vscode.Uri.joinPath(ws.uri, vscode.workspace.getConfiguration().drevolootion.localesDirectory);
            const localeFile = `${vscode.workspace.getConfiguration().drevolootion.defaultLocale}.json`;
            const fullUri = path.resolve(localeDir.fsPath, localeFile);
            const content = fs.readFileSync(fullUri, 'utf8');
            const dict = JSON.parse(content);
            const translatedKey = findTranslation(key, dict);
            let pos = 0;
            const line = content.split("\n").find((value, index) => {
                const check = value.indexOf(clickedRelativeUri) !== -1 && value.indexOf(translatedKey) !== -1;

                if (check) {
                    pos = index;
                }

                return check;
            });
            const charPos = line.indexOf(translatedKey);

            return new vscode.Location(vscode.Uri.file(fullUri), new vscode.Position(pos, charPos));
        }
    }
}