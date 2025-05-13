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

    const groupCollection = await groups();
    //each group should have a unique PIN
    let exists = await groupCollection.findOne({PIN: pin});
    if (exists){
        throw "Error: A group with this PIN number already exists.";
    }

    //the user who creates the group will automatically be an administrative member
    administrativeMembers.push(userId);
    members.push(userId);

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

    //add group to current user's groups object
    const userCollection = await users();
    await userCollection.updateOne(
      { userId: userId },
      { $set: { [`groups.${pin}`]: groupName } }
    );
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
        await userCollection.updateOne(
          { userId: userId },
          { $set: { [`groups.${groupPIN}`]: groupExists.name } }
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
    
    // Check if group exists
    const groupExists = await groupCollection.findOne({ PIN: groupPIN });
    if (!groupExists) {
        throw "Error: There is no group with this group PIN";
    }
    
    // Check if user exists
    const userExists = await userCollection.findOne({ userId: userId });
    if (!userExists) {
        throw "Error: There is no user with this ID";
    }
    
    // Check if user is already in group
    if (groupExists.members.includes(userId)) {
        throw "Error: User is already a member of this group";
    }
    
    // Combine events
    let groupEvents = Array.isArray(groupExists.schedule.events) ? groupExists.schedule.events : [];
    let userEvents = Array.isArray(userExists.schedules.events) ? userExists.schedules.events : [];
    
    // Get events from other members
    for (const memberId of groupExists.members) {
        if (memberId !== userId) {  // Skip the new member
            const member = await getUserById(memberId);
            userEvents = userEvents.concat(member.schedules.events || []);
        }
    }
    
    const combinedEvents = [...groupEvents, ...userEvents];
    
    // Update group
    const updateResult = await groupCollection.updateOne(
        { PIN: groupPIN },
        { 
            $push: { members: userId },
            $set: { 
                "schedule.groupFreeTime": helpers.createFreeIntervals(combinedEvents) 
            } 
        }
    );
    
    if (updateResult.modifiedCount === 0) {
        throw "Error: Failed to add member to group";
    }

        const addDate = new Date();
    if (groupExists.schedule.events.length!=0){
      for (let i=0; i<groupExists.schedule.events.length; i++){
        const sd = new Date(groupExists.schedule.events[i].startDate);
        const ed = new Date(groupExists.schedule.events[i].endDate);
        if (addDate >= sd && addDate <= ed){
          await userCollection.updateOne(
            {userId: userId},
            {$push: {"schedules.events": groupExists.schedule.events[i]}}
          );
        }
      }
    }
    await userCollection.updateOne(
      { userId: userId },
      { $set: { [`groups.${groupPIN}`]: groupExists.name } }
    );
    return { success: true };
}

// export const assignTask = async () {}

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
    startDate: startDate,
    endDate: endDate,
    description: event.description
  };

  let groupTotalEvents = group.schedule.events.concat(newEvent);

  await groupCollection.updateOne(
    {_id: group._id},
    {$push: {"schedule.events": newEvent},
     $set: {"schedule.groupFreeTime": helpers.createFreeIntervals(groupTotalEvents)}}
  );

  if (!Array.isArray(group.members) || group.members.length==0){
    throw "Error: Group is empty."
  }
  const userCollection = await users();

  for (const memberId of group.members) {
    try {
        const result = await userCollection.updateOne(
            { userId: memberId },
            { $push: { "schedules.events": newEvent } }
        );
        
        if (result.modifiedCount === 0) {
            console.error(`User ${memberId} not updated (possibly not found)`);
            continue; 
        }
    } catch (err) {
        console.error(`Failed to update user ${memberId}:`, err);
    }
}

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
    startDate: startDate,
    endDate: endDate,
    urgencyLevel: task.urgencyLevel,
    description: task.description
  };
  if (!Array.isArray(task.assignedUsers) || task.assignedUsers.length==0){
    throw "Please enter the usernames of the people you want to assign this task to.";
  }

  for (let i=0; i<task.assignedUsers.length; i++){
    let user = await userCollection.findOne({userId: task.assignedUsers[i]});
    if (!group.members.includes(user.userId)){
      throw "Error: A user you have assigned the task to is not in the group.";
    }
    await userCollection.updateOne(
      {_id: user._id},
      {$push: {"schedules.tasks": newTask}}
    );
  }
  await groupCollection.updateOne(
    {_id: group._id},
    {$push: {"schedule.tasks": newTask}}
  );

  return newTask;
}

export const updateProgress = async (groupPIN, taskId, newProgress, userId) => {
    groupPIN = helpers.validatePIN(groupPIN);
    taskId = taskId.toString().trim();
    newProgress = newProgress.trim().toLowerCase();
    //only these inputs are allowed
    if (!['not started', 'in progress', 'finished'].includes(newProgress)) {
        throw "Error: Progress must be 'not started', 'in progress', or 'finished'";
    }

    const groupCollection = await groups();
    const userCollection = await users();

    //find group and task
    const group = await groupCollection.findOne({ PIN: groupPIN });
    if (!group) throw "Error: Group not found";

    const task = group.schedule.tasks.find(t => t._id.toString() === taskId);
    if (!task) throw "Error: Task not found";

    //only admins/assignedUsers can update this
    const isAdmin = group.administrativeMembers.includes(userId);
    const isAssigned = task.assignedUsers.includes(userId);
    
    if (!isAdmin && !isAssigned) {
        throw "Error: User not authorized to update this task";
    }

    //update task progress in group
    const updateResult = await groupCollection.updateOne(
        { 
            PIN: groupPIN,
            "schedule.tasks._id": new ObjectId(taskId)
        },
        {
            $set: { "schedule.tasks.$.progress": newProgress }
        }
    );

    if (updateResult.modifiedCount === 0) {
        throw "Error: Failed to update task progress";
    }

    //update task progress for assignedUsers
    const userUpdatePromises = task.assignedUsers.map(async assignedUserId => {
        await userCollection.updateOne(
            {
                userId: assignedUserId,
                "schedules.tasks._id": new ObjectId(taskId)
            },
            {
                $set: { "schedules.tasks.$.progress": newProgress }
            }
        );
    });

    //return updated task
    const updatedGroup = await groupCollection.findOne({ PIN: groupPIN });
    const updatedTask = updatedGroup.schedule.tasks.find(t => t._id.toString() === taskId);
    return updatedTask;
};
