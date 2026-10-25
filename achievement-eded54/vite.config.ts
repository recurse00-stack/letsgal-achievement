import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// 这个扩展有两个入口，分两次构建到同一个 dist/（Studio 加载扩展时不支持分包）：
//   vite build                → dist/index.js   游戏运行时入口（src/index.tsx）
//   vite build --mode studio  → dist/studio.js  Studio 编辑期入口（src/studio.tsx）
// npm run build 依次跑这两次；npm run watch 同时监听两个入口。

// 游戏运行时入口不打包的共享依赖：与只有游戏运行时入口的扩展同一份精确名单，
// 其他子路径（如 react-dom/client）照常打包进 dist/index.js。
const RUNTIME_EXTERNALS = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@avg-studio/sdk",
];

// 编辑期入口里由 Studio 提供的共享包。按包名判断，子路径（如 react/jsx-runtime）也算。
const SHARED_PACKAGES = [
  "react",
  "react-dom",
  "@avg-studio/sdk",
];

// 只在 Studio 编辑期入口里可用的包（含子路径），由 Studio 在加载时提供；游戏运行时代码不能引用。
const STUDIO_ONLY_PACKAGES = [
  "@chakra-ui/react",
  "@avg-studio/studio-ui",
];

// Chakra 内部用的包（整个作用域）。Studio 自带一份，编辑期入口里绝不打包。
const STUDIO_INTERNAL_SCOPES = [
  "@emotion/",
  "@ark-ui/",
];

// source 是 pkg 本身或它的子路径。只看包名："react" 不会误伤 "react-colorful"。
function isPackageOrSubpath(source: string, pkg: string): boolean {
  return source === pkg || source.startsWith(`${pkg}/`);
}

function isStudioOnlyImport(source: string): boolean {
  return STUDIO_ONLY_PACKAGES.some((pkg) => isPackageOrSubpath(source, pkg));
}

// 编辑期入口保持外部引用的包。Studio 只能加载 RUNTIME_EXTERNALS 里那几个与 Chakra、组件包的
// 根路径；其他子路径与 @emotion/*、@ark-ui/* 故意留在产物里，Studio 加载时会拒绝并说明改法，
// 不会打包出第二份实例。
function isStudioEntryExternal(source: string): boolean {
  return (
    SHARED_PACKAGES.some((pkg) => isPackageOrSubpath(source, pkg)) ||
    isStudioOnlyImport(source) ||
    STUDIO_INTERNAL_SCOPES.some((scope) => source.startsWith(scope))
  );
}

// 游戏运行时代码一旦引用 Chakra 或 Studio 组件包（含子路径），构建直接报错。
function studioOnlyGuard(): Plugin {
  return {
    name: "avg-studio-only-imports",
    enforce: "pre",
    resolveId(source, importer) {
      if (isStudioOnlyImport(source)) {
        this.error(
          `${source} 只能在 src/studio.tsx（Studio 编辑期入口）里使用，游戏运行时代码不能引用它（来自 ${importer ?? "未知文件"}）。`,
        );
      }
      return null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const studio = mode === "studio";
  return {
    plugins: studio ? [react()] : [react(), studioOnlyGuard()],
    build: {
      lib: {
        entry: path.resolve(__dirname, studio ? "src/studio.tsx" : "src/index.tsx"),
        formats: ["es"],
        fileName: () => (studio ? "studio.js" : "index.js"),
      },
      rollupOptions: {
        external: studio ? isStudioEntryExternal : RUNTIME_EXTERNALS,
        // 打包进来的库用了动态 import() 也合进同一个文件：Studio 只能加载单个文件。
        output: { inlineDynamicImports: true },
      },
      outDir: "dist",
      // 两次构建共用 dist/，都不能清空目录，否则会删掉另一个入口的产物。
      emptyOutDir: false,
      sourcemap: true,
      minify: false,
    },
  };
});
