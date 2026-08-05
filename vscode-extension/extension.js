'use strict';
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
const vscode = require('vscode');

let client;

function activate(context) {
  const config = vscode.workspace.getConfiguration('skillscan');
  const serverPath = config.get('serverPath') || 'skillscan';

  const serverOptions = {
    run: {
      command: serverPath,
      args: ['lsp'],
      transport: TransportKind.stdio,
    },
    debug: {
      command: serverPath,
      args: ['lsp'],
      transport: TransportKind.stdio,
    },
  };

  const clientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'markdown' },
      { scheme: 'file', language: 'yaml' },
      { scheme: 'file', language: 'plaintext' },
    ],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{md,yml,yaml,txt}'),
    },
  };

  client = new LanguageClient('skillscan', 'SkillScan', serverOptions, clientOptions);
  client.start();

  context.subscriptions.push(
    vscode.commands.registerCommand('skillscan.restart', () => {
      client.restart();
    }),
  );
}

function deactivate() {
  if (client) return client.stop();
}

module.exports = { activate, deactivate };
