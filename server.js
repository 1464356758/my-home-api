const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

/*
首页测试
*/
app.get('/', (req, res) => {
res.send('server running');
});

/*
B站视频解析接口
你的主页调用：
/api/video?url=
*/
app.get('/api/video', async (req, res) => {

```
try {

    const biliUrl = req.query.url;

    if (!biliUrl) {

        return res.status(400).json({
            success: false,
            message: '缺少url参数'
        });

    }

    /*
    你的原始解析接口
    */
    const api =
        'https://api.5ikf.top/api/jmp?dm=sy858&key=82743b1715e2496ed8b7b06454d7494e&url=' +
        encodeURIComponent(biliUrl);

    const response = await fetch(api);

    const text = await response.text();

    let json;

    try {

        json = JSON.parse(text);

    } catch (e) {

        return res.status(500).json({
            success: false,
            message: '接口JSON解析失败',
            raw: text
        });

    }

    if (
        !json ||
        !json.data ||
        !json.data.playAddr
    ) {

        return res.status(500).json({
            success: false,
            message: '没有解析到视频地址',
            result: json
        });

    }

    /*
    获取真实视频地址
    */
    let realVideo = json.data.playAddr;

    realVideo = realVideo.replace(/\\\//g, '/');

    /*
    自动转代理地址
    */
    const proxyVideo =
        req.protocol +
        '://' +
        req.get('host') +
        '/api/proxy-video?url=' +
        encodeURIComponent(realVideo);

    res.json({
        success: true,
        video: proxyVideo,
        title: json.data.desc || '',
        cover: json.data.cover || ''
    });

} catch (e) {

    console.error(e);

    res.status(500).json({
        success: false,
        message: '视频解析失败',
        error: e.toString()
    });

}
```

});

/*
视频代理接口
*/
app.get('/api/proxy-video', async (req, res) => {

```
try {

    const targetUrl = req.query.url;

    if (!targetUrl) {

        return res.status(400).send('missing url');

    }

    const response = await fetch(targetUrl, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: 'https://www.bilibili.com/'
        }
    });

    if (!response.ok) {

        return res.status(500).send('video fetch failed');

    }

    /*
    设置视频类型
    */
    res.setHeader(
        'Content-Type',
        response.headers.get('content-type') || 'video/mp4'
    );

    /*
    允许跨域
    */
    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    /*
    禁止缓存
    */
    res.setHeader(
        'Cache-Control',
        'no-store'
    );

    /*
    node 24 兼容写法
    */
    const buffer = await response.arrayBuffer();

    res.send(Buffer.from(buffer));

} catch (e) {

    console.error(e);

    res.status(500).send('proxy error');

}
```

});

app.listen(PORT, () => {

```
console.log('server running on port ' + PORT);
```

});
const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

/*
首页测试
*/
app.get('/', (req, res) => {
res.send('server running');
});

/*
B站视频解析接口
你的主页调用：
/api/video?url=
*/
app.get('/api/video', async (req, res) => {

```
try {

    const biliUrl = req.query.url;

    if (!biliUrl) {

        return res.status(400).json({
            success: false,
            message: '缺少url参数'
        });

    }

    /*
    你的原始解析接口
    */
    const api =
        'https://api.5ikf.top/api/jmp?dm=sy858&key=82743b1715e2496ed8b7b06454d7494e&url=' +
        encodeURIComponent(biliUrl);

    const response = await fetch(api);

    const text = await response.text();

    let json;

    try {

        json = JSON.parse(text);

    } catch (e) {

        return res.status(500).json({
            success: false,
            message: '接口JSON解析失败',
            raw: text
        });

    }

    if (
        !json ||
        !json.data ||
        !json.data.playAddr
    ) {

        return res.status(500).json({
            success: false,
            message: '没有解析到视频地址',
            result: json
        });

    }

    /*
    获取真实视频地址
    */
    let realVideo = json.data.playAddr;

    realVideo = realVideo.replace(/\\\//g, '/');

    /*
    自动转代理地址
    */
    const proxyVideo =
        req.protocol +
        '://' +
        req.get('host') +
        '/api/proxy-video?url=' +
        encodeURIComponent(realVideo);

    res.json({
        success: true,
        video: proxyVideo,
        title: json.data.desc || '',
        cover: json.data.cover || ''
    });

} catch (e) {

    console.error(e);

    res.status(500).json({
        success: false,
        message: '视频解析失败',
        error: e.toString()
    });

}
```

});

/*
视频代理接口
*/
app.get('/api/proxy-video', async (req, res) => {

```
try {

    const targetUrl = req.query.url;

    if (!targetUrl) {

        return res.status(400).send('missing url');

    }

    const response = await fetch(targetUrl, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: 'https://www.bilibili.com/'
        }
    });

    if (!response.ok) {

        return res.status(500).send('video fetch failed');

    }

    /*
    设置视频类型
    */
    res.setHeader(
        'Content-Type',
        response.headers.get('content-type') || 'video/mp4'
    );

    /*
    允许跨域
    */
    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    /*
    禁止缓存
    */
    res.setHeader(
        'Cache-Control',
        'no-store'
    );

    /*
    node 24 兼容写法
    */
    const buffer = await response.arrayBuffer();

    res.send(Buffer.from(buffer));

} catch (e) {

    console.error(e);

    res.status(500).send('proxy error');

}
```

});

app.listen(PORT, () => {

```
console.log('server running on port ' + PORT);
```

});
