const app= require("./app")

const dotenv= require("dotenv")
const connectDB= require("./config/database")

//To Handle Uncaught Exception
process.on("uncaughtException",err=>{
    console.log(`Err: ${err.message}`);
    console.log("Shutting down the server due to Uncaught Exception");
    process.exit(1);
})

// Config
dotenv.config({path:"backend/config/config.env"})
connectDB()

const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
})

//Unhandled Promise Rejection
process.on("unhandledRejection",err=>{
    console.log(`Err: ${err.message}`);
    console.log("Shutting down the server due to unhandled promise rejection");

    server.close(()=>{
        process.exit(1);
    });
});