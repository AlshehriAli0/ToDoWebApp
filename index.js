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

//* reduce resource on mongodb
app.use((req, res, next) => {
  const pauseAndSaveSession = (req, res, next) => {
    req.pauseSession = () => {
      req.session.pause = true;
    };
    req.resumeSession = () => {
      req.session.pause = false;
    };
    if (req.session && req.session.pause) {
      req.session.save = (callback) => {
        if (req.session.hasChanges) {
          req.session.hasChanges = false;
          return store.set(req.sessionID, req.session, callback);
        }
        callback();
      };
    }
    next();
  };
  pauseAndSaveSession(req, res, next);
});

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

//* app requsts
app.get("/", (req, res) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
    req.session.addedTasks = [];
  }

  res.render("index.ejs", {
    dateAndDay,
    addedTasks: req.session.addedTasks,
  });
});

app.get("/work", (req, res) => {
  if (!req.session.addedWorkTasks) {
    req.session.addedWorkTasks = [];
  }
  res.render("work.ejs", {
    dateAndDay,
    addedWorkTasks: req.session.addedWorkTasks,
  });
});

app.post("/", (req, res) => {
  const addedTasks = req.session.addedTasks || [];
  if (addedTasks.includes(req.body["newNote"]) === false) {
    if (req.body["newNote"] != "") {
      addedTasks.unshift(req.body["newNote"]);
      req.session.addedTasks = addedTasks;
      req.session.hasChanges = true;
    }
  }
  res.render("index.ejs", { dateAndDay, addedTasks });
});

app.post("/work", (req, res) => {
  const addedWorkTasks = req.session.addedWorkTasks || [];
  if (addedWorkTasks.includes(req.body["newWorkNote"]) === false) {
    if (req.body["newWorkNote"] != "") {
      addedWorkTasks.unshift(req.body["newWorkNote"]);
      req.session.addedWorkTasks = addedWorkTasks;
      req.session.hasChanges = true;
    }
  }
  res.render("work.ejs", { dateAndDay, addedWorkTasks });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
