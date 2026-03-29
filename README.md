# PixelHeic v1

PixelHeic 是一个纯浏览器端的 HEIC / HEIF 转换工具，面向苹果照片格式，支持导出为 JPG、PNG、WEBP。

## 当前能力

| 类型 | 方案 |
|---|---|
| HEIC / HEIF 解码 | `heic-to/next` 浏览器端 worker 解码 |
| JPG 导出 | canvas 编码 + 关键 EXIF 回写 |
| PNG 导出 | canvas 无损导出 |
| WEBP 导出 | canvas 编码 |
| 元数据读取 | `exifr` 读取拍摄时间、设备信息、GPS、方向 |
| 批量下载 | `JSZip` 浏览器端打包 |

## 产品特性

- 纯前端本地转换，不依赖服务端上传处理
- 延续 PixelSmall / PixelTurn 家族三段式外壳
- 中英双语
- 多文件队列、单文件下载、ZIP 批量下载
- 默认提供“尽量保留元数据”选项
- JPG 尽量回写关键 EXIF；PNG / WEBP 在 v1 明确提示不保证完整保留
- Live Photo / 多帧 HEIC 当前只导出第一张静态画面

## 项目结构

| 路径 | 说明 |
|---|---|
| `src/App.tsx` | 页面骨架、队列、配置区、处理流程 |
| `src/components/` | 上传区、队列、提示、工作区头部 |
| `src/lib/heic.ts` | HEIC 解码、方向归一化、导出 |
| `src/lib/exif.ts` | 元数据读取与 JPG EXIF 回写 |
| `src/lib/copy.ts` | 中英文文案 |
| `src/index.css` | 家族化样式与响应式布局 |

## 本地运行

```bash
npm install
npm run dev
```

## 构建检查

```bash
npm run lint
npm run build
```

## 部署

| 项目 | 值 |
|---|---|
| Framework preset | `Vite` |
| Root directory | 仓库根目录 |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | 无 |
