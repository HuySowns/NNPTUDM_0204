/**
 * TEST SCRIPT: Import User & Gửi Email
 * 
 * Chạy: node test_import_user.js
 */

const { generateRandomPassword } = require('./utils/passwordGenerator');
const { sendPasswordEmail } = require('./utils/mailHandler');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userModel = require('./schemas/users');
const roleModel = require('./schemas/roles');

// MongoDB Connection
const MONGO_URL = 'mongodb+srv://huyss138_db_user:NyjqFpkWtoQ1o7x6@cluster0.zxg2ogp.mongodb.net/?appName=Cluster0';

const testImportUser = async () => {
    try {
        console.log('📌 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Kết nối MongoDB thành công\n');

        // ====== TEST DATA ======
        const username = 'testuser_' + Date.now();
        const email = 'user01@haha.com';
        const randomPassword = generateRandomPassword(16);
        const hashedPassword = bcrypt.hashSync(randomPassword, 10);

        console.log('📋 DỮ LIỆU TEST:');
        console.log(`  • Username: ${username}`);
        console.log(`  • Email: ${email}`);
        console.log(`  • Password (random): ${randomPassword}`);
        console.log(`  • Password (hashed): ${hashedPassword.substring(0, 30)}...\n`);

        // ====== KIỂM TRA USERNAME TRÙNG ======
        console.log('🔍 Kiểm tra username trùng...');
        let existingUser = await userModel.findOne({ username, isDeleted: false });
        if (existingUser) {
            console.log('❌ Lỗi: Username đã tồn tại');
            process.exit(1);
        }
        console.log('✅ Username có sẵn\n');

        // ====== KIỂM TRA EMAIL TRÙNG ======
        console.log('🔍 Kiểm tra email trùng...');
        let existingEmail = await userModel.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (existingEmail) {
            console.log('❌ Lỗi: Email đã tồn tại');
            process.exit(1);
        }
        console.log('✅ Email có sẵn\n');

        // ====== LẤY ROLE USER ======
        console.log('🔍 Lấy role USER...');
        let userRole = await roleModel.findOne({ name: 'USER' }).select('_id');
        if (!userRole) {
            console.log('❌ Lỗi: Không tìm thấy role USER');
            process.exit(1);
        }
        console.log(`✅ Role USER: ${userRole._id}\n`);

        // ====== TẠO USER ======
        console.log('👤 Tạo user mới...');
        const newUser = new userModel({
            username: username,
            password: hashedPassword,
            email: email.toLowerCase(),
            role: userRole._id,
            status: true,
            fullName: '',
            avatarUrl: 'https://i.sstatic.net/l60Hf.png',
            loginCount: 0
        });
        await newUser.save();
        console.log(`✅ User tạo thành công: ${newUser._id}\n`);

        // ====== GỬI EMAIL ======
        console.log('📧 Gửi email password...');
        const emailResult = await sendPasswordEmail(email, username, randomPassword);
        console.log(`✅ Email được gửi\n`);
        console.log(`📨 Message ID: ${emailResult.messageId}\n`);

        // ====== HIỂN THỊ KẾT QUẢ ======
        console.log('=====================================');
        console.log('✨ TEST THÀNH CÔNG ✨');
        console.log('=====================================\n');
        console.log('📌 THÔNG TIN USER:');
        console.log(`  • ID: ${newUser._id}`);
        console.log(`  • Username: ${username}`);
        console.log(`  • Email: ${email}`);
        console.log(`  • Password (chỉ hiển thị lần này): ${randomPassword}`);
        console.log(`  • Role: USER`);
        console.log(`  • Status: ACTIVE\n`);
        
        console.log('📧 EMAIL ĐÃ GỬI:');
        console.log(`  • Đến: ${email}`);
        console.log(`  • Chủ đề: Tài khoản mới - Thông tin đăng nhập`);
        console.log(`  • Message ID: ${emailResult.messageId}\n`);
        
        console.log('🔗 KIỂM TRA MAILTRAP:');
        console.log(`  1. Vào https://mailtrap.io`);
        console.log(`  2. Kiểm tra inbox`);
        console.log(`  3. Tìm email từ: hehehe@gmail.com`);
        console.log(`  4. Xem password: ${randomPassword}\n`);

        await mongoose.connection.close();
        console.log('✅ Đóng kết nối MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ LỖI:', error.message);
        console.error(error);
        process.exit(1);
    }
};

// Chạy test
testImportUser();
