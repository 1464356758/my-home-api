const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ========== 视频解析（使用“旧人阡陌”免费 API） ==========
// ========== 临时测试：直接返回假数据，模拟解析成功 ==========
// ========== 临时测试：直接返回假数据，模拟解析成功 ==========
app.get('/api/video', async (req, res) => {
  // 假数据，不调用外部 API，直接返回成功
  const fakeVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  const fakeTitle = '测试视频（假数据）';
  const fakeCover = 'https://via.placeholder.com/400x300.png?text=Test';
  res.json({ video: fakeVideoUrl, title: fakeTitle, cover: fakeCover });
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
