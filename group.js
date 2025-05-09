import { groups, users } from "../config/mongoCollections.js";
import { getUserById } from "./users.js";
import * as helpers from "../helpers.js";
import { ObjectId } from "mongodb";

//create a group
export const createGroup = async (groupName, userId, pin) => {
    //administrativeMembers and members start as empty arrays that can be added onto later
    let administrativeMembers = [];
    let members = [];
    if (!groupName || !userId){
        throw "Error: All fields must be supplied";
    }

    //validate inputs
    groupName = helpers.validateStringInput(groupName, "Group Name");
    userId = helpers.validateUserId(userId);
    pin = helpers.validatePIN(pin);

    //groups can only be created by existing users
    if (!getUserById(userId)){
        throw "Error: Group founder must be an existing user.";
    }

    //the user who creates the group will automatically be an administrative member
    administrativeMembers.push(userId);
    members.push(userId);
    const groupCollection = await groups();

    //each group should have a unique PIN
    let exists = await groupCollection.findOne({PIN: pin});
    if (exists){
        throw "Error: A group with this PIN number already exists.";
    }

    const newGroup = {
        name: groupName,
        PIN: pin,
        administrativeMembers: administrativeMembers,
        members: members,
        schedule: {
            _id: new ObjectId(),
            events: [],
            tasks: [],
            groupFreeTime: [],
            //userFreeTime: [] commenting this out since we said this would be hidden in group collection
        }
    };

    //add new group to the collection
    const insertInfo = await groupCollection.insertOne(newGroup);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {throw 'Could not add group';}
    return {registrationCompleted: true};
}

//assign a member within the group an administrator role
//this doesnt check whether the person calling this is an administrator themselves, but idt that happens here anyways
export const assignAdmin = async (userId, groupPIN) => {
    //validate inputs
    userId = helpers.validateUserId(userId);
    groupPIN = helpers.validatePIN(groupPIN);
    const groupCollection = await groups();
    const userCollection = await users();
    let groupExists = await groupCollection.findOne({PIN: groupPIN});
    if (!groupExists){
        throw "Error: There is no group with this group PIN";
    }
    let userExists = await userCollection.findOne({userId: userId});
    if (!userExists){
        throw "Error: There is no user with this ID";
    }
    //a user can only be given the administrator role if they are in the group, and not already an admin
    if (groupExists.members.includes(userId) && !groupExists.administrativeMembers.includes(userId)){
        await groupCollection.updateOne({PIN: groupPIN},
            {$push: {"administrativeMembers": userId}}
        );
    }
    else {
        throw "This member is either already an administrative member, or is not part of the group";
    }
}

//add members to the group
export const addMember = async (userId, groupPIN) => {
    userId = helpers.validateUserId(userId);
    groupPIN = helpers.validatePIN(groupPIN);
    const groupCollection = await groups();
    const userCollection = await users();
    let groupExists = await groupCollection.findOne({PIN: groupPIN});
    if (!groupExists){
        throw "Error: There is no group with this group PIN";
    }
    let userExists = await userCollection.findOne({userId: userId});
    if (!userExists){
        throw "Error: There is no user with this ID";
    }
    if (!groupExists.members.includes(userId)){
        await groupCollection.updateOne({PIN: groupPIN},
            {$push: {"members": userId}}
        );
    }
}

export const assignTask = async ()

export const searchGroupById = async (groupPIN) => {
    if (!groupPIN){
        throw "Error: Group PIN must be provided";
      }
      groupPIN = helpers.validatePIN(groupPIN);
      const groupCollection = await groups();
      const group = await groupCollection.findOne({PIN: groupPIN});
      if (!group){
        throw "The Group PIN is invalid";
      }
      return group; //should it return group object or groupname
}

//the following two functions were taken from /data/users.js, and adjusted to fit for groups
//idk if we need this, but ill leave it if we decide we want it
export const groupAddEvents = async (groupPIN, event) => {
  if (!groupPIN){
    throw "Error: Group PIN must be provided";
  }
  if (!event){
    throw "Error: event must be provided";
  }
  groupPIN = helpers.validatePIN(groupPIN);
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
  //check that startDate is before endDate
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


  const groupCollection = await groups();
  let group = await groupCollection.findOne({PIN: groupPIN});
  if (!group){
    throw "Error: Group not found";
  }

  //by now user def has a schedule with events and tasks. so add event to it
  const newEvent = {
    _id: new ObjectId(),
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    description: event.description
  };
  await groupCollection.updateOne(
    {_id: group._id},
    {$push: {"schedule.events": newEvent}}
  );

  return newEvent;
}

//adds tasks to individual user's schedule -->
//so assignedMembers is automatically empty, and we add this user's id to it
//in groups you can acc add tasks to specific users
export const groupAddTasks = async (groupPIN, task) => {
  if (!groupPIN){
    throw "Error: Group PIN must be provided";
  }
  groupPIN = helpers.validatePIN(groupPIN);

  //below checks task. May be moves to helpers at later date
  if (typeof task != 'object') {throw "Error: task must be an object";}
  //make sure the only keys are title, startDate, endDate, description
  const eventKeys = Object.keys(task);
  const validKeys = ['progress', 'assignedUsers', 'startDate', 'endDate', 'urgencyLevel', 'description'];
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


  const groupCollection = await groups();
  const group = await groupCollection.findOne({PIN: groupPIN});
  const userCollection = await users();
  if (!group){
    throw "Error: User not found";
  }
  //set assignedUsers to an array with this user's id (NOT equal to userId) IF its empty
  if (task.assignedUsers.length === 0){
    task.assignedUsers = [group._id.toString()];
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
    startDate: task.startDate,
    endDate: task.endDate,
    urgencyLevel: task.urgencyLevel,
    description: task.description
  };
  await groupCollection.updateOne(
    {_id: group._id},
    {$push: {"schedule.tasks": newTask}}
  );

  return newTask;
}