const express= require("express");
const app= express();
const errorMiddleware= require('./middleware/error');

app.use(express.json());

// Routes import
const product= require('./Routes/productRoute');
const user= require('./Routes/userRoute')

app.use("/api/v1",product);
app.use("/api/v1",user)

//Middleware for error
app.use(errorMiddleware);


module.exports= app