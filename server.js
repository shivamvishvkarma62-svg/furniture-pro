const express = require('express');
const multer = require('multer');
const session = require('express-session');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// ✅ CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: 'dvpnr89ht',
    api_key: '971143368462461',
    api_secret: 'GqdbnR7cBdpEww9xUyM5nms5u2s'
});

// ✅ MULTER + CLOUDINARY STORAGE
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'furniture',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});
const upload = multer({ storage });

// ✅ MONGODB CONNECT
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
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

// ✅ ROUTES
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/login', (req, res) => {
    if (req.body.username === "admin" && req.body.password === "1234") {
        req.session.user = true;
        res.redirect('/admin.html');
    } else {
        res.send("Wrong login");
    }
});

app.get('/admin.html', (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
});

// ✅ ADD ITEM
app.post('/add', upload.single('image'), async(req, res) => {
    const imagePath = req.file ?
        req.file.path :
        req.body.imageUrl;

    const newItem = new Item({
        name: req.body.name,
        image: imagePath,
        category: req.body.category // ✅ ADD KIYA
    });

    await newItem.save();
    res.redirect('/admin.html');
});

// ✅ GET ITEMS
app.get('/items', async(req, res) => {
    const items = await Item.find();
    res.json(items);
});

// ✅ DELETE ITEM
app.get('/delete/:id', async(req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.redirect('/admin.html');
});
// ✅ EDIT ITEM - GET (form dikhao)
app.get('/edit/:id', async(req, res) => {
    const item = await Item.findById(req.params.id);
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Edit Item</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: sans-serif; background: #f9f5f0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .form-box { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 350px; }
                h2 { color: #2c1f17; margin-bottom: 20px; text-align: center; }
                input { display: block; width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px; font-size: 14px; }
                img { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin: 10px 0; }
                .btn { width: 100%; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 15px; margin-top: 5px; }
                .save { background: #2c1f17; color: white; }
                .cancel { background: #eee; color: #333; text-decoration: none; display: block; text-align: center; margin-top: 10px; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="form-box">
                <h2>✏️ Edit Item</h2>
                <img src="${item.image}" onerror="this.src='https://via.placeholder.com/300'">
                <form action="/edit/${item._id}" method="POST" enctype="multipart/form-data">
                    <input type="text" name="name" value="${item.name}" required>
                    <input type="file" name="image" accept="image/*">
                    <small style="color:#888">* Naya image select karo ya chhod do same rakhne ke liye</small>
                    <button type="submit" class="btn save">💾 Save Changes</button>
                </form>
                <a href="/admin.html" class="cancel">❌ Cancel</a>
            </div>
        </body>
        </html>
    `);
});

// ✅ EDIT ITEM - POST (save karo)
app.post('/edit/:id', upload.single('image'), async(req, res) => {
    const updateData = { name: req.body.name };

    if (req.file) {
        updateData.image = req.file.path;
    }

    await Item.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin.html');
});

// ✅ SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});