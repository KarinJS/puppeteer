# Puppeteer-Server 测试指南

本文档提供有关如何运行和编写 puppeteer-server 单元测试的信息。

## 运行测试

项目使用 [Vitest](https://vitest.dev/) 作为测试框架。以下是可用的测试脚本：

### 运行所有测试

```bash
pnpm test
```

### 以监视模式运行测试

这将在文件更改时自动重新运行测试：

```bash
pnpm test:watch
```

### 运行测试覆盖率报告

```bash
pnpm test:coverage
```

覆盖率报告将生成在 `coverage` 目录下。

## 测试文件结构

测试文件应与被测试的源文件放在同一目录中，并使用 `.test.ts` 后缀。例如：

- `src/server/router/ping.ts` 的测试文件应为 `src/server/router/ping.test.ts`

## 已实现的测试

项目已经包含以下模块的测试：

1. **主应用初始化** (`src/index.test.ts`)：测试整个应用的启动流程。
2. **Puppeteer集成** (`src/puppeteer/index.test.ts`)：测试浏览器实例的创建和配置更新功能。
3. **HTTP响应工具** (`src/server/utils/response.test.ts`)：测试HTTP响应函数。
4. **API路由处理** (`src/server/router/ping.test.ts`)：测试ping路由功能。
5. **配置管理** (`src/utils/config.test.ts`)：测试配置读取和更新机制。

## 编写新测试

添加新测试时，请遵循以下最佳实践：

1. **使用模拟（Mocking）**：使用 `vi.mock()` 来模拟外部依赖。
2. **提供描述性的测试名称**：使用清晰的描述来命名测试用例。
3. **测试隔离**：每个测试应该是独立的，不依赖于其他测试的状态。
4. **使用 `beforeEach` 和 `afterEach`**：在每个测试之前和之后进行适当的清理。

示例测试：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myFunction } from './myModule'

// 模拟依赖
vi.mock('./dependency', () => ({
  dependencyFunction: vi.fn().mockReturnValue('mocked value')
}))

describe('MyModule测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确执行某个功能', () => {
    const result = myFunction()
    expect(result).toBe('expected value')
  })
})
```

## 处理类型错误

如果遇到与Vitest相关的类型错误，可以参考 `src/types/vitest.d.ts` 中的类型定义。 