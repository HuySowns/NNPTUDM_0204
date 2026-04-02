const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "ba453e1203a7b7",
        pass: "61bcbc13e90048",
    },
});
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "reset password URL",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href="+url+">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordEmail: async function (to, username, password) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "Tài khoản mới - Thông tin đăng nhập",
            text: `Tài khoản của bạn đã được tạo.\nUsername: ${username}\nPassword: ${password}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">✓ Tài khoản mới được tạo</h2>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>Username:</strong> ${username}</p>
                        <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background: #e0e0e0; padding: 5px 10px; border-radius: 3px;">${password}</code></p>
                    </div>
                    <p style="color: #666; margin-top: 20px;">
                        Vui lòng lưu thông tin này an toàn. Bạn có thể đổi password sau khi đăng nhập.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.
                    </p>
                </div>
            `
        });

        console.log("Password email sent:", info.messageId);
        return info;
    }
}
