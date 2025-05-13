import * as groupFunc from './data/group.js';
import * as userFunc from './data/users.js';
import { dbConnection, closeConnection } from './config/mongoConnection.js';
import { ObjectId } from 'mongodb';

const db = await dbConnection();
await db.dropDatabase();

let group1 = undefined;
let group2 = undefined;
let user1 = undefined;
let user2 = undefined;
let user3 = undefined;
let user4 = undefined;
let user5 = undefined;
let user6 = undefined;

try {
    user1 = await userFunc.register("Sean", "Bautista", "teriya", "Projectko2!");
    console.log(user1);
}
catch(e){
    console.error(e);
}

try {
    user2 = await userFunc.register("Noah", "Tumibay", "oktino", "Stevens@27");
    console.log(user2);
}
catch(e){
    console.error(e);
}

try {
    user3 = await userFunc.register("Vincent", "Penalosa", "warachnid", "#Yoyo1234");
    console.log(user3);
}
catch(e){
    console.error(e);
}

try {
    user4 = await userFunc.register("Samara", "Vassell", "samarav3", "StevensCS2!");
    console.log(user4);
}
catch(e){
    console.error(e);
}

try {
    user5 = await userFunc.register("Patrick", "Hill", "graffixnyc", "@PainTurfs7");
    console.log(user5);
}
catch(e){
    console.error(e);
}

try {
    user6 = await userFunc.register("New", "User", "nickname", "Password1!!!");
    console.log(user6);
}
catch(e){
    console.error(e);
}

try {
    group1 = await groupFunc.createGroup("Group R", "teriya", 123456);
    console.log(group1);
}
catch(e){
    console.error(e);
}

try {
    group2 = await groupFunc.createGroup("CS546 Group", "graffixnyc", 654321);
    console.log(group2);
}
catch(e){
    console.error(e);
}

// Close the database connection
await closeConnection();