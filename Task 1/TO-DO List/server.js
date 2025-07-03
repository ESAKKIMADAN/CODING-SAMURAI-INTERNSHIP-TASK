const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

mongoose.connect('mongodb://localhost:27017/todoApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Task = mongoose.model('Task', {
  text: String,
  completed: Boolean
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', async (req, res) => {
  const tasks = await Task.find();
  res.render('index', { tasks });
});

app.post('/add', async (req, res) => {
  const task = new Task({ text: req.body.task, completed: false });
  await task.save();
  res.redirect('/');
});

app.post('/toggle/:id', async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.completed = !task.completed;
  await task.save();
  res.redirect('/');
});

app.post('/edit/:id', async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, { text: req.body.updatedTask });
  res.redirect('/');
});

app.post('/delete/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));