import { readFileSync } from "node:fs";
import installed from "@larsen-utvikling/create-next-app/package.json" with { type: "json" };

// Local builds can verify a release candidate. Hosted builds require publication.
if (process.env.VERCEL || process.argv.includes("--require-published")) {
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url)));
  const expected = lock.packages["node_modules/@larsen-utvikling/create-next-app"];
  const response = await fetch(`https://registry.npmjs.org/@larsen-utvikling%2fcreate-next-app/${installed.version}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`CLI ${installed.version} is not published. Publish the verified CLI tarball before deploying this site.`);
  const published = await response.json();
  if (published.version !== installed.version || published.dist.integrity !== expected.integrity || published.gitHead !== installed.gitHead) {
    throw new Error("Published CLI identity does not match the locally verified release candidate. Reinstall and verify before deployment.");
  }
  console.log(`Verified published CLI ${installed.version} at ${published.gitHead}`);
}
