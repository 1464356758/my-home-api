const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// ========== 中间件 ==========
app.use(cors());
app.use(express.json());

// ========== 配置区域（按需修改） ==========
// 1. Cloudflare Worker 的地址（用于中转请求到 Cloudflare）
const CF_WORKER_DATA = 'https://my-homepage-api.qq1464356758.workers.dev';

// 2. 视频解析 Worker 地址
const CF_WORKER_VIDEO = 'https://proud-morning-d30b.qq1464356758.workers.dev';

// 3. 管理员密码（与 Cloudflare Worker 中的环境变量一致）
const ADMIN_PASSWORD = 'mypage123';

// ========== 数据存取接口（中转 Cloudflare Worker） ==========
// GET 请求 - 读取数据
app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(CF_WORKER_DATA, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Cloudflare Worker 返回错误: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GET /api/data 错误:', error.message);
    res.status(500).json({ error: '读取数据失败，请稍后再试' });
  }
});

// POST 请求 - 保存数据
app.post('/api/data', async (req, res) => {
  const password = req.headers['x-admin-password'] || req.body.password;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '密码错误，无权限保存' });
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

    if (!response.ok) {
      throw new Error(`Cloudflare Worker 返回错误: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('POST /api/data 错误:', error.message);
    res.status(500).json({ error: '保存失败，请稍后再试' });
  }
});

// ========== 视频解析接口 ==========
app.get('/api/video', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: '请传入B站链接' });
  }

  try {
    const response = await fetch(`${CF_WORKER_VIDEO}?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`视频解析失败: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GET /api/video 错误:', error.message);
    res.status(500).json({ error: '视频解析失败，请稍后再试' });
  }
});

// ========== 健康检查 ==========
app.get('/', (req, res) => {
  res.send('✅ 个人主页后端已正常运行');
});

// ========== 启动服务 ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动，端口: ${PORT}`);
});
