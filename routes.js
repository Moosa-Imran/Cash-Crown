const express = require('express');
const path = require('path');
const { ObjectId } = require('mongodb'); 
const router = express.Router();

// Protected Route Middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        return res.redirect('/');
    }
}


// Route for Fetching User's Detials
router.get('/fetchUser', async (req, res) => {
    // Get the user ID from the session
    const userId = req.session.user ? req.session.user.id : null;
    const usersDb = req.app.locals.usersDb;

    try {
        // Check if the user ID exists
        if (!userId) {
            return res.status(401).json({ status: false, message: 'User not authenticated.' });
        }

        // Search for the user in the Customers collection
        const user = await usersDb.collection('Customers').findOne({ _id: new ObjectId(userId) });
        if (user) {
            // If user is found, send the user data along with status
            res.status(200).json({ status: true, user });
        } else {
            // If user does not exist, send status false
            res.status(404).json({ status: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
});

router.get('/chkref', async (req, res) => {

    const usersDb = req.app.locals.usersDb;
    const referrerUsername = req.session.user.username; 

    try {
        // Find all documents where referral_code matches the current session's username
        const referredUsers = await usersDb.collection('Customers').find({
            referral_code: referrerUsername
        }).toArray();
        // Send the array as the response
        res.status(200).json({ referredUsers });
    } catch (error) {
        console.error('Error retrieving referred users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route for Storing Email Subscription
router.post('/subscribe', async (req, res) => {
    const email = req.body.email;
    const subscriptionsDb = req.app.locals.subscriptionsDb;

    try {
        const existingEmail = await subscriptionsDb.collection('Customers').findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already subscribed.' });
        }

        await subscriptionsDb.collection('Customers').insertOne({
            email,
            subscribedAt: new Date()
        });

        res.status(201).json({ message: 'Subscription successful!' });
    } catch (error) {
        console.error('Error subscribing email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Registration Route
router.post('/register', async (req, res) => {
    const { fname, lname, username, referral_code, email, password } = req.body;
    const usersDb = req.app.locals.usersDb;

    try {
        // Check if the username or email already exists
        const existingUser = await usersDb.collection('Customers').findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already taken.' });
        }

        // Handle referral code validation (optional)
        let referralUser = null;
        if (referral_code) {
            referralUser = await usersDb.collection('Customers').findOne({ username: referral_code });
            if (!referralUser) {
                return res.status(400).json({ message: 'Invalid referral code.' });
            }
        }

        // Create new user
        await usersDb.collection('Customers').insertOne({
            fname,
            lname,
            username,
            referral_code, 
            email,
            password, // Storing plain password for now; remember to hash it in production!
            plan: "none",
            registeredAt: new Date()
        });

        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Login Route
router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    const usersDb = req.app.locals.usersDb;
    try {
        // Search for the user by username or email
        const user = await usersDb.collection('Customers').findOne({
            $or: [
                { username: login },
                { email: login }
            ]
        });

        // If user is not found
        if (!user) {
            return res.status(401).json({status: 'invalid', message: 'Invalid username or email.' });
        }

        if (user.password !== password) {
            return res.status(401).json({status: 'incorrect', message: 'Incorrect password.' });
        }

        // If valid, store user session and create cookie
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        // Send success response
        res.status(200).json({status: 'success', message: 'Login successful!' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({status: 'error',  message: 'Internal server error' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed. Please try again later.' });
        }
        res.clearCookie('connect.sid'); 
        res.status(200).json({ message: 'Logout successful!' });
    });
});

// Dashboard Route (Protected)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'dashboard.html'));
});

router.get('/investmentplan', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'investmentplan.html'));
});

router.get('/investments', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'investments.html'));
});

router.get('/withdraw', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'withdraw.html'));
});

router.get('/withdrawals', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'withdrawals.html'));
});

router.get('/ticket', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'ticket.html'));
});

router.get('/setting', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'setting.html'));
});

router.get('/payment', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'payment.html'));
});

module.exports = router;
