require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const UssdMenu = require('ussd-menu-builder')
const mongoString = process.env.DATABASE_URL
mongoose.connect(mongoString)
const database = mongoose.connection
database.on('error', (error) => {
  console.log(error)
})
database.once('connected', () => {
  console.log('Database connected...')
})
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

let menu = new UssdMenu()
menu.startState({
  run: () => {
    // use menu.con() to send response without terminating session
    menu.con(
      'Welcome! Ready to register for the Zizi Conference:' +
        '\n1. Get started' +
        '\n2. Get out!'
    )
  },
  // next object links to next state based on user input
  next: {
    1: 'register',
    2: 'quit',
  },
})
menu.state('register', {
  run: () => {
    menu.con('Before we go ahead, whats your name?')
  },
  next: {
    '*[a-zA-Z]+': 'register.tickets',
  },
})
menu.state('register.tickets', {
  run: () => {
    let name = menu.val
    dataToSave.name = name
    console.log(dataToSave)
    menu.con('How many tickets would you like to reserve?')
  },
  next: {
    // using regex to match user input to next state
    '*\\d+': 'end',
  },
})
menu.state('end', {
  run: async () => {
    let tickets = menu.val
    dataToSave.tickets = tickets
    console.log(dataToSave)
    // Save the data
    const data = new Model({
      name: dataToSave.name,
      tickets: dataToSave.tickets,
    })
    const dataSaved = await data.save()
    menu.end(
      'Awesome! We have your tickets reserved. Sending a confirmation text shortly.'
    )
  },
})
menu.state('quit', {
  run: () => {
    menu.end('Goodbye :)')
  },
})
// Registering USSD handler with Express
app.get('/ussd', (req, res) => {
  menu.run(req.body, (ussdResult) => {
    res.send(ussdResult)
  })
})

app.listen(3000, () => {
  console.log("What's popping? We're connected")
})
