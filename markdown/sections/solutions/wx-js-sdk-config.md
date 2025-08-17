# Vue3 项目中使用微信 SDK 开发微信网页

:::info
作者：grtsinry43 <br>
原文地址：https://blog.grtsinry43.com/2024/07/03/wx-js-sdk-usage-vue3/ <br>
本文章最后一次同步时间：2024-07-03
:::

:::warning
这个解决方案对于 IOS/iPadOS 会出现问题 ~~（垃圾苹果 Webkit）~~，由于签名链接的问题...
唉看了好多是社区吐槽，还有中文互联网 *** 一顿抄来抄去，硬是没有解决方案... 知道的同学一定提 PR 告诉我哇
:::

最近在开发一个微信 H5 的项目，采用的是 Vue3+FastAPI，正好学习下微信用户登录，api 配置和调用，以及前后端关于这部分的解决方案

对微信网页开发的探索起源于最近的一个项目，需要一方面调用微信登录获取用户信息和将 token 作为区分用户的方式，另一方面要调用微信网页的
API 实现定位的操作

于是我查询微信官方开发文档，还有一些相关资料，按照自己理解研究了相关的解决方案

比较蛋疼的是，由于微信开发调用 API 时都会校验当前域名，因此被迫开发时进行线上测试（！！），目前个人没有解决方案，如果有了解的大佬恳请在评论处告知，不胜感激！！

## 安装及引入

首先微信的 `js-sdk` 是可以通过 `npm` 获取的：[weixin-js-sdk](https://www.npmjs.com/package/weixin-js-sdk)

在项目中直接通过以下命令安装：

```shell
npm install weixin-js-sdk
```

之后就可以在项目中直接引用

```js
import wx from 'weixin-js-sdk';
```

![image-20240703141306717](https://dogeoss.grtsinry43.com/2024/07/image-20240703110733723.png)

此时你可以发现已经能正常调用并且补全了（好耶）

## 项目背景

首先前端我使用的 `Vite`+`Vue3`，后端是 `FastAPI`，为了在页面打开时就载入相关配置，我们需要在 `main.js` 执行相关逻辑

首先规定相关的接口逻辑

| url                       | 定义     |
|---------------------------|--------|
| /api/wxconfig/get?url =   | 获取相关配置 |
| /api/wxconfig/flush?url = | 强制刷新配置 |

## 前端配置

这部分比较简单，无脑写就行，当测试完成之后，可以添加逻辑，让 `wx.error` 时候调用强制刷新的 API，这个具体自己设计就好

新建 `util/wx-api-config.js`

```js
import wx from 'weixin-js-sdk';
import {getWxConfig} from "@/api/wxConfig.js";

console.log("微信 JS-SDK 配置开始...")

// 微信 API 全局配置
getWxConfig(location.href.split('#')[0]).then(res => {
    console.log(res)
    const {appId, timestamp, nonceStr, signature} = res;
    wx.config({
        debug: process.env.NODE_ENV === 'development',
        appId,
        timestamp,
        nonceStr,
        signature,
        jsApiList: []
    });
});

wx.ready(function(){
    // config 信息验证后会执行 ready 方法，所有接口调用都必须在 config 接口获得结果之后，
    // config 是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，
    // 则须把相关接口放在 ready 函数中调用来确保正确执行。
    // 对于用户触发时才调用的接口，则可以直接调用，不需要放在 ready 函数中。
    console.log("微信 JS-SDK 配置成功！")
});

wx.error(function(err){
    console.log("微信 JS-SDK 配置失败：", err);
});



```

以及 `axios` 的配置，注意我这里使用了响应拦截器进行了统一处理，返回时已经直接是 `data` 的内容

`api/wxConfig.js`

```js
import ins from "@/api/request.js";

export function getWxConfig(url) {
    return ins.get("/wxconfig/get",{
        params: {
            url
        }
    })
}

```

最后只需要在 `main.js` 中调用即可：

```js
// 配置微信 API
import "@/util/wx-api-config.js";
```

## 后端配置

重头戏肯定在这里哇，首先呢，我们先了解一下 `config` 都有哪些部分：

让我们把目光再转向刚才的配置

```js
wx.config({
        debug: true,
        appId,
        timestamp,
        nonceStr,
        signature,
        jsApiList: []
    });
```

其中有：是否开发模式，公众号唯一 id，生成签名的时间戳，生成签名的随机字符串，签名，要调用的 api 列表

准备好你的信息 ~，就像这样：

```python
wx_app_cfg = {
    'appid': 'xxxxxxxxxxxxxxxxxx',
    'secret': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
}
```

对于这些内容，我们继续了解微信这个签名逻辑

首先，要带上 `appid` 和 `appscrect` 请求微信接口拿到 `access_token`，有效时长 `7200` 秒

```python
def get_access_token(appid: str, appsecret: str) -> str:
    """调用微信API获取access_token"""
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={appsecret}"
    response = requests.get(url)
    data = response.json()
    return data.get("access_token")
```

之后获取 `jsapi_ticket`

```python
def get_jsapi_ticket(access_token: str) -> str:
    """调用微信API使用access_token获取jsapi_ticket"""
    url = f"https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={access_token}&type=jsapi"
    response = requests.get(url)
    data = response.json()
    return data.get("ticket")
```

有了这两个东西，就可以开始签名啦 ~

```python
def generate_nonce_str(length: int = 16) -> str:
    """生成随机字符串，用于签名"""
    characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return ''.join(random.choice(characters) for _ in range(length))


def generate_signature(ticket: str, noncestr: str, timestamp: int, url: str) -> str:
    """使用sha1生成签名"""
    string1 = f"jsapi_ticket={ticket}&noncestr={noncestr}&timestamp={timestamp}&url={url}"
    return hashlib.sha1(string1.encode('utf-8')).hexdigest()
```

这样我们就得到了签名，但是这还没有结束，根据微信文档的介绍：

> access_token 是公众号的全局唯一接口调用凭据，公众号调用各接口时都需使用 access_token。开发者需要进行妥善保存。access_token
> 的存储至少要保留 512 个字符空间。access_token 的有效期目前为 2 个小时，需定时刷新，重复获取将导致上次获取的 access_token
> 失效。
>
> 公众平台的 API 调用所需的 access_token 的使用及生成方式说明：
>
> 1、建议公众号开发者使用中控服务器统一获取和刷新 access_token，其他业务逻辑服务器所使用的 access_token
> 均来自于该中控服务器，不应该各自去刷新，否则容易造成冲突，导致 access_token 覆盖而影响业务；
>
> 2、目前 access_token 的有效期通过返回的 expires_in 来传达，目前是 7200 秒之内的值。中控服务器需要根据这个有效时间提前去刷新新
> access_token。在刷新过程中，中控服务器可对外继续输出的老 access_token，此时公众平台后台会保证在 5 分钟内，新老 access_token
> 都可用，这保证了第三方业务的平滑过渡；
>
> 3、access_token 的有效时间可能会在未来有调整，所以中控服务器不仅需要内部定时主动刷新，还需要提供被动刷新 access_token
> 的接口，这样便于业务服务器在 API 调用获知 access_token 已超时的情况下，可以触发 access_token 的刷新流程。

因此我们需要提供缓存的能力，这里使用 `mongoengine` 处理相关逻辑

```python
def save_and_expire_handle(force=False):
    """
    每次调用的时候，首先检查 mongo 中是否有缓存（mongoengine），如果有，检查是否过期，如果过期，重新获取并且存储，如果没有，直接获取
    """
    current_time = int(time.time())
    config = WXConfig.objects().first()  # 因为只会有一条记录，所以直接获取第一条应该就可以了

    if config and config.expires_at > current_time and not force:
        # 如果配置存在且未过期，直接返回
        return {
            "access_token": config.access_token,
            "jsapi_ticket": config.jsapi_ticket
        }
    else:
        # 如果配置不存在或已过期，重新获取并存储
        appid = wx_app_cfg['appid']
        appsecret = wx_app_cfg['secret']
        print("==重新调用微信API获取access_token和jsapi_ticket==")
        access_token = get_access_token(appid, appsecret)
        jsapi_ticket = get_jsapi_ticket(access_token)
        expires_at = current_time + 7000  # 这里过期时间应该是 7200 秒，但是为了保险起见，提前 200 秒过期并重新获取

        if config:
            # 更新现有记录
            config.update(access_token=access_token, jsapi_ticket=jsapi_ticket, expires_at=expires_at)
        else:
            # 创建新记录
            WXConfig(access_token=access_token, jsapi_ticket=jsapi_ticket, expires_at=expires_at).save()

        return {
            "access_token": access_token,
            "jsapi_ticket": jsapi_ticket
        }
```

这样，我们就可以实现缓存 `access_token` 和 `jsapi_ticket`，并且在每次都检查是否过期减少请求次数了。

诶？为什么要留一个 `force` 参数呢？

在实际开发中，如果存在多端测试，可能在未过期时候就会刷新 `access_token` 和 `jsapi_ticket`，这样之前的存储就会过期，因此需要提供一个强制刷新的接口

按照前端需要的内容封装好函数，就有：

```python
def get_wx_config(appid: str, appsecret: str, url: str, force=False) -> Dict[str, str]:
    """获取微信JS-SDK配置"""
    # 首先从数据库或者新获取 access_token 和 jsapi_ticket
    # 这里就一个需要 force 即可，因为 access_token 和 jsapi_ticket 是一起获取的
    access_token = save_and_expire_handle(force)['access_token']
    jsapi_ticket = save_and_expire_handle()['jsapi_ticket']
    # 生成签名所需的参数
    noncestr = generate_nonce_str()
    timestamp = int(time.time())
    # 生成签名
    signature = generate_signature(jsapi_ticket, noncestr, timestamp, url)

    return {
        "appId": appid,
        "timestamp": timestamp,
        "nonceStr": noncestr,
        "signature": signature
    }
```

最后注册路由接口，`FastAPI`，启动！！

```python
@wxconfig_route.get('/get')
async def return_wx_config(url: str):
    """
    获取微信 JS-SDK 配置
    """
    # 生成微信 JS-SDK 配置
    wx_config = get_wx_config(wx_app_cfg['appid'], wx_app_cfg['secret'], url)

    return trueReturn(wx_config)


@wxconfig_route.get('/flush')
async def flush_wx_config(url):
    """
    这里保留了一个接口用于特殊情况，强制刷新微信 JS-SDK 配置
    """
    # 生成微信 JS-SDK 配置
    wx_config = get_wx_config(wx_app_cfg['appid'], wx_app_cfg['secret'], url, force=True)

    return trueReturn(wx_config)
```

## 测试

按照之前我说的，测试过程比较蛋疼，必须是正式域名的线上环境，可以用微信开发者工具测试一下，测试时候可以将 `debug` 写死成
`true` 便于发现问题

---

这里留个坑（？！又来），之后详细讲一下测试过程
