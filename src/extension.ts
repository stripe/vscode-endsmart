import { ExtensionContext, languages } from "vscode";
import EndsmartOnTypeFormatter from "./formatter";

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    languages.registerOnTypeFormattingEditProvider(
      { scheme: "file", language: "ruby" },
      new EndsmartOnTypeFormatter(),
      "\n"
    )
  );
}

export function deactivate() {}
