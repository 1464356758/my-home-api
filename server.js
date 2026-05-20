const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({
limit: '50mb'
}));

// 首页测试
app.get('/', (req, res) => {

```
res.send('homepage api running');
```

});

// 保存主页数据
let savedData = {
personalInfo: {
name: '张三',
avatar: '',
bio: '欢迎来到我的主页',
links: []
},
cards: []
};

// 获取数据
app.get('/api/save', (req, res) => {

```
res.json(savedData);
```

});

// 保存数据
app.post('/api/save', (req, res) => {

```
try {

    if (req.body.data) {

        savedData = req.body.data;

        return res.json({
            success: true
        });
    }

    res.status(400).json({
        success: false
    });

} catch (e) {

    console.error(e);

    res.status(500).json({
        success: false
    });
}
```

});

// B站视频解析
app.get('/api/video', async (req, res) => {

```
try {

    const bilibiliUrl = req.query.url;

    if (!bilibiliUrl) {

        return res.status(400).json({
            success: false,
            message: 'missing url'
        });
    }

    const api =
        'https://api.5ikf.top/api/jx/biliplayer/?url=' +
        encodeURIComponent(bilibiliUrl);

    const response = await fetch(api);

    const json = await response.json();

    let videoUrl = '';
    let title = 'B站视频';

    if (
        json.url
    ) {

        videoUrl = json.url;

    } else if (
        json.data &&
        json.data.url
    ) {

        videoUrl = json.data.url;
    }

    if (
        json.title
    ) {

        title = json.title;

    } else if (
        json.data &&
        json.data.title
    ) {

        title = json.data.title;
    }

    if (!videoUrl) {

        return res.status(500).json({
            success: false,
            message: '没有解析到视频地址',
            result: json
        });
    }

    res.json({
        success: true,
        video: videoUrl,
        title
    });

} catch (e) {

    console.error(e);

    res.status(500).json({
        success: false,
        message: '视频解析失败'
    });
}
```

});

// 视频代理
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
                'Mozilla/5.0 (Windows NT 10.0; Win64; Win64; x64)',
            Referer:
                'https://www.bilibili.com/'
        }
    });

    if (!response.ok) {

        return res.status(500).send('video fetch failed');
    }

    res.setHeader(
        'Content-Type',
        response.headers.get('content-type') ||
        'video/mp4'
    );

    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    res.setHeader(
        'Cache-Control',
        'no-store'
    );

    response.body.pipe(res);

} catch (e) {

    console.error(e);

    res.status(500).send('proxy error');
}
```

});

app.listen(PORT, () => {

```
console.log(
    'server running: ' + PORT
);
```

});
