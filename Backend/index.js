const express =require("express");
const router = require("./routes/auth");
const cors = require('cors');
const dashboardRouter = require('./routes/dashboard');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
//Routes
app.use("/auth",router);
app.use('/dashboard',dashboardRouter);
// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
