/**
 * Multer Middleware
 */

const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        // Set unique file name
        const fileExtension = path.extname(file.originalname);
        const fileName = req.user.id + Date.now() + fileExtension;
        cb(null, fileName);
    }
});

const uploadSingleImage = multer({ storage }).single('photo');

module.exports = {
    uploadSingleImage
}