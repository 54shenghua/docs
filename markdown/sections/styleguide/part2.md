# PART 2 - 前端（Vue.js）

::: note
接下来就是适合于前端的小伙伴啦，会先从 `axios` 的封装开始，还有关于 `Vue` 的项目的规范，以及一些细节问题，希望大家能够有所收获。
:::

## 2.1 - axios 封装

在项目中引入 `axios` 后，我们需要对其进行封装，以便于更好地处理请求和响应，比如添加请求拦截器，响应拦截器，统一处理错误等等。

首先，这是我在项目中经常使用的 `axios` 封装，大家可以参考一下（这里用了 `vant`
的弹窗组件，可以根据自己的项目需求进行修改，比如 `El-Message` 什么的都可以哇）：

|| 其实你都可以直接复制一直用 ||

```js
import axios from "axios";
import {showDialog, showNotify} from "vant";
import {getToken, setToken} from "@/util/auth.js";

// 统一封装，便于调用
const ins = axios.create({
    baseURL: "/api/v2",
    timeout: 5000,
    headers: {
        "Content-Type": "application/json",
    },
});
ins.interceptors.response.use(
    function (resp) {
        // 如果响应头中有 token，则存储到 localStorage 中，以便下次请求时携带
        console.log(resp.headers)
        if (resp.headers.Authorization) {
            console.log("存储token")
            setToken(resp.headers.Authorization);
        }
        if (resp.data.code !== 0) {
            showNotify({
                message: resp.data.msg,
                type: "warning",
            });
            return null;
        } else if (resp.data.code === 404) {
            showDialog({
                title: "提示",
                message: resp.data.msg,
            });
            return null;
        }

        // 成功则直接返回数据
        return resp.data.data;
    },
    function (error) {
        // 错误的响应处理
        showNotify({
            message: ` 获取数据失败：${error}`,
            type: "danger",
        });
        return null;
    });

ins.interceptors.request.use(
    function (config) {
        // 在 localStorage 中获取 token
        const token = getToken();
        if (token) {
            // 如果存在 token，则在请求头中携带 token
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    function (error) {
        showNotify({
            message: ` 请求失败：${error}`,
            type: "danger",
        })
        return Promise.reject(error);
    });

export default ins;
```

我们开始逐步讲解：

1. 首先我们引入了 `axios`，然后创建了一个实例 `ins`，并设置了一些默认值，比如 `baseURL`，`timeout`，`headers` 等等。

```js {2}
const ins = axios.create({
    baseURL: "/api/v2", // 设置基础 URL
    timeout: 5000, // 设置超时时间
    headers: {
        "Content-Type": "application/json", // 设置请求头
    },
});
```

其中，`baseURL` 一定要确定好，这样在请求时就不用每次都写全路径了，这里补充一下，如果你正在本地开发，一定会设置代理服务器：

```js {11-19}
export default defineConfig({
    plugins: [
        vue(),
        VueDevTools(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            }
        },
        host: '0.0.0.0',
    }
})
```

2. 接下来就是拦截器的设置，这里我们设置了两个拦截器，一个是请求拦截器，一个是响应拦截器。

响应拦截器主要用来处理响应数据，比如判断响应头中是否有 `token`，如果有则存储到 `localStorage`
中，以便下次请求时携带；判断响应数据中的 `code` 字段，如果不为 0 则弹出提示框，当没有报错就直接返回数据。

```js {23}
ins.interceptors.response.use(
    function (resp) {
        // 如果响应头中有 token，则存储到 localStorage 中，以便下次请求时携带
        console.log(resp.headers)
        if (resp.headers.Authorization) {
            setToken(resp.headers.Authorization);
        }
        if (resp.data.code !== 0) {
            showNotify({
                message: resp.data.msg,
                type: "warning",
            });
            return null;
        } else if (resp.data.code === 404) {
            showDialog({
                title: "提示",
                message: resp.data.msg,
            });
            return null;
        }

        // 成功则直接返回数据
        return resp.data.data;
    },
    function (error) {
        // 错误的响应处理
        showNotify({
            message: ` 获取数据失败：${error}`,
            type: "danger",
        });
        return null;
    });
```

::: note
注意下这里的写法哦，我们获取 `resp.data.data`，这样直接就是我们需要的数据了，不用每次都去解构，这样也方便我们后续的处理。
:::

请求拦截器主要用来处理请求数据，比如在请求头中添加 `token`，这样后端就可以根据 `token` 来判断用户的身份，然后返回相应的数据。

```js {7}
ins.interceptors.request.use(
    function (config) {
        // 在 localStorage 中获取 token
        const token = getToken();
        if (token) {
            // 如果存在 token，则在请求头中携带 token
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    function (error) {
        showNotify({
            message: ` 请求失败：${error}`,
            type: "danger",
        })
        return Promise.reject(error);
    });
```

这样我们就完成了 `axios` 的封装，接下来我们就可以在项目中使用这个实例来进行请求了。

## 2.2 - Vue/Vite 项目规范

首先，我们明确一下项目的目录结构，这里我推荐一种目录结构，大家可以参考一下：


```
├── public
│   ├── favicon.ico
│   └── index.html // 如果要是 Vite 就在 src 下
├── src
│   ├── api // 接口相关
│   │   ├── user.js
│   │   └── ...
│   ├── assets
│   │   ├── logo.png
│   │   └── ...
│   ├── components // 这里一定是公共组件，多次使用的组件一定要封装一下
│   │   ├── HelloWorld.vue
│   │   └── ...
│   ├── directives // 自定义指令
│   │   ├── index.js
│   │   └── ...
│   ├── mock // 模拟数据，如果使用 Vite mock 服务额可能会在根目录下
│   │   ├── index.js
│   │   └── ...
│   ├── router // 路由相关
│   │   ├── index.js // 路由配置
│   │   └── ... // 这里可以根据模块来划分，也可以添加路由守卫
│   ├── store // 状态管理
│   │   ├── index.js // 状态管理配置
│   │   └── ... // 这里可以根据模块来划分（Vuex），如果是 Pinia 就直接每个模块一个文件，不需要 index.js
│   ├── styles // 样式相关
│   │   ├── index.css/less/sass
│   │   └── ...
│   ├── utils // 工具函数
│   │   ├── index.js
│   │   └── ...
│   ├── views // 页面
│   │   ├── Home.vue
│   │   └── ... // 就是每个页面的组件，如果复杂或者存在子页面，可以再细分，创建目录
│   ├── App.vue // 根组件
│   └── main.js // 入口文件，这里可以引入全局样式，全局组件，全局插件等等
├── .gitignore // git 忽略文件，一定要写好
├── package.json // 项目配置文件
├── vite.config.js // Vite 配置文件
├── README.md // 项目说明文档
└── ...
```


### /api

这部分主要是存放接口相关的文件，比如 `user.js`，`article.js`
等等，这里一般会根据模块来划分，比如用户相关的接口就放在 `user.js` 中，文章相关的接口就放在 `article.js` 中。
在分别写某个接口之前，首先建议要用 `axios` 封装好，这样在写接口时就可以直接调用封装好的 `axios` 实例了。

（这里可以参考上面的 `axios` 封装）

对于每个接口尽量要写好注释，说明这个接口的作用，参数，返回值等等，这样方便后续的维护和修改。
比如像以下这样：要让人一眼看出来这个接口是干什么的，传入什么参数，返回什么值。

::: note
如果你使用的 `WebStorm` 或者 `VSCode`，可以直接在函数上方 `/**`，然后回车，就会自动生成注释模板，然后你只需要填写参数，返回值等等就可以了。
:::

```js
/**
 * 获取成员签到信息（用于队长或者指导老师）
 * @param {String} id 成员 id
 * @returns {Promise <AxiosResponse<any> >} 成员签到信息
 */
export function getMemberSignInfo(id) {
    return ins.get("/sign/detail", {
        params: {
            memberid: id,
        }
    });
}
```

### /assets

这个文件夹主要是存放静态资源，比如图片，字体等等，这里一般会根据类型来划分，比如图片就放在 `images`
文件夹中，字体就放在 `fonts` 文件夹中。
注意，由于使用 `Webpack` 打包，我们在引入静态资源时，一定要使用 `@` 来引入，这样可以避免路径错误。

```vue
<img src="@/assets/images/logo.png" alt="logo"/>
```

当然也可以在 script setup 中使用 `import` 来引入（推荐这个吧，这个管理起来比较舒服）：

```js
import logo from '@/assets/images/logo.png';
```

```vue
<img :src="logo" alt="logo"/>
```

### /components

这个目录主要是存放公共组件，公共的组件代码一定要封装好，充分解耦合
比如侧边栏，头部导航栏，底部导航栏等等，这些组件一定要封装好，方便多次使用。

这里最好要考虑好组件的复用性，可维护性，可扩展性等等，这样可以减少代码的冗余，提高开发效率。
比如说通过 `props` 来传递数据，通过 `emit` 来触发事件，通过 `slots` 来插槽等等。

### /directives

这个目录主要是存放自定义指令，比如 `v-permission`，`v-ellipsis`
等等，这些指令一般会根据功能来划分，比如权限相关的指令就放在 `permission.js` 中，文本截断相关的指令就放在 `ellipsis.js` 中。
可能大家用的不多吧... 除了我举的这两个例子，还可以 `v-focus`，`v-loading` 等等，这些指令可以方便我们在模板中使用，减少代码的冗余，提高开发效率。

### /mock

这个目录主要是存放模拟数据，这个目录一般会根据模块来划分，比如用户相关的模拟数据就放在 `user.js`
中，文章相关的模拟数据就放在 `article.js` 中。

方便前端攻城狮——独！立！开！发！不用再苦求后端小伙伴啦（逃

具体的使用方法可以参考 `mockjs` 的官方文档，这里给一下具体的链接：[Mock.js](http://mockjs.com/)，当然
代码的编写也是要有规范的，并且要和接口文档保持一致，这样才能更好地测试和开发。
这里举个栗子：

```js
import Mock from "mockjs";
import qs from "querystring";

Mock.mock(/^\/api\/message\/?(\?.+)?$/, "get", function (options) {
    const query = qs.parse(options.url);

    return Mock.mock({
        code: 0,
        msg: "",
        data: {
            total: 52,
            [`rows|${query.limit || 10}`]: [
                {
                    id: "@guid",
                    nickname: "@cname",
                    content: "@cparagraph(1, 10)",
                    createDate: Date.now(),
                    "avatar|1": [
                        "https://balabala/avatar6.jpg",
                        "https://balabala/avatar4.jpg",
                        "https://balabala/avatar8.jpg",
                        "https://balabala/avatar2.jpg",
                    ],
                },
            ],
        },
    });
});
```

还有，最后建议创建一个 `index.js` 文件，然后在这个文件中引入所有的模拟数据，这样方便管理，方便维护。
在 `main.js` 中引入这个文件，这样就可以在开发时直接使用模拟数据了。
并且开发完成直接注释这行代码就可以了：）

### /router

这个目录主要是存放路由相关的文件，比如 `index.js`，`guard.js` 等等
要善于使用路由懒加载，还有路由守卫，这样可以提高页面的加载速度，保护页面的安全性。
另外，根据路由的 `meta` 字段，可以实现权限控制，比如某个页面登录之后才能访问，这样可以提高系统的安全性。
具体这样写就可以啦：

```js {21}
import {createRouter, createWebHistory} from 'vue-router'
import Login from "@/views/Login.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login',
        },
        {
            path: '/login',
            name: '登录',
            component: Login,
            meta: {title: '登录'}
        },
        {
            path: '/myHome',
            name: '我的',
            component: () => import('../views/MyHome.vue'),
            meta: {title: '我的', auth: true}
        },
        {
            path: '/index',
            name: '首页',
            component: () => import('../views/HomeView.vue'),
            meta: {title: '打卡', auth: true}
        },
        // ... 更多的路由
    ]
});

export default router;
```

当然阴间的微信 `js-sdk` 也可以切换路由的时候进行初始化，这样可以避免一些问题。

### /store

这个目录主要是存放状态管理相关的文件，一般 Vue3 都会使用 `Pinia`，这里就不多说了，如果使用 `Vuex`，
这里一般会根据模块来划分，比如用户相关的状态就放在 `user.js` 中，文章相关的状态就放在 `article.js` 中。
没什么好说的，就是状态管理，方便数据的共享，方便数据的修改，方便数据的监听等等。
写的方法按照官方的例子就好，额用一个之前项目的例子吧：

```js
/**
 * @name UserStore
 * @description 用户信息
 * 这里打开网页时就会通过携带 wx 相关信息向后端请求，获取信息并存储
 */
import {defineStore} from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => {
        return {
            name: '',
            phone: '',
            title: '',
            belong: '',
            avatar: '',
        }
    },
    actions: {
        /**
         * @name setUser
         * @param data 传入的 data 应该是一个对象，包含 name, phone, title
         */
        setUser(data) {
            this.name = data.name;
            this.phone = data.phone;
            this.title = data.title;
        },
        /**
         * @name setAvatar
         * @param avatar 传入的 avatar 应该是一个字符串，表示头像的 url
         */
        setAvatar(avatar) {
            this.avatar = avatar;
        }
    },
});

```

在其他的地方使用的时候最好是先 setup 中定义一个对象，然后在模板中使用。

```js
import {useUserStore} from "@/store/user";

const user = useUserStore();
```

### /styles

样式文件，最好用 `less` 或者 `sass`，这样可以方便我们使用变量，函数等等。

建议包含这些文件：

- `golbal.less`：全局初始化

```less
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: inherit;
}

ul, ol {
  list-style: none;
}

```

- `variables.less`：变量

```less
:root {
  --primary: #1890ff; // 全局主色
  --bg: #ffffff; // 全局背景
  --font: #333333; // 全局字体颜色
  --warning: #faad14; // 警告
  --success: #52c41a; // 成功
  --error: #f5222d; // 错误
  --info: #1890ff; // 信息
  --disabled: #bfbfbf; // 失效
  --link: #1890ff; // 链接
  --hover: #001764; // hover
}

@primary: var(--primary);
@bg: var(--bg);
@font: var(--font);
@warning: var(--warning);
@success: var(--success);
@error: var(--error);
@info: var(--info);
@disabled: var(--disabled);
@link: var(--link);
@hover: var(--hover);

@media (prefers-color-scheme: dark) {
  :root {
    --primary: #718dff; // 全局主色
    --bg: #1d1e21; // 全局背景
    --font: #ffffff; // 全局字体颜色
    --warning: #faad14; // 警告
    --success: #a8ff7d; // 成功
    --error: #f5222d; // 错误
    --info: #80c1ff; // 信息
    --disabled: #4e4e4e; // 失效
    --link: #a0b5ff; // 链接
    --hover: #d5e8ff; // hover
  }
}
```

接下来的 `less` 文件就可以引入这个文件，然后使用这些变量了。

- `mixin.less`：混合（公共样式）

```less
// 这里就随便举个例子吧，就是公共样式
@self-conter: {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

其他的文件按模块来划分，比如 `login.less`，`home.less` 等等，
另外 less 相互引入的时候，最好是使用 `@import`，这样可以避免路径错误。

```less
@import "@/styles/mixin.less";

.manage-team-container {
  .main-container;
  overflow-y: auto;
}
```

### /utils

工具类，不多说了，就是一些工具函数，比如时间格式化，深拷贝，浏览器判断等等，这些函数一定要封装好，方便多次使用。

### /views

页面文件，这里一般会根据模块来划分，不是很复杂的页面就直接放在这个目录下，如果复杂或者存在子页面，可以再细分，创建目录。

## 2.3 - JavaScript 规范

::: warning
这个真的是重中之重，一定要遵守，不然后面维护起来会很痛苦的。
对于一个团队的代码规范，以及个人的代码风格，都是举足轻重的。
:::

::: note
强烈建议大家书写代码时启用 `eslint`，`prettier` 等工具（尤其是 `ESLint`）
:::

### 命名规范

在 JavaScript 中，变量名，函数名，类名等等都是有规范的
务必要遵守驼峰命名法（小驼峰），比如 `userName`，`getUserInfo` 等等
这样可以提高代码的可读性，减少歧义，方便维护。

### 缩进

我们希望在纯 JavaScript 文件中使用四个空格缩进（更清晰），而对于 Vue 和 React ，我们希望使用两个空格缩进（更紧凑）。

### 分号

在 JavaScript 中，分号是可选的，但是我们建议在每行语句的末尾加上分号，这样可以避免一些错误。

### 注释

注释真的非常重要，尤其是协作开发和代码的流传与维护（？
在 JavaScript 中，我们建议使用单行注释 `//`，多行注释 `/* */`，文档注释 `/** */` 等等
在写注释时，一定要写清楚这段代码的作用，这样方便后续的维护和修改。
强烈建议书写文档注释！！并且署名，这样方便他人查看，如果有不清楚的地方，可以直接找到你。

就像以下这样：

```js
/**
 * @name Permission
 * @description 通过路由守卫实现登录验证
 * @author Grtsinry43
 * @date 2024-07-24
 * 本段代码灵感来源于 vue-element-admin，当用户已登录时，会自动获取用户信息，
 * 当用户访问需要登录的页面时，会自动跳转到登录页面，鉴权后再跳转回原页面
 */
```

### 函数风格

这里以 Vue 为例，比如一些业务处理，命名为 ...Handle，
比如 submitHandle，clickHandle 等等，这样可以方便我们区分这个函数是用来处理什么的。

参数尽量让人一看就知道要传什么，比如 `durationSeconds` 好于 `duration`，`isShow` 好于 `show` 等等。
当然即使这样，也要写好注释，方便他人查看。

## 2.4 - 常用组件库的使用规范

[//]: # (TODO: 待补充)
