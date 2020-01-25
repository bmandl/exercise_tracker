const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config();
const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(res => console.log("Sucessfuly connected to database"), rej => console.error("No connection"));

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Adding new user
var UserSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

var User = mongoose.model("User", UserSchema); //User model

var ExerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.SchemaTypes.ObjectId, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
})

var Exercise = mongoose.model("Exercise", ExerciseSchema); //Exercise model

app.post('/api/exercise/new-user', (req, res, next) => {
  var NewUser = new User({ username: req.body.username });
  NewUser.save((err, data) => {
    if (err) {
      console.error(err);
      next(err);
    }
    console.log("user added");
  })
  res.json({ username: NewUser.username, id: NewUser._id });
});

app.post('/api/exercise/add', (req, res, next) => {

  var entry = new Object();

  var exercise = new Exercise({
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date) : new Date()
  });

  exercise.save((err, data) => {
    if (err) {
      console.error(err);
      next(err);
    }
    User.findOne({ _id: exercise.userId }, { username: 1 }, (err, user) => {
      entry.username = user.toObject().username;
      entry.description = exercise.toObject().description;
      entry.duration = exercise.toObject().duration;
      entry.date = exercise.toObject().date.toDateString();
      entry._id = user.toObject()._id;
      res.json(entry);
    })
  })
})

app.get('/api/exercise/users', (req, res, next) => {
  User.find({}, { username: 1, _id: 1 }, (err, users) => {
    if (err) {
      console.error(err);
      next(err);
    }
    res.json(users);
  })
})

app.get('/api/exercise/log', (req, res, next) => {
  var query = req.query;
  var log = new Object();

  User.findById(query.userId, { _id: 1, username: 1 }, (err, user) => {
    if (err) {
      console.error(err);
      next(err);
    }
    log._id = user.toObject()._id;
    log.username = user.toObject().username;

    Exercise.find({ userId: query.userId, $and: [{ date: { $gte: query.from ? query.from : 0 } }, { date: { $lte: query.to ? query.to : Date.now() } }] }, { description: 1, duration: 1, date: 1, _id: 0 })
      .limit(query.limit ? parseInt(query.limit) : 0).exec((err, exercise) => {
        if (err) {
          console.error(err);
          next(err);
        }
        log.count = exercise.length;
        log.log = exercise.map(el => {
          return {
            description: el.description,
            duration: el.duration,
            date: el.date.toDateString()
          }
        })
        res.json({ ...log });
      })
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
