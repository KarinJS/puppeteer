> [!IMPORTANT]  
> Snapka 由 **“Snap”**（截图）和日式语感的 **“-ka”** 组合而成，整体读起来轻快顺口。
>
> - **Snap**：代表截图（Snapshot / Screenshot），突出核心功能。
> - **ka（カ）**：灵感来自日语中常见的词尾，如「メカ（Mecha，机械）」或「ガチャ（Gacha，扭蛋）」。

## 类型

目前 `@karinjs/puppeteer-core` 和 `@karinjs/puppeteer` 拆分了类型，需要单独安装类型包。

类型太大了 qaq。

1. 类型包映射

- `@karinjs/puppeteer`：`@karinjs/puppeteer`
- `@karinjs/puppeteer-core`: `@karinjs/puppeteer-core-types`

2. `tsconfig.json` 配置

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./lib",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@karinjs/puppeteer": ["node_modules/@karinjs/puppeteer-types"], // 安装哪个包 就写对应的映射
      "@karinjs/puppeteer-core": ["node_modules/@karinjs/puppeteer-core-types"] // 安装哪个包 就写对应的映射
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib"]
}
```
