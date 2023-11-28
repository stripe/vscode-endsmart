import {
  CancellationToken,
  FormattingOptions,
  OnTypeFormattingEditProvider,
  Position,
  ProviderResult,
  TextDocument,
  TextEdit,
  TextLine,
} from 'vscode';

const TRIGGER_STATEMENTS = [
  /(if|unless|for|while|class|module|until|def|case|begin).*/,
  /.*\sdo/,
];
const SINGLE_LINE_DEFINITION = /;\s*end[\s;]*$/;
const LINE_PARSE_LIMIT = 1000;

export default class EndsmartOnTypeFormatter
  implements OnTypeFormattingEditProvider
{
  provideOnTypeFormattingEdits(
    document: TextDocument,
    position: Position,
    _ch: string,
    options: FormattingOptions,
    _token: CancellationToken,
  ): ProviderResult<TextEdit[]> {
    const lineBeforeNewLine = document.lineAt(Math.max(0, position.line - 1));

    // If the line is whitespace, nothing to do
    if (lineBeforeNewLine.isEmptyOrWhitespace) {
      return;
    }

    // Exit early if we find out we may be dealing with a comment or a string as we don't care in that case
    const firstChar =
      lineBeforeNewLine.text[
        lineBeforeNewLine.firstNonWhitespaceCharacterIndex
      ];
    if (['#', '"', "'"].includes(firstChar)) {
      return;
    }

    // Exit early if we are in the presence of a single statement line
    if (lineBeforeNewLine.text.match(SINGLE_LINE_DEFINITION)) {
      return;
    }

    // Try to find a keyword that would indicate we need to trigger the logic
    if (!this.lineMatchOpening(lineBeforeNewLine)) {
      return;
    }

    // Save what the previous line indentation is, if we are using tabs it's directly the value
    // if using spaces we need to calculate an amount
    const indentationLevel = this.indentationFor(lineBeforeNewLine, options);

    // Cool we are good to proceed, we should see if we need to add a `end` statement now
    if (
      !this.shouldAddEnd(document, position.line, indentationLevel, options)
    ) {
      return;
    }

    // Return the edits necessary to place the end statement
    const indentationString = lineBeforeNewLine.text.substring(
      0,
      lineBeforeNewLine.firstNonWhitespaceCharacterIndex,
    );
    const insertPosition = new Position(position.line + 1, 0);
    return [
      // Add the `end` keyword with the right indentation
      TextEdit.insert(insertPosition, `${indentationString}end\n`),
    ];
  }

  private lineMatchOpening(line: TextLine): boolean {
    const mainLineContent = line.text.substring(
      line.firstNonWhitespaceCharacterIndex,
    );
    if (!TRIGGER_STATEMENTS.some((ts) => ts.test(mainLineContent))) {
      return false;
    }
    return true;
  }

  private indentationFor(line: TextLine, options: FormattingOptions) {
    return options.insertSpaces
      ? line.firstNonWhitespaceCharacterIndex / options.tabSize
      : line.firstNonWhitespaceCharacterIndex;
  }

  /* This logic is mostly lifted from the original endwise extension so that behavior
   * remains as consistent as possible.
   * Original implementation: https://github.com/kaiwood/vscode-endwise/blob/c846a9e0210a32c8d919aade048039aeb01a123a/src/extension.ts#L164
   */
  private shouldAddEnd(
    document: TextDocument,
    lineNumber: number,
    currentIndentation: number,
    options: FormattingOptions,
  ): boolean {
    let stackCount = 0;
    const documentLineCount = document.lineCount;

    // Do not add "end" if code structure is already balanced
    for (let ln = lineNumber; ln <= lineNumber + LINE_PARSE_LIMIT; ln++) {
      // Close if we are at the end of the document
      if (documentLineCount <= ln + 1) return true;

      const line = document.lineAt(ln + 1);
      const lineStartsWithEnd = line.text.startsWith(
        'end',
        line.firstNonWhitespaceCharacterIndex,
      );

      // Always close the statement if there is another closing found on a smaller indentation level
      if (
        currentIndentation > this.indentationFor(line, options) &&
        lineStartsWithEnd
      ) {
        return true;
      }

      if (currentIndentation === this.indentationFor(line, options)) {
        // If another opening is found, increment the stack counter
        if (this.lineMatchOpening(line)) {
          stackCount += 1;
        }

        if (lineStartsWithEnd && stackCount > 0) {
          stackCount -= 1;
        } else if (lineStartsWithEnd) {
          return false;
        }
      }
    }

    return false;
  }
}
