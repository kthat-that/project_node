const jwt = require('jsonwebtoken');

exports.CheckDevice = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    if (mobileRegex.test(userAgent)) {
        req.deviceType = 'mobile';
        console.log(req.deviceType);
        const token = req.cookies.jwtToken;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET_TOKEN, (error, decodedToken) => {
                if (error) {
                    return res.status(401).json({
                        message: 'Unauthorized access',
                        error: error.message
                    });
                } else {
                    req.user = decodedToken;
                    next();
                }
            })
        } else {
            res.redirect('/user/login');    
        }

    } else {
        req.deviceType = 'pc';
        console.log(req.deviceType);
        res.redirect('/home-screen');
    }
    next();

}

