const express = require('express');
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

// 视频代理
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

        response.body.pipe(res);
    } catch (e) {
        console.error(e);
        res.status(500).send('proxy error');
    }
});

app.listen(PORT, () => {
    console.log('server running: ' + PORT);
});
