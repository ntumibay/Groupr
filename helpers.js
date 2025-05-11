//You can add and export any helper functions you want here. If you aren't using any, then you can just leave this file as is.

// Regex patterns
export const nameRegex = /^[a-zA-Z]{2,20}$/;
export const idRegex = /^[a-zA-Z0-9]{5,10}$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
export const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const pinRegex = /^[0-9]{6}$/;

// Helper functions
export const validateStringInput = (input, fieldName) => {
  if (!input) throw `Error: ${fieldName} must be provided`;
  if (typeof input !== 'string' || input.trim().length===0) throw `Error: ${fieldName} must be a non-empty string`;
  return input.trim();
};

export const validatePIN = (pin) => {
  if (!pin) throw "Error: PIN must be provided";
  if (!Number.isInteger(pin)) throw "Error: PIN must be an int";
  let pStr = pin.toString();
  if (!pinRegex.test(pStr)) throw "Error: PIN must be a positive, 6-digit integer";
  return pin;
};

export const validateName = (name, fieldName) => {
    const trimmed = validateStringInput(name, fieldName);
  if (!nameRegex.test(name)) {
    throw `Error: ${fieldName} can only contain letters, and must be between 2 and 25 characters long`;
  }
  return name;
};

export const validateUserId = (userId) => {
    const trimmed = validateStringInput(userId, 'User ID').toLowerCase();
  if (!idRegex.test(userId)) {
    throw "Error: User ID can only contain letters and numbers, and must be between 5 and 10 characters long";
  }
  return trimmed;
};

export const validatePassword = (password) => {
    const trimmed = validateStringInput(password, 'Password');
  if (!passwordRegex.test(password)) {
    throw "Error: Password must contain at least one capital letter, one number, one special character, and must be at least 8 characters long";
  }
  if (password.includes(" ")) {
    throw "Error: Password cannot contain spaces";
  }
  return trimmed;
};

export const validateQuote = (quote) => {
    const trimmed = validateStringInput(quote, 'Favorite quote');
  if (quote.length < 20 || quote.length > 255) {
    throw "Error: Favorite quote must be between 20 and 255 characters";
  }
  return trimmed;
};
export const validateThemePreference = (themePreference) => {
  if (!themePreference || typeof themePreference !== 'object') {
    throw "Error: themePreference must be an object";
  }

  const bgColor = themePreference.backgroundColor;
  const fontColor = themePreference.fontColor;

  if (!bgColor || !fontColor) {
    throw "Error: themePreference must contain both background and font colors in hex form";
  }

  if (!hexRegex.test(bgColor) || !hexRegex.test(fontColor)) {
    throw "Error: Background/Font color must be valid hex color codes";
  }

  if (bgColor === fontColor) {
    throw "Error: Background and Font color cannot be the same";
  }

  // Return normalized object
  return {
    backgroundColor: bgColor,
    fontColor: fontColor
  };
};

export const validateHex = (hexColor) => {
    if (!hexRegex.test(hexColor)){
        throw "Error: Color invalid";
    }
}

export const validateRole = (role) => {
    role = validateStringInput(role, 'Role').toLowerCase();
  if (role !== 'administrator' && role !== 'member') {
    throw "Error: Role can only be administrator or member.";
  }
  return role;
};

export const formatSignupDate = () => {
  const td = new Date();
  return `${(td.getMonth() + 1).toString().padStart(2, '0')}/${td.getDate().toString().padStart(2, '0')}/${td.getFullYear()}`;
};

export const formatLastLogin = () => {
  const td = new Date();
  const hours = td.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;
  return `${(td.getMonth() + 1).toString().padStart(2, '0')}/` +
         `${td.getDate().toString().padStart(2, '0')}/` +
         `${td.getFullYear()} ` +
         `${twelveHour.toString().padStart(2, '0')}:` +
         `${td.getMinutes().toString().padStart(2, '0')}${ampm}`;
};

//takes in a datetime of the format dow:hh:mm then converts it into the minute it is in the week (0 - 10080 minutes in a week)
export const daysToMinutes = (datetime) => {
  const day = datetime.slice(0, datetime.indexOf(":"));
  const time = datetime.slice(datetime.indexOf(":") + 1);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hour = time.split(":").map(Number)[0];
  const minute = time.split(":").map(Number)[1];
  return days.indexOf(day) * 1440 + hour * 60 + minute;
}

//converts a minute in the week and converts it to dow:hh:mmm
export const minutesToDays = (minutes) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days_index = Math.floor(minutes/1440);
  const hour = Math.floor((minutes - 1440*days_index)/60);
  const minute = minutes - 1440*days_index - 60*hour;
  return `${days[days_index]}:${hour}:${minute}`;
}

//takes in a bunch of events
export const createFreeIntervals = (events) => {
  //converts datetimes in events from dow:hh:mm -> minutes in week
  let datetimes = [];
  for(let event of events) {
    datetimes.push({startDate: daysToMinutes(event.startDate), endDate: daysToMinutes(event.endDate)});
  }
  datetimes.sort((a, b) => a.startDate - b.startDate);

  //gets all the busy blocks
  let busyIntervals = [];
  let lastMerged = datetimes[0];
  for(let i = 1; i < datetimes.length; i++) {
    let current = datetimes[i];
    if(lastMerged.endDate >= current.startDate) {
      lastMerged = {startDate: lastMerged.startDate, endDate: (lastMerged.endDate > current.endDate) ? lastMerged.endDate : current.endDate};
    } else {
      busyIntervals.push(lastMerged);
      lastMerged = current;
    }
  }
  busyIntervals.push(lastMerged);

  //returns all the free blocks
  let freeIntervals = [];
  for(let i = 0; i < busyIntervals.length-1; i++) {
    freeIntervals.push({startDate: busyIntervals[i].endDate, endDate: busyIntervals[i+1].startDate});
  }
  freeIntervals.push({startDate: busyIntervals[busyIntervals.length-1].endDate, endDate: busyIntervals[0].startDate});

  //reputs the dates back into dow:hh:mm
  for(let datetime of freeIntervals) {
    datetime.startDate = minutesToDays(datetime.startDate);
    datetime.endDate = minutesToDays(datetime.endDate);
  }

  return freeIntervals;
}

//takes in a bunch of events
export const createBusyIntervals = (events) => {
  //converts datetimes in events from dow:hh:mm -> minutes in week
  let datetimes = [];
  for(let event of events) {
    datetimes.push({startDate: daysToMinutes(event.startDate), endDate: daysToMinutes(event.endDate)});
  }
  datetimes.sort((a, b) => a.startDate - b.startDate);

  //gets all the busy blocks
  let busyIntervals = [];
  let lastMerged = datetimes[0];
  for(let i = 1; i < datetimes.length; i++) {
    let current = datetimes[i];
    if(lastMerged.endDate >= current.startDate) {
      lastMerged = {startDate: lastMerged.startDate, endDate: (lastMerged.endDate > current.endDate) ? lastMerged.endDate : current.endDate};
    } else {
      busyIntervals.push(lastMerged);
      lastMerged = current;
    }
  }
  busyIntervals.push(lastMerged);

  //reputs the dates back into dow:hh:mm
  for(let datetime of busyIntervals) {
    datetime.startDate = minutesToDays(datetime.startDate);
    datetime.endDate = minutesToDays(datetime.endDate);
  }

  return busyIntervals;
}