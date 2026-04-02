/**
 * CLEANUP: Xóa user test trước đó
 */

const mongoose = require('mongoose');
const userModel = require('./schemas/users');

const MONGO_URL = 'mongodb+srv://huyss138_db_user:NyjqFpkWtoQ1o7x6@cluster0.zxg2ogp.mongodb.net/?appName=Cluster0';

const cleanup = async () => {
    try {
        console.log('📌 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Kết nối thành công\n');

        console.log('🗑️  Xóa user với email user01@haha.com...');
        const result = await userModel.deleteOne({ email: 'user01@haha.com' });
        
        if (result.deletedCount > 0) {
            console.log(`✅ Đã xóa ${result.deletedCount} user\n`);
        } else {
            console.log('ℹ️  Không tìm thấy user nào\n');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ LỖI:', error.message);
        process.exit(1);
    }
};

cleanup();
