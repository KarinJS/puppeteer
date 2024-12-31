# Changelog

## [1.6.0](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.5.1...puppeteer-core-v1.6.0) (2024-12-31)


### Features

* 添加静态文件处理接口，更新截图参数类型，优化模板渲染逻辑 ([0ea1e82](https://github.com/KarinJS/puppeteer/commit/0ea1e826e8460396d40215a47a32fab7698b4667))

## [1.5.1](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.5.0...puppeteer-core-v1.5.1) (2024-12-31)


### Bug Fixes

* 等待元素超时10秒，以防元素不存在等待过长 ([#28](https://github.com/KarinJS/puppeteer/issues/28)) ([c951c54](https://github.com/KarinJS/puppeteer/commit/c951c54a9f7c425b5da108e7ced5d862688a7ca3))

## [1.5.0](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.4.5...puppeteer-core-v1.5.0) (2024-12-30)


### Features

* 添加新的配置选项，支持调试模式和最大标签页数 ([975b634](https://github.com/KarinJS/puppeteer/commit/975b6348b024b730cf7c103b64c653e0d7765001))

## [1.4.5](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.4.4...puppeteer-core-v1.4.5) (2024-12-30)


### Bug Fixes

* 改进超时错误信息格式，增加详细选项信息 ([d0c11d5](https://github.com/KarinJS/puppeteer/commit/d0c11d5d182538e0aef1fffe441ee2c1a689589c))

## [1.4.4](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.4.3...puppeteer-core-v1.4.4) (2024-12-30)


### Bug Fixes

* 支持超时截图设置 ([0b54aef](https://github.com/KarinJS/puppeteer/commit/0b54aefb3b150904bb7ab08c3dac17b6d3c0fdfc))

## [1.4.3](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.4.2...puppeteer-core-v1.4.3) (2024-12-29)


### Bug Fixes

* 修复文件路径处理逻辑，增强跨平台兼容性 ([d60f2eb](https://github.com/KarinJS/puppeteer/commit/d60f2eb23e8654f961257f128d595813e5af7133))

## [1.4.2](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.4.1...puppeteer-core-v1.4.2) (2024-12-29)


### Bug Fixes

* 回退页面池 修正已知问题 ([c1750b3](https://github.com/KarinJS/puppeteer/commit/c1750b34c5938fdb4305eac1d94a76e580a320d4))

## [1.4.1](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.4.0...puppeteer-core-v1.4.1) (2024-12-27)


### Bug Fixes

* **all:** ？？？ ([c68a687](https://github.com/KarinJS/puppeteer/commit/c68a6874ca15570c8347ec1ad62bcdb0bcf1187b))

## [1.4.0](https://github.com/KarinJS/puppeteer/compare/puppeteer-core-v1.3.0...puppeteer-core-v1.4.0) (2024-12-27)


### Features

* 迁移core到此仓库 ([fe88ce3](https://github.com/KarinJS/puppeteer/commit/fe88ce36de77f60c447ca01b684d992e335d079c))

## [1.3.0](https://github.com/KarinJS/puppeteer-core/compare/v1.2.1...v1.3.0) (2024-12-27)


### Features

* 添加实验性功能以模拟0毫秒的waitUntil并支持直接传参html字符串 ([1bef5f3](https://github.com/KarinJS/puppeteer-core/commit/1bef5f34709c119c7f6b9d32ae886d5b046b4f2b))


### Bug Fixes

* eslint.config.js =&gt; eslint.config.mjs ([aa502fc](https://github.com/KarinJS/puppeteer-core/commit/aa502fce2d6f6050b4267a4104e5de15b099ba30))

## [1.2.1](https://github.com/KarinJS/puppeteer-core/compare/v1.2.0...v1.2.1) (2024-12-09)


### Bug Fixes

* import ([907725e](https://github.com/KarinJS/puppeteer-core/commit/907725e95d9500c03b98f6ac77f63648b74666e1))

## [1.2.0](https://github.com/KarinJS/puppeteer-core/compare/v1.1.4...v1.2.0) (2024-12-09)


### Features

* 下载进度条 ([ecadea5](https://github.com/KarinJS/puppeteer-core/commit/ecadea56aeaadad07f17fdc515f372532d8dad36))

## [1.1.4](https://github.com/KarinJS/puppeteer-core/compare/v1.1.3...v1.1.4) (2024-12-09)


### Bug Fixes

* 修正可能存在的内存泄漏。 ([b701d41](https://github.com/KarinJS/puppeteer-core/commit/b701d41f3362c97b5d59e26595abd38135ede351))

## [1.1.3](https://github.com/KarinJS/puppeteer-core/compare/v1.1.2...v1.1.3) (2024-11-11)


### Bug Fixes

* &lt;T&gt; extends string ? string[] : Uint8Array[] ([40b3850](https://github.com/KarinJS/puppeteer-core/commit/40b3850fef8dea074c915febd7d53cbf578c404b))

## [1.1.2](https://github.com/KarinJS/puppeteer-core/compare/v1.1.1...v1.1.2) (2024-11-11)


### Bug Fixes

* 截图返回值修正 ([b9ef6e1](https://github.com/KarinJS/puppeteer-core/commit/b9ef6e1156cfbcc9cadf107eadfa53e8753d89db))

## [1.1.1](https://github.com/KarinJS/puppeteer-core/compare/v1.1.0...v1.1.1) (2024-11-06)


### Bug Fixes

* 修正返回类型非buffer ([74b0d2d](https://github.com/KarinJS/puppeteer-core/commit/74b0d2d75378816c6436e3a0abb658d7a40021ee))

## [1.1.0](https://github.com/KarinJS/puppeteer-core/compare/v1.0.8...v1.1.0) (2024-11-04)


### Features

* 推进版本 ([b525303](https://github.com/KarinJS/puppeteer-core/commit/b525303a7e75ec2be115d93ff0313f55c146d326))

## [1.0.8](https://github.com/KarinJS/puppeteer-core/compare/v1.0.7...v1.0.8) (2024-11-04)


### Bug Fixes

* 过时的screensEval ([117d323](https://github.com/KarinJS/puppeteer-core/commit/117d32371589858d9ac09d5420cfd624de02febc))

## [1.0.7](https://github.com/KarinJS/puppeteer-core/compare/v1.0.6...v1.0.7) (2024-11-04)


### Bug Fixes

* arch ([6f80373](https://github.com/KarinJS/puppeteer-core/commit/6f803730f0a2e56a86c055d4b47794bcad016c96))
* 修正返回类型检查错误 ([753733e](https://github.com/KarinJS/puppeteer-core/commit/753733e954a33ed60e97ec76e955eae9beb4727b))

## [1.0.6](https://github.com/KarinJS/puppeteer-core/compare/v1.0.5...v1.0.6) (2024-09-28)


### Bug Fixes

* setRequestInterception ([ef5a65b](https://github.com/KarinJS/puppeteer-core/commit/ef5a65b66638883d1c901a6a243e4afc3e261a91))

## [1.0.5](https://github.com/KarinJS/puppeteer-core/compare/v1.0.4...v1.0.5) (2024-09-26)


### Bug Fixes

* 统一缓存目录 ([302068d](https://github.com/KarinJS/puppeteer-core/commit/302068de0a0a2f46dedc72afc8b31a71c9c4af17))

## [1.0.4](https://github.com/KarinJS/puppeteer-core/compare/v1.0.3...v1.0.4) (2024-09-24)


### Bug Fixes

* add setRequestInterception ([7b74259](https://github.com/KarinJS/puppeteer-core/commit/7b74259644da29e99a2d0ad139e77e2bbd555ddf))

## [1.0.3](https://github.com/KarinJS/puppeteer-core/compare/v1.0.2...v1.0.3) (2024-09-09)


### Bug Fixes

* return this ([88a474c](https://github.com/KarinJS/puppeteer-core/commit/88a474cf5a7ee697ba4e5b9ba2aa8a8519d4b289))

## [1.0.2](https://github.com/KarinJS/puppeteer-core/compare/v1.0.1...v1.0.2) (2024-09-09)


### Bug Fixes

* dir ([465a64e](https://github.com/KarinJS/puppeteer-core/commit/465a64ef6882d19c0dedf9b241979616b6cbb389))

## [1.0.1](https://github.com/KarinJS/puppeteer-core/compare/v1.0.0...v1.0.1) (2024-09-09)


### Bug Fixes

* src ([c090176](https://github.com/KarinJS/puppeteer-core/commit/c0901762ca8604c9360e39846ecbf435cae61c7e))

## 1.0.0 (2024-09-07)


### Features

* init ([429dcf6](https://github.com/KarinJS/puppeteer-core/commit/429dcf60e6656a18ee04f1825bbda67edb5925ea))


### Bug Fixes

* Create LICENSE ([5d284a9](https://github.com/KarinJS/puppeteer-core/commit/5d284a9149e3fbd5e7150d0d8b64c3c8c7ab805f))
