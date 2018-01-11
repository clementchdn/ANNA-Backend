'use strict';

/**
 * @file
 * @see {@link module:cors}
 */

/**
 * @module cors
 */

const cors = require('cors'); // Cross Origin Resource Sharing

/**
 * Manages the Cross-Origin Request Security settings
 * @function exports
 */
module.exports = cors({
    origin (origin, cb) {
        cb(null, true);
    },
    credentials: true
});
