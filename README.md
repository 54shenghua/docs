# 54sh 文档站

> 中南大学网络信息部/升华工作室文档中心

### 🎯 文档内容

- **项目指南** - 升华网项目概述、技术栈介绍、开发团队信息
- **代码规范** - 前后端开发规范、Git 工作流、代码审查标准
- **解决方案** - 常见技术问题的解决方案和最佳实践
- **使用指南** - 文档站使用说明、Markdown 编写规范

### 🏗️ 技术架构

- **框架**: Next.js 15.2.5
- **样式**: Tailwind CSS + DaisyUI
- **内容**: Markdown 驱动
- **部署**: 静态站点生成 (SSG)
- **包管理**: pnpm

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- pnpm 9.12.3+

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/54shenghua/docs.git
   cd docs
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **访问站点**
   
   打开浏览器访问 [http://localhost:9988](http://localhost:9988)

### 构建部署

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 📝 参与贡献

### 文档编写

1. Fork 本仓库到您的 GitHub 账户
2. 创建新的功能分支
3. 在 `markdown/sections/` 目录下编写或修改文档
4. 提交 Pull Request

### 文档结构

```
markdown/sections/
├── guide/           # 项目指南
├── shenghua-web/    # 升华网项目文档
├── styleguide/      # 代码规范
├── solutions/       # 解决方案
└── site-usage/      # 使用指南
```

### 编写规范

- 使用 Markdown 格式编写
- 遵循现有的文档结构和命名规范
- 保持内容简洁明了，逻辑清晰
- 适当使用提示框、警告框等组件增强可读性

## 📋 可用脚本

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
pnpm format       # 代码格式化
```

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🤝 联系我们

- **项目仓库**: [https://github.com/54shenghua/docs](https://github.com/54shenghua/docs)
- **升华网项目**: [https://github.com/54shenghua/shenghua-web](https://github.com/54shenghua/shenghua-web)

---

*最后更新: 2025年 9月*