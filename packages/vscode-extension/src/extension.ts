/**
 * Axiomatic Color — VS Code Extension
 *
 * Provides:
 * - Config validation with composition diagnostics
 * - Surface inspection (hover to see contrast values)
 * - Dead zone warnings
 *
 * Stub — implementation TBD.
 */

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  const validateCommand = vscode.commands.registerCommand("axiomatic-color.validate", () => {
    vscode.window.showInformationMessage("Axiomatic Color: validation not yet implemented.");
  });

  const inspectCommand = vscode.commands.registerCommand("axiomatic-color.inspect", () => {
    vscode.window.showInformationMessage("Axiomatic Color: inspection not yet implemented.");
  });

  context.subscriptions.push(validateCommand, inspectCommand);
}

export function deactivate(): void {
  // cleanup
}
