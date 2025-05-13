//import express, express router as shown in lecture code
import e, { Router } from "express";
const router = Router();
//import {register, login, addEvents, addTasks, getUserById} from "../data/users.js";
import * as userFuncs from "../data/users.js";
import * as groupFuncs from "../data/group.js";
import * as helpers from "../helpers.js";
import {users} from "../config/mongoCollections.js";

export const nameRegex = /^[a-zA-Z]{2,20}$/;
export const idRegex = /^[a-zA-Z0-9]{5,10}$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
export const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const pinRegex = /^\d{6}$/;

router.route('/').get(async (req, res) => {
  //code here for GET
  try {
    return res.render('home', {user: req.session.user, currentTime: new Date().toLocaleTimeString(), currentDate: new Date().toLocaleDateString()});
  }
  catch (e){
    return res.status(500).render('error', {errors: e.message, title: 'Error'});
  }
});

router
  .route('/registerUser')
  .get(async (req, res) => {
    //code here for GET
    try {
      if (req.session.user){
        return res.redirect('/');
      }
      return res.render('registerUser');
    }
    catch (e){
      return res.status(500).render('error', {errors: e.message, title: 'Error'});
    }
  })
  .post(async (req, res) => {
    //code here for POST
    let regData = req.body;
    
      try {
        //input validation
        let firstName = regData.firstName.trim();
        let lastName = regData.lastName.trim();
        let userId = regData.userId.trim();
        let password = regData.password.trim();
        let confirmPassword = regData.confirmPassword.trim();
        let missingFields = [];
        if (!firstName) missingFields.push('First Name');
        if (!lastName) missingFields.push('Last Name');
        if (!userId) missingFields.push('User ID');
        if (!password) missingFields.push('Password');
        if (!confirmPassword) missingFields.push('Confirmed Password');

        if (missingFields.length>0){
            return res.status(400).render('registerUser', {errors: true, errorMessage: `${missingFields.toString()} must be filled`});
        }
        if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())){
            return res.status(400).render('registerUser', {errors: true, errorMessage: 'First/Last name must be between 2 and 20 letters, and cannot have spaces'});
        }

        if (!idRegex.test(userId.trim())){
            return res.status(400).render('registerUser', {errors: true, errorMessage: 'User ID must be between 5 and 10 characters, and cannot have spaces'});
        }

        if (!passwordRegex.test(password.trim())){
            return res.status(400).render('registerUser', {errors: true, errorMessage: 'Password must be at least 8 characters, and contain an uppercase letter, a lowercase letter, a number, and a special character'});
        }
    
        if (password !== confirmPassword) {
            return res.status(400).render('registerUser', {errors: true, errorMessage: 'Passwords do not match'});
        }
    
        //register user
        const result = await userFuncs.register(
          firstName.trim(),
          lastName.trim(),
          userId.trim().toLowerCase(),
          password
        );
    
        if (!result.registrationCompleted) {
          throw { code: 500, error: "Registration failed - please try again" };
        }
    
        return res.redirect('/');
      } catch (e) {
        return res.status(400).render('registerUser', {
          errors: true,
          errorMessage: e
        });
    }
  });

router
  .route('/registerGroup')
  .get(async (req, res) => {
    //code here for GET
    try {
      return res.render('registerGroup');
    }
    catch (e){
      return res.status(500).render('error', {errors: e.message, title: 'Error'});
    }
  })
  .post(async (req, res) => {
    //code here for POST
    let regData = req.body;
    let userId = req.session.user.userId;
      try {
        //input validation
        let name = regData.name.trim();
        let PIN = parseInt(regData.PIN.trim(), 10);
        let missingFields = [];
        if (!name) missingFields.push('Group Name');
        if (!PIN) missingFields.push('PIN');
        
        if (missingFields.length>0){
            return res.status(400).render('registerGroup', {errors: true, errorMessage: `${missingFields.toString()} must be filled`});
        }

        if (!pinRegex.test(PIN)){
            return res.status(400).render('registerGroup', {errors: true, errorMessage: 'PIN must be a positive 6 digit number'});
        }
    
        //register user
        const result = await groupFuncs.createGroup(
          name.trim(),
          userId.trim().toLowerCase(),
          PIN
        );
    
        if (!result.registrationCompleted) {
          throw { code: 500, error: "Registration failed - please try again" };
        }
        return res.redirect(`/group/${PIN}`);
      } catch (e) {
        return res.status(400).render('registerGroup', {
          errors: true,
          errorMessage: e
        });
    }
  });

router
  .route('/login')
  .get(async (req, res) => {
    //code here for GET
    return res.render('login');
  })
  .post(async (req, res) => {
    //code here for POST
    const { userId, password } = req.body;
    
    try {
        //validate inputs
        if (!userId || !password) {
            return res.status(400).render('login', {errors: true, errorMessage: 'Please enter User ID and Password'});
        }

        if (typeof userId !== 'string' || userId.trim().length === 0) {
            return res.status(400).render('login', {errors: true, errorMessage: "User ID must be a valid string"});
        }

        if (userId.length < 5 || userId.length > 10) {
            return res.status(400).render('login',{ errors: true, errorMessage: "userId must be between 5 and 10 characters" });
        }

        if (!/^[a-zA-Z0-9]+$/.test(userId)) {
            return res.status(400).render('login',{ errors: true, errorMessage: "userId can only contain letters and numbers" });
        }

        if (typeof password !== 'string' || password.trim().length === 0) {
            return res.status(400).render('login',{ errors: true, errorMessage: "Password must be a valid string" });
        }

        if (password.length < 8) {
            return res.status(400).render('login',{ errors: true, errorMessage: "Password must be at least 8 characters" });
        }

        if (!/(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])/.test(password)) {
            return res.status(400).render('login',{ errors: true, errorMessage: "password must contain at least one uppercase letter, one number, and one special character" });
        }

        //login user
        const user = await userFuncs.login(userId.toLowerCase(), password); 

        //store in session
        req.session.user = user;
        res.cookie("AuthenticationState", 'Authenticated');

        //redirect according to role
        // if (user.role === 'administrator') {
        //     return res.redirect('/superuser');
        // } else {
        //     return res.redirect('/user');
        // }
        //rn j redirecting to user/:userId
        return res.redirect(`/user/${req.session.user.userId}`);
    } catch (e) {
        if (e.code) {
            return res.status(400).render('login', { 
                errors: true, 
                errorMessage:"Either the userId or password is invalid"
            });
        }
        return res.status(400).render('login', {
            errors: true,
            errorMessage: "Either the userId or password is invalid",
            userId: req.body.userId // Preserve userId in form
        });
    }
  });

router.route('/user').get(async (req, res) => {
  //code here for GET
  let currUser = req.session.user;
  let t = new Date().toLocaleTimeString();
  let d = new Date().toLocaleDateString();
  return res.render('user', {users: true, firstName: currUser.firstName, lastName: currUser.lastName, currentTime: t, currentDate: d,
    role: currUser.role, signupDate: currUser.signupDate, lastLogin: currUser.lastLogin, user: currUser
  })
});

router.route('/superuser').get(async (req, res) => {
  //code here for GET
  let currUser = req.session.user;
  let t = new Date().toLocaleTimeString();
  let d = new Date().toLocaleDateString();
  return res.render('superuser', {users: true, firstName: currUser.firstName, lastName: currUser.lastName, currentTime: t, currentDate: d,
    signupDate: currUser.signupDate, lastLogin: currUser.lastLogin, user: currUser
  });
});

router.route('/signout').get(async (req, res) => {
  res.clearCookie('AuthenticationState', '', {expires: new Date()});
  req.session.destroy();
  return res.render('signout');
});

//below are events for /user/:userid
//only worry if user is logged in using middleware lol
router
  .route('/user/:userId')
  .get(async (req, res) => {
    //code here for GET --> j render userProfile
    let currUser = req.session.user;
    let fullName = currUser.firstName + " " + currUser.lastName;
    return res.status(200).render('userProfile', {
      userId: currUser.userId,
      fullName: fullName,
      events: currUser.schedules.events,
      tasks: currUser.schedules.tasks,
      errors: false
    });
  })
  .post(async (req, res) => {
    const formType = req.body.submitButton;//value is either event or task
    const body = req.body;
    let currUser = req.session.user;
    let fullName = currUser.firstName + " " + currUser.lastName;
    let combinedStartDate = `${body.startDate}T${body.startTime}`;
    let combinedEndDate = `${body.endDate}T${body.endTime}`;

    if (formType === 'event') {
      // handle event form submission
      //so call addEvent with userId and event data
      const eventData = {
        title: body.eventTitle,
        description: body.eventDescription,
        startDate: combinedStartDate,
        endDate: combinedEndDate
      };
      try {
        await userFuncs.addEvents(req.session.user.userId, eventData);
        let currUser = await userFuncs.getUserById(req.session.user.userId);
        req.session.user = currUser;
        return res.status(200).redirect(`/user/${req.session.user.userId}`);
      }
      catch (e) {
        return res.status(404).render('userProfile', {
          userId: currUser.userId,
          fullName: fullName,
          events: currUser.schedules.events,
          tasks: currUser.schedules.tasks,
          errors: true,
          errorMessage: e.toString()
        });
      }
      
    } else if (formType === 'task') {
      // handle task form submission
      let combinedStartDate = `${body.startDate}T${body.startTime}`;
      let combinedEndDate = `${body.endDate}T${body.endTime}`;
      const taskData = {
        progress: decodeURIComponent(body.progress.replace(/\+/g, ' ')),
        assignedUsers: [],
        startDate: combinedStartDate,
        endDate: combinedEndDate,
        urgencyLevel: Number(body.urgencyLevel),
        description: body.taskDescription
      };
      try {
        await userFuncs.addTasks(req.session.user.userId, taskData);
        let currUser = await userFuncs.getUserById(req.session.user.userId);
        req.session.user = currUser;
        return res.status(200).redirect(`/user/${req.session.user.userId}`);
      }
      catch (e) {
        return res.status(404).render('userProfile', {
          userId: currUser.userId,
          fullName: fullName,
          events: currUser.schedules.events,
          tasks: currUser.schedules.tasks,
          errors: true,
          errorMessage: e.toString()
        });
      }
    } else {
      // handle error or unknown form
      return res.status(400).render('userProfile', {
        userId: currUser.userId,
        fullName: fullName,
        events: currUser.schedules.events,
        tasks: currUser.schedules.tasks,
        errors: true,
        errorMessage: 'Unknown form type'
      });
    }
  });

router.route('/group/:PIN').get(async (req,res) => {
  let currUser = req.session.user;
  let PIN = parseInt(req.params.PIN, 10);
  let group = await groupFuncs.searchGroupById(PIN);
  let isAdmin = group.administrativeMembers.includes(currUser.userId);

  return res.status(200).render('group', {
    user: currUser,
    isAdmin,
    group,
    errors: false
  });
})
.post(async (req, res) => {
  const formType = req.body.submitButton;//value is either event or task or member
  const body = req.body;
  let currUser = req.session.user;
  let PIN = parseInt(req.params.PIN, 10);
  let group = await groupFuncs.searchGroupById(PIN);
  let isAdmin = group.administrativeMembers.includes(currUser.userId);
  if (formType === 'event') {
    // handle event form submission
    //so call addEvent with userId and event data
    const eventData = {
      title: body.eventTitle,
      description: body.eventDescription,
      startDate: body.startDate,
      endDate: body.endDate,
    };
    
    try {
      await groupFuncs.groupAddEvents(group.PIN, eventData);
      let currUser = await userFuncs.getUserById(req.session.user.userId);
      req.session.user = currUser;
      return res.status(200).redirect(`/group/${group.PIN}`);
    }
    catch (e) {
      return res.status(404).render('group', {
        isAdmin,
        group,
        errors: true,
        errorMessage: e.toString()
      });
    }
    
  } else if (formType === 'task') {
    // handle task form submission
    const taskData = {
      progress: decodeURIComponent(body.progress.replace(/\+/g, ' ')), 
      assignedUsers: [],
      startDate: body.startDate,
      endDate: body.endDate,
      urgencyLevel: Number(body.urgencyLevel),
      description: body.taskDescription
    };
    try {
      await groupFuncs.groupAddTasks(group.PIN, taskData);
      return res.status(200).redirect(`/group/${group.PIN}`);
    }
    catch (e) {
      return res.status(404).render('group', {
        isAdmin,
        group,
        errors: true,
        errorMessage: e.toString()
      });
    }
  } 
  
  else if (formType === 'member'){
    try {
      await groupFuncs.addMember(req.body.userId, group.PIN);
      return res.status(200).redirect(`/group/${group.PIN}`);
    }
    catch(e){
      return res.status(404).render('group',
        {
          isAdmin,
          group,
          errors: true,
          errorMessage: e.toString()
        }
      )
    }
  }

  else if (formType === 'admin'){
    try {
      await groupFuncs.assignAdmin(req.body.userId, group.PIN);
      return res.status(200).redirect(`/group/${group.PIN}`);
    }
    catch(e){
      return res.status(404).render('group',
        {
          isAdmin,
          group,
          errors: true,
          errorMessage: e.toString()
        }
      )
    }
  }

  else {
    // handle error or unknown form
    return res.status(400).render('group', {
      isAdmin,
      group,
      errors: true,
      errorMessage: 'Unknown form type'
    });
  }
});
export default router;