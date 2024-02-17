const express = require('express');
var cors = require('cors')


const app = express();
const PORT = 3001;


app.use(cors());


app.get('/firstQuestion', (req, res)=>{
    const temperatureData = {
        temperature: 74
      };
   
      // Send the JSON object as the response
      res.json(temperatureData);
});

app.get('/followUp', (req, res)=>{
  const temperatureData = {
      temperature: 74
    };
 
    // Send the JSON object as the response
    res.json(temperatureData);
});


app.listen(PORT, (error) =>{
  if(!error)
    console.log("Server is Successfully Running, and App is listening on port "+ PORT)
  else
    console.log("Error occurred, server can't start", error);
  }
);
