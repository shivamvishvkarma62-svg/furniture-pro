const express = require('express');
const multer = require('multer');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

// ✅ MONGODB CONNECT
mongoose.connect('mongodb+srv://admin:furniture123@cluster0.wanfofg.mongodb.net/furnitureDB?appName=Cluster0')
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('DB Error:', err));

// ✅ SCHEMA
const itemSchema = new mongoose.Schema({
    name: String,
    image: String
});
const Item = mongoose.model('Item', itemSchema);

// ✅ MIDDLEWARE
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

// ✅ MULTER SETUP
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

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
        "/uploads/" + req.file.filename :
        req.body.image;

    const newItem = new Item({
        name: req.body.name,
        image: imagePath
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

// ✅ SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});