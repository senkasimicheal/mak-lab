var express = require("express");
var moment = require('moment');
const cors = require("cors");
      app = express();
      Mongoose = require("mongoose");
      bodyParser = require("body-parser");
      cookieParser = require("cookie-parser");
      sessions = require("express-session");

//password encryption
bcrypt = require("bcrypt");

const port = process.env.PORT || 5000

const saltRounds = 10;

// creating mins from milliseconds
const Time = 300000;

//session middleware
app.use(cors());
app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: Time },
    resave: false,
  })
);

// parsing the incoming data
app.use(express.json());

// RENDERING HTML FILES
var engine = require("consolidate");
const { default: isEmail } = require("validator/lib/isemail");

app.set("views", __dirname + "/views");
app.engine("html", engine.mustache);
app.set("view engine", "html");
// RENDERING HTML FILES

app.use(express.urlencoded({ extended: false }));

// Telling the express module that the public dir has all of our site assets

app.use(express.static(__dirname + "/views"));

// cookie parser middleware
app.use(cookieParser());

// a variable to save a session
var session;
var session1;

var localDB = "mongodb://localhost/laboratoryDB";
var remoteDB =
  "mongodb+srv://Senkasi:senkasimicheal@cluster0.rivod.mongodb.net/ComputerLab";
Mongoose.connect(
  remoteDB,
  { useNewUrlParser: true },
  { useUnifiedTopology: true }
);

// CREATE A DATA SCHEMA FOR STUDENT DETAILS
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
    validate: [isEmail, "Please provide a valid email"],
  },
  password1: String,
  password2: String,
});

// CREATE A DATA MODEL FOR STUDENT DETAILS
const User = Mongoose.model("user", userSchema);

// CREATE A DATA SCHEMA FOR BOOKING DETAILS
var bookingSchema = new Mongoose.Schema({
  booking_date: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  Name: String,
  reg_number: String,
  start_time: String,
  stop_time: String,
  bookedComputer: String,
  computerDetails: String
});

const Book = Mongoose.model("booking", bookingSchema);

// CREATE A DATA SCHEMA FOR ADMINISTRATORS
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
    validate: [isEmail, "Please provide a valid email"],
  },
  password01: String,
  password02: String,
});

const Admin = Mongoose.model("admin", adminSchema);

// COMPUTERS SCHEMA
var computerSchema = new Mongoose.Schema({
  CompName: {
    type: String,
    unique: true,
  },
  details: String,
});

const Computer = Mongoose.model("computer", computerSchema);

//but still the index.html is not rendering with css and js
app.get("/register", function (req, res) {
  res.render("index.html");
});

app.get("/login", function (req, res) {
  session = req.session;
  res.render("index.html");
});

app.get("/slot", function (req, res) {
  res.render("slot.html");
});

app.get("/sign_up", function (req, res) {
  res.render("index.html");
});

app.get("/adminLogin", function (req, res) {
  res.render("index.html");
});

app.get("/addComputer", function (req, res) {
  Computer.find((err, docs) => {
    if (!err) {
      res.render("computers.html", {
        data: docs,
      });
    } else {
      console.log("Failed to retrieve the Course List: " + err);
    }
  });
  // res.render('computers.html')
});

app.get("/removeComputer", function (req, res) {
  res.render("computers.html");
});

// STUDENT SIGNUP
app.post("/register", async (req, res) => {
  console.log(req.body);
  try {
    const Exist = await User.findOne({ Email: req.body.Email });
    const Exist1 = await User.findOne({ reg_number: req.body.reg_number });
    const Exist2 = await User.findOne({ stdt_number: req.body.stdt_number });
    if (Exist || Exist1 || Exist2) {
      res.send(
        "User already exists! Check your email, student number or registration number and try again"
      );
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
        res.redirect("/slot");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occured");
  }
});

// STUDENT LOGIN
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ Email: req.body.Email });
    console.log(user);
    if (user) {
      const cmp = await bcrypt.compare(req.body.password1, user.password1);
      if (cmp) {
        //   ..... further code to maintain authentication like jwt or sessions
        session = req.session;
        session.userid = user;
        console.log(req.session);
        res.redirect("/slot");
      } else {
        res.send("Wrong password.");
      }
    } else {
      res.send("Wrong username or User does not exist.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occured");
  }
});


// DISPLAYING LOGGED IN USER NAME
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


// BOOKING DETAILS
app.post("/slot", async (req, res) => {
  console.log(req.body);
  // const computers = await Computer.updateOne({CompName: req.body.CompName});
  
  try {
    const list_of_computers = await Computer.aggregate([
      { $sample: { size: 1 } },
    ]);
    const bookedComp = list_of_computers[0];
    const computerBook = await Book.findOne({ bookedComputer: bookedComp.CompName });
    if(computerBook){
      res.send("Try to book again")
    }else{
      session = req.session;
      session.userid1 = bookedComp;
      console.log(req.session);
      const bookingResult = await Book.create({
        booking_date: Date.now(),
        Name: req.session.userid.Name,
        reg_number: req.session.userid.reg_number,
        start_time: req.body.start_time,
        stop_time: req.body.stop_time,
        bookedComputer: bookedComp.CompName,
        computerDetails: bookedComp.details
      });
      res.redirect("/slot");
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send("A problem occurred");
  }
});

// DISPLAYING BOOKED COMPUTER
app.get("/getComputer", async (req, res) => {
  res.json({
    comp: req.session.userid1,
  });
});

app.get("/list1", async (req, res) => {
  res.render("slot.html", {
    list1: req.session.userid1.CompName,
  });
});

// ADMINISTRATOR SIGNUP
app.post("/sign_up", async (req, res) => {
  console.log(req.body);
  try {
    const Exist11 = await Admin.findOne({ Email1: req.body.Email1 });
    if (Exist11) {
      res.send("User already exists! Check your email and try again");
    } else {
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
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occured");
  }
});

// ADMINISTRATOR LOGIN
app.post("/adminLogin", async (req, res) => {
  try {
    const user = await Admin.findOne({ Email1: req.body.user_name1 });
    console.log(user);
    if (user) {
      const cmp = await bcrypt.compare(req.body.password01, user.password01);
      if (cmp) {
        //   ..... further code to maintain authentication like jwt or sessions
        res.redirect("/addComputer");
      } else {
        res.send("Wrong password.");
      }
    } else {
      res.send("Wrong username or User does not exist.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occured");
  }
});

// ADDING COMPUTERS TO THE DATABASE

app.post("/addComputer", async (req, res) => {
  console.log(req.body);
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
    console.log(error);
    res.status(500).send("Internal Server error Occured");
  }
});

// DELETING COMPUTERS
app.post('/removeComputer', async (req, res)=>{
  console.log(req.body);
  try {
    const query = { title: req.body.CompName };
    const result = await Computer.deleteOne(query);
    if (result.deletedCount === 1) {
      res.send("Successfully removed one computer.");
    } else {
      res.send("No computers matched the query. Deleted 0 computers.");
    }
  }catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error Occured");
  }
})

app.listen(port, ()=> {
  console.log("Server is running on 5000");
});
