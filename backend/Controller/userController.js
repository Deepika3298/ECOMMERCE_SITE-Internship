const User= require("../models/userModel")
const ErrorHander= require("../utils/errorhander");
const catchAsyncError= require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const sendEmail= require("../utils/sendEmail");
const crypto= require("crypto")

//Register a user
exports.registerUser= catchAsyncError(async(req,res,next)=>{
    const {name,email,password}=req.body;
    const user= await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:"This is a sample picture",
            url:"profilePicUrl"
        }
    })

    sendToken(user, 201, res);
});

//Login User
exports.loginUser= catchAsyncError(async(req,res,next)=>{
    const {email,password}= req.body;

    if(!email || !password){
        return next(new ErrorHander("Please Enter email and password", 400));
    }

    const user= await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHander("Invalid Email or password",401));
    }

    const isPasswordMatched= await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHander("Invalid Email or password",401));
    }

    sendToken(user, 200, res);

});

//Logout User
exports.logout= catchAsyncError(async(req,res,next)=>{

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly:true
    })

    res.status(200).json({
        success:true,
        message:"Logged Out "
    })
});

//Forgot Password
exports.forgotPassword= catchAsyncError(async(req,res,next)=>{
    const user= await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHander('User not found',404));
    }
    const resetToken= user.getResetPasswordToken();
     
    await user.save({validateBeforeSave:false});

    const resetPasswordUrl =`${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message= `Your Password Reset Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then, please ignore it. `;

    try {

       await sendEmail({
        email:  user.email,
        subject: 'DV Password Recovery',
        message,
       }) 

       res.status(200).json({
        success:true,
        message:`Email sent to ${user.email} successfully`
       })
        
    } catch (error) {
       user.resetPasswordToken= undefined;
       user.resetPasswordExpire=undefined;

       await user.save({validateBeforeSave:false});
       
       return next(new ErrorHander(error.message))
    }
});

//Reset Password
exports.resetPassword= catchAsyncError(async(req, res, next)=>{
    const resetPasswordToken= crypto
    .createHash("sha256")   
    .update(req.params.token)
    .digest("hex");

    const user= await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt:Date.now()}
    });

    if(!user){
        return next(new ErrorHander("Reset Password Token is invalid or has been expired.", 400)); 
    }

    if(req.body.password!==req.body.confirmPassword){
        return next(new ErrorHander("Password is not matched with Confirm password", 400));
    }

    user.password= req.body.password;
    user.resetPasswordToken= undefined;
    user.resetPasswordExpire=undefined;

    await user.save();

    sendToken(user,200,res);
})

//Get User details
exports.getUserDetails= catchAsyncError(async(req,res,next)=>{
    const user= await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user 
    })
});

//update User password
exports.updatePassword= catchAsyncError(async(req,res,next)=>{
    const user= await User.findById(req.user.id).select("+password");

    const isPasswordMatched= await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHander("Old password is incorrect",400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHander("New Password is not match with Confirm Password",400));
    }
    user.password= req.body.newPassword;
    
    await user.save();

    sendToken(user, 200, res);
});

//Update User Profile
exports.updateProfile= catchAsyncError(async(req, res, next)=>{
    const newUserData={
        name: req.body.name,
        email: req.body.email
    }

    //We will add cloudinary later

    const user= await User.findByIdAndUpdate(req.user.id, newUserData, {
        new:true,
        runValidators: true,
        userFindAndModify:false
    })

    res.status(200).json({
        success:true 
    })
});

//Get All Users(Admin)
exports.getAllUsers= catchAsyncError(async(req,res,next)=>{
    const users= await User.find();

    res.status(200).json({
        success:true,
        users
    })
});

//Get Single User (Admin)
exports.getSingleUser= catchAsyncError(async(req, res, next)=>{
    const user= await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHander(`User does not exist with Id: ${req.params.id}`,400));
    }

    res.status(200).json({
        success:true,
        user
    })
});

//Update User Role --- Admin
exports.updateUserRole= catchAsyncError(async(req, res, next)=>{
    const newUserData={
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user= await User.findByIdAndUpdate(req.params.id, newUserData, {
        new:true,
        runValidators: true,
        userFindAndModify:false
    })

    if(!user){
        return next(new ErrorHander(`User does not exist by this Id: ${req.params.id}`,400));
    }

    res.status(200).json({
        success:true 
    })
});

//Delete User --- Admin
exports.deleteUser= catchAsyncError(async(req, res, next)=>{
    
    const user= User.findById(req.params.id);
    //We will remove cloudinary later

    if(!user){
        return next(new ErrorHander(`User does not exist by this Id: ${req.params.id}`,400));
    }
    
    await user.deleteOne();

    res.status(200).json({
        success:true,
        message:"User Deleted Successfully"
    })
});
