

const PDFDocument = require('pdfkit');
const path = require('path');

const fs = require('fs');

function generateEmployeeIDCard(employee, dataCallback, endCallback) {
    const doc = new PDFDocument({
        size: [350, 255], // Custom size for ID card (85.6mm x 53.98mm, equivalent to 340x200 px)
        layout: 'landscape', // Optional: landscape orientation
        margins: { top: 20, bottom: 20, left: 20, right: 20 }
    });

    // Stream callbacks
    doc.on('data', dataCallback);
    doc.on('end', endCallback);

    // Colors and styles
    const primaryColor = '#EEEEEE'; // Company branding color
    const textColor = '#000000';
    const borderColor = '#CCCCCC';

    // Background rectangle

    // doc.rect(0, 0, doc.page.width, doc.page.height).fill(primaryColor);








    // Add employee details
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(employee?.name, 85, 140, { align: 'left' });

    doc.save();
    doc.rotate(-24, { origin: [150, 70] })
        .rect(-45, -70, 430, 190)
        .fill('#002A5C');


    doc.rect(-45, 120, 455, 6)
        .fill('#FFFFFF');

    doc.restore();

    // Define circle parameters
    const x = 129; // Center X for the circle
    const y = 131; // Center Y for the circle
    const radius = 50; // Radius for the circle

    doc.fontSize(14)
        .font('Helvetica-Bold')
        .fill("#FFFFFF")
        .text("Company Name", 75, 50, { align: 'left' });

    const cardWidth = doc.page.width; // Example card width
    const cardCenterX = cardWidth / 2;



    const backgroundPath = employee?.card; // Replace with your image path
    doc.image(backgroundPath, 0, 0, {
        width: doc.page.width,  // Make the image fit the page width
        height: doc.page.height // Make the image fit the page height
    });
    // Save the current graphics state for the circle drawing
    doc.save();

    // Draw the circle
    doc.circle(x, y, radius) // Use x, y, and radius for the circle parameters
        .lineWidth(3) // Line width will also scale
        .fillAndStroke("#FFFFFF", "#FFFFFF"); // Fill and stroke the circle

    // Restore the original graphics state to reset scaling
    doc.restore();

    // Check if the image path is provided
    if (employee?.photoPath) {
        doc.save();

        doc.circle(x, y, radius); // Use the same x, y, radius for clipping
        doc.clip(); // Apply clipping

        // Draw the image inside the clipped circle
        doc.image(path.join(__dirname, '../public/upload/' + employee?.photoPath), x - radius, y - radius, {
            width: radius * 2,
            height: radius * 2,
        });


        // Restore the graphics state after clipping
        doc.restore();
    }
    // Add company logo
    if (employee?.logoPath) {
        // doc.rotate(0);
        // Place the image at an absolute position
        doc.image(employee?.logoPath, 100, 12, { width: 55 });
    }
    // Define maximum and minimum padding for the name

    // Dynamically calculate padding based on name length
    let namePadding;
    if (employee?.name.length > 20) {
        namePadding = 45; // Apply paddzng for medium-length names
    } else if (employee?.name.length > 17) {
        namePadding = -40; // Apply padding for medium-length names
    } else if (employee?.name.length > 8) {
        namePadding = -35; // Apply padding for longer names
    } else {
        namePadding = -10; // No padding for short names
    }

    // Calculate the width of the name text
    let textWidthName = doc.widthOfString(employee?.name, {
        font: path.join(__dirname, '../public/font/KantumruyPro-Bold.ttf'),
        size: 18,
    });

    // Calculate adjusted X position for the name
    let textXName = cardCenterX - textWidthName / 2 + namePadding;

    // Draw the centered name
    // doc.fontSize(18)
    //     .font(path.join(__dirname, '../public/font/KantumruyPro-Bold.ttf'))
    //     .fill("#002A5C")
    //     .text(employee?.name, textXName, 195); // Replace 210 with the desired Y coordinat


    // * === Posit

    const maxPadding = 52; // Maximum padding for longer text
    const minPadding = 0;  // No padding for short text

    // // Dynamically calculate padding based on text length
    // let textPadding;
    // if (employee?.position.length > 20) {
    //     textPadding = maxPadding; // Apply maximum padding for very long positions


    // Calculate adjusted X position
    // let textWidth = doc.widthOfString(employee?.position, {
    //     font: path.join(__dirname, '../public/font/KantumruyPro-SemiBold.ttf'),
    //     size: 10,
    // });


    // // Center the text
    // let textX = cardCenterX - textWidth / 2 + textPadding;

    // // Use textX for your text positioning
    // doc.fontSize(10)
    //     .font(path.join(__dirname, '../public/font/KantumruyPro-SemiBold.ttf'))
    //     .text(employee?.position, textX, 220); // Replace someYPosition with the desired Y coordinate

    // const fontPath = path.resolve(__dirname, '../public/font/KantumruyPro-SemiBold.ttf');
    // doc.fontSize(10)
    // const pageWidth = doc.page.width;
    // const boxWidth = 225;
    // const textWidth = doc.widthOfString(employee?.position || "");
    // const centerX = (boxWidth - textWidth) / 2 + (pageWidth - boxWidth) / 2;

    // doc.fontSize(10)
    //     .font(fontPath)
    //     .text(employee?.position || "", centerX, doc.y);


    const fontPath = path.resolve(__dirname, '../public/font/KantumruyPro-SemiBold.ttf');
    const pageWidth = doc.page.width; // Get full page width
    doc.fontSize(18)
        .font(path.join(__dirname, '../public/font/KantumruyPro-Bold.ttf'))
        .fill("#002A5C")
        .text(employee?.name || "", 0, 195, {
            width: pageWidth, // Use full page width
            align: 'center'   // Center text automatically
        });

    doc.fontSize(10)
        .font(fontPath)
        .text(employee?.position || "", 0, 218, {
            width: pageWidth, // Use full page width
            align: 'center'   // Center text automatically
        });





    doc.fontSize(10)
        .font(path.join(__dirname, '../public/font/KantumruyPro-Regular.ttf'))
        .fill(textColor)
        // .text(`Employee? ID: ${employee?.id}`, 80, 170)
        // .text(`Department: ${employee?.department}`, 80, 190)
        .text(`អត្តលេខ  `, 70, 250)
        .text(`: ${employee?.id}`, 125, 250)
        .text(`អ៊ីមែល`, 70, 266)
        // .text(`: ${employee?.email}`, 125, 266)
        .text(`លេខទូរស័ព្ទ`, 70, 282)
        .text(`: ${employee?.phone}`, 125, 282)

    doc.fontSize(9)
        .font(path.join(__dirname, '../public/font/KantumruyPro-Regular.ttf'))
        .fill(textColor)
        .text(`: ${employee?.email}`, 125, 266)



    doc.addPage(); // Add a new page for each card (except the first one)
    const backgroundBack = employee?.cardBack; // Replace with your image path
    doc.image(backgroundBack, 0, 0, {
        width: doc.page.width,  // Make the image fit the page width
        height: doc.page.height // Make the image fit the page height
    });



    //   Add QR code for employee? ID (if available)
    if (employee?.qrCodePath) {
        doc.image(employee?.qrCodePath, 22, doc.page.height - 75, { width: 55 });
    }
    doc.fontSize(9)
        .font(path.join(__dirname, '../public/font/KantumruyPro-SemiBold.ttf'))
        .fill("#002A5C")
        .text(`ហត្ថលេខា`, 110, 140);

    if (employee?.sign) {
        doc.image(employee?.sign, 110, 155, { width: 40 });
    }
    // roundedRect(x, y, width, height,radius)
    doc.roundedRect(95, 145, 13, 1, 2)
        .fill('#002A5C')
    doc.roundedRect(145, 145, 13, 1, 2)
        .fill('#002A5C')
    if (employee?.logoBack) {
        // doc.rotate(0);
        // Place the image at an absolute position
        doc.image(employee?.logoBack, 105, 5, { width: 50 });
    }
    doc.fontSize(7)
        .font(path.join(__dirname, '../public/font/KantumruyPro-Regular.ttf'))
        .fill('#002A5C')
        .text('1. ម៉ោងធ្វើការធ្វើការពីម៉ោង 8:00 ព្រឹក ដល់ 5:00 ល្ងាច', 55, 60)
        .text('2. សូមទំនាក់ទំនងជាមួយអ្នកគ្រប់គ្រងសម្រាប់ចម្ងល់ផ្សេងៗ', 55, 75)
        .text('3. សូមគោរពភាពឯកជននៃអ្នកដទៃ និងការពារព័ត៌មានផ្ទាល់ខ្លួន', 55, 90)
        .text('4. ប្រសិនបើមានបញ្ហា ឬសុវត្ថិភាព សូមរាយការណ៍ភ្លាមៗ', 55, 105)


    doc.fontSize(10)
        .font(path.join(__dirname, '../public/font/KantumruyPro-Regular.ttf'))
        .fill('#FFFFFF')
        // .text(`Employee? ID: ${employee?.id}`, 80, 170)
        // .text(`Department: ${employee?.department}`, 80, 190)
        .text(`ចាប់ពីថ្ងៃ  `, 110, 285)
        .text(`: ${employee?.startDate}`, 155, 285)
        .text(`ផុតកំណត់`, 110, 305)
        .text(`: ${employee?.endDate}`, 155, 305)

    doc.end();
}

module.exports = generateEmployeeIDCard;
