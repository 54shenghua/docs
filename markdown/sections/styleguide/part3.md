# PART 3 - 后端（FastAPI & Spring Boot）

::: note
后端的小伙伴们看过来，适合你们的在这里！这部分主要围绕我个人在 `Spring Boot` (Java/Kotlin) 和 `FastAPI` (Python) 项目中沉淀下来的规范和最佳实践。当然，很多思想同样适用于 `Gin` (Go)、`Express` (TypeScript) 等其他现代后端框架。
:::

::: info
后端的稳定性和安全性是整个应用的基石。一个清晰、分层、可维护的后端项目，不仅能让开发和协作丝般顺滑，还能在面对高并发、复杂业务和安全威胁时游刃有余。
:::

## 3.1 - 项目结构规范

一个好的项目结构是成功的开始。它能让开发者快速定位代码，理解模块职责，降低新成员的上手门槛。

### Spring Boot 项目结构 (Maven/Gradle)

`Spring Boot` 项目通常遵循标准的 Maven/Gradle 目录结构，并在此基础上进行分包。推荐采用按层或按功能划分的方式。

**推荐结构 (按层划分):**

```
src
└── main
    ├── java
    │   └── com
    │       └── example
    │           └── myapp
    │               ├── MyApplication.java      // Spring Boot 启动类
    │               ├── config                  // 配置类 (如 Spring Security, MyBatis, Swagger)
    │               ├── controller              // 控制层 (处理 HTTP 请求, 调用 Service)
    │               ├── service                 // 业务逻辑层
    │               │   └── impl                // Service 的实现类
    │               ├── repository / mapper     // 数据访问层 (JPA Repository, MyBatis Mapper)
    │               ├── model                   // 数据模型层
    │               │   ├── entity              // 数据库实体 (Entity)
    │               │   └── dto                 // 数据传输对象 (Data Transfer Object)
    │               ├── exception               // 自定义异常及全局异常处理器
    │               └── utils                   // 工具类
    └── resources
        ├── application.yml                     // 主配置文件
        ├── application-dev.yml                 // 开发环境配置
        ├── application-prod.yml                // 生产环境配置
        ├── static                              // 静态资源
        ├── templates                           // 模板文件 (如 Thymeleaf)
        └── mapper                              // MyBatis XML 文件
```

- **`controller`**: 只负责接收前端请求、参数校验、调用 `service` 层，然后返回响应。保持 `controller` 的轻薄。
- **`service`**: 核心业务逻辑的实现地。复杂的业务流程、事务管理都在这一层。
- **`repository`**: 与数据库直接交互，负责数据的增删改查。
- **`model`**:
    - **`entity`**: 与数据库表结构一一对应，由 ORM 框架管理。
    - **`dto`**: 用于在不同层之间（特别是 `controller` 和 `service`）传输数据，避免直接暴露数据库实体，实现解耦。
    （这里如果复杂也可能会 entity dto vo 各个有对应的包）
- **`exception`**: 定义全局异常处理器 (`@RestControllerAdvice`)，业务 `Exception` 定义等 ，捕获并格式化异常信息，返回统一的错误响应。

|| 当前好多后端用了 Spring Boot ||

### FastAPI 项目结构

`FastAPI` 社区推崇模块化和显式依赖，结构相对灵活，但遵循一定的最佳实践能让项目更清晰。

**推荐结构:**

```
.
├── app                   // 应用主目录
│   ├── __init__.py
│   ├── main.py           // FastAPI 应用实例和启动入口
│   ├── api               // API 路由层
│   │   ├── __init__.py
│   │   └── v1            // API 版本
│   │       ├── __init__.py
│   │       ├── endpoints // 按资源划分路由文件
│   │       │   ├── user.py
│   │       │   └── article.py
│   │       └── deps.py   // 依赖注入项 (如获取当前用户, 数据库 session)
│   ├── core              // 核心配置
│   │   ├── __init__.py
│   │   └── config.py     // 配置加载 (如环境变量)
│   ├── crud              // 数据库操作层 (CRUD: Create, Read, Update, Delete)
│   │   ├── __init__.py
│   │   ├── crud_user.py
│   │   └── base.py       // 通用 CRUD 基类
│   ├── models            // 数据库模型 (SQLAlchemy Models)
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas           // 数据校验层 (Pydantic Schemas)
│   │   ├── __init__.py
│   │   └── user.py       // 定义请求体、响应体的 Pydantic 模型
│   └── db                // 数据库相关
│       ├── __init__.py
│       └── session.py    // 数据库引擎和 session 创建
├── .env                  // 环境变量文件
├── requirements.txt      // Python 依赖
└── ...
```

- **`main.py`**: 初始化 `FastAPI` app，并使用 `include_router` 挂载 `api` 目录下的各个路由。
- **`api/endpoints`**: 类似于 Spring Boot 的 `controller`，定义路径操作函数（`@app.get`, `@app.post` 等）。
- **`crud`**: 类似于 Spring Boot 的 `repository`，封装了对数据库模型的直接操作，供 `api` 层调用。
- **`models`**: SQLAlchemy 的 ORM 模型，对应数据库表。
- **`schemas`**: Pydantic 模型，这是 FastAPI 的精髓之一。它负责请求/响应数据的定义、校验和序列化，功能上等同于 Spring Boot 的 DTO + Validation。

## 3.2 - API 设计与实现

### 统一响应格式

如 **PART 1** 所述，后端需要返回统一的 JSON 结构。我们可以通过封装一个通用响应类来实现。

**Spring Boot 实现:**

创建一个泛型 `Result` 类。

```java
// Result.java
public class Result<T> {
    private int code;
    private String msg;
    private T data;

    // 构造函数、Getter/Setter 省略...

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(0);
        result.setMsg("成功");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> error(int code, String msg) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
}

// 在 Controller 中使用
@GetMapping("/user/{id}")
public Result<UserDTO> getUserById(@PathVariable Long id) {
    UserDTO user = userService.findUserById(id);
    return Result.success(user);
}
```

**FastAPI 实现:**

同样可以创建一个通用的响应模型，或直接在路由函数中构建字典。

```python
# schemas/response.py
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field

T = TypeVar('T')

class ResponseModel(BaseModel, Generic[T]):
    code: int = Field(0, description="状态码")
    msg: str = Field("成功", description="消息")
    data: Optional[T] = None

# 在 endpoint 中使用
from app.schemas.response import ResponseModel
from app.schemas.user import User # Pydantic schema for user

@router.get("/{user_id}", response_model=ResponseModel[User])
def read_user(user_id: int):
    # db_user = crud.user.get(db, id=user_id)
    # ...
    # return {"code": 0, "msg": "成功", "data": db_user}
    # 或者直接返回 ORM model, FastAPI 会自动序列化
    return {"data": db_user} # code 和 msg 会使用默认值
```

### 使用 DTO/Schema

::: warning
**永远不要**直接将数据库实体（Entity/ORM Model）直接暴露给前端！
:::

  - **安全**: 避免泄露数据库结构和不应被前端感知的字段（如密码哈希、内部状态）。
  - **解耦**: API 的形态不应被数据库的结构所绑定。数据库表结构可能会变，但 API 可以保持向后兼容。
  - **灵活**: 可以根据不同场景（如创建、更新、列表展示）定制不同的 DTO/Schema，只包含必要的字段。

**Spring Boot 示例 (`UserDTO.java`):**

```java
public class UserDTO {
    private Long id;
    private String username;
    private String avatar;
    // 没有 password 字段
}
```

**FastAPI 示例 (`schemas/user.py`):**

```python
from pydantic import BaseModel

# 用于创建用户的请求体
class UserCreate(BaseModel):
    username: str
    password: str

# 用于响应的 Schema
class User(BaseModel):
    id: int
    username: str
    avatar: str | None = None

    class Config:
        from_attributes = True # 兼容 ORM 模型
```

## 3.3 - 安全规范

后端是安全的第一道，也是最重要的一道防线。

:::danger
**严格禁止**任何未经验证鉴权的系统上线，**开发测试**时就应配有完善的鉴权逻辑。
:::

### 认证与授权

通常使用 JWT (JSON Web Token) 实现。

1.  **登录接口**: 用户提供凭证（用户名/密码），验证成功后，后端生成一个 JWT 并返回。
2.  **后续请求**: 前端在请求头 `Authorization` 中携带 `Bearer <token>`。
3.  **后端验证**: 后端通过中间件（Middleware）或拦截器（Interceptor/Filter）在每个受保护的请求到达前，解析并验证 JWT 的有效性。

**Spring Boot:** 强烈推荐使用 `Spring Security`。它提供了完整的认证和授权框架，可以方便地集成 JWT。通过配置可以实现对 URL 的精细化权限控制。

**FastAPI:** 通过 `Depends` 实现一个依赖项来验证 Token，可以非常方便地应用到需要保护的路由上。

```python
# api/v1/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # 这里是解码和验证 JWT 的逻辑
    # ...
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    return user
```

### 输入验证

:::danger
绝不相信来自客户端的任何数据！
:::

- **Spring Boot**: 使用 `jakarta.validation`（以前是 `javax.validation`）注解，在 DTO 的字段上添加 `@NotNull`, `@Size`, `@Email` 等，并在 Controller 方法参数前加上 `@Valid`。

```java
// CreateUserDTO.java
public class CreateUserDTO {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20之间")
    private String username;
    // ...
}
```

- **FastAPI**: 这是 FastAPI 的强项。Pydantic Schema 本身就是天然的验证器。如果请求数据不符合 Schema 定义（类型、必填项等），FastAPI 会自动返回一个详细的 `422 Unprocessable Entity` 错误响应。

### 防止 SQL 注入

:::danger
**永远使用 ORM 或参数化查询！** 严禁手动拼接 SQL 字符串。
:::

- **Spring Boot**: 使用 `Spring Data JPA`（不建议，都 5202 年了，不过也可能有人会用） 或 `MyBatis`。它们底层都使用了 `PreparedStatement`，可以有效防止 SQL 注入。
- **FastAPI**: 使用 `SQLAlchemy` ORM，通过构建查询表达式来操作数据库，同样是安全的。

## 3.4 - 代码风格与注释

### 命名规范

- **Java/Kotlin**:
    - 类名：`UpperCamelCase` (帕斯卡命名法)，如 `UserController`。
    - 方法/变量名：`lowerCamelCase` (小驼峰命名法)，如 `getUserById`。
    - 常量：`UPPER_SNAKE_CASE` (大写下划线)，如 `MAX_LOGIN_ATTEMPTS`。
- **Python**:
    - 遵循 `PEP 8` 规范。
    - 模块/包/变量/函数名：`lower_snake_case` (小写下划线)，如 `get_user_by_id`。
    - 类名：`CapitalizedWords` (同帕斯卡)，如 `UserSchema`。

### 注释

和前端一样，注释至关重要。

- **公共 API**: 必须有详细的文档注释（JavaDoc 或 Python Docstrings），说明其功能、参数、返回值和可能抛出的异常。
- **复杂业务逻辑**: 在代码块前添加注释，解释这段代码的业务目的和实现思路。
- **TODO / FIXME**: 明确标注待办事项或需要修复的问题，并最好署名和日期。

**JavaDoc 示例:**

```java
/**
 * 根据用户ID查找用户，并转换为DTO.
 * @param id 用户的唯一标识ID
 * @return 包含用户信息的DTO对象
 * @throws UserNotFoundException 如果用户不存在
 */
public UserDTO findUserById(Long id) {
    // ...
}
```

**Python Docstring 示例 (Google Style):**

```python
def get_user_by_id(db: Session, user_id: int) -> models.User:
    """Gets a user by their ID.

    Args:
        db: The database session.
        user_id: The ID of the user to retrieve.

    Returns:
        The user object from the database.
    """
    # ...
```

-----

一个优秀的后端系统，离不开这些良好习惯的日积月累。与前端规范结合起来，就能构建出一个真正高质量的全栈项目。