const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  inviteCode: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Group', groupSchema);
