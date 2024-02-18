const express = require('express');
var cors = require('cors')
require('dotenv').config({path: './env'});
const { OpenAI } = require('openai');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

const accountSid = process.env.ACCOUNTSID_KEY;
const authToken = process.env.AUTHTOKEN_KEY;

const client = require('twilio')(accountSid, authToken);

app.post('/firstQuestion', async (req, res) => {
  //get openai first question
  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      {
        role: "system",
        content:
          'You are an AI nurse. You will be communicating with a patient who has just triggered our computer vision monitoring software. Something has happened to the patient that triggered you, the nurse, to get deployed. Your job is to ask a question to the patient to assess the situation and help the patient as the paramedics arrive. You will be given the patient data and trigger details and only return the question to ask the patient. The question should look something like this: Hi, Im an AI nurse. Are you experiencing any pain or discomfort?',
      },
      {
        role: "user",
        content: JSON.stringify(req.body),
      },
    ],
    temperature: 1,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const obj = response.choices[0].message.content;
  console.log(obj);
  //get audio
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "shimmer",
    input: obj,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());

  const questionData = {
    question: obj,
    buffer: buffer
  };
  res.json(questionData);
});

app.post('/followUp', async (req, res) => {
  //get openai follow up
  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      {
        role: "system",
        content:
          'You are an AI nurse. You will be communicating with a patient who has just triggered our computer vision monitoring software. Something has happened to the patient that triggered you, the nurse, to get deployed.Your job is to ask questions to the patient  to assess the situation and help the patient with anything they are experiencing as the paramedics arrive. Use the patient data given to form your questions to help them. You will be given trigger details on what triggered you, your previous question in the conversation,  and also the previous response to the previous question. Return only what you want to say next in the conversation with the patient.   The questions should look something like this: I understand that youve fell and cant move your legs. Have you taken xyz medication today. or I understand that you have pain in your heart. Is this pain similar to the pain you had in Marchs apointment with Dr.Raj?',
      },
      {
        role: "user",
        content: JSON.stringify(req.body),
      },
    ],
    temperature: 1,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const obj = response.choices[0].message.content;
  console.log(obj);
  //get audio file
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "shimmer",
    input: obj,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  const questionData = {
    question: obj,
    buffer: buffer
  };
  res.json(questionData);
});

app.post('/send-message', (req, res) => {
  const { message} = req.body; // Extract message and recipient from request body

  client.messages
    .create({
      body: message, // Use the message from the request
      from: '+18447020832', // Your Twilio number
      to: '+19734208233' // The recipient's number from the request
    })
    .then(message => {
      console.log(message.sid);
      res.status(200).send({ message: 'Message sent successfully.', sid: message.sid });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send({ message: 'Failed to send the message.', error: error });
    });
});

// Listen to Arduino serial port
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 }); // Use a different port for WS

// Broadcast to all clients
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const { SerialPort } = require('serialport')
const port = new SerialPort({
  path: '/COM4',
  baudRate: 9600,
  autoOpen: false,
})

port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message)
  }

  // Because there's no callback to write, write errors will be emitted on the port:
  port.write('main screen turn on')
})

// The open event is always emitted
port.on('open', function() {
  // open logic
});

// Read data that is available but keep the stream in "paused mode"
port.on('readable', function () {
  const data = port.read().toString();
  wss.broadcast(data);
})

// Switches the port into "flowing mode"
port.on('data', function (data) {
  const readableData = data.toString();
  // Broadcast data to all connected WebSocket clients
  wss.broadcast(readableData);
})

// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message)
})

app.listen(PORT, (error) => {
  if (!error)
    console.log("Server is Successfully Running, and App is listening on port " + PORT)
  else
    console.log("Error occurred, server can't start", error);
  });