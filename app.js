const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const databasePath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const passwordLength = password.length
    if (passwordLength < 5) {
      response.send('Password is too short')
      response.status(400)
    } else {
      const createUserQuery = `
        INSERT INTO 
            user (username, name, password, gender, location) 
        VALUES 
            (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
            )`
      await db.run(createUserQuery)
      response.send('User created successfully')
    }
  } else {
    response.send('User already exists')
    response.status(400)
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.send('Invalid user')
    response.status(400)
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.send('Invalid password')
      response.status(400)
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.send('Invalid current password')
    response.status(400)
  } else {
    const isOldPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password,
    )
    if (isOldPasswordMatched === true) {
      const newPasswordLength = newPassword.length
      if (newPasswordLength < 5) {
        response.send('Password is too short')
        response.status(400)
      } else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        const updateNewPasswordQuery = `
            update user
            set password='${hashedNewPassword}'
            where username='${username}}';`
        await db.run(updateNewPasswordQuery)
        response.send('Password updated')
      }
    }
  }
})

module.exports = app


