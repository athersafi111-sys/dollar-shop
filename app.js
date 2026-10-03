require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const session = require('express-session');
const userModel = require('./models/user');
const dollarModel = require('./models/dollar');
const mongoose = require("mongoose");

console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded ✓" : "NOT FOUND ✗");

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to Atlas - dollar DB"))
    .catch(err => console.log("DB Error:", err.message));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "dollar-secret",
  resave: false,
  saveUninitialized: false
}));

function isAdminAuth(req, res, next){
    if(req.session.isAdmin === true) next();
    else res.send("Access Denied: Only admin can access this page. <a href='/login'>Login as Admin</a>");
}

// FIXED: Root now shows shop, not plain html
app.get('/', async (req, res) => {
    let lastProduct = await dollarModel.findOne().sort({ updatedAt: -1 }).catch(()=>null);
    res.render('index', { 
        username: req.session.username || "",
        lastUpdated: lastProduct ? lastProduct.updatedAt : new Date()
    }); 
});

app.get('/shop', async (req, res) => {
    let lastProduct = await dollarModel.findOne().sort({ updatedAt: -1 }).catch(()=>null);
    res.render('index', { 
        username: req.session.username || "",
        lastUpdated: lastProduct ? lastProduct.updatedAt : new Date()
    }); 
});

app.get('/signup', (req, res) => { res.render('signup'); });
app.get('/login', (req, res) => { res.render('login'); });
app.get('/dollarAdmin', isAdminAuth, (req, res) => { res.render('dollarAdmin'); });
app.get('/dollar', async (req, res) => {
    let products = await dollarModel.find().catch(()=>[]);
    res.render('dollar', { products, isAdmin: req.session.isAdmin || false });
});
app.get('/rayal', (req, res) => { res.render('rayal'); });
app.get("/index/:username", async (req, res) => {
    let lastProduct = await dollarModel.findOne().sort({ updatedAt: -1 }).catch(()=>null);
    res.render("index", { username: req.params.username, lastUpdated: lastProduct ? lastProduct.updatedAt : new Date() });
});
app.get('/users', async (req, res) => {
    let users = await userModel.find().catch(()=>[]);
    res.render('users', { users });
});
app.get("/delete/:id", async (req, res) => {
    await dollarModel.findByIdAndDelete(req.params.id);
    res.redirect("/dollar");
});
app.get('/editProduct/:productid', async (req, res) => {
    let product = await dollarModel.findOne({ _id: req.params.productid });
    res.render('editProduct', { product });
});
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.send("Error logging out");
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.post("/create", async (req, res) => {
    let { name, image, email, password } = req.body;
    await userModel.create({ userName: name, image, email, password });
    res.redirect("/login");
});
app.post("/login", async (req, res) => {
    const {email, password, isAdminCheck} = req.body;
    if(isAdminCheck){
        if(email === "admin@gmail.com" && password === "12345"){
            req.session.isAdmin = true;
            req.session.username = "Admin";
            req.session.save(()=> res.redirect("/dollar"));
            return;
        } else return res.send("Wrong admin credentials");
    }
    let user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) return res.send("user not found");
    if (user.password === password) {
        req.session.isAdmin = false;
        req.session.username = user.userName;
        req.session.save(()=> res.redirect(`/index/${user.userName}`));
    } else res.send("Email or password incorrect");
});
app.post("/dollar", async (req, res) => {
    let { image, name, detail } = req.body;
    await dollarModel.create({ image, name, detail });
    res.redirect("/dollar");
});
app.post('/update/:productid', async (req,res)=>{
    let {name,detail,image} =req.body;
    await dollarModel.findOneAndUpdate({_id: req.params.productid},{name,detail,image},{returnDocument: 'after' });
    res.redirect('/dollar');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log("Server on " + PORT));