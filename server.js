:::writing{variant="standard" id="48271"}
const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

// 首页
app.get('/', (req, res) => {
    res.send('server running');
});

// B站解析接口
app.get('/api/bilibili', async (req, res) => {
    try {
        const url = req.query.url;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: '缺少url参数'
            });
        }

        const apiUrl =
            'https://api.5ikf.top/api/jx/biliplayer?url=' +
            encodeURIComponent(url);

        const response = await fetch(apiUrl);

        const json = await response.json();

        let videoUrl = '';
        let title = '';

        // 不同接口返回格式兼容
        if (json.video) {
            videoUrl = json.video;
        } else if (json.url) {
            videoUrl = json.url;
        } else if (json.data && json.data.video) {
            videoUrl = json.data.video;
        } else if (json.data && json.data.url) {
            videoUrl = json.data.url;
        }

        if (json.title) {
            title = json.title;
        } else if (json.data && json.data.title) {
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
});

// 视频代理接口
app.get('/api/proxy-video', async (req, res) => {
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

        res.setHeader(
            'Content-Type',
            response.headers.get('content-type') || 'video/mp4'
        );

        res.setHeader('Access-Control-Allow-Origin', '*');

        res.setHeader('Cache-Control', 'no-store');

        // node 18+ 兼容写法
        const buffer = await response.arrayBuffer();

        res.send(Buffer.from(buffer));
    } catch (e) {
        console.error(e);

        res.status(500).send('proxy error');
    }
});

app.listen(PORT, () => {
    console.log('server running on port ' + PORT);
});
:::
