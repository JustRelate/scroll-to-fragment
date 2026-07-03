import { esbuildPlugin } from "@web/dev-server-esbuild";
import { playwrightLauncher } from "@web/test-runner-playwright";
import { fromRollup } from "@web/dev-server-rollup";
import replace from "@rollup/plugin-replace";

const replacePlugin = fromRollup(replace);

export default {
  files: "spec/**/*.spec.ts",
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: "chromium" }),
    playwrightLauncher({ product: "firefox" }),
    playwrightLauncher({ product: "webkit" }),
  ],
  plugins: [
    replacePlugin({ "process.env.NODE_ENV": '"production"', preventAssignment: true }),
    esbuildPlugin({ ts: true }),
  ],
};
