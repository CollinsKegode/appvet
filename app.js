import express from "express";
import mysql from "mysql";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer"

// create expressjs app
const app = express()

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appv'
})

const upload = multer({dest: 'public/images/profile_pictures'})

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
    
    const user  = {
        email: req.body.email,
        password: req.body.password
    } 
    
    // check if user exists
    let sql = 'SELECT * FROM clients WHERE email = ?'
    connection.query(
        sql,
        [user.email],
        (error, results) => {
            if(error) {
                let error = true
                let message = 'Internal server error. Contact Admin.'
                res.render('login', {user, error, message})
            }
            
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
                        // Wrong password stored in the db
                        let error = true
                        let message = 'Wrong Password.'
                        res.render('login', { user, error, message})
                    }
                })
                
            } else {
                // user does not exist 
                let error = true
                let message = 'Email not registered. Check Email or Sign Up.'
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
                    console.log(results);
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

// logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
}) 

// Dahsboard
app.get('/dashboard', (req, res) => {
    if (res.locals.isLoggedIn) {
        // Fetch upcoming appointments from the database
        const upcomingAppointments = []; // Implement logic to fetch upcoming appointments from the database

        // Calculate appointment statistics (total appointments and appointments for the current week)
        const totalAppointments = upcomingAppointments.length;
        const currentWeekAppointments = upcomingAppointments.filter(appointment => {
            const appointment_date = new Date(appointment.appointment_date);
            const today = new Date();
            const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
            const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
            return appointment_date >= startOfWeek && appointment_date <= endOfWeek;
        }).length;

        // Render the dashboard view with data
        res.render('dashboard', {
            upcomingAppointments,
            totalAppointments,
            currentWeekAppointments
        });
    } else {
        res.redirect('/login')
    }
})

// Account
app.get('/account/:id', (req,res) => {
    if (res.locals.isLoggedIn) {
        let sql = 'SELECT * FROM clients WHERE client_id = ?'
        connection.query(
            sql,
            [req.params.id],
            (error, results) => {
                res.render('account', {user: results[0], userID: req.session.userID, error: false})
            }
        )
    } else {
        res.redirect('/login')
    }
})

// Get edit account form
app.get('/edit-account', (req, res) => {
    if (res.locals.isLoggedIn) {
        let sql = 'SELECT * FROM clients WHERE client_id = ?'
        connection.query(
            sql,
            [req.session.userID],
            (error, results) => {
                res.render('edit-account', {user: results[0], error: false, password: false})
            }
        )
    } else {
        res.redirect('/login')
    }
})

// edit account
app.post('/edit-account/:id', upload.single('picture'), (req, res) => {
    let sql = 'SELECT password FROM clients WHERE client_id = ?'
    connection.query(
        sql,
        [req.params.id],
        (error, results) => {
            bcrypt.compare(req.body.password, results[0].password, (error, isEqual) => {
                
                if (isEqual) {
                    
                    if (req.file) {
                        let sql= 'UPDATE clients SET username = ?, email = ?, phonenumber = ?, gender = ?, location = ?, picture = ? WHERE client_id = ?'
                        connection.query(
                            sql,
                            [
                                req.body.fullname,
                                req.body.email,
                                req.body.phonenumber,
                                req.body.gender,
                                req.body.location,
                                req.file.filename,
                                Number(req.params.id)
                            ],
                            (error, results) => {
                                res.redirect(`/account/${req.params.id}`)
                            }
                        )

                    } else {
                        let sql = 'UPDATE clients SET username = ?, email = ?, phonenumber = ?, gender = ?, location = ? WHERE client_id = ?'
                        connection.query(
                            sql,
                            [
                                req.body.fullname,
                                req.body.email,
                                req.body.phonenumber,
                                req.body.gender,
                                req.body.location,
                                Number(req.params.id)
                            ],
                            (error, results) => {
                                res.redirect(`/account/${req.params.id}`)
                            }
                        )
                    }
                } else {
                    const user = {
                        client_id: req.session.userID,
                        username: req.body.fullname,
                        email: req.body.email,
                        phonenumber: req.body.phonenumber,
                        gender: req.body.gender,
                        location: req.body.location
                    }  
                    res.render('edit-account', {user: user, error: true, password: req.body.id} )
                } 
            })
        }
    )
})

// Handle GET request to display the appointment form
app.get('/appointment', (req, res) => {
    const appointments = []
    res.render('appointment',  { appointments: appointments });
});

// Handle GET request to retrieve existing appointments
app.get('/appointments', (req, res) => {
    const sql = 'SELECT * FROM appointments';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching appointments from database: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('appointments', { appointments: results });
    });
});


// Handle POST request to create a new appointment
app.post('/appointments/:id', (req, res) => {
    const appointmentId = req.params.id
    const { pet_name, appointment_date, reason_for_visit } = req.body;
    const sql = 'INSERT INTO appointments (pet_name, appointment_date, reason_for_visit ) VALUES (?, ?, ?)';
    const values = [pet_name, appointment_date, reason_for_visit];
    

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting appointment into database: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        console.log('New appointment added to database');
        res.redirect('/appointments'); // Redirect to another page after saving
    });
});

// Handle DELETE request to delete an appointment
app.post('/appointments/:id', (req, res) => {
    const appointmentId = req.params.id;

    // Delete the appointment from the database
    const sql = 'DELETE FROM appointments WHERE id = ?';
    connection.query(sql, [appointmentId], (err, result) => {
        if (err) {
            console.error('Error deleting appointment:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        console.log('Appointment deleted successfully');
        res.redirect('/appointments');
    });
});



app.listen(5000, () => {
    console.log('app is running...');
})