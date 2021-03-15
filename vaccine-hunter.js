const cron = require('node-cron')
const dotenv = require('dotenv')
const express = require('express')
const nodemailer = require('nodemailer')
const notifier = require('node-notifier');
const util = require('util')

const exec = util.promisify(require('child_process').exec)

// Setup important stuff
const app = express()
dotenv.config()

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const textSender = process.env.TEXT_SENDER;
const textRecipient = process.env.TEXT_RECIPIENT;
const client = require('twilio')(accountSid, authToken);

function selectCity(item) {
  switch (item.city) {
    case "SANTA BARBARA":
      return true
      break;
    case "GOLETA":
      return true
      break;
    case "VENTURA":
      return true
      break;
    case "VENTURA":
      return true
      break;
    case "OXNARD":
      return true
      break;
    case "ALHAMBRA":
      return true
      break;
    default:
      return false
  }
}

const hunt = async (state) => {
  if (!state) {
    console.error('State is required')
    return
  }

  try {
    const { stdout, stderr } = await exec('sh scripts/ca-hunt.sh')

    if (stdout) {
      const data = JSON.parse(stdout).responsePayloadData.data['CA']

      return data
        .filter(selectCity)
    }
  } catch (err) {
    console.error(err)
  }
}

function huntCA (send) {
  console.log('---------------------')
  console.log('Hunting CA for Vaccines')
  // Check California
  hunt('CA').then((res) => {
    statusSet = new Set(res.map((p) => p.status))
    if (statusSet.size > 1 || send) {
      console.log('CA Vaccine opening found. Sending email.')
      let text = res
        .map((p) => `City: ${p.city}, Vaccine Availability: ${p.status} \n`)
        .toString()
      // Object
      notifier.notify({
        title: 'Vaccine Found!',
        message: 'CVS Vaccine Status\n' + text
      });
      client.messages
        .create({
           body: 'CVS Vaccine Status\n' + text,
           from: textSender,
           to: textRecipient
         })
        .then(message => console.log(message.sid));
    } else {
      console.log('All cities Fully Booked')
    }
    console.log(res)
  })
}

// Hunt on Launch
huntCA(true)
// Hunt on Schedule
cron.schedule('*/15  * * * *', function () {
  huntCA(false)
})

app.listen(process.env.PORT)
console.log(`Vaccine hunter has started on port ${process.env.PORT}`)
