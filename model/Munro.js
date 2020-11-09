const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String
    }, 
    height: {
        type: Number
    }, 
    gridref_letters: {
        type: String
    },
    gridref_eastings: {
        type: String
    }, 
    gridref_northings: {
        type: String
    },
    latlng_lat: {
        type: Number
    },
    latlng_lng: {
        type: Number
    },
    smcid: {
        type: String
    },
    metoffice_loc_id: {
        type: String
    },
    region: {
        type: String
    },
    meaning: {
        type: String
    }

});

module.exports = mongoose.model('Munro', userSchema);