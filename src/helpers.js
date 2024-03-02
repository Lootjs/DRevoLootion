const vscode = require('vscode');
const findTranslation = (word, dictionary) => {
	return word.split('.').reduce((o, i, t, arr)=> {
        if (!o) {
            arr = [];
            return;
        }
        return o[i]
    }, dictionary);
}

const i18nContentRegex = /<i18n>(.*?)<\/i18n>/s;
const hasInlineTranslations = (content) => content.includes('<i18n>');

const extractTranslations = (key, content) => {
    const match = content.match(i18nContentRegex);

    if (!match || !match[1]) {
        return;
    }

    const messages = JSON.parse(match[1]);
    let mdString = '';
    let hasTranslation = false;

    Object.entries(messages).forEach(([locale, dictionary]) => {
        const translate = findTranslation(key, dictionary);
        if (translate && !hasTranslation) {
            hasTranslation = true;
        }
        mdString += `*${locale}*: ${translate}\n\n`;
    })

    if (!hasTranslation) {
        return;
    }

    return new vscode.Hover(
        new vscode.MarkdownString(mdString)
    );
}

const extractInlineDict = (content) => {
    const match = content.match(i18nContentRegex);

    if (!match || !match[1]) {
        return;
    }

    return JSON.parse(match[1]);
}


module.exports = {
    findTranslation,
    hasInlineTranslations,
    extractTranslations,
    extractInlineDict,
}