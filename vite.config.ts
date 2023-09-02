import { resolve } from './node_modules/.store/vite-tsconfig-paths@4.2.0/node_modules/vite-tsconfig-paths/src/path';
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

import electron from "vite-plugin-electron"
import electronRenderer from "vite-plugin-electron-renderer"
import polyfillExports from "vite-plugin-electron-renderer"

import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: "electron/entry.ts", // 主进程文件
      },
      preload: {
        input: "electron/preload.ts", // 预加载文件
      },
    }),
    electronRenderer(),
    polyfillExports()
  ],
  build: {
    emptyOutDir: false, // 默认情况下，若 outDir 在 root 目录下，则 Vite 会在构建时清空该目录
  },
  resolve: {
    alias: [
      {
        find: '@', replacement: path.resolve(__dirname, 'src')
      }
    ]
  }
})