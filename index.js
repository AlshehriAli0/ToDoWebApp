import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import mongoose from "mongoose";
import { default as connectMongoDBSession } from "connect-mongodb-session";
import { v4 as uuidv4 } from "uuid";

//* constants
const resetTime = 1000 * 60 * 60 * 24 * 30;
const app = express();
const port = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET;
const mongoURI = process.env.mongodb_URI;
const MongoDBStore = connectMongoDBSession(session);

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const store = new MongoDBStore({
  uri: mongoURI,
  collection: "sessions",
  expires: resetTime / 1000,
});

store.on("error", (error) => {
  console.error(`MongoDBStore Error: ${error}`);
});

//* express
app.use(
  session({
    name: "tasks.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365,
    },
  })
);
app.use("/public", express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static("./node_modules/bootstrap/dist/"));

//* variables
var today = new Date();
var day = today.getDate();
var month = today.getMonth();
var monthName = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
var dayName = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
var dateAndDay = `${dayName[today.getDay()]}, ${day}/${monthName[month]}`;
var addedTasks = [];
var addedWorkTasks = [];

// * functions
// function waitFiveMinutes() {
//   const milliseconds = 30 * 60 * 1000;
//   setTimeout(() => {
//     addedTasks = [];
//     addedWorkTasks = [];
//   }, milliseconds);
// }

// function waitFiveMinutesWork() {
//   const milliseconds = 30 * 60 * 1000;
//   setTimeout(() => {
//     addedWorkTasks = [];
//   }, milliseconds);
// }

//* app requsts
app.get("/", (req, res) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
    req.session.addedTasks = [];
  }

  res.render("index.ejs", {
    dateAndDay,
    addedTasks: req.session.addedTasks,
    exist,
  });
});

app.get("/work", (req, res) => {
  if (!req.session.addedWorkTasks) {
    req.session.addedWorkTasks = [];
  }
  res.render("work.ejs", {
    dateAndDay,
    addedWorkTasks: req.session.addedWorkTasks,
    existWork,
  });
});

app.post("/", (req, res) => {
  const addedTasks = req.session.addedTasks || [];
  if (addedTasks.includes(req.body["newNote"]) === false) {
    if (req.body["newNote"] != "") {
      exist = false;
      addedTasks.unshift(req.body["newNote"]);
      req.session.addedTasks = addedTasks;
    }
  } else {
    exist = true;
  }

  res.render("index.ejs", { dateAndDay, addedTasks, exist });
  // waitFiveMinutes();
});

app.post("/work", (req, res) => {
  const addedWorkTasks = req.session.addedWorkTasks || [];
  if (addedWorkTasks.includes(req.body["newWorkNote"]) === false) {
    if (req.body["newWorkNote"] != "") {
      existWork = false;
      addedWorkTasks.unshift(req.body["newWorkNote"]);
      req.session.addedWorkTasks = addedWorkTasks;
    }
  } else {
    existWork = true;
  }

  res.render("work.ejs", { dateAndDay, addedWorkTasks, existWork });
  // waitFiveMinutesWork();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
