const express = require('express');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const livereload = require("livereload");
const multer = require('multer')
const connectLivereload = require("connect-livereload");
const { checkUser } = require('./middlewares/auth');
const { generatePayroll } = require('./resources/payroll');
const cron = require('node-cron');

const apiAuth = require('./routes/api/auth');
const apiPosition = require('./routes/api/position');
const apiDept = require('./routes/api/department');
const apiScan = require('./routes/api/scan');
const apiOvertime = require('./routes/api/overtime');
const apiLeave = require('./routes/api/leave');
const apiPayroll = require('./routes/api/payroll');
const qrCard = require('./routes/api/qrCard');
const attendance = require('./routes/api/attendance');
const statistic = require('./routes/api/statistic');
const apiAnnouncement = require('./routes/api/announcement');

const auth = require('./routes/web/auth')
const allDepartment = require('./routes/web/department');
const allPosition = require('./routes/web/position');
const overtime = require('./routes/web/overtime');
const attendanceEmp = require('./routes/web/attendanceEmp');
const allEmployee = require('./routes/web/employee');
const manageProfile = require('./routes/web/profile-manage')
const allUser = require('./routes/web/user')
const addAdmin = require('./routes/web/add-admin')
const leave = require('./routes/web/leave');
const announcement = require('./routes/web/announcement')
const page404 = require('./routes/web/404')
const generateQR = require('./routes/web/generate-qr')
const dashboard = require('./routes/web/dashboard')
const informationQR = require('./routes/web/info-qr-code')

require('dotenv').config();
// * api AUTH

const app = new express();
const port = process.env.PORT;
const upload = multer().any();
// Middleware
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname + "/public");


app.use(connectLivereload());
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('storage'));
// app.use(fileUpload());  
app.use(cookieParser());
// view Card ID
app.use(express.urlencoded({ extended: true }));
app.use(qrCard);
app.use((req, res, next) => {
    if (req.is('multipart/form-data')) {
        if (req.headers['content-length'] > 0 && req.headers['content-type'].includes('filename')) {
            return upload(req, res, next);
        } else {
            return fileUpload()(req, res, next);
        }
    }
    next();
});

app.get('*', checkUser);

//API
app.use(apiAuth);
app.use(apiPosition);
app.use(apiDept);
app.use(apiScan);
app.use(apiOvertime);
app.use(apiLeave);
app.use(apiPayroll);
app.use(attendance);
app.use(statistic);
app.use(statistic);
app.use(apiAnnouncement)


//Web

app.use(auth);
app.use(allDepartment);
app.use(allPosition);
app.use(overtime);
app.use(attendanceEmp);
app.use(manageProfile);
app.use(allEmployee);
app.use(allUser);
app.use(addAdmin);
app.use(leave);
app.use(announcement);
app.use(generateQR)
app.use(dashboard);
app.use(informationQR)

// 404
app.use(page404);

// Auto generate payrolls
cron.schedule('0 0 27 * *', async () => {
    console.log('Running monthly payroll generation');
    generatePayroll
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})  
