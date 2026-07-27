const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: { user: 'support@bitumix.lk', pass: 'L(728769163037at' },
  tls: { ciphers: 'SSLv3' }
});
transporter.sendMail({
  from: '"Megakem Feedback" <support@bitumix.lk>',
  to: 'lahin@megakemglobal.com',
  subject: 'Test email from Local Script',
  text: 'This is a test.'
}).then(info => console.log('Success:', info.messageId)).catch(err => console.error('Error:', err));
