import * as assert from 'assert';

import * as vscode from 'vscode';
import EndsmartOnTypeFormatter from '../formatter';

suite('formatter tests', () => {
  const createDocument = async (
    content: string,
  ): Promise<vscode.TextDocument> =>
    vscode.workspace.openTextDocument({
      language: 'ruby',
      content,
    });

  const runFormatter = async (
    content: string,
  ): Promise<[vscode.TextEdit[] | undefined | null, vscode.TextDocument]> => {
    const formatter = new EndsmartOnTypeFormatter();
    // Cursor should be after the newline
    const cursorPosition = content.indexOf('$') + 1;
    // Create a document where the newline was added where the cursor was
    const doc = await createDocument(content.replace('$', '\n'));
    const cancellationToken = new vscode.CancellationTokenSource().token;
    const edits = await formatter.provideOnTypeFormattingEdits(
      doc,
      doc.positionAt(cursorPosition),
      '\n',
      {insertSpaces: true, tabSize: 2},
      cancellationToken,
    );
    return [edits, doc];
  };

  const applyEdits = async (
    doc: vscode.TextDocument,
    edits: vscode.TextEdit[],
  ): Promise<boolean> => {
    const workspaceEdit = new vscode.WorkspaceEdit();
    edits.forEach((edit) =>
      workspaceEdit.replace(doc.uri, edit.range, edit.newText),
    );
    return await vscode.workspace.applyEdit(workspaceEdit);
  };

  test('can add end to a block', async () => {
    const content = 'if foo$';
    const [edits] = await runFormatter(content);

    assert.notStrictEqual(edits, null);
    assert.strictEqual(edits?.length, 1);
    assert.strictEqual(edits![0].newText, 'end\n');
    // Inserted at end of document
    assert.deepEqual(edits![0].range, new vscode.Range(2, 0, 2, 0));
  });

  test('does not add end if it exists already', async () => {
    const content = 'if foo$\nend';
    const [edits] = await runFormatter(content);

    // No edits should be returned since the doc is balanced
    assert.strictEqual(edits, undefined);
  });

  test('support nested blocks, add end', async () => {
    const content = `
if foo
  begin$
end`;
    const [edits] = await runFormatter(content);

    assert.notStrictEqual(edits, null);
    assert.strictEqual(edits?.length, 1);
    assert.strictEqual(edits![0].newText, '  end\n');
    // Inserted after begin and before the last end
    assert.deepEqual(edits![0].range, new vscode.Range(4, 0, 4, 0));
  });

  test('support nested blocks, does not add end', async () => {
    const content = `
if foo
  begin$
  end
end`;
    const [edits] = await runFormatter(content);

    // No edits should be returned since the doc is balanced
    assert.strictEqual(edits, undefined);
  });

  test('does not add end with a return if statement', async () => {
    const content = `
return if foo$`;
    const [edits] = await runFormatter(content);
    assert.strictEqual(edits, undefined);
  });

  test('does not add end to a random statement even a portion of a trigger keyword is in it', async () => {
    const content = `
Module::Factorify::SbeginClass.method()$`;
    const [edits] = await runFormatter(content);
    assert.strictEqual(edits, undefined);
  });

  test('does not add end if cursor is inside an if statement expression', async () => {
    const content = 'if ![$]';
    const [edits] = await runFormatter(content);
    assert.strictEqual(edits, undefined);
  });
});
