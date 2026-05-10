const express = require('express');
const multer = require('multer');
const session = require('express-session');

const app = express();
let items = [];

// ✅ MIDDLEWARE
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

// ✅ MULTER SETUP (MOVE THIS UP)
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

// ✅ DATABASE (TEMP)

app.post('/add', upload.single('image'), (req, res) => {
    const imagePath = req.file ?
        "/uploads/" + req.file.filename :
        req.body.image;

    const newItem = {
        id: Date.now(), // ✅ UNIQUE ID
        name: req.body.name,
        image: imagePath
    };

    items.push(newItem);

    res.redirect('/admin.html');
});

// ✅ GET ITEMS
app.get('/items', (req, res) => {
    res.json(items);
}); // DELETE ITEM
app.get('/delete/:id', (req, res) => {

    const id = parseInt(req.params.id); // get id from URL

    // remove item with that id
    items = items.filter(item => item.id !== id);

    res.redirect('/admin.html'); // go back to admin page
});

// ✅ SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});