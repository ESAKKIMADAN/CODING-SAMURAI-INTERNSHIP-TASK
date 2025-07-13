
const Message = require('../models/Message');
const Group = require('../models/Group');
module.exports = (app, io) => {
  app.get('/group/:room', async (req, res) => {
    if (!req.session.username) return res.redirect('/login');
    const groups = await Group.find().distinct('name');
    res.render('chat', { username: req.session.username, room: req.params.room, groups });
  });
  io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
      socket.join(room);
      Message.find({ room }).then(messages => {
        socket.emit('loadMessages', messages);
      });
    });
    socket.on('chatMessage', async ({ username, message, room }) => {
      const msg = await Message.create({ room, user: username, text: message });
      io.to(room).emit('message', msg);
    });
  });
};
