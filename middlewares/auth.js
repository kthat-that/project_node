const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwtToken;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET_TOKEN, (error, decodedToken) => {
            if (error) {
                return res.status(401).json({
                    message: 'Unauthorized access',
                    error: error.message
                });
            } else {
                // console.log(decodedToken);
                req.user = decodedToken;
                next();
            }
        })
    } else {
        // res.status(401).json({
        //     message: "You need to login"
        // });
        res.redirect('/page-login');
    }
}
const authorize = (roles = []) => {
    return async function (req, res, next) {
        try {
            const userId = req.user.id;
            const result = await query("select  role from users where id = ?", [userId]);

            if (!result.length || !roles.includes(result[0].role)) {
                // return res.redirect('back'); // Stay on the current page
                res.render('pages/404.ejs')
                // return res.status(403).json({
                //     message: "Access denied"
                // })
            }
            next();

        } catch (error) {
            return res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }

    }
}
const checkUser = async (req, res, next) => {
    const token = req.cookies.jwtToken;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        // Convert jwt.verify into a Promise
        const decodedToken = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET_TOKEN, (error, decoded) => {
                if (error) reject(error);
                else resolve(decoded);
            });
        });

        // Fetch user from database
        const userId = decodedToken.id;
        const result = await query("SELECT * FROM users WHERE id = ?", [userId]);

        if (!result.length) {
            res.locals.user = null;
            
            res.render('pages/auth/page-login.ejs')
            // return res.status(401).json({
            //     message: 'User not found'
            // });
        }

        // Store user in res.locals
        res.locals.user = result; // Store user object
        // res.locals.user = result[0]; // Store user object
        req.user = decodedToken; // Attach decoded token to req
        next();
        
    } catch (error) {
        res.locals.user = null;
        // return res.status(401).json({
        //     message: 'Unauthorized access',
        //     error: error.message
        // });
        res.render('pages/auth/page-login.ejs')
    }
};

module.exports = {
    requireAuth,
    authorize,
    checkUser
}
