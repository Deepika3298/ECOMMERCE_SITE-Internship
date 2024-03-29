const express= require("express");
const app= express();
const cookieParser= require('cookie-parser')


const errorMiddleware= require('./middleware/error');


app.use(express.json());
app.use(cookieParser());

// Routes import
const product= require('./Routes/productRoute');
const user= require('./Routes/userRoute');
const order= require('./Routes/orderRoute');

app.use("/api/v1",product);
app.use("/api/v1",user);
app.use("/api/v1",order); 

//Middleware for error
app.use(errorMiddleware);


module.exports= app