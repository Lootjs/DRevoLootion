const vscode = require('vscode');
const untranslatedStorage = require('./untranslatedStorage');

module.exports = class TreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.data = []
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    return untranslatedStorage.getStorage().map(string => {
      return new vscode.TreeItem(string);
    });
  }

  refresh() {
    this._onDidChangeTreeData.fire()
  }
}