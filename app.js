import express from "express";
import mysql from "mysql";
import session from "express-session";
import bcrypt from "bcrypt";

// create expressjs app
const app = express()

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appovet'
})

// add the express-session
app.use(session({
    secret: 'kolee',
    resave: true,
    saveUninitialized: false
}))

//set view engine as handlebars in app
app.set('view engine', 'ejs')

// parsing the incoming data
app.use(express.urlencoded({extended: false}))

// serving public file
app.use(express.static('public'))

// Route to homepage
app.get('/', (req, res) => {
    res.render('index')
})

// Route to login page
app.get('/login', (req, res) => {
    const client = {
        email: '',
        password: ''
    }
    res.render('login')
})

// Handling user login
app.post('/login', (req, res) => {
    const client = {
        email: req.body.email,
        password: req.body.password
    }
})

// Route to signup page
app.get('/signup', (req, res) => {
    const client = {
        clientname: req.body.clientname,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword

    }

    res.render('signup')
})

// Handling user signup
app.post('/signup', (req, res) => {
    const client = {
        clientname: '',
        email: '',
        password: '',
        confirmPassword: ''
    }

    res.render('signup')
})




app.listen(5000, () => {
    console.log('app is running...');
})