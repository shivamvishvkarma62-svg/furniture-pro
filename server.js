const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const JWT_SECRET = 'furniture_secret_key_2026';

// ✅ ADMIN CREDENTIALS (hashed)
const ADMIN = {
    username: 'admin',
    password: bcrypt.hashSync('1234', 10)
};

// ✅ CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: 'dvpnr89ht',
    api_key: '971143368462461',
    api_secret: 'GqdbnR7cBdpEww9xUyM5nms5u2s'
});

// ✅ MULTER + CLOUDINARY
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'furniture',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});
const upload = multer({ storage });

// ✅ MONGODB
mongoose.connect('mongodb+srv://admin:furniture123@cluster0.wanfofg.mongodb.net/furnitureDB?appName=Cluster0')
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('DB Error:', err));

// ✅ SCHEMA
const itemSchema = new mongoose.Schema({
    name: String,
    image: String,
    category: { type: String, default: 'Other' }
});
const Item = mongoose.model('Item', itemSchema);

// ✅ MIDDLEWARE
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ JWT MIDDLEWARE
function verifyToken(req, res, next) {
    const token = req.headers['authorization'] || req.query.token;
    if (!token) return res.status(401).redirect('/login.html');
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).redirect('/login.html');
    }
}

// ✅ ROUTES
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ✅ LOGIN - JWT
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN.username && bcrypt.compareSync(password, ADMIN.password)) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } else {
        res.json({ success: false, message: 'Wrong username or password!' });
    }
});

// ✅ ADMIN PAGE
app.get('/admin.html', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// ✅ ADD ITEM
app.post('/add', upload.single('image'), async(req, res) => {
    const token = req.query.token;
    try {
        jwt.verify(token, JWT_SECRET);
    } catch {
        return res.redirect('/login.html');
    }

    const imagePath = req.file ? req.file.path : req.body.imageUrl;
    const newItem = new Item({
        name: req.body.name,
        image: imagePath,
        category: req.body.category
    });
    await newItem.save();
    res.redirect('/admin.html?token=' + token);
});

// ✅ GET ITEMS
app.get('/items', async(req, res) => {
    const items = await Item.find();
    res.json(items);
});

// ✅ DELETE ITEM
app.get('/delete/:id', async(req, res) => {
    const token = req.query.token;
    try {
        jwt.verify(token, JWT_SECRET);
    } catch {
        return res.redirect('/login.html');
    }
    await Item.findByIdAndDelete(req.params.id);
    res.redirect('/admin.html?token=' + token);
});

// ✅ EDIT ITEM GET
app.get('/edit/:id', async(req, res) => {
    const token = req.query.token;
    try { jwt.verify(token, JWT_SECRET); } catch { return res.redirect('/login.html'); }

    const item = await Item.findById(req.params.id);
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Edit Item</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family:sans-serif; background:#f9f5f0; display:flex; justify-content:center; align-items:center; height:100vh; }
                .box { background:white; padding:30px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); width:350px; }
                h2 { color:#2c1f17; margin-bottom:20px; text-align:center; }
                input, select { display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #ccc; border-radius:5px; }
                img { width:100%; height:150px; object-fit:cover; border-radius:8px; margin:10px 0; }
                .save { background:#2c1f17; color:white; width:100%; padding:10px; border:none; border-radius:5px; cursor:pointer; }
                .cancel { display:block; text-align:center; margin-top:10px; color:#888; text-decoration:none; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>✏️ Edit Item</h2>
                <img src="${item.image}">
                <form action="/edit/${item._id}?token=${token}" method="POST" enctype="multipart/form-data">
                    <input type="text" name="name" value="${item.name}" required>
                    <select name="category">
                        <option ${item.category==='Sofa'?'selected':''}>Sofa</option>
                        <option ${item.category==='Bed'?'selected':''}>Bed</option>
                        <option ${item.category==='Table'?'selected':''}>Table</option>
                        <option ${item.category==='Chair'?'selected':''}>Chair</option>
                        <option ${item.category==='Wardrobe'?'selected':''}>Wardrobe</option>
                        <option ${item.category==='Kitchen'?'selected':''}>Kitchen</option>
                        <option ${item.category==='Other'?'selected':''}>Other</option>
                    </select>
                    <input type="file" name="image" accept="image/*">
                    <button type="submit" class="save">💾 Save</button>
                </form>
                <a href="/admin.html?token=${token}" class="cancel">❌ Cancel</a>
            </div>
        </body>
        </html>
    `);
});

// ✅ EDIT ITEM POST
app.post('/edit/:id', upload.single('image'), async(req, res) => {
    const token = req.query.token;
    try { jwt.verify(token, JWT_SECRET); } catch { return res.redirect('/login.html'); }

    const updateData = { name: req.body.name, category: req.body.category };
    if (req.file) updateData.image = req.file.path;

    await Item.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin.html?token=' + token);
});

// ✅ SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));