const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

/*
========================
配置区域
========================
*/

// 你的 Cloudflare 数据接口
const DATA_API =
  "https://my-homepage-api.qq1464356758.workers.dev/";

// 你的 Cloudflare 视频解析接口
const VIDEO_API =
  "https://proud-morning-d30b.qq1464356758.workers.dev/";

/*
========================
测试接口
========================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Render API 运行正常"
  });
});

/*
========================
获取主页数据
========================
*/

app.get("/api/data", async (req, res) => {
  try {
    const response = await axios.get(DATA_API);

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/*
========================
保存主页数据
========================
*/

app.post("/api/save", async (req, res) => {
  try {
    const response = await axios.post(DATA_API, req.body, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/*
========================
视频解析代理
========================
*/

app.get("/api/video", async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "缺少 url 参数"
      });
    }

    const response = await axios.get(
      `${VIDEO_API}?url=${encodeURIComponent(url)}`
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/*
========================
启动服务
========================
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("服务启动成功：" + PORT);
});
