require('dotenv').config(); 

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     
    pass: process.env.EMAIL_PASS     
  }
});

async function sendResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: `"Freshfarm Support" <${process.env.EMAIL_USER}>`,  
    to: toEmail,
    subject: 'ลิงก์รีเซ็ตรหัสผ่าน',
    html: `
      <p>คุณได้ร้องขอรีเซ็ตรหัสผ่าน</p>
      <p>คลิกที่ลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>ลิงก์นี้จะหมดอายุใน 15 นาที</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendResetEmail;
