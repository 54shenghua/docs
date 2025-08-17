# 使用 Less 变量和媒体查询实现深浅色模式适配

:::info
作者：grtsinry43 <br>
原文地址：https://blog.grtsinry43.com/2024/06/09/less-media-variable/ <br>
本文章最后一次同步时间：2024-06-09
:::

使用 Less 变量简化 css 写法，并不影响 css 变量和媒体查询在深浅模式切换时的效果

## 分析问题

首先要清楚问题的来源是什么，使用媒体查询 api 可以根据深浅色为 css 变量赋予不同的值，而 Less（或是
scss）不是原生被浏览器所支持，运行时需要先转为为原生 css，这一步也就是编译，有点类似 ts 和 js 的关系。这里采用的是 vite 创建的
Vue3 项目
而 Less/Scss 在编译的过程中，进行的是完全的字段替换，这也就意味着在运行之前 css
已经被固定，无法在运行的过程中动态修改，当然也不支持媒体查询的所有属性，但一些还是支持的哈，比如设备类型，最大宽度什么的，这里深浅色默认是不支持的。

## 问题出现

这里首先我是想办法完全使用 Less 的，也就是媒体查询 + 正常定义变量

```less
@primary: #1890ff; // 全局主色
@bg: #ffffff; // 全局背景
@font: #333333; // 全局字体颜色
@warning: #faad14; // 警告
@success: #52c41a; // 成功
@error: #f5222d; // 错误
@info: #1890ff; // 信息
@disabled: #bfbfbf; // 失效
@link: #1890ff; // 链接
@hover: #001764; // hover

@media (prefers-color-scheme: dark) {
  :root {
    @primary: #718dff; // 全局主色
    @bg: #1d1e21; // 全局背景
    @font: #ffffff; // 全局字体颜色
    @warning: #faad14; // 警告
    @success: #a8ff7d; // 成功
    @error: #f5222d; // 错误
    @info: #80c1ff; // 信息
    @disabled: #4e4e4e; // 失效
    @link: #a0b5ff; // 链接
    @hover: #d5e8ff; // hover
  }
}
```

但是实际测试中发现所编译出的 css 根本没有 `@media` 的字样，所以又是 inline 编译了，导致完全写死，不可能在运行中改变

## 问题解决

因为测试 Less 写法一直有问题，而原生 css 是可以完美解决的，为了既保留 Less
的简便的变量写法，又解决变量无法修改的问题，因此利用字段替换编译的特性，我们可以 ** 将 Less 变量赋值为 css 变量 **
，这样当编译之后所生成的 css，依然是变量形式储存内容，具体代码可以参考：

`colors.less`

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

`global.less`

```less
@import "@/styles/colors";

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

a {
  color: @link;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
  color: @hover;
}

ul {
  list-style: none;
}


body {
  min-height: 100vh;
  color: @font;
  background: @bg;
  transition: color 0.5s,
  background-color 0.5s;
  line-height: 1.6;
  font-family: Inter,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  Oxygen,
  Ubuntu,
  Cantarell,
  'Fira Sans',
  'Droid Sans',
  'Helvetica Neue',
  sans-serif;
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  margin: 0 auto;
  font-weight: normal;
}
```

随后正常在 `main.js` 引入 `global.less` 即可：

```js
import '@/styles/global.less'
```

## 问题延伸

问题到这里解决了吗？当然，但是还有个需求场景，某些网站会提供用户手动切换深色浅色模式的功能，而 css 变量可在运行中动态修改的优势就显现了出来

这里就需要 js 在运行中更改变量啦，具体的实现逻辑如下：

这里采用触发事件的方式进行，在 Vue3 中，你可以使用 `mitt` 进行事件的监听，

```shell
npm install mitt
```

可以直接注册在全局 app 上，也可以单独延续 Vue2 的习惯创建 Vue 实例挂载到上面：

这里的举例是创建 Vue 实例挂载到上面，新建一个 `eventBus.js`

```js
import {createApp} from 'vue';
import mitt from 'mitt';

const emitter = mitt();

const bus = createApp({});

bus.config.globalProperties.$bus = emitter;

export default bus;
```

这样就可以全局触发和监听事件

接下来创建一个工具函数，在挂载时候添加监听，新建 `util/useColorScheme.js`

```js
import {onMounted, onUnmounted} from 'vue';
import bus from "@/eventBus.js";
/**
 * 当触发 themeChange 事件，切换页面的颜色主题，在 onMounted，onUnmounted 生命周期钩子函数中设置
 * 修改原理是 css 变量
 */
export function useColorScheme() {
    const themeChange = (theme) => {
        console.log('themeChange', theme)
        if (theme) {
            // 深色模式
            document.documentElement.style.setProperty('--primary', '#718dff');
            document.documentElement.style.setProperty('--bg', '#1d1e21');
            document.documentElement.style.setProperty('--font', '#ffffff');
            document.documentElement.style.setProperty('--warning', '#faad14');
            document.documentElement.style.setProperty('--success', '#a8ff7d');
            document.documentElement.style.setProperty('--error', '#f5222d');
            document.documentElement.style.setProperty('--info', '#80c1ff');
            document.documentElement.style.setProperty('--disabled', '#4e4e4e');
            document.documentElement.style.setProperty('--link', '#a0b5ff');
            document.documentElement.style.setProperty('--hover', '#d5e8ff');
        } else {
            // 浅色模式
            document.documentElement.style.setProperty('--primary', '#1890ff');
            document.documentElement.style.setProperty('--bg', '#ffffff');
            document.documentElement.style.setProperty('--font', '#333333');
            document.documentElement.style.setProperty('--warning', '#faad14');
            document.documentElement.style.setProperty('--success', '#52c41a');
            document.documentElement.style.setProperty('--error', '#f5222d');
            document.documentElement.style.setProperty('--info', '#1890ff');
            document.documentElement.style.setProperty('--disabled', '#bfbfbf');
            document.documentElement.style.setProperty('--link', '#1890ff');
            document.documentElement.style.setProperty('--hover', '#001764');
        }
    };

    onMounted(() => {
        bus.config.globalProperties.$bus.on('themeChange', themeChange);
    });

    onUnmounted(() => {
        bus.config.globalProperties.$bus.off('themeChange', themeChange);
    });
}
```

这个就是在当触发 themeChange 事件，切换页面的颜色主题，在 onMounted，onUnmounted 生命周期钩子函数中设置，工具都准备好啦，就可以在任意地方使用啦

```js
import {ref, watchEffect} from 'vue';
import {useColorScheme} from "@/util/useColorScheme.js";
import bus from "@/eventBus.js";

// 定义深浅模式的变量
const isDark = ref(false);

// 切换深浅模式
const handleThemeButton = () => {
  isDark.value = !isDark.value;
};

watchEffect(() => {
  // 当深浅模式变量改变时，发出自定义事件
  bus.config.globalProperties.$bus.emit('themeChange', isDark.value);
});

useColorScheme();
```

## 总结一下

其实有点复杂不太优雅，不过在大的 Vue 项目中，一定会用到 pinia，mitt 等工具来进行状态管理，全局事件总线监听的，折腾一下利于积累经验（）

回到最开始的问题，原生 css 变量可用于动态修改，给了实时切换的可能，而 less/scss 的便捷写法又能大大简化开发，好啦，就到这里呀

## 效果演示

![](https://dogeoss.grtsinry43.com/2024/06/20240609.gif)
