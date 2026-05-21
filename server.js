const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ========== 配置区域 ==========
const CF_WORKER_DATA = 'https://my-homepage-api.qq1464356758.workers.dev';
const VIDEO_API_BASE = 'https://api.5ikf.top/api/jmp?dm=sy858&key=82743b1715e2496ed8b7b06454d7494e&url=';
const ZHIPU_API_KEY = '3d13c85a598545139fe0e32b0fc719c8.ld0tYqbt9LP094LZ';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// ========== 数据存取 ==========
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

// ========== 视频解析 ==========
app.get('/api/video', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '请传入B站链接' });
  try {
    const apiUrl = VIDEO_API_BASE + encodeURIComponent(url);
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data && data.data && data.data.playAddr) {
      const videoUrl = data.data.playAddr.replace(/\\\//g, '/');
      const title = data.data.desc || '';
      const cover = data.data.cover ? data.data.cover.replace(/\\\//g, '/') : '';
      res.json({ video: videoUrl, title: title, cover: cover });
    } else {
      res.status(500).json({ error: '视频解析失败' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AI 对话 (智谱 GLM-4.7-Flash 免费模型) ==========

app.post('/api/ai', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // ★ 增加1秒延时，避免触发速率限制
    await new Promise(r => setTimeout(r, 1000));
    
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
