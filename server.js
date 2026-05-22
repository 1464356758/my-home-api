const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ========== 配置区域 ==========
const CF_WORKER_DATA = 'https://my-homepage-api.qq1464356758.workers.dev';
const ZHIPU_API_KEY = '3d13c85a598545139fe0e32b0fc719c8.ld0tYqbt9LP094LZ';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 抖音视频备用解析 API（可自行更换）
const DOUYIN_API = 'https://api.douyin.wtf/api?url=';

// ========== 数据存取（保持不变） ==========
app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(CF_WORKER_DATA);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data', async (req, res) => {
  const password = req.headers['x-admin-password'] || req.body.password;
  if (password !== 'mypage123') return res.status(403).json({ error: '密码错误' });
  try {
    const response = await fetch(CF_WORKER_DATA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
      body: JSON.stringify({ data: req.body.data || req.body })
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 视频解析（B站 + 抖音，自主可控） ==========
const bili = require('bilibili-parse'); // 引入 B站解析库

app.get('/api/video', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '请传入视频链接' });

  try {
    const isDouyin = url.includes('douyin.com') || url.includes('douyinvod.com');
    let videoUrl, title, cover;

    if (isDouyin) {
      // 抖音：使用备用 API
      const apiUrl = DOUYIN_API + encodeURIComponent(url);
      const resp = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.douyin.com/'
        }
      });
      const data = await resp.json();
      if (data && data.video_data) {
        videoUrl = data.video_data.backplay_url || '';
        title = data.desc || '';
        cover = data.cover || '';
      } else {
        throw new Error('抖音解析返回数据无效');
      }
    } else {
      // B站：使用 bilibili-parse 库
      const videoInfo = await bili.getVideoInfo(url);
      if (videoInfo && videoInfo.url) {
        videoUrl = videoInfo.url;
        title = videoInfo.title || '';
        cover = videoInfo.pic || videoInfo.cover || '';
      } else {
        throw new Error('B站视频解析失败');
      }
    }

    // 去除反斜杠转义（如果存在）
    videoUrl = videoUrl.replace(/\\\//g, '/');
    cover = cover.replace(/\\\//g, '/');

    res.json({ video: videoUrl, title: title, cover: cover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AI 对话（智谱 GLM-4.7-Flash 免费模型） ==========
app.post('/api/ai', async (req, res) => {
  try {
    const { messages } = req.body;
    await new Promise(r => setTimeout(r, 1000)); // 防止速率限制

    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.json({
      choices: [{
        message: {
          content: data.choices[0].message.content
        }
      }]
    });
  } catch (error) {
    res.status(500).json({ error: 'AI 服务暂时不可用' });
  }
});

app.get('/', (req, res) => res.send('✅ 个人主页后端已正常运行'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
