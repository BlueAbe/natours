const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
//PART: SOLUTION I - SIMPLE
/*
const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  // GMAIL TRANSPORTER
  //   const transporterGmail = nodemailer.createTransport({
  //     service: 'Gmail',
  //     auth: {
  //       user: process.env.EMAIL_USERNAME_GMAIL,
  //       pass: process.env.EMAIL_PASSWORD_GMAIL
  //     }
  //     //Active in gmail "less secure app"
  //   });

  // 2) Define the email options
  const mailOptions = {
    from: 'Andrzej Jaworski <andrzej@www.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html:
  };
  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
*/

//PART: SOLUTION II - COMPLEX
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `<${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // 1) SendGrid
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // 1) Render HTML base on a pug template
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.fromString(html),
      html
    };
    // 3) Create a transport and send eamil
    this.newTransport();
    await this.newTransport().sendMail(mailOptions);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family !');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (vaild for only 10 minutes)');
  }
};
