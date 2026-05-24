const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ========== 视频解析（使用“旧人阡陌”免费 API） ==========
app.get('/api/video', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '请传入视频链接' });

  try {
    const apiUrl = 'https://api.52api.net/api/jx?url=' + encodeURIComponent(url);
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data && data.code === 200 && data.data) {
      const videoUrl = data.data.url || '';
      const title = data.data.title || '';
      const cover = data.data.cover || '';
      res.json({ video: videoUrl, title: title, cover: cover });
    } else {
      console.error('解析失败，API返回:', JSON.stringify(data));
      res.status(500).json({ error: '视频解析失败: ' + (data.msg || '未知错误') });
    }
  } catch (error) {
    console.error('视频解析请求异常:', error);
    res.status(500).json({ error: '视频解析服务异常: ' + error.message });
  }
});

// ========== AI 对话（智谱 GLM-4.7-Flash 免费模型）==========
app.post('/api/ai', async (req, res) => {
  try {
    const { messages } = req.body;
    await new Promise(r => setTimeout(r, 1000)); // 防止速率限制

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 3d13c85a598545139fe0e32b0fc719c8.ld0tYqbt9LP094LZ'
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    res.json({
      choices: [{
        message: { content: data.choices[0].message.content }
      }]
    });
  } catch (error) {
    res.status(500).json({ error: 'AI 服务暂时不可用' });
  }
});

// ========== 更新 GitHub 上的 homepage-data.json ==========
app.post('/api/update-video', async (req, res) => {
  const { cardIndex, videoUrl, title, cover } = req.body;
  if (cardIndex === undefined || !videoUrl) {
    return res.status(400).json({ error: '缺少参数' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: '服务器未配置 GITHUB_TOKEN' });
  }

  const repoOwner = '1464356758';
  const repoName = 'my-homepage-data';
  const filePath = 'homepage-data.json';

  try {
    // 1. 获取当前文件内容和 SHA
    const getRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (!getRes.ok) {
      const err = await getRes.json();
      return res.status(500).json({ error: '获取文件失败: ' + err.message });
    }
    const fileData = await getRes.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const sha = fileData.sha;
    let json = JSON.parse(content);

    // 2. 更新视频卡片信息
    if (json.cards && json.cards[cardIndex] && json.cards[cardIndex].type === 'video') {
      json.cards[cardIndex].content.url = videoUrl;
      json.cards[cardIndex].content.title = title || json.cards[cardIndex].content.title || '';
      json.cards[cardIndex].content.poster = cover || json.cards[cardIndex].content.poster || '';
      json.cards[cardIndex].content.lastResolved = Date.now();
    } else {
      return res.status(400).json({ error: '无效的卡片索引' });
    }

    // 3. 写回 GitHub
    const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString('base64');
    const putRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `更新视频链接: 卡片${cardIndex}`,
        content: newContent,
        sha: sha
      })
    });
    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ error: '更新文件失败: ' + err.message });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '更新异常: ' + error.message });
  }
});

app.get('/', (req, res) => res.send('✅ 个人主页后端已正常运行'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
