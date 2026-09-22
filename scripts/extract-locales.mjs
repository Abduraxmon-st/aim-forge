import ts from "typescript";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
async function walk(p) {
  return (
    await Promise.all(
      (await readdir(p, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(join(p, e.name)) : [join(p, e.name)],
      ),
    )
  ).flat();
}
const keys = new Set();
function literals(node) {
  if (ts.isStringLiteral(node) && node.text) keys.add(node.text);
  else if (ts.isConditionalExpression(node)) {
    literals(node.whenTrue);
    literals(node.whenFalse);
  }
}
for (const file of await walk("src"))
  if (/\.(ts|tsx)$/.test(file)) {
    const s = ts.createSourceFile(
      file,
      await readFile(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (n) => {
      if (
        ts.isCallExpression(n) &&
        (n.expression.getText(s) === "t" ||
          n.expression.getText(s) === "i18n.t") &&
        n.arguments[0]
      )
        literals(n.arguments[0]);
      ts.forEachChild(n, visit);
    };
    visit(s);
  }
const existing = JSON.parse(await readFile("src/i18n/locales/en.json", "utf8"));
for (const k of keys) existing[k] ??= k;
await writeFile(
  "src/i18n/locales/en.json",
  JSON.stringify(
    Object.fromEntries(
      Object.entries(existing).sort(([a], [b]) => a.localeCompare(b)),
    ),
    null,
    2,
  ) + "\n",
);
console.log(keys.size + " static UI keys");
