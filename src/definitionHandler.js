const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { findTranslation, hasInlineTranslations, extractInlineDict } = require('./helpers');

const findLocation = (translatedKey, content, clickedRelativeUri) => {
    let pos = 0;

    const line = content.split("\n").find((value, index) => {
        const check = value.indexOf(clickedRelativeUri) !== -1 && value.indexOf(translatedKey) !== -1;

        if (check) {
            pos = index;
        }

        return check;
    });
    const charPos = line.indexOf(translatedKey);

    return {
        pos,
        charPos,
    }
}

module.exports = class DefinitionProvider {
    provideDefinition(defDocument, position) {
        const fileContent = defDocument.getText();
        const wordRange = defDocument.getWordRangeAtPosition(position)
        const clickedRelativeUri = defDocument.getText(wordRange)
        const containingLine = defDocument.lineAt(position.line).text;

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
            if (hasInlineTranslations(fileContent)) {
                const inlineDict = extractInlineDict(fileContent);
                const defaultDict = inlineDict[vscode.workspace.getConfiguration().drevolootion.defaultLocale];
                const foundInlineTranslation = findTranslation(key, defaultDict);

                if (foundInlineTranslation) {
                    const { pos, charPos } = findLocation(foundInlineTranslation, fileContent, clickedRelativeUri);

                    return new vscode.Location(defDocument.uri, new vscode.Position(pos, charPos));
                }
            }
            const localeDir = vscode.Uri.joinPath(ws.uri, vscode.workspace.getConfiguration().drevolootion.localesDirectory);
            const localeFile = `${vscode.workspace.getConfiguration().drevolootion.defaultLocale}.json`;
            const fullUri = path.resolve(localeDir.fsPath, localeFile);
            const content = fs.readFileSync(fullUri, 'utf8');
            const dict = JSON.parse(content);
            const translatedKey = findTranslation(key, dict);
            const { pos, charPos } = findLocation(translatedKey, content, clickedRelativeUri)

            return new vscode.Location(vscode.Uri.file(fullUri), new vscode.Position(pos, charPos));
        }
    }
}
