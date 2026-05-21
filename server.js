const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// ========== 中间件 ==========
app.use(cors());
app.use(express.json());

// ========== 配置区域 ==========
// 1. Cloudflare Worker 数据存取地址
const CF_WORKER_DATA = 'https://my-homepage-api.qq1464356758.workers.dev';

// 2. 视频解析 API 基础地址
const VIDEO_API_BASE = 'https://api.5ikf.top/api/jmp?dm=sy858&key=82743b1715e2496ed8b7b06454d7494e&url=';

// 3. 智谱 AI 配置（GLM-4-Flash 永久免费模型）
const ZHIPU_API_KEY = '3d13c85a598545139fe0e32b0fc719c8.ld0tYqbt9LP094LZ';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// ========== 数据存取（转发 Cloudflare Worker） ==========
app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(CF_WORKER_DATA);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GET /api/data 错误:', error.message);
    res.status(500).json({ error: '读取数据失败' });
  }
});

app.post('/api/data', async (req, res) => {
  const password = req.headers['x-admin-password'] || req.body.password;
  if (password !== 'mypage123') {
    return res.status(403).json({ error: '密码错误' });
  }
  try {
    const response = await fetch(CF_WORKER_DATA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password
      },
      body: JSON.stringify({ data: req.body.data || req.body })
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('POST /api/data 错误:', error.message);
    res.status(500).json({ error: '保存失败' });
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
    console.error('GET /api/video 错误:', error.message);
    res.status(500).json({ error: '视频解析失败' });
  }
});

// ========== AI 对话（智谱 GLM-4-Flash 免费模型） ==========
app.post('/api/ai', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // 返回格式与 DeepSeek 保持一致，前端无需修改
    res.json({
      choices: [{
        message: {
          content: data.choices[0].message.content
        }
      }]
    });
  } catch (error) {
    console.error('POST /api/ai 错误:', error.message);
    res.status(500).json({ error: 'AI 服务暂时不可用' });
  }
});

// ========== 健康检查 ==========
app.get('/', (req, res) => {
  res.send('✅ 个人主页后端已正常运行');
});

// ========== 启动服务 ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
