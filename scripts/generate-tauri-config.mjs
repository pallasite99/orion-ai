import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packageJsonPath = path.join(root, "package.json");
const outputPath = path.join(root, "src-tauri", "tauri.conf.json");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const frontendDist = process.env.ORION_TAURI_FRONTEND_URL ?? "http://localhost:3000";

const config = {
  productName: "ORION",
  version: packageJson.version,
  identifier: "com.pallasite99.orion",
  build: {
    beforeDevCommand: "npm run dev",
    beforeBuildCommand: "",
    devUrl: "http://localhost:3000",
    frontendDist,
  },
  app: {
    security: {
      csp: null,
    },
    windows: [
      {
        title: "ORION",
        width: 1280,
        height: 860,
        minWidth: 1100,
        minHeight: 760,
        resizable: true,
        fullscreen: false,
      },
    ],
  },
  bundle: {
    active: true,
    targets: ["msi"],
    category: "Productivity",
    shortDescription: "Personal AI operating system for chat, memory, files, and automation.",
    longDescription:
      "ORION is a personal AI operating system with chat, memory, tasks, files, voice, automation, inbox capture, and self-learning.",
    icon: [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.ico",
    ],
    windows: {
      wix: {
        language: "en-US",
        upgradeCode: "A9C1B5D4-3D6E-4E1E-8B49-1A0D8B7E64F2",
      },
    },
  },
  plugins: {},
};

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`);
