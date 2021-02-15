const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import routes
const authRoute = require('./routes/auth');
const munrosRoute = require('./routes/munros');

dotenv.config();

// Connect to DB
mongoose.connect(process.env.DB_CONNECT,
    { 
        useUnifiedTopology: true, 
        useNewUrlParser: true 
    }, () => {
        console.log('Connected to DB');
});

// Json Parser
app.use(express.json());

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    const allowedOrigins = ['http://localhost:4200', 'https://www.munrolocator.com'];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
         res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// Route Middlewears
app.use('/api/user', authRoute);
app.use('/api/munros', munrosRoute);

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running');
});