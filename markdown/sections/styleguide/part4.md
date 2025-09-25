# PART 4 - 部署与运维

::: note
“在我电脑上是好的啊！” —— 这句话是每个开发者都可能说过或听过的。部署与运维（DevOps）的核心目标之一，就是彻底消灭这句话。它不仅仅是把代码扔到服务器上运行，更是一套确保软件开发、部署和维护过程高效、自动化、稳定可靠的文化、实践和工具的集合。
:::

我们先从简单入门吧，之后我计划要大改造，但是我精力不够了，交给后人了。

## 4.1 - 环境准备与管理

规范化管理开发、测试、生产等多个环境是保障软件质量的第一步。

  - **开发环境 (dev):** 开发者本地环境。
  - **测试环境 (test):** 部署给测试人员使用的环境（应该要有，计划交叉测试）。
  - **预发布环境 (staging/pre-prod):** 生产环境的克隆。
  - **生产环境 (prod):** 面向最终用户的环境。

**最佳实践：**

1.  **环境隔离：** 各环境之间应网络隔离，配置独立。
2.  **配置外部化：** 严禁将配置信息（如数据库密码）硬编码在代码中。
      - **Spring Boot:** 利用 `application-{profile}.yml`。
      - **FastAPI:** 使用 `.env` 文件。
      - **Vue/Vite:** 使用 `.env.development` 和 `.env.production` 文件。
3.  **基础设施即代码 (IaC):** 这是未来的方向，使用 Docker, Terraform 等工具来代码化地管理环境，确保环境一致性。

## 4.2 - 构建打包


将源代码转换为可部署的产物。

  - **前端 (Vue.js):**

      - **命令:** `npm run build`
      - **产物:** 一个 `dist` 目录，包含静态文件。

  - **后端 (Spring Boot):**

      - **命令:** `mvn clean package`
      - **产物:** 一个可执行的 `JAR` 包。

  - **后端 (FastAPI):**

      - **产物:** 源代码本身 + `requirements.txt` 依赖列表。

## 4.3 - 核心部署模式：Nginx 统一网关

这是我们当前项目中最核心、最稳定、也是首选的部署模式。它通过在单台服务器上使用 Nginx 作为统一入口，既能提供前端静态资源，又能作为反向代理将 API 请求转发给后端应用。

**架构图：**

```
                  |
             HTTPS (443)
                  |
+-----------------v-----------------+
|          服务器 (Server)           |
|  +---------------------------+    |
|  |       Nginx (监听 443)     |    |
|  |                           |    |
|  |  location / { -> 前端静态文件 }| |
|  |  location /api/ { -> 后端 }|    |
|  +-------------+-------------+    |
|                |                  |
|  (读取文件系统)  | (代理到本地端口)   |
| +--------------v-------------+    |
| | /var/www/frontend/dist   |      |
| +--------------------------+      |
|                    +--------------v-------------+
|                    |  后端应用 (localhost:8080)   |
|                    +----------------------------+
+-----------------------------------+
```

**核心优势:**

  - **部署简单:** 清晰明了，易于上手和排查问题。
  - **无跨域烦恼:** 前后端在浏览器看来是同源的，彻底避免了 CORS 问题。 （本地用 devProxy，上线不用管）
  - **统一管理:** SSL 证书、域名、访问日志、限流、缓存、Gzip 压缩等都可以在 Nginx 层统一配置。

**核心 Nginx 配置示例 (`/etc/nginx/sites-available/myapp.conf`):**

```nginx
server {
    listen 443 ssl http2;
    server_name your.domain.com;

    # SSL 证书配置
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    
    # 1. 前端静态资源配置
    location / {
        # Vue/React build 后的 dist 目录路径
        root /var/www/html/dist;
        # 这是单页应用(SPA)的关键配置！
        try_files $uri $uri/ /index.html;
    }

    # 2. 后端 API 反向代理配置
    location /api/ {
        # 转发请求到后端应用监听的地址和端口
        proxy_pass http://127.0.0.1:8080;

        # 传递真实的客户端信息给后端
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 日志和压缩等其他配置...
    access_log /var/log/nginx/myapp.access.log;
    error_log /var/log/nginx/myapp.error.log;
    gzip on;
}
```

## 4.4 - 自动化部署流程 (CI/CD)

基于当前的 Nginx 部署模式，我们可以设计一个简单高效的自动化流程，主要利用 `scp` (安全拷贝) 和 `ssh` (安全执行远程命令)。

**一个典型的 GitHub Actions 工作流 (`.github/workflows/deploy.yml`):**

1.  **触发 (Trigger):** 当代码 `push` 到 `main` 分支时自动触发。
2.  **构建 (Build):** 拉取代码，执行 `npm run build` 和 `mvn clean package`。
3.  **部署 (Deploy):**
      - **前端:** 使用 `scp` 将 `dist` 目录安全地上传到服务器的 `/var/www/html/dist`。
      - **后端:** 使用 `scp` 将生成的 `jar` 包上传到服务器的 `/opt/myapp` 目录。
      - **重启:** 使用 `ssh` 登录服务器，执行一个预先写好的脚本来重启后端服务（例如，通过 `systemd` 管理的服务）。

**示例片段:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    # ... 此处省略 Java 和 Node.js 环境设置、构建步骤 ...

    - name: Deploy Frontend
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        source: "./frontend/dist/*" # 构建产物目录
        target: "/var/www/html/dist"

    - name: Deploy Backend and Restart
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          # 拷贝后端 jar 包
          scp ./backend/target/*.jar ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }}:/opt/myapp/app.jar
          # 重启由 systemd 管理的服务
          sudo systemctl restart my-app.service
```

## 4.5 - 远景规划与技术演进

::: info
以下部分是我们技术演进的目标。虽然目前尚未大规模建设，但它们代表了行业未来的方向，能够极大地提升部署的可靠性、扩展性和运维效率。当项目变得更复杂或需要更高可用性时，我们应积极向此方向探索。
:::

### 目标一：全面容器化 (Docker)

**为什么需要？**
当“环境问题”成为常态，当新服务器的配置耗时耗力时，就是引入 Docker 的最佳时机。它将应用和环境打包在一起，实现真正的“一次构建，到处运行”。

**演进路径：**

1.  为前端、后端分别编写 `Dockerfile`（可参考之前版本中的示例）。
2.  在开发环境中使用 `docker-compose` 编排整个应用栈（前端Nginx、后端服务、数据库、Redis等），实现一键启动。
3.  在 CI/CD 流程中，将构建产物从 `jar` 包和静态文件，变为 Docker 镜像，并推送到镜像仓库。
4.  在服务器上，部署流程从 `scp` + `ssh` 变为 `docker pull` + `docker run`。

### 目标二：建立服务监控体系

**为什么需要？**
当“用户反馈某个功能用不了”成为我们发现问题的唯一途径时，我们就迫切需要一套监控体系，让我们能主动、实时地掌握服务的健康状况。

**演进路径：**

1.  **日志管理 (Logging):**

      - **目标:** 集中管理所有日志，提供快速检索和分析能力。
      - **技术选型:** **ELK (Elasticsearch, Logstash, Kibana)** 或 **Loki + Grafana**。
      - **实施:** 应用日志采用结构化（JSON）格式输出到标准输出，由日志收集器（如 Filebeat）采集并发送到中心化的日志系统中。

2.  **指标监控 (Metrics):**

      - **目标:** 收集关键性能指标（如请求延迟、错误率、CPU/内存使用率），并进行可视化展示。
      - **技术选型:** **Prometheus** (指标收集) + **Grafana** (可视化)。
      - **实施:** 后端应用（Spring Boot Actuator 或 FastAPI 相关库）暴露指标端点，由 Prometheus 定期抓取，并在 Grafana 中配置仪表盘。

3.  **告警 (Alerting):**

      - **目标:** 在问题发生时（甚至发生前），自动通知相关人员。
      - **技术选型:** **Alertmanager** (Prometheus 生态) 或 Grafana Alerting。
      - **实施:** 基于收集到的指标和日志，设置告警规则。例如“接口 5xx 错误率在 5 分钟内超过 1%”，则立即通过飞书或邮件发送告警。