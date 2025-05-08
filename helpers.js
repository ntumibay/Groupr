//You can add and export any helper functions you want here. If you aren't using any, then you can just leave this file as is.

// Regex patterns
export const nameRegex = /^[a-zA-Z]{2,20}$/;
export const idRegex = /^[a-zA-Z0-9]{5,10}$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
export const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Helper functions
export const validateStringInput = (input, fieldName) => {
  if (!input) throw `Error: ${fieldName} must be provided`;
  if (typeof input !== 'string' || input.trim().length===0) throw `Error: ${fieldName} must be a non-empty string`;
  return input.trim();
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