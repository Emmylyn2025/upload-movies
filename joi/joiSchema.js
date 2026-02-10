import joi from "joi";

export const registerUserSchema = joi.object({
  username: joi.string().trim().min(3).max(30).required().empty("").messages({
    "string.base": "username must be a text",
    "string.empty": "username cannot be empty",
    "string.min": "username must be minimum of 3 characters",
    "string.max": "username must be maximum of 30 characters",
    "any.required": "username is required"
  }),
  email: joi.string().email().trim().empty("").required().messages({
    "string.base": "email must be string",
    "string.empty": "email cannot be empty",
    "string.email": "please provide a valid email address",
    "any.required": "user email is required"
  }),
  userpassword: joi.string().trim().empty("").min(6).required().messages({
    "string.base": "userpassword must be string",
    "string.min": "userpassword must be minimum of 6 letters",
    "string.empty": "userpassword cannot be empty",
    "any.required": "userpassword is required"
  })
});

export const loginSchema = joi.object({
  email: joi.string().trim().email().empty("").required().messages({
    "string.base": "Email must be a string",
    "string.email": "Please input a valid email format",
    "string.empty": "The email field is empty",
    "any.required": "User email is required"
  }), 
  password: joi.string().trim().empty("").min(6).required().messages({
    "string.base": "password must be string",
    "string.min": "password must be minimum of 6 letters",
    "string.empty": "password cannot be empty",
    "any.required": "password is required"
  })
})