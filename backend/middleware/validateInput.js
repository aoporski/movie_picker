const validator = require("validator");

const containsMalicious = (str) =>
  /<script.*?>.*?<\/script>/gi.test(str) || /["'<>]/.test(str);

const validateEmail = (email) => {
  return (
    typeof email === "string" &&
    validator.isEmail(email) &&
    !containsMalicious(email)
  );
};

const validatePassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 100 &&
    !containsMalicious(password)
  );
};

const isSafeStringArray = (arr, maxItems, maxLength = 100) => {
  return (
    Array.isArray(arr) &&
    arr.length <= maxItems &&
    arr.every(
      (item) =>
        typeof item === "string" &&
        item.length <= maxLength &&
        !/<script.*?>.*?<\/script>/gi.test(item)
    )
  );
};

module.exports = {
  validateEmail,
  validatePassword,
  containsMalicious,
  isSafeStringArray,
};
