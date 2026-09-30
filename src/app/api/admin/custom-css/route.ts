import fs from "node:fs";
import path from "node:path";

import { handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";

const CUSTOM_CSS_PATH = path.join(process.cwd(), "src/styles/custom.css");
const VERSIONS_PATH = path.join(process.cwd(), "src/styles/custom-css-versions.json");
const MAX_VERSIONS = 10;

type CssVersion = {
  css: string;
  savedAt: string;
};

function readVersions(): CssVersion[] {
  if (!fs.existsSync(VERSIONS_PATH)) return [];

  try {
    return JSON.parse(fs.readFileSync(VERSIONS_PATH, "utf8")) as CssVersion[];
  } catch {
    return [];
  }
}

function saveVersions(versions: CssVersion[]) {
  fs.writeFileSync(VERSIONS_PATH, JSON.stringify(versions, null, 2), "utf8");
}

export async function GET(request: Request) {
  try {
    await requirePermission(request, "settings.update");

    const css = fs.existsSync(CUSTOM_CSS_PATH) ? fs.readFileSync(CUSTOM_CSS_PATH, "utf8") : "";
    const versions = readVersions();

    return ok({ css, versions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission(request, "settings.update");

    const body = (await request.json()) as { css?: string };
    const css = typeof body.css === "string" ? body.css : "";

    const currentCss = fs.existsSync(CUSTOM_CSS_PATH) ? fs.readFileSync(CUSTOM_CSS_PATH, "utf8") : "";

    if (currentCss.trim()) {
      const versions = readVersions();

      versions.unshift({ css: currentCss, savedAt: new Date().toISOString() });

      if (versions.length > MAX_VERSIONS) {
        versions.length = MAX_VERSIONS;
      }

      saveVersions(versions);
    }

    fs.writeFileSync(CUSTOM_CSS_PATH, css, "utf8");

    const versions = readVersions();

    return ok({ css, updatedAt: new Date().toISOString(), versions });
  } catch (error) {
    return handleApiError(error);
  }
}
