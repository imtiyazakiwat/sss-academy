/**
 * Copies the sql.js runtime out of node_modules and into `public/sql/`.
 *
 * The playground boots SQLite by injecting `/sql/sql-wasm.js` as a plain script
 * rather than importing the npm package. sql.js ships a UMD bundle that sniffs
 * for `require` / `__dirname` to locate its .wasm file, which bundlers either
 * mangle or refuse outright. Serving it as a static asset side-steps all of
 * that, keeps the ~1.1 MB wasm binary out of the JS bundle, and lets the
 * browser cache it independently of the app.
 *
 * Runs automatically via the `predev` / `prebuild` npm hooks.
 */
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const files = ["sql-wasm.js", "sql-wasm.wasm"];
const from = path.join(process.cwd(), "node_modules", "sql.js", "dist");
const to = path.join(process.cwd(), "public", "sql");

try {
  await stat(from);
} catch {
  console.error(
    "sql.js is not installed. Run `npm install` before dev/build so the playground has a SQLite runtime.",
  );
  process.exit(1);
}

await mkdir(to, { recursive: true });

for (const file of files) {
  await copyFile(path.join(from, file), path.join(to, file));
}

console.log(`sql.js runtime copied to public/sql (${files.join(", ")})`);
