//import mongo collections, bcrypt and implement the following data functions
import { users, groups } from "../config/mongoCollections.js";
import * as helpers from "../helpers.js";
import bcrypt from "bcrypt";
import {ObjectId} from "mongodb";
import { searchGroupById, addMember } from "./group.js";

const saltRounds = 8;

export const register = async (
  firstName,
  lastName,
  userId,
  password
) => {
  if (!firstName || !lastName || !userId || !password){
    throw "Error: All fields must be supplied";
  }

  firstName = helpers.validateName(firstName, 'First name');
  lastName = helpers.validateName(lastName, 'Last name');
  userId = helpers.validateUserId(userId);
  password = helpers.validatePassword(password);

  const userCollection = await users();
  let exists = await userCollection.findOne({userId: userId});
  if (exists){
    throw "Error: There is already a user with this User ID";
  }

  const hashedPass = await bcrypt.hash(password, saltRounds);
  const td = new Date();
  const signupDate = `${(td.getMonth() + 1).toString().padStart(2, '0')}/${td.getDate().toString().padStart(2, '0')}/${td.getFullYear()}`;

  const newUser = {
    firstName: firstName,
    lastName: lastName,
    userId: userId,
    password: hashedPass,
    signupDate: signupDate,
    lastLogin: "",
    schedules: {
      _id: new ObjectId(),
      events: [],
      tasks: [],
      //groupFreeTime: [], commenting this out since we said it would be hidden in user collection
      userFreeTime: []
    },
    groups: {} //an object to store key-value pairings of (PIN : name) for each group that the user is a part of
  };
  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {throw 'Could not add user';}
  return {registrationCompleted: true};
};

export const login = async (userId, password) => {
  if (!userId || !password){
    throw "Error: userId and password must be provided";
  }
  userId = helpers.validateUserId(userId);
  password = helpers.validatePassword(password);
  userId = userId.trim();
  

  const userCollection = await users();
  const user = await userCollection.findOne({userId: userId});
  if (!user){
    throw "Either the userId or password is invalid";
  }

  const matched = await bcrypt.compare(password, user.password);
  if (!matched){
    throw "Either the userId or password is invalid";
  }
  const td = new Date();
  const hours = td.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12; // Convert to 12-hour format
  const lastLogin = `${(td.getMonth() + 1).toString().padStart(2, '0')}/` +
                   `${td.getDate().toString().padStart(2, '0')}/` +
                   `${td.getFullYear()} ` +
                   `${twelveHour.toString().padStart(2, '0')}:` +
                   `${td.getMinutes().toString().padStart(2, '0')}${ampm}`;
  await userCollection.updateOne(
    {_id: user._id},
    {$set: {lastLogin: lastLogin}}
  );
  const retUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    userId: user.userId,
    signupDate: user.signupDate,
    lastLogin: lastLogin
  };
  return await userCollection.findOne(
    {userId: userId},
    {projection: 
      {_id: 0, password: 0}
    }
    );
  return retUser;
};

export const addEvents = async (userId, event) => {
  if (!userId){
    throw "Error: userId must be provided";
  }
  if (!event){
    throw "Error: event must be provided";
  }
  userId = helpers.validateUserId(userId);
  //below checks event. May be moves to helpers at later date
  if (typeof event != 'object') {throw "Error: event must be an object";}
  //make sure the only keys are title, startDate, endDate, description
  const eventKeys = Object.keys(event);
  const validKeys = ['title', 'startDate', 'endDate', 'description'];
  for (let i = 0; i < eventKeys.length; i++){
    if (!validKeys.includes(eventKeys[i])){
      throw "Error: event can only contain title, startDate, endDate, and description";
    }
  }
  //check that title is a string
  if (!event.title || typeof event.title !== 'string'){
    throw "Error: title must be a string";
  }
  //check that startDate and endDate are strings
  if (!event.startDate || typeof event.startDate !== 'string'){
    throw "Error: startDate must be a string";
  }
  if (!event.endDate || typeof event.endDate !== 'string'){
    throw "Error: endDate must be a string";
  }
  //check that description is a string
  if (!event.description || typeof event.description !== 'string'){
    throw "Error: description must be a string";
  }
  
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  if (startDate > endDate){
    throw "Error: startDate must be before endDate";
  }
  //check that startDate and endDate are valid dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())){
    throw "Error: startDate and endDate must be valid dates";
  }

  //check that description is not empty
  if (event.description.trim() === ''){
    throw "Error: description cannot be empty";
  }
  //check that title is not empty
  if (event.title.trim() === ''){
    throw "Error: title cannot be empty";
  }

  //getting here implies event is valid. now add to user's schedule subdocument

  const userCollection = await users();
  const user = await userCollection.findOne({userId: userId.trim()});
  if (!user){
    throw "Error: User not found";
  }

  //by now user def has a schedule with events and tasks. so add event to it
  const newEvent = {
    _id: new ObjectId(),
    title: event.title,
    startDate: startDate,
    endDate: endDate,
    description: event.description
  };

  //add event to schedule, calculate userFreeTime
  let totalUserEvents = user.schedules.events.concat(newEvent);
  await userCollection.updateOne(
    {_id: user._id},
    {$push: {"schedules.events": newEvent},
     $set: {"schedules.userFreeTime": helpers.createFreeIntervals(totalUserEvents)}}
  );

  //updating groupFreeTime
  const groupCollection = await groups();
  let totalGroupEvents = [];
  for(let groupPIN of Object.keys(user.groups).map(Number)) {
    let group = await searchGroupById(groupPIN);
    for(let member of group.members) {
      let currMember = await getUserById(member);
      totalGroupEvents = totalGroupEvents.concat(currMember.schedules.events);
    }
    const updateGroup = await groupCollection.updateOne(
      { PIN: groupPIN },
      { $set: { "schedule.groupFreeTime": helpers.createFreeIntervals(totalGroupEvents) }}
    );
  }

  return newEvent;
}

//adds tasks to individual user's schedule -->
//so assignedMembers is automatically empty, and we add this user's id to it
//in groups you can acc add tasks to specific users
export const addTasks = async (userId, task) => {
  if (!userId){
    throw "Error: userId must be provided";
  }
  userId = helpers.validateUserId(userId);

  //below checks task. May be moves to helpers at later date
  if (typeof task != 'object') {throw "Error: task must be an object";}
  //make sure the only keys are title, startDate, endDate, description
  const eventKeys = Object.keys(task);
  const validKeys = ['progress', 'assignedUsers', 'startDate', 'endDate', 'startTime', 'endTime', 'urgencyLevel', 'description'];
  for (let i = 0; i < eventKeys.length; i++){
    if (!validKeys.includes(eventKeys[i])){
      throw "Error: event can only contain title, startDate, endDate, and description";
    }
  }
  //check that progress is a string
  if (!task.progress || typeof task.progress !== 'string'){
    throw "Error: progress must be a string";
  }
  //check that progress is either "not started", "in progress", or "finished"
  if (task.progress !== 'not started' && task.progress !== 'in progress' && task.progress !== 'finished'){
    throw "Error: progress must be either 'not started', 'in progress', or 'finished'";
  }


  //check that startDate and endDate are strings
  if (!task.startDate || typeof task.startDate !== 'string'){
    throw "Error: startDate must be a string";
  }
  if (!task.endDate || typeof task.endDate !== 'string'){
    throw "Error: endDate must be a string";
  }
  //check that description is a string
  if (!task.description || typeof task.description !== 'string'){
    throw "Error: description must be a string";
  }
  //check that startDate is before endDate
  const startDate = new Date(task.startDate);
  const endDate = new Date(task.endDate);
  if (startDate > endDate){
    throw "Error: startDate must be before endDate";
  }
  //check that startDate and endDate are valid dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())){
    throw "Error: startDate and endDate must be valid dates";
  }

  const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours)) throw `Error: Invalid time format (use HH:MM)`;
    return { hours, minutes };
  };
  const startTime = parseTime(task.startTime);
  const endTime = parseTime(task.endTime);

  // Validate time logic for same-day tasks
  if (startDate.toDateString() == endDate.toDateString()) {
    if (startTime.hours > endTime.hours || 
        (startTime.hours === endTime.hours && startTime.minutes >= endTime.minutes)) {
      throw "Error: For same-day tasks, startTime must be before endTime";
    }
  }

  //check that assignedUSers is an array of strings
  if (!task.assignedUsers || !Array.isArray(task.assignedUsers)){
    throw "Error: assignedUsers must be an array of strings";
  }

  //check that urgencyLevel is an int between 1 and 5 inclusive
  if (!task.urgencyLevel || typeof task.urgencyLevel !== 'number'){
    throw "Error: urgencyLevel must be an int between 1 and 5 inclusive";
  }
  if (task.urgencyLevel < 1 || task.urgencyLevel > 5){
    throw "Error: urgencyLevel must be an int between 1 and 5 inclusive";
  }
  //check that description is not empty
  if (task.description.trim() === ''){
    throw "Error: description cannot be empty";
  }
 

  //getting here implies task is valid. now add to user's schedule subdocument


  const userCollection = await users();
  const user = await userCollection.findOne({userId: userId.trim()});
  if (!user){
    throw "Error: User not found";
  }
  //set assignedUsers to an array with this user's id (NOT equal to userId) IF its empty
  if (task.assignedUsers.length === 0){
    task.assignedUsers = [user._id.toString()];
  }
  else {//lowkey feel like the else should be in groups.js addTasks but whatever
    //check that all assignedUsers are strings
    for (let i = 0; i < task.assignedUsers.length; i++){
      if (typeof task.assignedUsers[i] !== 'string'){
        throw "Error: assignedUsers must be an array of strings";
      }
    }
    //check that all assignedUsers are valid userIds
    for (let i = 0; i < task.assignedUsers.length; i++){
      const assignedUser = await userCollection.findOne({userId: task.assignedUsers[i]});
      if (!assignedUser){
        throw "Error: assignedUsers must be an array of valid userIds";
      }
    }
  }
  //by now user def has a schedule with events and tasks. so add task to it
  const newTask = {
    _id: new ObjectId(),
    assignedUsers: task.assignedUsers,
    progress: task.progress,
    startDate: startDate,
    endDate: endDate,
    startTime: task.startTime,
    endTime: task.endTime,
    urgencyLevel: task.urgencyLevel,
    description: task.description
  };
  await userCollection.updateOne(
    {_id: user._id},
    {$push: {"schedules.tasks": newTask}}
  );

  return newTask;
}

export const getUserById = async (userId) => {
  if (!userId){
    throw "Error: userId must be provided";
  }
  userId = helpers.validateUserId(userId);
  const userCollection = await users();
  const user = await userCollection.findOne({userId: userId});
  if (!user){
    throw "The userId is invalid";
  }
  return await userCollection.findOne(
    {userId: userId},
    {projection: 
      {_id: 0, password: 0}
    }
    );
}

export const joinGroup = async (groupName, groupPIN, userId) =>{
  const groupCollection = await groups();
  const userCollection = await users();
  userId = helpers.validateUserId(userId);
  groupName = helpers.validateStringInput(groupName).toLowerCase();
  let group = await searchGroupById(groupPIN);
  if (!group || groupName!==group.name.toLowerCase()){
    throw "Error: Could not find group";
  }

  let user = await userCollection.findOne({userId: userId});
  if (!user){
    throw "Error: There is no user with this ID.";
  }

  if (group.members.includes(userId)){
    throw "Error: This user is already in the group.";
  }

  return addMember(userId, groupPIN);
}