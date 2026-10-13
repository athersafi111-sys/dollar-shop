require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
const path = require('path');
const express = require('express');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const feedbackModel = require('./models/feedback');
const rayalModel = require('./models/rayal');
const premiumModel = require('./models/premium');
const otherModel = require('./models/other');
const seasonModel = require('./models/season');
const userModel = require('./models/user');
const dollarModel = require('./models/dollar');
const childrenModel = require('./models/children');
const ladyModel = require('./models/lady');
const settingModel = require('./models/setting');
const pageStatsModel = require('./models/pageStats'); // ADD THIS
const appStatsModel = require('./models/appStats'); // ADD THIS
const searchKeywordModel = require('./models/searchKeyword'); // ADD THIS

if(!process.env.MONGO_URI) { console.error("❌ MONGO_URI missing"); process.exit(1); }

mongoose.connect(process.env.MONGO_URI).then(()=>console.log("✅ Atlas Connected"));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'dollar_shop', allowed_formats: ['jpg','jpeg','png','webp'], transformation: [{ width: 800, crop: 'limit', quality: 'auto' }] },
});
const upload = multer({ storage, limits: { fileSize: 2*1024*1024 } });

app.use(session({ secret: process.env.SESSION_SECRET || "secret123", resave: false, saveUninitialized: false, cookie: { httpOnly: true, maxAge: 86400000 } }));

// ==== PERFORMANCE TRACKING MIDDLEWARE ====
app.use(async (req,res,next)=>{
    // 1. Track active user
    if(req.session && req.session.username && req.session.username!== "Admin"){
        try{
            await userModel.findOneAndUpdate({userName: req.session.username}, {lastActive: new Date()});
        }catch(e){}
    }
    // 2. Track page visits
    if(!req.path.includes('.') &&!req.path.startsWith('/api/')){
        res.on('finish', async ()=>{
            try{
                await pageStatsModel.findOneAndUpdate({page: req.path}, {$inc:{visits:1}}, {upsert:true});
            }catch(e){}
        });
    }
    next();
});

function isAdminAuth(req,res,next){ if(req.session.isAdmin) return next(); return res.redirect('/login?error=Admin required'); }

async function getSettings(){
    let rates = await settingModel.findOne().catch(()=>null);
    if(!rates){
        const hashed = await bcrypt.hash("12345", 10);
        rates = await settingModel.create({ twoDollarRate:540, dollarRate:270, rayalRate:75, dollarBgColor:"#ffffff", notification:"", adminEmail:"admin@gmail.com", adminPassword:hashed });
    }
    return rates;
}

app.get('/', async (req,res)=>{
    let last = await dollarModel.findOne().sort({updatedAt:-1}).catch(()=>null);
    let rates = await getSettings();
    res.render('index',{ username:req.session.username||"", isAdmin:req.session.isAdmin||false, lastUpdated:last?last.updatedAt:new Date(), twoDollarRate:rates.twoDollarRate, dollarRate:rates.dollarRate, rayalRate:rates.rayalRate, notification:rates.notification||"", bgColor:rates.dollarBgColor });
});
app.get('/signup',(req,res)=>res.render('signup'));
app.get('/login',(req,res)=>res.render('login',{error:req.query.error||""}));
app.get('/dollar', async (req,res)=>{
    let [products,childrens,ladies,seasons,others,rates] = await Promise.all([dollarModel.find(),childrenModel.find(),ladyModel.find(),seasonModel.find(),otherModel.find(),getSettings()]);
    res.render('dollar',{products,childrens,ladies,seasons,others,isAdmin:req.session.isAdmin||false,bgColor:rates.dollarBgColor,notification:rates.notification||""});
});
app.get('/twoDollar', async (req,res)=>{
    let [premiums,rates] = await Promise.all([premiumModel.find(),getSettings()]);
    res.render('twoDollar',{premiums,isAdmin:req.session.isAdmin||false,bgColor:rates.dollarBgColor,notification:rates.notification||""});
});
app.get('/rayal', async (req,res)=>{
    let [rayals,rates] = await Promise.all([rayalModel.find(),getSettings()]);
    res.render('rayal',{rayals,isAdmin:req.session.isAdmin||false,bgColor:rates.dollarBgColor,notification:rates.notification||""});
});
app.get('/dollarAdmin', isAdminAuth, async (req,res)=>{ let r=await getSettings(); res.render('dollarAdmin',{bgColor:r.dollarBgColor,notification:r.notification,notificationExpiresAt:r.notificationExpiresAt,notificationDuration:r.notificationDuration}); });
app.get('/users', isAdminAuth, async (req,res)=>{ let users=await userModel.find().select('-password'); res.render('users',{users}); });
app.get('/feedbacks', isAdminAuth, async (req,res)=>{ let allFeedbacks=await feedbackModel.find().sort({createdAt:-1}); res.render('feedbacks',{allFeedbacks}); });
app.get('/changeAdminPassword', isAdminAuth, async (req,res)=>{ let r=await getSettings(); res.render('passwordChangeAdmin',{adminEmail:r.adminEmail,msg:req.query.msg||"",error:req.query.error||""}); });
app.get('/editProduct/:productid', isAdminAuth, async (req,res)=>{
    let product=null; for(let M of [dollarModel,childrenModel,ladyModel,seasonModel,otherModel,premiumModel,rayalModel]){ product=await M.findById(req.params.productid).catch(()=>null); if(product) break; }
    if(!product) return res.send("Not found"); res.render('editProduct',{product});
});
const del = (Model,red)=>async(req,res)=>{ await Model.findByIdAndDelete(req.params.id); res.redirect(red); };
app.get("/delete/:id", isAdminAuth, del(dollarModel,"/dollar"));
app.get("/deleteLady/:id", isAdminAuth, del(ladyModel,"/dollar"));
app.get("/deleteChildren/:id", isAdminAuth, del(childrenModel,"/dollar"));
app.get("/deleteSeason/:id", isAdminAuth, del(seasonModel,"/dollar"));
app.get("/deleteOther/:id", isAdminAuth, del(otherModel,"/dollar"));
app.get("/deletePremium/:id", isAdminAuth, del(premiumModel,"/twoDollar"));
app.get("/deleteRayal/:id", isAdminAuth, del(rayalModel,"/rayal"));
app.get("/deleteUser/:id", isAdminAuth, async(req,res)=>{ await userModel.findByIdAndDelete(req.params.id); res.redirect('/users'); });
app.get('/editUser/:id', isAdminAuth, async(req,res)=>{ let user=await userModel.findById(req.params.id); res.render('editUser',{user}); });
app.post('/updateUser/:id', isAdminAuth, upload.single('image'), async(req,res)=>{ let up={userName:req.body.userName.trim(),email:req.body.email.trim().toLowerCase()}; if(req.file) up.image=req.file.path; await userModel.findByIdAndUpdate(req.params.id,up); res.redirect('/users'); });
app.get('/logout',(req,res)=>{ req.session.destroy(()=>{ res.clearCookie('connect.sid'); res.redirect('/login'); }); });

app.post("/create", upload.single('image'), async(req,res)=>{
    try{
        let {name,email,password}=req.body; email=email.trim().toLowerCase(); let exist=await userModel.findOne({email}); if(exist) return res.send("Email exists");
        let hashed=await bcrypt.hash(password.trim(),10); let img=req.file?req.file.path:"/images/default-user.png";
        await userModel.create({userName:name.trim(),image:img,email,password:hashed}); res.redirect("/login");
    }catch(e){ res.send(e.message); }
});
app.post("/login", async(req,res)=>{
    const {email,password,isAdminCheck}=req.body; let clean=email.trim().toLowerCase();
    if(isAdminCheck){ let r=await getSettings(); if(clean===r.adminEmail && await bcrypt.compare(password.trim(),r.adminPassword)){ req.session.isAdmin=true; req.session.username="Admin"; return req.session.save(()=>res.redirect("/")); } else return res.send("Wrong admin"); }
    let user=await userModel.findOne({email:clean}); if(!user) return res.send("not found");
    if(await bcrypt.compare(password.trim(),user.password)){ req.session.isAdmin=false; req.session.username=user.userName; req.session.save(()=>res.redirect("/")); } else res.send("wrong pass");
});
const createP=(Model,red)=>async(req,res)=>{ if(!req.body?.name) return res.send("Name required"); let img=req.file?req.file.path:(req.body?.image||""); await Model.create({image:img,name:req.body.name}); res.redirect(red); };
app.post("/rayal", isAdminAuth, upload.single('image'), createP(rayalModel,"/dollarAdmin"));
app.post("/twoDollar", isAdminAuth, upload.single('image'), createP(premiumModel,"/dollarAdmin"));
app.post("/dollar", isAdminAuth, upload.single('image'), createP(dollarModel,"/dollarAdmin"));
app.post("/children", isAdminAuth, upload.single('image'), createP(childrenModel,"/dollarAdmin"));
app.post("/lady", isAdminAuth, upload.single('image'), createP(ladyModel,"/dollarAdmin"));
app.post("/season", isAdminAuth, upload.single('image'), createP(seasonModel,"/dollarAdmin"));
app.post("/other", isAdminAuth, upload.single('image'), createP(otherModel,"/dollarAdmin"));
app.post('/update/:productid', isAdminAuth, upload.single('image'), async(req,res)=>{
    let id=req.params.productid; let found=null,Model=null,red="/dollar";
    for(let o of [{M:dollarModel,r:"/dollar"},{M:childrenModel,r:"/dollar"},{M:ladyModel,r:"/dollar"},{M:seasonModel,r:"/dollar"},{M:otherModel,r:"/dollar"},{M:premiumModel,r:"/twoDollar"},{M:rayalModel,r:"/rayal"}]){ found=await o.M.findById(id).catch(()=>null); if(found){Model=o.M;red=o.r;break;} }
    let up={name:req.body?.name}; if(req.file) up.image=req.file.path; await Model.findOneAndUpdate({_id:id},up); res.redirect(red);
});
app.post('/updateRate', isAdminAuth, async(req,res)=>{ let {twoDollarRate,dollarRate,rayalRate}=req.body; let r=await settingModel.findOne(); if(!r) await settingModel.create({twoDollarRate,dollarRate,rayalRate}); else {r.twoDollarRate=twoDollarRate;r.dollarRate=dollarRate;r.rayalRate=rayalRate;await r.save();} res.redirect('/dollarAdmin'); });
app.post('/updateBgColor', isAdminAuth, async(req,res)=>{ let r=await settingModel.findOne(); if(!r) await settingModel.create({dollarBgColor:req.body.bgColor}); else {r.dollarBgColor=req.body.bgColor;await r.save();} res.redirect('/dollarAdmin'); });
app.post('/updateNotification', isAdminAuth, async(req,res)=>{ let {notification,duration}=req.body; duration=parseInt(duration)||24; let created=new Date(); let expires=duration!==0?new Date(created.getTime()+duration*3600000):null; let r=await settingModel.findOne(); if(!r) await settingModel.create({notification,notificationCreatedAt:created,notificationExpiresAt:expires,notificationDuration:duration}); else {r.notification=notification;r.notificationCreatedAt=created;r.notificationExpiresAt=expires;r.notificationDuration=duration;await r.save();} res.redirect('/dollarAdmin'); });
app.post('/clearNotification', isAdminAuth, async(req,res)=>{ let r=await settingModel.findOne(); if(r){r.notification="";r.notificationExpiresAt=null;await r.save();} res.redirect('/dollarAdmin'); });
app.post('/changeAdminPassword', isAdminAuth, async(req,res)=>{ let {currentPassword,newEmail,newPassword,confirmPassword}=req.body; let r=await getSettings(); if(!await bcrypt.compare(currentPassword,r.adminPassword)) return res.redirect('/changeAdminPassword?error=Wrong current'); if(newPassword!==confirmPassword) return res.redirect('/changeAdminPassword?error=Not matched'); r.adminEmail=newEmail.trim().toLowerCase(); r.adminPassword=await bcrypt.hash(newPassword.trim(),10); await r.save(); res.redirect('/changeAdminPassword?msg=Changed ✓'); });
app.post('/feedback', async(req,res)=>{ await feedbackModel.create({name:req.body.name.trim(),message:req.body.message.trim(),username:req.session.username||"Guest"}); res.render('feedBack',{name:req.body.name}); });

// ==== PERFORMANCE API ====
app.post('/api/track-time', async (req,res)=>{
    const { time } = req.body;
    if(!time) return res.json({ok:true});
    let stats = await appStatsModel.findOne();
    if(!stats) stats = await appStatsModel.create({totalWatchTime: 0});
    stats.totalWatchTime += parseInt(time);
    await stats.save();
    res.json({success:true});
});

// Add name mapping
const pageNames = {
    '/': 'Home Page',
    '/dollar': 'Dollar Products',
    '/twoDollar': 'Two Dollar Products',
    '/rayal': 'Rayal Products',
    '/dollarAdmin': 'Admin Panel',
    '/users': 'Users List',
    '/login': 'Login Page',
    '/signup': 'Signup Page',
    '/performance': 'Performance Page'
};

app.get('/api/performance-stats', async (req,res)=>{
    let allPages = await pageStatsModel.find().sort({visits:-1});
    let total = await appStatsModel.findOne();
    let totalUsers = await userModel.countDocuments();
    const dayAgo = new Date(Date.now() - 24*60*60*1000);
    let activeToday = await userModel.countDocuments({lastActive: {$gte: dayAgo}});
    let topKeywords = await searchKeywordModel.find().sort({count:-1}).limit(10);

    // Convert / to readable names
    let mappedPages = allPages.map(p => ({
        ...p._doc,
        displayName: pageNames[p.page] || p.page
    }));

    res.json({
        totalWatchTime: total? total.totalWatchTime : 0,
        mostVisited: mappedPages[0] || {displayName:'None', page:'None', visits:0},
        leastVisited: mappedPages[mappedPages.length-1] || {displayName:'None', page:'None', visits:0},
        allPages: mappedPages,
        totalUsers,
        activeToday,
        topKeywords
    });
});

app.get('/performance', isAdminAuth, async (req,res)=>{
    res.render('performance');
});

// Track search if you have search - add in your search route like this:
// app.get('/search', async(req,res)=>{
// let q = req.query.q?.toLowerCase().trim();
// if(q) await searchKeywordModel.findOneAndUpdate({keyword:q}, {$inc:{count:1}}, {upsert:true});
//...
// });

app.listen(process.env.PORT||10000, ()=>console.log("Server on "+(process.env.PORT||10000)));