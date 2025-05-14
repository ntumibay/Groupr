# *Groupr*
Github repo for CS 546-WS1 Final Project.

# Group Members
Samara Vassel, 
Noah Tumibay, 
Sean Bautista, 
Vincent Penalosa

# Introduction
The web application will serve as a scheduler for groups. Users will be able to put their schedules onto the site, for the rest of the group to see. Group members can also decide who will be able to assign tasks to individuals. When a task is completed, the user can mark it, and the next time a user logs on, they will see that certain assignments have been finished, regardless of whether or not it was assigned to them.

Our goal with this project is to make group planning simple, accessible, and efficient. 

# Core Features:
Users will be able to upload their own schedules (time, date, descriptions), to be available for display to the other members in their group.
Users (who are assigned permission) can assign tasks to be completed by assigned members.
An overall project timeline can be displayed which visualizes the deadlines for each task

# Extra Features:
Users will be able to view all group members schedules and how their free time overlap for planning purposes
Users can customize their group title, description, and background images.
Users can assign ranks and stats to group members based on the number of completed tasks (their contributions).

# Walkthrough:
To populate the database, run “node seed.js” in a terminal. This will create six users, and two of these groups will have an administrative member when created. Afterwards, it adds one member to each group, and then assigns events and tasks to users.

To run the server, type “npm start”. 

In a browser, type “localhost:3000”, and this will take you to a page with links to either Register or Log In. If you want to register, you will provide your first name, last name, a username (user ID), and a password that you will have to confirm. Upon submitting the form, you will be redirected to the home page. If a username is taken, you will not be able to register, regardless of how you change capitalization. Also, a username must be between 5 and 10 characters and cannot contain spaces or special characters. Passwords must be at least 8 characters long, and contain an uppercase letter, lowercase letter, number, and special character. 

When logging in, you may log in with the username you registered with, regardless of capitalization, but the password must be exactly as you inputted during registration. Once logged in, you will be able to see your own profile information, groups you are a part of, and schedule which consists of tasks and events. You will also be able to add events and tasks to your schedules, and join groups assuming you know the name and PIN of the group you are joining. At the bottom are links to create a group and to sign out. Signing out takes you to a signout page where you can click a link to go back to the home page. 

When you create a group, you must enter a group name and PIN. Group names do not need to be unique, but PINs do. So for example, there can be multiple groups with the name “Group R”, but their PINs will be different. When entering a PIN, any PIN starting with a 0 will not be accepted, so the range of PINs will be 100000 to 999999. Once you create a group, you will be redirected to the group page with an administrator view. Administrators can see the group PIN, and can add members to the group, or members that are already in the group to the list of administrative members. Administrators can add events that will show up to all members’ schedules, and assign events to certain members. At the bottom, you will be able to go back to your individual user page. 
