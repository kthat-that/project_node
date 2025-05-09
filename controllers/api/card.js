const moment = require('moment');
const fs = require('fs');
const QRCode = require('qrcode');
const path = require('path');
const generateEmployeeIDCard = require("../../resources/qrCard");
const { PDFDocument } = require('pdf-lib');
const { first } = require('lodash');
const { name } = require('ejs');

exports.qrCard = async  (req, res) => {
    try {
        const {name,department_id,position_id,phone,avatar,email} = req.body;
        let id= req.params.id;

        const startDate = moment();
        const endDate = moment().add(1, 'year');


            const profileUrl =`https://votmean.ems.linkpc.net/info-qr-code?id=${id}`;
            const qrCodeBuffer = await QRCode.toBuffer(profileUrl);

            function generateId(length = 5) {
                id++; // Increment ID dynamically
                return (`${'0'.repeat(length)}` + id).slice(-length);
            }
              
            // id: '000123',
            // name: 'អូន គីមហុង',
            // department: 'Software Development',
            // position: 'Frontend Developer',
        const employee = {
            id: generateId(),
            name: name,
            department: department_id,
            position: position_id,
            email: email,
            phone: phone,
            logoPath: path.join(__dirname, '../../public/images/logo/logowhite.png'),
            photoPath: avatar,
            qrCodePath: qrCodeBuffer,
            card: path.join(__dirname, '../../public/images/idCard/card1.png'),
            cardBack: path.join(__dirname, '../../public/images/idCard/cardBack.png'),
            logoBack: path.join(__dirname, '../../public/images/logo/logoBack.png'),
            sign: path.join(__dirname, '../../public/images/idCard/signature.png'),
            startDate: startDate.format('DD-MM-YYYY'),
            endDate: endDate.format('DD-MM-YYYY')
        };

          
       
        res.setHeader('Content-Type', 'application/pdf');

       
        generateEmployeeIDCard(
            employee,
            chunk => res.write(chunk), // Write PDF chunks to the response
            () => res.end() // End the response
        );
    } catch (error) {
        console.error('Error generating ID card:', error);
        res.status(500).send('Internal Server Error');
    }
}
exports.qrCardAlls = async (req, res) => {
    try {
        const employees = req.body.employees || []; 

        if (!Array.isArray(employees) || employees.length === 0) {
            return res.status(400).send('No employees data provided');
        }

        const startDate = moment();
        const endDate = moment().add(1, 'year');
        const mergedPdf = await PDFDocument.create(); // Create a blank PDF to merge all employee PDFs

        for (let employeeData of employees) {
            let { id, first_name,last_name,department_id,position_id, phone, avatar, email } = employeeData;

            let fullname = first_name +" "+last_name;
            // console.log("fullname"+fullname);
            // Set default values for missing fields
            id = id || 'No ID Provided';
            fullname = fullname || 'No Name Provided';
            phone = phone || 'No Phone Provided';
            email = email || 'No Email Provided';
            department_id = department_id || "no Departmnt id"
            position_id = position_id || "no position id"
            if (!id || !fullname || !phone || !email) {
                console.error(`Missing required employee fields for employee ID: ${id}`);
                continue;
            }

            function generateId(length = 5) {
                id++; // Increment ID dynamically
                return (`${'0'.repeat(length)}` + id).slice(-length);
            }
            const profileUrl = `https://votmean.ems.linkpc.net/info-qr-code?id=${id}`;
            const qrCodeBuffer = await QRCode.toBuffer(profileUrl);

            const employee = {
                id:generateId(),
                name:fullname,
                position: position_id ==1 ? "Web Developer" : 'Mobile Developer',    // Hardcoded position
                email,
                phone,
                logoPath: path.join(__dirname, '../../public/images/logo/logowhite.png'),
                photoPath: avatar,
                qrCodePath: qrCodeBuffer,
                card: path.join(__dirname, '../../public/images/idCard/card1.png'),
                cardBack: path.join(__dirname, '../../public/images/idCard/cardBack.png'),
                logoBack: path.join(__dirname, '../../public/images/logo/logoBack.png'),
                sign: path.join(__dirname, '../../public/images/idCard/signature.png'),
                startDate: startDate.format('DD-MM-YYYY'),
                endDate: endDate.format('DD-MM-YYYY')
            };

            // console.log("Generating ID card for employee:", employee);

            let chunks = []; // Create a new chunk array for each employee

            // Generate the ID card PDF for this employee
            await new Promise((resolve, reject) => {
                generateEmployeeIDCard(
                    employee,
                    chunk => chunks.push(chunk),  // Collect chunks
                    () => resolve()
                );
            });

            // Combine chunks into a complete PDF buffer
            const pdfBuffer = Buffer.concat(chunks);

            // Load this employee's PDF and add it to the merged PDF
            const employeePdf = await PDFDocument.load(pdfBuffer);
            const copiedPages = await mergedPdf.copyPages(employeePdf, employeePdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        // Send the final merged PDF to the client for viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=all_employees.pdf');
        res.end(await mergedPdf.save());

    } catch (error) {
        console.error('Error generating ID card:', error);
        res.status(500).send('Internal Server Error');
    }
};