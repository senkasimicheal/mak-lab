var express = require("express");
var moment = require('moment');
const cors = require("cors");
const app = express();
const  Mongoose = require("mongoose");
const  bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

bcrypt = require("bcrypt");

const port = process.env.PORT || 5000

const saltRounds = 10;

const Time = 1000*24*60*60;

app.use(cors());
app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: Time },
    resave: false,
  })
);

app.use(express.json());

var engine = require("consolidate");
const { json } = require("express");

app.set("views", __dirname + "/views");
app.engine("html", engine.mustache);
app.set("view engine", "html");

app.use(express.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/views"));

app.use(cookieParser());

var session;

var remoteDB = "mongodb+srv://Senkasi:senkasimicheal@cluster0.rivod.mongodb.net/ComputerLab";
Mongoose.connect(remoteDB, { useNewUrlParser: true },{ useUnifiedTopology: true });

var userSchema = new Mongoose.Schema({
  registration_date: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  Name: String,
  reg_number: {
    type: String,
    unique: true,
  },
  stdt_number: {
    type: Number,
    unique: true,
  },
  Course: String,
  Email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password1: String,
  computer_id: {
    type: String,
    default: ''
  },
  CompName: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  booking_date: {
    type: Date,
    default: ''
  },
  start_time: {
    type: String,
    default: ''
  },
  stop_time: {
    type: String,
    default: ''
  }
});

const User = Mongoose.model("user", userSchema);

var adminSchema = new Mongoose.Schema({
  registration_date: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  Name1: String,
  Email1: {
    type: String,
    unique: true,
    lowercase: true,
  },
  staffID: String,
  password01: String,
  password02: String,
});

const Admin = Mongoose.model("admin", adminSchema);

var idsSchema = new Mongoose.Schema({
  staffID: String
});

const IDS = Mongoose.model("ids", idsSchema);

var computerSchema = new Mongoose.Schema({
  CompName: {
    type: String,
    unique: true,
  },
  details: String,
  bookers_id: {
    type: String,
    default: ''
  }
});

const Computer = Mongoose.model("computer", computerSchema);

app.get("/register", function (req, res) {
  res.render("index.html");
});
app.post("/register", async (req, res) => {
  try {
    const Exist = await User.findOne({ Email: req.body.Email });
    const Exist1 = await User.findOne({ reg_number: req.body.reg_number });
    const Exist2 = await User.findOne({ stdt_number: req.body.stdt_number });
    if (Exist || Exist1 || Exist2) {
      res.send("User already exists! Check your email, student number or registration number and try again");
    } else {
      if (req.body.password1 != req.body.password2) {
        res.send("Passwords don't match");
      } else {
        const hashedPwd = await bcrypt.hash(req.body.password1, saltRounds);
        const insertResult = await User.create({
          registration_date: Date.now(),
          Name: req.body.Name,
          reg_number: req.body.reg_number,
          stdt_number: req.body.stdt_number,
          Course: req.body.Course,
          Email: req.body.Email,
          password1: hashedPwd,
        });
        res.redirect("/login");
      }
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.get("/login", function (req, res) {
  session = req.session;
  res.render("index.html");
});
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ Email: req.body.Email });
    if (user) {
      const cmp = await bcrypt.compare(req.body.password1, user.password1);
      if (cmp) {
        session = req.session;
        session.userid = user;
        res.redirect("/slot");
      } else {
        res.send("Wrong password.");
      }
    } else {
      res.send("Wrong username or User does not exist.");
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.get("/getSession", async (req, res) => {
  res.json({
    user: req.session.userid.Name,
  });
});

app.get("/list", async (req, res) => {
  res.render("slot.html", {
    list: req.session.userid.Name,
  });
});

app.get("/slot", function (req, res) {
  res.render("slot.html");
});
app.post("/slot", async (req, res) => {
  const list_of_computers = await Computer.find({"bookers_id": ""});
  const checkUser = await User.findOne({Email: req.session.userid.Email});
  const index1 = req.body.start_time.indexOf(":");
  const hours1 = req.body.start_time.substr(0, index1);
  const minute1 = req.body.start_time.substr(index1 + 1);
  const index2 = req.body.stop_time.indexOf(":");
  const hours2 = req.body.stop_time.substr(0, index1);
  const minute2 = req.body.stop_time.substr(index1 + 1); 
  try {
    if(hours2 <= 5){
      var TwtFourhrs = hours2 + 12;
      if((TwtFourhrs-hours1) >= 0){
        const Workhours = TwtFourhrs - hours1;
        const Workmins = minute2 - minute1;
        const Duration = Workhours + (Workmins/60);
        if((Duration >= (1/6)) && (Duration <= 2)){
          if(checkUser.computer_id == ""){
            if(list_of_computers.length !== 0){
              const user_id = String(checkUser._id)
              const randomItem = list_of_computers[Math.floor(Math.random()*list_of_computers.length)];
              const first_free_comp_id = String(randomItem._id)
              await User.updateOne({_id: checkUser._id}, {computer_id: first_free_comp_id,
                CompName: randomItem.CompName, details: randomItem.details,
                booking_date: Date.now(), start_time: req.body.start_time,
                stop_time: req.body.stop_time});
                
              await Computer.updateOne({_id: randomItem._id}, {bookers_id: user_id});
              res.redirect("/slot");
            }else{
              res.send("No free computers");
              }
          }else{
            res.send("already booked");
            }
        }else{
          res.send("Duration can not go below 10 minutes or it can not be greater than 2 hours");
        }
      }else{
        res.send("Invalid!! Starting time is bigger");
      }
    }else{
      if((hours2-hours1) >= 0){
        const Workhours = hours2 - hours1;
        const Workmins = minute2 - minute1;
        const Duration = Workhours + (Workmins/60);
        if((Duration >= (1/6)) && (Duration <= 2)){
          if(checkUser.computer_id == ""){
            if(list_of_computers.length !== 0){
              const user_id = String(checkUser._id)
              const randomItem = list_of_computers[Math.floor(Math.random()*list_of_computers.length)];
              const first_free_comp_id = String(randomItem._id)
              await User.updateOne({_id: checkUser._id}, {computer_id: first_free_comp_id,
                CompName: randomItem.CompName, details: randomItem.details,
                booking_date: Date.now(), start_time: req.body.start_time,
                stop_time: req.body.stop_time});
                
              await Computer.updateOne({_id: randomItem._id}, {bookers_id: user_id});
              res.redirect("/slot");
            }else{
              res.send("No free computers");
              }
          }else{
            res.send("already booked");
            }
        }else{
          res.send("Duration can not go below 10 minutes or it can not be greater than 2 hours");
        }
      }else{
        res.send("Invalid!! Starting time is bigger");
      }
    }
  } catch (error) {
    res.status(500).send("A problem occurred");
  }
 });

app.get("/getComputer", async (req, res) => {
  const user = await User.findOne({ Email: req.session.userid.Email });
  res.json({
    comp: user.CompName,
    id: user.computer_id
  })
});

app.get("/list1", async (req, res) => {
  const user = await User.findOne({ Email: req.session.userid.Email });
  res.render("slot.html", {
    list1: user.CompName,
    list2: user.computer_id
  });
});

app.get("/sign_up", function (req, res) {
  res.render("index.html");
});
app.post("/sign_up", async (req, res) => {
  try {
    const sID = await IDS.findOne({staffID: req.body.staffID});
    const Exist11 = await Admin.findOne({ Email1: req.body.Email1 });
    if (Exist11) {
      res.send("User already exists! Check your email and try again");
    } else {
      if(sID){
        if (req.body.password01 != req.body.password02) {
          res.send("Passwords don't match");
        } else {
          const hashedPwd1 = await bcrypt.hash(req.body.password01, saltRounds);
          const insertResult1 = await Admin.create({
            registration_date: Date.now(),
            Name1: req.body.Name1,
            Email1: req.body.Email1,
            password01: hashedPwd1,
          });
          res.render("computers.html");
        }
      }else{
        res.send("Wrong staff ID number");
      }
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.get("/adminLogin", function (req, res) {
  res.render("index.html");
});
app.post("/adminLogin", async (req, res) => {
  try {
    const user = await Admin.findOne({ Email1: req.body.user_name1 });
    if (user) {
      const cmp = await bcrypt.compare(req.body.password01, user.password01);
      if (cmp) {
        res.redirect("/addComputer");
      } else {
        res.send("Wrong password.");
      }
    } else {
      res.send("Wrong username or User does not exist.");
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.get("/addComputer", function (req, res) {
  Computer.find((err, docs) => {
    if (!err) {
      res.render("computers.html", {
        data: docs,
      });
    } else {
      res.send("Failed to retrieve the Course List: " + err);
    }
  });
});
app.post("/addComputer", async (req, res) => {
  try {
    const Comp = await Computer.findOne({ CompName: req.body.CompName });
    if (Comp) {
      res.send("Computer is already in the database");
    } else {
      const insertResult1 = await Computer.create({
        CompName: req.body.CompName,
        details: req.body.details,
      });
      res.send("Computer added successfully");
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.get("/removeComputer", function (req, res) {
  res.render("computers.html");
});
app.post('/removeComputer', async (req, res)=>{
  try {
    const query = { title: req.body.CompName };
    const result = await Computer.deleteOne(query);
    if (result.deletedCount === 1) {
      res.send("Successfully removed one computer.");
    } else {
      res.send("No computers matched the query. Deleted 0 computers.");
    }
  }catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
});

app.get("/decline", function (req, res) {
  res.render("computers.html");
});
app.post('/decline', async (req, res)=>{
  try {
    const decline = await User.findOne({computer_id: req.body.CompID});
    if(decline){
      await User.updateOne({computer_id: req.body.CompID}, {computer_id: "",
        CompName: "", details: "",
        booking_date: "", start_time: "",
        stop_time: ""});
      await Computer.updateOne({_id: req.body.CompID}, {bookers_id: ""});
      res.redirect("/decline");
    }else{
      res.send("Wrong computer ID");
    }
  } catch (error) {
    res.status(500).send("Internal Server error Occured");
  }
})

app.get("/getBooked", async (req, res) => {
  const list_of_computers = await User.find({"computer_id": {"$exists" : true, "$ne" : ""}});
  res.json({
    Booked: list_of_computers,
  })
});

app.get("/list2", async (req, res) => {
  const list_of_computers = await User.find({"computer_id": {"$exists" : true, "$ne" : ""}});
  res.render("computers.html", {
    list1: list_of_computers,
  });
});

app.listen(port, ()=> {
  console.log("Server is running on 5000");
});