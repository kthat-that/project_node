const { query } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validator, register, login, changePass } = require('../validation/auth');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_TOKEN, { expiresIn: '3d' });
}

exports.createUser = async (req, res) => {
    try {

        const { first_name, last_name, email, role, password, gender, dob, phone, address, department_id, position_id, hire_date, base_salary } = req.body;

        // Validate input
        const { error } = validator(register)(req.body);
        if (error) return res.status(400).json({ message: 'Validation failed', details: error.message });

        // Check if email already exists
        const userExists = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (userExists.length > 0) return res.status(400).json({ message: 'Email already exists' })

        const phoneExist = await query('SELECT * FROM employees WHERE phone = ?', [phone]);
        if (phoneExist.length > 0) return res.status(400).json({ message: 'Phone already exists' });

        const checkPosition = await query('SELECT * FROM positions WHERE id = ?', [position_id]);
        if (checkPosition.length === 0) return res.status(400).json({ result: false, message: 'Poistion is not  exists' });

        const checkDepartment = await query('SELECT * FROM departments WHERE id = ?', [department_id]);
        if (checkDepartment.length === 0) return res.status(400).json({ result: false, message: 'Department is not  exists' });


        let sampleFileName = 'default.png';

        if (req.files && req.files.avatar) {
            let sampleFile = req.files.avatar;
            let fileExt = path.extname(sampleFile.name).toLowerCase(); // Get file extension
            let allowedFormats = ['.png', '.jpg', '.jpeg', '.webp']; // Allowed formats

            if (!allowedFormats.includes(fileExt)) {
                return res.status(400).json({ message: 'Invalid file format. Only PNG, JPG, JPEG, and WEBP are allowed.' });
            }

            sampleFileName = Date.now() + fileExt;
            let uploadPath = `./public/upload/${sampleFileName}`;

            // Determine output format for sharp
            let imageSharp = sharp(sampleFile.data);
            switch (fileExt) {
                case '.jpg':
                case '.jpeg':
                    imageSharp = imageSharp.jpeg({
                        quality: 85,           // Adjust quality (75-85 is best for balance)
                        mozjpeg: true,         // Uses MozJPEG for better compression
                        progressive: true,     // Enables progressive loading (better for web)
                        chromaSubsampling: '4:2:0' // Reduces color data for smaller size
                    });
                    break;
                case '.png':
                    imageSharp = imageSharp.png({
                        quality: 85,
                        compressionLevel: 9,
                        adaptiveFiltering: true,
                        palette: true
                    });
                    break;
                case '.webp':
                    imageSharp = imageSharp.webp({ quality: 90 });
                    break;
            }


            await imageSharp.toFile(uploadPath);

            sampleFile.mv(uploadPath, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error uploading file', error: err.message });
                }
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const insertUserSQL = "INSERT INTO `users` (`first_name`, `last_name`, `email`, `role`, `avatar`, status,`password`) VALUES (?, ?, ?, ?, ?, ?,?)";
        //* user query
        const userQuery = await query(insertUserSQL, [first_name, last_name, email, role, sampleFileName, 1, hashedPassword]);


        const insertId = userQuery.insertId;

        // Handle CV file
        let sampleFileNameCv = 'default.pdf';
        if (req.files && req.files.cv_pdf) {
            let sampleFileCV = req.files.cv_pdf;
            sampleFileNameCv = Date.now() + sampleFileCV.name;
            let cvUploadPath = './storage/documents/cv/' + sampleFileNameCv;

            await new Promise((resolve, reject) => {
                sampleFileCV.mv(cvUploadPath, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }

        //  * Insert employee data
        const insertEmployeeSQL = "INSERT INTO `employees` (`user_id`, `gender`, `dob`, `phone`, `address`, `department_id`, `position_id`, `hire_date`, `cv_filename`, `base_salary`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const arrEmploye = [insertId, gender, dob, phone, address, department_id, position_id, hire_date, sampleFileNameCv, base_salary];
        await query(insertEmployeeSQL, arrEmploye);
        res.status(201).json({
            result: true,
            message: 'User and employee registered successfully',
            data: []
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}





// *  getUser 
exports.getUser = async (req, res) => {
    try {
        const getAll = await query( 
                `
                     select 
            users.id,
            users.first_name,
            users.last_name,
            users.email,
            users.avatar,
            employees.phone,
            employees.department_id,
            employees.position_id
            FROM employees
            INNER JOIN users ON users.id = employees.user_id
                `
        );
        res.status(200).json({
            result: true,
            message: "Get all user successfully",
            data: getAll
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error get data',
            error: error.message
        });
    }
}
// * loginPost
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { error, value } = validator(login)(req.body);
        if (error) {
            return res.status(400).json({
                message: 'All fields are required!',
                details: error.message
            });
        }

        const checkEmail = await query("select * from users where email = ?", [email]);
        // const getID = checkEmail[0].id;
        // const avatar = await query("select * from user where id = ?", [getID]);
        if (checkEmail.length === 0) {
            return res.status(400).json({
                message: 'Invalid email!'
            });
        }
        let decryptPassword = await bcrypt.compare(password, checkEmail[0].password);
        if (decryptPassword) {
            const token = generateToken(checkEmail[0].id);
            console.log(token);
            res.cookie('jwtToken', token, {
                maxAge: 3 * 24 * 60 * 60 * 1000,
                // httpOnly: true,
            })
            res.status(200).json({
                result: true,
                role: checkEmail[0].role,
                status: checkEmail[0].status,
                message: 'Login Successfully!'
            })
        } else {
            res.status(401).json({
                message: 'Invalid password'
            })
        };

    } catch (error) {
        res.status(500).json({
            message: 'Error logging in',
            error: error.message
        });
    }
}
exports.resetPass = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await query('select * from users where id = ?', [id]);
        if (!user || user.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const hashedPassword = await bcrypt.hash("123123123", 10);
        const sql = "update users set password = ?, status = ? where id = ?";
        const myArr = [hashedPassword, 1, id];

        await query(sql, myArr);

        res.status(200).json({
            result: true,
            message: "Password Reset successfully"
        })

    } catch {
        res.status(500).json({ message: "Error updating password", error: error.message });
    }
}
exports.updatepass = async (req, res) => {
    try {
        const id = req.params.id;
        const { oldPassword, newPassword } = req.body;
        const { error, value } = validator(changePass)(req.body);
        if (error) {
            return res.status(400).json({
                message: 'All fields are required!',
                details: error.message
            });
        }

        const user = await query('select * from users where id = ?', [id]);
        if (!user || user.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // if (oldPassword === newPassword) {
        //     return res.status(400).json({
        //         message: 'New password cannot be the same as old password'
        //     });
        // }

        const checkStatus = user[0].status;
        if (checkStatus !== 2) {
            const isValidPassword = await bcrypt.compare(oldPassword, user[0].password);
            if (!isValidPassword) {
                return res.status(401).json({
                    message: 'Invalid old password'
                })
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const sql = "update users set password = ?, status = ? where id = ?";
            const myArr = [hashedPassword, 2, id];

            await query(sql, myArr);

            res.status(200).json({
                result: true,
                message: "Password updated successfully"
            })
        } else {
            res.status(200).json({
                result: 'false',
                message: " password already changed or status 2"
            })
        }

    } catch {
        res.status(500).json({ message: "Error updating password", error: error.message });
    }

}

exports.sortPagi = async (search = '', page = 1, perpage = 10) => {

    try {
        page = parseInt(page);
        perpage = parseInt(perpage);
        let userArr = [];
        let values = [];


        let queryStr = `SELECT 
                users.id,
                users.first_name,
                users.last_name,
                users.role,
                users.email,
                users.avatar,
                employees.gender,
                employees.dob,
                employees.address,
                employees.phone,
                employees.department_id,
                employees.position_id,
                employees.base_salary,
                employees.hire_date,
                employees.cv_filename
            FROM employees
            INNER JOIN users ON users.id = employees.user_id`;

        if (search.length > 0) {
            queryStr += " WHERE (users.id = ? OR users.first_name LIKE ? OR users.last_name LIKE ?)";
            values.push(search, `%${search}%`, `%${search}%`);
        }
        queryStr += " LIMIT ? OFFSET ?";
        values.push(perpage, (page - 1) * perpage);


        const res = await query(queryStr, values);

        for (let i = 0; i < res.length; i++) {
            const userTemp = {
                id: res[i].id,
                first_name: res[i].first_name,
                last_name: res[i].last_name,
                role: res[i].role,
                email: res[i].email,
                avatar: res[i].avatar,
                gender: res[i].gender,
                dob: res[i].dob,
                address: res[i].address,
                phone: res[i].phone,
                department_id: res[i].department_id,
                position_id: res[i].position_id,
                base_salary: res[i].base_salary,
                hire_date: res[i].hire_date,
                cv_filename: res[i].cv_filename
            };
            userArr.push(userTemp);
        }


        let countqueryStr = "SELECT COUNT(`id`) AS `total` FROM `users`"
        let countValue = [];

        if (search.length > 0) {
            countqueryStr += " WHERE (`id` = ? OR `first_name` LIKE ? OR `last_name` LIKE ?)";
            countValue.push(search, `%${search}%`, `%${search}%`);
        }


        const [countquery] = await query(countqueryStr, countValue);


        const totalCount = countquery?.total ?? 0;
        const totalPage = totalCount > 0 ? Math.ceil(totalCount / perpage) : 1;


        const userObj = {
            rows: userArr,
            paginate: {
                total: totalCount,
                page: page,
                perpage: perpage,
                pages: totalPage
            }
        };

        return userObj;
    } catch (error) {
        console.log('Cannot get user information:', error);
        return undefined;
    }
};

// * get all employee
exports.getEmployee = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });

        }
        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error || !decodedToken || !decodedToken.id) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }

            let id = decodedToken.id;
            // let id = req.params.id;
            const getAll = await query(`SELECT 
            users.id,
            users.first_name,
            users.last_name,
            users.role,
            users.email,
            users.avatar,
            employees.gender,
            employees.dob,
            employees.address,
            employees.phone,
            employees.department_id,
            employees.position_id,
            employees.base_salary,
            employees.hire_date,
            employees.cv_filename
         FROM employees
         INNER JOIN users ON users.id = employees.user_id
         WHERE users.id = ?`,
                [id]
            );
            // Separate user and employee data
            const user = {
                id: getAll[0].id,
                first_name: getAll[0].first_name,
                last_name: getAll[0].last_name,
                role: getAll[0].role,
                email: getAll[0].email,
                avatar: getAll[0].avatar
            };

            const employee = {
                gender: getAll[0].gender,
                dob: getAll[0].dob,
                address: getAll[0].address,
                phone: getAll[0].phone,
                department_id: getAll[0].department_id,
                position_id: getAll[0].position_id,
                base_salary: getAll[0].base_salary,
                hire_date: getAll[0].hire_date,
                cv_filename: getAll[0].cv_filename
            };

            return res.status(200).json({
                result: true,
                message: "Get all employee successfully",
                data: {
                    user: user,
                    employee: employee
                }
            });
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error get data',
            error: error.message
        });
    }
}
// * not yet
exports.updateAvarta = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized access: no token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET_TOKEN, async (error, decodedToken) => {
            if (error) {
                return res.status(401).json({ message: 'Unauthorized access: invalid token', error: error.message });
            }

            if (!decodedToken || !decodedToken.id) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userId = decodedToken.id;

            if (!req.files || !req.files.avatar) {
                return res.status(400).json({ result: false, message: "Avatar field is required!" });
            }

            // Ensure the uploaded file has a valid name
            const sampleFile = req.files.avatar;
            if (!sampleFile.name) {
                return res.status(400).json({ message: 'Invalid file upload: No file name provided.' });
            }

            const fileExt = path.extname(sampleFile.name).toLowerCase();
            const allowedFormats = ['.png', '.jpg', '.jpeg', '.webp'];

            if (!allowedFormats.includes(fileExt)) {
                return res.status(400).json({ message: 'Invalid file format. Only PNG, JPG, JPEG, and WEBP are allowed.' });
            }

            // Get the old avatar from the database
            const userResult = await query("SELECT avatar FROM users WHERE id = ?", [userId]);
            let oldAvatar = userResult[0]?.avatar || 'default.png';

            console.log("Old avatar from database:", oldAvatar);

            const newFileName = Date.now() + fileExt;
            const uploadDir = './public/upload';
            const uploadPath = `${uploadDir}/${newFileName}`;

            console.log(`Uploading avatar to: ${uploadPath}`);

            let imageSharp = sharp(sampleFile.data);
            switch (fileExt) {
                case '.jpg':
                case '.jpeg':
                    imageSharp = imageSharp.jpeg({ quality: 85, mozjpeg: true, progressive: true, chromaSubsampling: '4:2:0' });
                    break;
                case '.png':
                    imageSharp = imageSharp.png({ quality: 85, compressionLevel: 9, adaptiveFiltering: true, palette: true });
                    break;
                case '.webp':
                    imageSharp = imageSharp.webp({ quality: 90 });
                    break;
            }

            try {
                await imageSharp.toFile(uploadPath);
                console.log("Image saved successfully to:", uploadPath);
            } catch (err) {
                console.error("Error in image processing:", err);
                return res.status(500).json({ message: 'Error processing the image.' });
            }

            // Delete old avatar if it's not the default image
            if (oldAvatar && oldAvatar !== 'default.png') {
                const oldFilePath = `${uploadDir}/${oldAvatar}`;
                console.log("Attempting to delete old avatar:", oldFilePath);

                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                        console.log("Old avatar deleted successfully:", oldFilePath);
                    } catch (err) {
                        console.error("Error deleting old avatar:", err);
                    }
                } else {
                    console.log("Old avatar file not found:", oldFilePath);
                }
            }

            // Update avatar in the database
            const sql = "UPDATE users SET avatar = ? WHERE id = ?";
            await query(sql, [newFileName, userId]);

            res.status(200).json({ result: true, message: "Avatar updated successfully" });
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating avatar", error: error.message });
    }
};


exports.updateEmployee = async (req, res) => {
    try {
        const {
            first_name, last_name, gender, dob, phone, address,
            department_id, position_id, hire_date, base_salary
        } = req.body;
        const employee_id = req.params.id;
        if (!employee_id) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        // // Validate input (if needed)
        // const { error } = validator(updateEmp)(req.body);
        // if (error) return res.status(400).json({ message: 'Validation failed', details: error.message });

        // Check if employee exists
        const userId = await query('SELECT * FROM employees WHERE id = ?', [employee_id]);
        if (!userId || userId.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (phone) {
            const currentEmployee = await query('SELECT phone FROM employees WHERE id = ?', [employee_id]);
        
            if (currentEmployee.length > 0) {
                if (phone !== currentEmployee[0].phone) {
                    const phoneExist = await query('SELECT * FROM employees WHERE phone = ?', [phone]);
                    if (phoneExist.length > 0) {
                        return res.status(400).json({ message: 'Phone number already exists' });
                    }
                }
            }
        }
        



        // Check if position exists
        if (position_id) {
            const checkPosition = await query('SELECT * FROM positions WHERE id = ?', [position_id]);
            if (checkPosition.length === 0) return res.status(400).json({ message: 'Position does not exist' });
        }

        // Check if department exists
        if (department_id) {
            const checkDepartment = await query('SELECT * FROM departments WHERE id = ?', [department_id]);
            if (checkDepartment.length === 0) return res.status(400).json({ message: 'Department does not exist' });
        }

        // Check for files
        // Avatar update
        let avatar = req.body.old_img || 'default.png';
        if (req.files && req.files.avarta) {
            const sampleFile = req.files.avarta;
            const fileExt = path.extname(sampleFile.name).toLowerCase();
            const allowedFormats = ['.png', '.jpg', '.jpeg', '.webp'];
        
            // Log file info for debugging
            console.log('Uploaded file:', sampleFile);
            console.log('File extension:', fileExt);
        
            if (!allowedFormats.includes(fileExt)) {
                return res.status(400).json({ message: 'Invalid file format. Only PNG, JPG, JPEG, and WEBP are allowed.' });
            }
        
            const newFileName = Date.now() + fileExt;
            const uploadDir = './public/upload';
            const uploadPath = `${uploadDir}/${newFileName}`;
        
        
            console.log(`Uploading avatar to: ${uploadPath}`);
        
            let imageSharp = sharp(sampleFile.data);
            switch (fileExt) {
                case '.jpg':
                case '.jpeg':
                    imageSharp = imageSharp.jpeg({ quality: 85, mozjpeg: true, progressive: true, chromaSubsampling: '4:2:0' });
                    break;
                case '.png':
                    imageSharp = imageSharp.png({ quality: 85, compressionLevel: 9, adaptiveFiltering: true, palette: true });
                    break;
                case '.webp':
                    imageSharp = imageSharp.webp({ quality: 90 });
                    break;
            }
        
            try {
                // Process and save the image
                await imageSharp.toFile(uploadPath);
                console.log("Image saved successfully to:", uploadPath);
            } catch (err) {
                console.error("Error in image processing:", err);
                return res.status(500).json({ message: 'Error processing the image.' });
            }
        
            // Delete old avatar if it's not the default image
            if (avatar && avatar !== 'default.png') {
                const oldFilePath = `${uploadDir}/${avatar}`;
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log("Old avatar deleted:", oldFilePath);
                }
            }
        
            avatar = newFileName; // Set new avatar name
        }
        
        let fileCv = req.body.old_cv;

        if (req.files && req.files.newCv && req.files.newCv.name !== 'default.pdf') {
            const sampleFile = req.files?.newCv;
            const sampleFileName = Date.now() + sampleFile.name;

            const uploadPath = './storage/documents/cv/' + sampleFileName;
            console.log(`Uploading to: ${uploadPath}`);

            // Move file with proper error handling
            await new Promise((resolve, reject) => {
                sampleFile.mv(uploadPath, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            // Delete old file if it exists and is not the default image
            if (req.body.old_cv && req.body.old_cv !== 'default.pdf') {
                const oldFilePath = './storage/documents/cv/' + req.body.old_cv;
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            fileCv = sampleFileName; // Set the new file name
        }

        // Dynamically build update query for employees
        let updateFields = [];
        let updateValues = [];

        const fields = { gender, dob, phone, address, department_id, position_id, hire_date, base_salary };
        if (fileCv) fields.cv_filename = fileCv; // Only update CV if a new one is uploaded

        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }
        });

        if (updateFields.length > 0) {
            await query(`UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`, [...updateValues, employee_id]);
        }

        // Dynamically build update query for users
        let userFields = [];
        let userValues = [];
        const userData = { first_name, last_name };
        if (avatar) userData.avatar = avatar; // Only update avatar if a new one is uploaded

        Object.entries(userData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                userFields.push(`${key} = ?`)
                userValues.push(value);
            }
        });
        console.log(updateFields);
        console.log(userFields);
        if (userFields.length > 0) {
            await query(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, [...userValues, userId[0].user_id]);
        }

        res.status(200).json({
            result: true,
            message: 'Employee updated successfully',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// * delete employee & user
exports.deleteEmp = async (req, res) => {
    try {
        const token = req.cookies.jwtToken;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
            console.log("Decoded Token:", decodedToken);
        } catch (error) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }

        const idUser = decodedToken.id;
        const sqlRole = "SELECT * FROM users WHERE id = ?";
        const role = await query(sqlRole, [idUser]);

        if (role.length === 0) {
            return res.status(404).json({ message: "User role not found" });
        }

        let requestRole = role[0].role;
        console.log('Request Role:', requestRole);
        let id = req.params.id;
        console.log("param " + id)


        const sqlEmployee = "SELECT * FROM employees WHERE id = ?";
        const employee = await query(sqlEmployee, [id]);
        if (employee.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const userId = employee[0].user_id;

        // Fetch user data
        const sqlUser = "SELECT * FROM users WHERE id = ?";
        const user = await query(sqlUser, [userId]);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const targetRole = user[0].role;
        console.log(`Request Role: ${requestRole}, Target Role: ${targetRole}`); // Debugging check

        // Role access control
        if (requestRole == 2 && (targetRole == 2 || targetRole == 3)) {
            return res.status(200).json({ message: "Forbidden: Admins can only delete Users (Role 1)" });
        }

        if (requestRole == 3 && targetRole == 3) {
            return res.status(200).json({ message: "Forbidden: Super Admins cannot delete other Super Admins" });
        }

        let avatar_name = user[0].avatar;
        let cv_name = employee[0].cv_filename;

        // Delete avatar if it's not the default
        if (avatar_name && avatar_name !== "default.png") {
            try {
                await fs.promises.unlink(`./public/upload/${avatar_name}`);
                console.log(`Deleted avatar: ${avatar_name}`);
            } catch (error) {
                console.warn(`Avatar file not found or already deleted: ${avatar_name}`);
            }
        }

        // Delete CV if it's not the default
        if (cv_name && cv_name !== "default.pdf") {
            try {
                await fs.promises.unlink(`./storage/documents/cv/${cv_name}`);
                console.log(`Deleted CV: ${cv_name}`);
            } catch (error) {
                console.warn(`CV file not found or already deleted: ${cv_name}`);
            }
        }

        // Delete user and employee records
        const deleteUserSql = "DELETE FROM users WHERE id = ?";
        const deleteEmpSql = "DELETE FROM employees WHERE id = ?";

        await query(deleteUserSql, [userId]);
        await query(deleteEmpSql, [id]);

        res.json({ result: true, message: "Employee deleted successfully" });
    } catch (error) {
        console.error(`Error deleting employee: ${error.message}`);
        res.status(500).json({ message: "Error deleting employee", error: error.message });
    }
};
