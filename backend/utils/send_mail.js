const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: `"Choose The Movie" <support@choosethemovie.com>`,
      replyTo: "support@choosethemovie.com",
      to: email,
      subject: "Account verification",
      text: `Your verification code: ${code}`,
      html: `<p>Your verification code: <strong>${code}</strong></p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email wysłany do ${email}: ${info.response}`);
  } catch (error) {
    console.error("Błąd wysyłania e-maila:", error);
  }
};

module.exports = sendVerificationEmail;
