const vscode = require('vscode');
const fs = require('fs');
const { findTranslation } = require('./helpers');

module.exports = {
    async provideHover(hoveredDoc, position) {
        const range = hoveredDoc.getWordRangeAtPosition(position);
        const word = hoveredDoc.getText(range);
        const line = hoveredDoc.lineAt(position.line);
        const findReg = line.text.match(/t\(.*?\)/g);

        if (!findReg || findReg.length === 0) {
            return;
        }

        const prevSymbol = line.text.indexOf(findReg[0]) - 1;
        const allowedSymbols = ['', ' ', '\t', '$', '{', '(', undefined]

        if (!allowedSymbols.includes(line.text[prevSymbol])) {
            return;
        }

        const findHoveredFunctionInvoke = findReg.find(part => part.indexOf(word) !== -1);
        const fnInvoke = findHoveredFunctionInvoke || findReg[0];
        const keys = fnInvoke.match(/'(.*?)'/);
        const key = keys[0].replaceAll('\'', '');
        let messages = {};
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let mdString = '';

        if (workspaceFolders.length > 0) {
            const ws = workspaceFolders[0];
            try {
            const localeDir = vscode.Uri.joinPath(ws.uri, vscode.workspace.getConfiguration().drevolootion.localesDirectory);
            const localeFiles = await vscode.workspace.fs.readDirectory(localeDir);
            for (let [localeFile] of localeFiles) {
                const locale = localeFile.replace('.json', '');
                const localeFilePath = vscode.Uri.joinPath(localeDir, localeFile);
                const content = fs.readFileSync(localeFilePath.fsPath);
                messages[locale] = JSON.parse(content);
                const translate = findTranslation(key, messages[locale]);
                mdString += `*${locale}*: ${translate}\n\n`;
                }
            } catch (e) { console.log(e) };
        }

        return new vscode.Hover(
            new vscode.MarkdownString(mdString)
        );
    }
};
