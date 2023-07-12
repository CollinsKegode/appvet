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
    database: 'appv'
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
        res.locals.username = 'Guest'
        console.log("You're not logged in. UserId is " + req.session.userID);
    } else {
        res.locals.isLoggedIn = true
        res.locals.userID = req.session.userID
        res.locals.username = req.session.username.toString().split(' ')[0]
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
    }
    res.render('login', {user, error: false, message: ' '})
    
})

// Handling user login
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }
    // check if user exists
    let sql = 'SELECT * FROM clients WHERE email = ?'
    connection.query(
        sql,
        [ user.email ],
        (error, results) => {
            if (results.length > 0) {

                // compare the submitted password with hash password in the db
                bcrypt.compare(user.password, results[0].password, (error, isEqual) => {
                    if (isEqual) {
                        // grand access
                        req.session.userID = results[0].client_id
                        req.session.username = results[0].username
    
                        console.log('User is successfully logged in');
                        res.redirect('/')
    
                    } else {
                        // incorect password stored in the db
                        let error = true
                        message = 'Incorect password'
                        res.render('login', { user, error, message, })
                    }
                })
                
            } else {
                // user does not exist 
                let error = true
                let message = 'Account does not exist'
                res.render('login', {user, error, message})
            }
        }
    )
    
})

// Route to signup page
app.get('/signup', (req, res) => {
    const user = {
        username: '',
        email: '',
        password: '',
        confirm_password: ''

    }
    res.render('signup', {user, error: false, message: ' '})
})

// Handling user signup
app.post('/signup', (req, res) => {
    const user = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        confirm_password: req.body.confirm_password
    }

    if (user.password === user.confirm_password) {
        // Check if client exists
        let sql = 'SELECT * FROM clients WHERE email = ?'
        connection.query(
            sql,
            [user.email],
            (error, results) => {
                if (results.length > 0) {
                    // check if user exists
                    let error = true
                    let message = 'Account already exists with the email provided.'
                    res.render('signup', {user, error, message})
                } else {
                    //  hash and create user
                    bcrypt.hash(user.password, 10, (error, hash) => {
                        let sql = 'INSERT INTO clients (username, email, password) VALUES (?,?,?)'
                        connection.query(
                        sql,
                        [user.username, user.email, hash],
                        (error, result) => {
                            res.redirect('/login') 
                        }
                    )    
                    })
                }
            }
        )
    } else {
        // password do not match
        let error = true
        let message = 'Password Mismarch!'
        res.render('signup', {user, error, message})
    }
    
})


app.listen(5000, () => {
    console.log('app is running...');
})