// In this file, you must perform all client-side validation for every single form input (and the role dropdown) on your pages. The constraints for those fields are the same as they are for the data functions and routes. Using client-side JS, you will intercept the form's submit event when the form is submitted and If there is an error in the user's input or they are missing fields, you will not allow the form to submit to the server and will display an error on the page to the user informing them of what was incorrect or missing.  You must do this for ALL fields for the register form as well as the login form. If the form being submitted has all valid data, then you will allow it to submit to the server for processing. Don't forget to check that password and confirm password match on the registration form!

//import {validateUserEvent, validateUserTask} from './helper.js';
const nameRegex = /^[a-zA-Z]{2,20}$/;
const idRegex = /^[a-zA-Z0-9]{5,10}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const pinRegex = /^[0-9]{6}$/;

// Helper functions
const validateStringInput = (input, fieldName) => {
  if (!input) throw `Error: ${fieldName} must be provided`;
  if (typeof input !== 'string' || input.trim().length===0) throw `Error: ${fieldName} must be a non-empty string`;
  return input.trim();
};

const validatePIN = (pin) => {
  if (!pin) throw "Error: PIN must be provided";
  if (!Number.isInteger(pin)) throw "Error: PIN must be an int";
  let pStr = pin.toString();
  if (!pinRegex.test(pStr)) throw "Error: PIN must be a positive, 6-digit integer";
  return pin;
};

const validateName = (name, fieldName) => {
    const trimmed = validateStringInput(name, fieldName);
  if (!nameRegex.test(name)) {
    throw `Error: ${fieldName} can only contain letters, and must be between 2 and 25 characters long`;
  }
  return name;
};

const validateUserId = (userId) => {
    const trimmed = validateStringInput(userId, 'User ID').toLowerCase();
  if (!idRegex.test(userId)) {
    throw "Error: User ID can only contain letters and numbers, and must be between 5 and 10 characters long";
  }
  return trimmed;
};

const validatePassword = (password) => {
    const trimmed = validateStringInput(password, 'Password');
  if (!passwordRegex.test(password)) {
    throw "Error: Password must contain at least one capital letter, one number, one special character, and must be at least 8 characters long";
  }
  if (password.includes(" ")) {
    throw "Error: Password cannot contain spaces";
  }
  return trimmed;
};

const validateUserEvent = (event) => {
  if (!event){
    throw "Error: event must be provided";
  }
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
};

const validateUserTask = (task) => {
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
    const timePart = timeStr.split('T')[1]; // "00:00"
    const [hours, minutes] = timePart.split(':').map(Number);
    if (isNaN(hours)) throw `Error: Invalid time format (use HH:MM)`;
      return { hours, minutes };
  };
  const startTime = parseTime(task.startDate);
  const endTime = parseTime(task.endDate);

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
};

const validateGroupEvent = (event) => {
    if (!event){
    throw "Error: event must be provided";
  }
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
  const startDate = event.startDate;
  const endDate = event.endDate;
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
};

const validateGroupTask = (task) => {
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
    
      //set assignedUsers to an array with this user's id (NOT equal to userId) IF its empty
      if (task.assignedUsers.length === 0){
        return ;
      }
      else {//lowkey feel like the else should be in groups.js addTasks but whatever
        //check that all assignedUsers are strings
        for (let i = 0; i < task.assignedUsers.length; i++){
          if (typeof task.assignedUsers[i] !== 'string'){
            throw "Error: assignedUsers must be an array of strings";
          }
        }
        //check that all assignedUsers are valid userIds
        //below is backend tho so i aint doing that client side
        //for (let i = 0; i < task.assignedUsers.length; i++){
        //  const assignedUser = await userCollection.findOne({userId: task.assignedUsers[i]});
        //  if (!assignedUser){
        //    throw "Error: assignedUsers must be an array of valid userIds";
        //  }
        //}
      }
};



let userSignupForm = document.getElementById("signup-form-user");
if (userSignupForm) {
    userSignupForm.addEventListener("submit", (event) => {
        let firstName = userSignupForm.elements["firstName"].value;
        let lastName = userSignupForm.elements["lastName"].value;
        let userId = userSignupForm.elements["userId"].value;
        let password = userSignupForm.elements["password"].value;
        let confirmPassword = userSignupForm.elements["confirmPassword"].value;
        try {
          validateName(firstName, "First Name");
          validateName(lastName, "Last Name");
          validateUserId(userId);
          validatePassword(password);
          if (password !== confirmPassword) {
            throw "Error: Passwords do not match";
          }
          console.log("Form submitted successfully!");
        }
        catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let userLoginForm = document.getElementById("signin-form");
if (userLoginForm) {
    userLoginForm.addEventListener("submit", (event) => {
        let userId = userLoginForm.elements["userId"].value;
        let password = userLoginForm.elements["password"].value;
        try {
            validateUserId(userId);
            validatePassword(password);
            console.log("Form submitted successfully!");
        }
        catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let groupSignupForm = document.getElementById("signup-form-group");
if (groupSignupForm) {
    groupSignupForm.addEventListener("submit", (event) => {
        let groupName = groupSignupForm.elements["name"].value;
        let groupPin = groupSignupForm.elements["PIN"].value;
        try {
            validateStringInput(groupName, "Group Name");
            validatePIN(Number(groupPin));
            console.log("Form submitted successfully!");
        }
        catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let userEventForm = document.getElementById("userEventForm");
if (userEventForm) {
    userEventForm.addEventListener("submit", (event) => {
        let eventTitle = userEventForm.elements["eventTitle"].value;
        let startDate = userEventForm.elements["startDate"].value;
        let endDate = userEventForm.elements["endDate"].value;
        let startTime = userEventForm.elements["startTime"].value;
        let endTime = userEventForm.elements["endTime"].value;
        let eventDescription = userEventForm.elements["eventDescription"].value;

        let combinedStartDate = `${startDate}T${startTime}`;
        let combinedEndDate = `${endDate}T${endTime}`;

        const eventData = {
        title: eventTitle,
        description: eventDescription,
        startDate: combinedStartDate,
        endDate: combinedEndDate
        };
        try {
            validateUserEvent(eventData);
            console.log("Form submitted successfully!");
        } catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let userTaskForm = document.getElementById("userTaskForm");
if (userTaskForm) {
    userTaskForm.addEventListener("submit", (event) => {
        let taskDescription = userTaskForm.elements["taskDescription"].value;
        let progress = userTaskForm.elements["progress"].value;
        let startDate = userTaskForm.elements["startDate"].value;
        let endDate = userTaskForm.elements["endDate"].value;
        let startTime = userTaskForm.elements["startTime"].value;
        let endTime = userTaskForm.elements["endTime"].value;
        let urgencyLevel = userTaskForm.elements["urgencyLevel"].value;
        let combinedStartDate = `${startDate}T${startTime}`;
        let combinedEndDate = `${endDate}T${endTime}`;
        const taskData = {
        description: taskDescription,
        startDate: combinedStartDate,
        endDate: combinedEndDate,
        startTime: startTime,
        endTime: endTime,
        progress: progress,
        urgencyLevel: Number(urgencyLevel),
        assignedUsers: []
        };
        try {
            validateUserTask(taskData);
            console.log("Form submitted successfully!");
        } catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let groupEventForm = document.getElementById("groupEventForm");
if (groupEventForm) {
    groupEventForm.addEventListener("submit", (event) => {
        let eventTitle = groupEventForm.elements["eventTitle"].value;
        let startDate = groupEventForm.elements["startDate"].value;
        let endDate = groupEventForm.elements["endDate"].value;
        let eventDescription = groupEventForm.elements["eventDescription"].value;

        const eventData = {
        title: eventTitle,
        description: eventDescription,
        startDate: startDate,
        endDate: endDate
        };
        try {
            validateGroupEvent(eventData);
            console.log("Form submitted successfully!");
        } catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let groupTaskForm = document.getElementById("groupTaskForm");
if (groupTaskForm) {
    groupTaskForm.addEventListener("submit", (event) => {
        let taskDescription = groupTaskForm.elements["taskDescription"].value;
        let progress = groupTaskForm.elements["progress"].value;
        let startDate = groupTaskForm.elements["startDate"].value;
        let endDate = groupTaskForm.elements["endDate"].value;
        let urgencyLevel = groupTaskForm.elements["urgencyLevel"].value;
        let assignedUsers = groupTaskForm.elements["assignedUsers"].value.split(",").map(user => user.trim());
        const taskData = {
        description: taskDescription,
        startDate: startDate,
        endDate: endDate,
        progress: progress,
        urgencyLevel: Number(urgencyLevel),
        assignedUsers: assignedUsers
        };
        try {
            validateGroupTask(taskData);
            console.log("Form submitted successfully!");
        } catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let addMemberForm = document.getElementById("addMember");
if (addMemberForm) {
    addMemberForm.addEventListener("submit", (event) => {
        let userId = addMemberForm.elements["userId"].value;
        try {
            validateUserId(userId);
            console.log("Form submitted successfully!");
        } catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}

let addAdminForm = document.getElementById("addAdmin");
if (addAdminForm) {
    addAdminForm.addEventListener("submit", (event) => {
        let userId = addAdminForm.elements["userId"].value;
        try {
            validateUserId(userId);
            console.log("Form submitted successfully!");
        } catch (error) {
            event.preventDefault();
            //check if error paragraph exists
            let errorP = document.getElementById("error");
            if (!errorP) {
                errorP = document.createElement("p");
                errorP.classList.add("error"); errorP.id = "error";
                event.target.appendChild(errorP);
            }
            errorP.innerHTML = error.toString().replace("Error: ", "");
        }
    });
}