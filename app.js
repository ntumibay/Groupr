// // Setup server, session and middleware here.

// /*
// Middlewares
// You will have the following middleware functions:

// This middleware will apply to the root route / (note, a middleware applying to the root route is the same as a middleware that fires for every request) and will do one of the following:
// This middleware will log to your console for every request made to the server, with the following information:
// Current Timestamp: new Date().toUTCString()
// Request Method: req.method
// Request Path: req.path
// Some string/boolean stating if a user is authenticated
// If logged in, the users status (superuser or user)
//     There is no precise format you must follow for this. The only requirement is that it logs the data stated above.

//      An example would be:

//     [Sun, 14 Apr 2019 23:56:06 GMT]: GET / (Non-Authenticated)

//      [Sun, 14 Apr 2019 23:56:14 GMT]: POST /login (Non-Authenticated)

//      [Sun, 14 Apr 2019 23:56:19 GMT]: GET /userProfile (Authenticated Super User)

//      [Sun, 14 Apr 2019 23:56:44 GMT]: GET / (Authenticated User)

// Then call next

// 3. This middleware will only be used for the GET /login route and will do one of the following:    
//      A. If the user is authenticated AND they have a role of superuser, the middleware function will redirect them to the /superuser route,
//      B. If the user is authenticated AND they have a role of user, you will redirect them to the /user route.
//      C. If the user is NOT authenticated, you will allow them to get through to the GET /login route. A logged in user should never be able to access the sign in form.

// 4. This middleware will only be used for the GET /register route and will do one of the following:
//      A. If the user is authenticated AND they have a role of superuser, the middleware function will redirect them to the /superuser route,
//      B. If the user is authenticated AND they have a role of user, you will redirect them to the /user route.
//      C. If the user is NOT authenticated, you will allow them to get through to the GET /signupuser route. A logged in user should never be able to access the registration form.

// 5. This middleware will only be used for the GET /user route and will do one of the following:
//      A. If a user is not logged in, you will redirect to the GET /login route.
//      B. If the user is logged in, the middleware will "fall through" to the next route calling the next() callback. (Users with both roles superuser or user should be able to access the /user route, so you simply need to make sure they are authenticated in this middleware.)

// 6. This middleware will only be used for the GET /superuser route and will do one of the following: 
//     A. If a user is not logged in, you will redirect to the GET /login route.
//     B. If a user is logged in, but they are not an super user, you end the response right in the middleware function and render a HTML error page saying that the user does not have permission to view the page, and the page must issue an HTTP status code of 403. (provide a link to the /user page, since they are logged in, just not an super user)
//    C. If the user is logged in AND the user has a role of superuser, the middleware will "fall through" to the next route calling the next() callback.
//  ONLY USERS WITH A ROLE of superuser SHOULD BE ABLE TO ACCESS THE /superuser ROUTE!

// 7. This middleware will only be used for the GET /signout route and will do one of the following:   
//      If a user is not logged in, you will redirect to the GET /login route.
//      If the user is logged in, the middleware will "fall through" to the next route calling the next() callback.



// */


import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import exphbs, { create } from 'express-handlebars';
import configRoutes from './routes/index.js';
import * as helpers from "./helpers.js";

import { register, login, addEvents, addTasks, getUserById } from "./data/users.js";
import { createGroup, assignAdmin, addMember, groupAddEvents, groupAddTasks, searchGroupById, updateProgress } from './data/group.js';
import {dbConnection, closeConnection } from './config/mongoConnection.js';

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {//helper func for userProfile
    inc: function (value) {
      return parseInt(value) + 1;
    },
    eq: function (a, b) {
       return a === b;
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Middleware setup
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public'));

app.use(session({
  name: 'AuthenticationState',
  secret: 'some secret string!',
  resave: false,
  saveUninitialized: false
}));

//check for what needs to be added before this

//Middleware 1
app.use('/', (req, res, next)=>{
  let currentTimeStamp = new Date().toUTCString();
  let reqMethod = req.method;
  let reqPath = req.path;
  let isAuthenticated = 'Non-Authenticated';
  if (req.session && req.session.user){
    if (req.session.user.role==='administrator'){
      isAuthenticated = 'Authenticated Super User';
    }
    else if (req.session.user.role==='member'){
      isAuthenticated = 'Authenticated User';
    }
  }
  
  console.log(`[${currentTimeStamp}]: ${reqMethod} ${reqPath} (${isAuthenticated})`);
  next();
});

//Middleware 2
app.use('/login', (req, res, next)=>{
  if (req.session && req.session.user && req.session.user.role){
    if (req.session.user.role==='administrator'){
      return res.redirect('/superuser');
    }
    if (req.session.user.role==='member'){
      return res.redirect('/user');
    }
  }
  next();
});

//Middleware 3
app.use('/register', (req, res, next)=>{
  if (req.session && req.session.user){
    if (req.session.user.role==='administrator'){
      return res.redirect('/superuser');
    }
    if (req.session.user.role==='member'){
      return res.redirect('/user');
    }
  }
  next();
});

//Middleware 4
app.use('/user', (req, res, next) =>{
  if (!(req.session && req.session.user)){
    return res.redirect('/login');
  }
  next();
});

//Middleware 5
app.use('/superuser', (req, res, next) =>{
  if (!(req.session && req.session.user)){
    return res.redirect('/login');
  }
  else if (req.session.user.role!== 'administrator'){
    return res.status(403).render('error', {errors: "Error 403: You do not have permission to view the page."});
  }
  else {
    next();
  }
});

//Middleware 6
app.use('/signout', (req, res, next) => {
  if (!(req.session && req.session.user)){
    return res.redirect('/login');
  }
  else {
    next();
  }
});

//Middleware to ensure user is logged in when trying to access /user/:userid
app.use('/user/:userid', (req, res, next) => {
  if (!(req.session && req.session.user)){
    return res.redirect('/login');
  }
  else {
    next();
  }
});

configRoutes(app);

// app.listen(3000, () => {
//     console.log("We've now got a server!");
//     console.log('Your routes will be running on http://localhost:3000');
// });


//below checks functions work b4 creating routes
async function populate_database() {
  const db = await dbConnection();
  await db.dropDatabase();
  console.log(await register('Patrick',
       'Hill',  
       'graffixnyc',
       '@PainTurfs7',
      'administrator'));

  console.log(await register("Sean", "Bautista", "teriya", "Projectko2!", "administrator"));
  try {
       console.log(await login("Samara", "@PainTurfs7"));
  } catch (err) {
       console.log(err.toString());
  }
  console.log();
  try {
       console.log(await login("GRAFFIXnyc", "@PainTurfs7"));
  } catch (err) {
       console.log(err.toString());
  }

  try {
    console.log(await addTasks("teriya", {
      assignedUsers: ["teriya"], 
      progress: "not started", 
      startDate: "Thu:10:30", 
      endDate: "The:12:30",
      urgencyLevel: 5,
      description: "CS546 Final Project"
    }));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await createGroup("Group R", "graffixnyc", 123456));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await createGroup("Not Group R", "graffixnyc", 123456));
  }
  catch (e){
    console.log(e);
  }
  try {
    console.log(await assignAdmin("graffixnyc", 123456));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await addMember("teriya", 123456));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await assignAdmin("teriya", 123456));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await groupAddTasks(123456, {
      assignedUsers: ["teriya"], 
      progress: "not started", 
      startDate: "2025-10-01", 
      endDate: "2025-12-01",
      urgencyLevel: 5,
      description: "CS546 Final Project"
    }));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await searchGroupById(123456));
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await register('Vincent',
       'Penalosa',  
       'warachnid',
       '1Password!',
      'member'));
  } catch (e) {
    console.log(e);
  }

  try {
    console.log(await register('Dominic',
       'Penalosa',  
       'derpysquid',
       '2Password!',
      'member'));
  } catch (e) {
    console.log(e);
  }

  try {
    console.log(await groupAddEvents(123456, {
      title: "Testing groupAddEvents",
      startDate: "2025-05-10T12:30",
      endDate: "2025-05-20T14:00",
      description: "Weekly team sync-up"
    }
    ));
  }
  catch (e){
    console.error(e);
  }

  const events1 = [
    {
      title: "Team Meeting",
      startDate: "2025-05-15T12:30",
      endDate: "2025-05-15T14:00",
      description: "Weekly team sync-up"
    },
    {
      title: "Office Hours",
      startDate: "2025-05-12T10:00",
      endDate: "2025-05-12T11:00",
      description: "Student office hours with TA"
    },
    {
      title: "Study Group",
      startDate: "2025-05-14T09:15",
      endDate: "2025-05-14T10:00",
      description: "Morning study group session"
    },
    {
      title: "Lab Session",
      startDate: "2025-05-13T18:00",
      endDate: "2025-05-13T19:00",
      description: "CS546 Lab on backend development"
    },
    {
      title: "Late Night Coding",
      startDate: "2025-05-17T00:30",
      endDate: "2025-05-17T02:00",
      description: "Group hackathon preparation"
    },
    {
      title: "Game Dev Sprint",
      startDate: "2025-05-16T22:00",
      endDate: "2025-05-17T01:00",
      description: "Late night game development sprint"
    }
  ];

  let events2 = [
    {
      title: "Lecture Review",
      startDate: "2025-05-12T09:00",
      endDate: "2025-05-12T10:30",
      description: "Review session for CS coursework"
    },
    {
      title: "Overnight Server Maintenance",
      startDate: "2025-05-11T23:30",
      endDate: "2025-05-12T01:00",
      description: "Scheduled server maintenance"
    },
    {
      title: "Morning Gym",
      startDate: "2025-05-14T08:00",
      endDate: "2025-05-14T09:30",
      description: "Workout before class"
    },
    {
      title: "Lunch Meetup",
      startDate: "2025-05-15T12:00",
      endDate: "2025-05-15T13:00",
      description: "Quick lunch with classmates"
    }
  ];

  for(let event of events1) {
    await addEvents("warachnid", event);
  }

  for(let event of events2) {
    await addEvents("derpysquid", event);
  }
  
  await addMember("warachnid", 123456);
  await addMember("derpysquid", 123456);

  try {
    let group = await searchGroupById(123456);
    await updateProgress(123456, group.schedule.tasks[0]._id, "FINISHED", "teriya");
  }
  catch (e){
    console.error(e);
  }

  try {
    console.log(await groupAddTasks(123456, 
      {
      assignedUsers: ["teriya", 'graffixnyc', 'derpyquid', 'warachnid'], 
      progress: "not started", 
      startDate: "2025-09-11", 
      endDate: "2025-12-07",
      urgencyLevel: 5,
      description: "EVERYONE GET ON THIS"
    }
    ));
  }
  catch(e){
    console.error(e);
  }

  await closeConnection();
  console.log('Done!');
}


async function main() {
  await populate_database();
}

main();