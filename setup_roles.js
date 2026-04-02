/**
 * SETUP: Tạo Role USER nếu chưa có
 */

const mongoose = require('mongoose');
const roleModel = require('./schemas/roles');

const MONGO_URL = 'mongodb+srv://huyss138_db_user:NyjqFpkWtoQ1o7x6@cluster0.zxg2ogp.mongodb.net/?appName=Cluster0';

const setupRoles = async () => {
    try {
        console.log('📌 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Kết nối thành công\n');

        // Kiểm tra roles hiện tại
        console.log('🔍 Kiểm tra roles hiện tại:');
        const allRoles = await roleModel.find();
        console.log(`  • Tổng roles: ${allRoles.length}`);
        allRoles.forEach((role, i) => {
            console.log(`    ${i + 1}. ${role.name} (${role._id})`);
        });
        console.log();

        // Kiểm tra role USER
        let userRole = await roleModel.findOne({ name: 'USER' });
        
        if (userRole) {
            console.log('✅ Role USER đã tồn tại');
            console.log(`  ID: ${userRole._id}`);
        } else {
            console.log('⚠️  Role USER chưa tồn tại, đang tạo...');
            userRole = new roleModel({
                name: 'USER',
                description: 'User default role',
                isDeleted: false
            });
            await userRole.save();
            console.log(`✅ Đã tạo role USER: ${userRole._id}\n`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ LỖI:', error.message);
        process.exit(1);
    }
};

setupRoles();
