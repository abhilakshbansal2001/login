// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     service: process.env.EMAIL_SERVICE,
//     host: process.env.EMAIL_HOST,
//     port: 587,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: "bansalabhilaksh@yahoo.com",
//     subject: options.subject,
//     html: options.text,
//   };
// try{

//   transporter.sendMail(mailOptions , (err , info) => {
//     if(!err)
//     console.log(info)
//   })

// }catch(e){
//   throw e;
// }
//   // .then(console)
//   // .catch(err => {
//     // console.log("Hello toeknkzno")
//     // throw new Error(err)
//   // })
  
//   // , function (err, info) {
//   //   if (err) {
//   //     throw "Jell"
//   //   } else {
//   //     console.log(info);
//   //   }
//   // });
// };

// module.exports = sendEmail;


const nodemailer = require("nodemailer");

const sendEmail = (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.text,
  };

  return transporter.sendMail(mailOptions)
};

module.exports = sendEmail;
