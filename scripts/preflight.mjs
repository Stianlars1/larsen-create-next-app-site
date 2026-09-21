import { validateAdminCredentials } from "../src/lib/admin/credential-policy.ts";

const errors = [];
const has = (key) => Object.hasOwn(process.env, key);
const value = (key) => process.env[key];

const adminKeys = ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"];
if (adminKeys.some(has)) {
  const validation = validateAdminCredentials(
    value("ADMIN_PASSWORD"),
    value("ADMIN_SESSION_SECRET"),
  );
  if (!validation.ok) {
    errors.push(
      `ADMIN_PASSWORD and ADMIN_SESSION_SECRET must be complete and valid (${validation.reason}).`,
    );
  }
}

const publicUmamiKeys = ["NEXT_PUBLIC_UMAMI_SRC", "NEXT_PUBLIC_UMAMI_WEBSITE_ID"];
if (publicUmamiKeys.some(has)) {
  const src = value("NEXT_PUBLIC_UMAMI_SRC");
  const websiteId = value("NEXT_PUBLIC_UMAMI_WEBSITE_ID");
  if (!src || !websiteId) {
    errors.push("NEXT_PUBLIC_UMAMI_SRC and NEXT_PUBLIC_UMAMI_WEBSITE_ID must both be set.");
  }
}

const serverUmamiKeys = [
  "UMAMI_API_URL",
  "UMAMI_WEBSITE_ID",
  "UMAMI_API_KEY",
];
if (serverUmamiKeys.some(has)) {
  const base = value("UMAMI_API_URL");
  const websiteId = value("UMAMI_WEBSITE_ID");
  const apiKey = value("UMAMI_API_KEY");

  if (!base || !websiteId) {
    errors.push("UMAMI_API_URL and UMAMI_WEBSITE_ID must both be set.");
  } else if (!apiKey) {
    errors.push("UMAMI_API_KEY must be set.");
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
}
