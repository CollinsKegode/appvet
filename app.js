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

// Set up middleware to check if user is logged in
app.use((req, res, next) => {
    if (req.session.userID === undefined) {
        res.locals.isLoggedIn = false
        res.locals.clientname = 'Guest'
        console.log("You're not logged in. UserId is " + req.session.userID);
    } else {
        res.locals.isLoggedIn = true
        res.locals.userID = req.session.userID
        res.locals.clientname = req.session.clientname.toString().split(' ')[0]
        console.log("You're logged in. UserId is " + req.session.userID);
    }
    next()
})

// Route to homepage
app.get('/', (req, res) => {
    res.render('index')
})

// Route to login page
app.get('/login', (req, res) => {
    const user = {
        email: '',
        password: ''

        // // Check if user credentials are valid
        // if (isValidUser)(email,password) {
        //     // set session variable to indicate user is logged in
        //     req.session.userID = getUserIdByEmail(email)

        //     res.redirect('/dashboard')
        // } else {
        //     res.render('index')
        // }
    }
    res.render('login')
})

// Handling user login
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    // Check if user exists
    // let sql 
})

// Route to signup page
app.get('/signup', (req, res) => {
    const user = {
        clientname: '',
        email: '',
        password: '',
        confirmPassword: ''

    }

    res.render('signup', {user})
})

// Handling user signup
app.post('/signup', (req, res) => {
    const user = {
        clientname: req.body.clientname,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword

    }

    if (user.password === user.confirmPassword) {
        // Check if client exists
        let sql = 'SELECT * FROM clients WHERE email = ?'
        connection.query(
            sql,
            [user.email],
            (error, results) => {
                if (results.length > 0) {
                    // check if user exists
                    let error = true
                    message = 'Account already exists with the email provided.'
                    res.render('signup', {user, error, message})
                } else {
                    //  Hash password and create user
                    let sql = 'INSERT INTO clients (clientname, email, password) VALUES(?,?,?)'
                    connection.query(
                        sql,
                        [user.clientname, user.email],
                        (error, result) => {
                            res.redirect('/login') 
                        }
                    )
                }
            }
        )
    } else {
        // password do not match
        let error = true
        message = 'Password Mismarch!'
        res.render('signup', {user, error, message})
    }

    
})


app.listen(5000, () => {
    console.log('app is running...');
})