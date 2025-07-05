const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const sendResetEmail = require('../utils/emailService');


const register = async(req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email นี้ถูกใช้งานแล้ว' });
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role', [name, email, hashedPassword]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const login = async(req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'ไม่พบผู้ใช้งานนี้' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign({ id: user.id, role: user.role },
            process.env.JWT_SECRET, { expiresIn: '2h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(200).json({
        message: 'ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้',
      });
    }

    const userId = userResult.rows[0].id;
    const token = uuidv4();
    const expiresAt = dayjs().add(15, 'minute').toDate();

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

const resetLink = `http://10.0.2.2:3000/auth/reset-redirect?token=${token}`;
    await sendResetEmail(email, resetLink);

    return res.status(200).json({
      message: 'ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอก token และรหัสผ่านใหม่' });
  }

  try {
    const tokenResult = await pool.query(
      `SELECT user_id, expires_at FROM password_resets WHERE token = $1`,
      [token]
    );

    if (tokenResult.rowCount === 0) {
      return res.status(400).json({ message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ' });
    }

    const { user_id, expires_at } = tokenResult.rows[0];

    if (new Date() > expires_at) {
      return res.status(400).json({ message: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hashedPassword, user_id]
    );

    await pool.query(
      `DELETE FROM password_resets WHERE token = $1`,
      [token]
    );

    return res.status(200).json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
const handleResetRedirect = (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Missing token');
  }

  const appLink = `freshfarm://reset/password?token=${encodeURIComponent(token)}`;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>กำลังเปิดแอป...</title>
        <meta charset="utf-8" />
        <meta http-equiv="refresh" content="0; url=${appLink}" />
        <style>
          body {
            font-family: sans-serif;
            text-align: center;
            padding: 100px;
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h2>กำลังเปิดแอป FreshFarm...</h2>
        <p>หากไม่เด้งอัตโนมัติ <a href="${appLink}">แตะที่นี่</a></p>
      </body>
    </html>
  `);
};

module.exports = { register, login, forgotPassword, resetPassword,handleResetRedirect };
