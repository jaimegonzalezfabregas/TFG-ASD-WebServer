const express = require('express')
const app = express()

app.get('/', (req, res) => {
    res.send("A response")
})

app.listen(5000)