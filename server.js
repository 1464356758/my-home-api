const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());

app.use(express.json({
    limit: '50mb'
}));

const ADMIN_PASSWORD = 'mypage123';

const DATA_FILE = './data.json';

function getDefaultData() {
    return {
        personalInfo: {
            name: '张三',
            avatar: '',
            bio: '欢迎来到我的主页',
            links: []
        },
        cards: []
    };
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(getDefaultData(), null, 2)
    );
}

app.get('/api/save', (req, res) => {

    try {

        const data = fs.readFileSync(
            DATA_FILE,
            'utf-8'
        );

        res.json(JSON.parse(data));

    } catch (e) {

        res.status(500).json({
            message: '读取失败'
        });
    }
});

app.post('/api/save', (req, res) => {

    try {

        const password =
            req.headers['x-admin-password'];

        if (password !== ADMIN_PASSWORD) {

            return res.status(403).json({
                message: '密码错误'
            });
        }

        const body = req.body;

        if (!body.data) {

            return res.status(400).json({
                message: '缺少 data'
            });
        }

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(body.data, null, 2)
        );

        res.json({
            success: true
        });

    } catch (e) {

        console.error(e);

        res.status(500).json({
            message: '保存失败'
        });
    }
});

app.get('/', (req, res) => {

    res.send('API OK');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log('server running');
});
