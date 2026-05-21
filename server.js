const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

// JsonLight 密钥（你已有的）
const JSONLIGHT_KEY = 'e56101cf53ce13ab';
const DATA_API_URL = `https://api.json.lighttools.net/json/${JSONLIGHT_KEY}`;

// 视频 API 基础地址
const VIDEO_API_BASE = 'https://api.5ikf.top/api/jmp?dm=sy858&key=82743b1715e2496ed8b7b06454d7494e&url=';

// ========== 数据存取代理 ==========
app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(DATA_API_URL);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const response = await fetch(DATA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const result = await response.json();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== 视频解析代理 ==========
app.get('/api/video', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: '请传入B站链接' });
  }
  try {
    const apiUrl = VIDEO_API_BASE + encodeURIComponent(url);
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data && data.data && data.data.playAddr) {
      // 处理反斜杠，提取纯净链接
      const videoUrl = data.data.playAddr.replace(/\\\//g, '/');
      const title = data.data.desc || '';
      const cover = data.data.cover ? data.data.cover.replace(/\\\//g, '/') : '';
      res.json({
        video: videoUrl,
        title: title,
        cover: cover
      });
    } else {
      res.status(500).json({ error: '解析失败' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
