const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const jwt = require("jsonwebtoken")
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

// @desc    Login user
exports.login = async (req, res, next) => {
  const { email, password } = req.body;


  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  try {
  
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check that password match
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid Email or Password", 401));
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};


exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;
  // console.log(name , email , password)
  if (!email || !password || !name) {
    return next(new ErrorResponse("Please provide an all the details", 400));
  }

  let user = await User.findOne({ email })
  if(user){
      return next(new ErrorResponse("Email already exists" , 403))
  }



  const token = jwt.sign({
    email , name , password
  },process.env.JWT_ACTIVATION_SECRET , {
    expiresIn : process.env.JWT_ACTIVATION_EXPIRE_SECRET
  })
  const activationUrl = `${process.env.CLIENT_URL}/activation?token=${token}`;


  const message =`
          <h1>Please use the following to activate your account</h1>
          <a href=${activationUrl} clicktracking=off>${activationUrl}</a>
          <hr />
          <p>This email may containe sensetive information</p>
          <p>${process.env.CLIENT_URL}</p>
        `
  

  try {
    await sendEmail({
      to: email,
      subject: "Account Activation",
      text: message,
    });

    res.status(200).json({ success: true, message: "Activation Email Sent" });
  } catch (err) {
    return next(new ErrorResponse("Something went wrong please try again later!", 500));
  }

    


};

exports.activation = async (req , res, next) => {
  const { token } = req.body;
  if(!token)
  return next(new ErrorResponse("Please try again later !" , 404))
  
  try {

    const decoded = jwt.verify(token, process.env.JWT_ACTIVATION_SECRET)
    const {email , name , password} = decoded;
    // let user = await User.findOne({email})
    // if(!user.isActive){
    //   user.isActive = true;
    //   await user.save()
    // }else{
    //   next(new ErrorResponse("You have already activated your account" , 403))
    // }
     const user = await User.create({
      name,
      email,
      password,
    });
    
    res.status(200).json({
      success : true,
      message : "Account is activated"
    })
    // sendToken(user , 200 ,res)

  } 
  
  catch (error) {
    console.log(error)
    if(error.message == "invalid signature")
      return next(new ErrorResponse("Link is invalid . Please sign up again" , 404))
    if(error.message == "jwt expired")
      return next(new ErrorResponse("Link is expired . Resend the email" , 404))
    return next(new ErrorResponse("Please try again later !" , 404))
    
  }

}


exports.ResendActivationLink = async (req , res, next) => {
  const { token } = req.body;
  if(!token)
  return next(new ErrorResponse("Please try again later !" , 404))
  
  try {

    const decoded = jwt.decode(token)
    const {name , email , password} = decoded;
    const user = await User.findOne({email})
    if(user){
      res.status(401).json({
        message:"You have already activated your account"
      })
    }
    const resendToken = jwt.sign({
      name ,email , password
    },process.env.JWT_ACTIVATION_SECRET , {
      expiresIn : process.env.JWT_ACTIVATION_EXPIRE_SECRET
    })
    const activationUrl = `${process.env.CLIENT_URL}/activation/${resendToken}`;
  
  
    const message =`
            <h1>Please use the following to activate your account</h1>
            <a href=${activationUrl} clicktracking=off>${activationUrl}</a>
            <hr />
            <p>This email may containe sensetive information</p>
            <p>${process.env.CLIENT_URL}</p>
          `
    
  
    try {
      await sendEmail({
        to: email,
        subject: "Account Activation",
        text: message,
      });
  
      res.status(200).json({ success: true, data: "Activation Email Sent" });
    } catch (err) {
      return next(new ErrorResponse("Something went wrong please try again later!", 500));
    }

  } 
  
  catch (error) {
    return next(new ErrorResponse("Please try again later !" , 404))
    
  }

}

// @desc    Forgot Password Initialization
exports.forgotPassword = async (req, res, next) => {
  // Send Email to email provided but first check if user exists
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse("No email could not be sent", 404));
    }

    // Reset Token Gen and add to database hashed (private) version of token
    const resetToken = user.getResetPasswordToken();

    await user.save();

    // Create reset url to email to provided email
    const resetUrl = `${process.env.CLIENT_URL}/resetPassword?token=${resetToken}`;

    // HTML Message
    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please make a put request to the following link:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

    

    try {
      const info = await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      })
      console.log(info)
      res.status(200).json({ success: true, message: "Email Sent" });
    } catch (err) {
      console.log(err);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset User Password
exports.resetPassword = async (req, res, next) => {

  // console.log(req.body.resetToken)
  // Compare token in URL params to hashed token
  try {

    const token  = req.body.token
    const decoded = jwt.verify(token, process.env.JWT_PASSWORD_SECRET,);
    // jwt.verify()
    // const decoded = "nmdfnfkj"
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    console.log(resetPasswordToken , "reset token")
    try {
      const user = await User.findOne({
        resetPasswordToken,_id : decoded.id
      });
  
      if (!user) {
        return next(new ErrorResponse("Invalid Tokenssss", 400));
      }
  
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      // user.resetPasswordExpire = undefined;
  
      await user.save();
  
      res.status(201).json({
        success: true,
        message: "Password Updated Success",
        token: user.getSignedJwtToken(),
      });
    
  } catch (error) {
    return next(new ErrorResponse("Token Expired or not Valid ! " ,401 ))
  }
  

  } catch (err) {
    next(new ErrorResponse("Link is invalid. Please try again later"))

    // if(err.error)
    // console.log(err.message)
    // switch(err.message){
    //   case "jwt malformed":
    //     next(new ErrorResponse("Link is invalid. Please go to forget password again!"))
    //     break;
    //   case "invalid signature":

    //   default :
    //     next(err)
    // }
    // next(new ErrorResponse("Something Went Wrong" , 401));
    // next(err)
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT);
// Google Login
exports.googleController = async (req, res , next) => {
  const { idToken } = req.body;
  const response = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT })
  const { email_verified, name, email } = response.payload;
  if (email_verified) {
    const user = await User.findOne({ email : email })
    if (user) 
      return sendToken(user, 200 , res)
    
      
    let password = crypto
    .createHash("sha256")
    .update(email + process.env.JWT_PASSWORD_SECRET)
    .digest("hex");

    const newUser = await User.create({ name, email, password })
    return sendToken(newUser , 200 , res)

  }else 
  next(new ErrorResponse('Google login failed. Try again' , 500))
      
};

  

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({ sucess: true, token , user : {...user.toJSON() } });
};
