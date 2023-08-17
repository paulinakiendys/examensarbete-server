const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const path = require('path');

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve photos
app.use('/photos', express.static(path.join(__dirname, 'public/images')));

app.use(require('./routes'));

module.exports = app;
