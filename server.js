const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config();
const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true, useUnifiedTopology: true }).then(res => console.log("Sucessfuly connected to database"),rej => console.error("No connection"));

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

app.post('/api/exercise/new-user', (req, res) => {
  var NewUser = new User({username:req.body.username});
  NewUser.save((err, data) => {
    if (err) {
      console.error(err);
      next(err);
    }
    console.log("user added");
  })
  res.json({username: NewUser.username,id:NewUser._id});
});

app.get('/api/exercise/users',(req,res) => {
  User.find({},{username:1,_id:1},(err,users) => {
    if(err) {
      console.error(err);
      next(err);
    }    
    res.json(users);
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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
