// 同时监听两个入口：改游戏运行时代码重建 dist/index.mjs，改 Studio 编辑期界面重建 dist/studio.js。
// 两个入口仍是分开构建（Studio 加载扩展时不支持分包），这里只是把两个监听放进同一个终端。
import { build } from "vite";

await Promise.all([
  build({ build: { watch: {} } }),
  build({ mode: "studio", build: { watch: {} } }),
]);
