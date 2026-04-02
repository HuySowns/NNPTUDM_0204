/**
 * Tạo password ngẫu nhiên 16 ký tự
 * Đảm bảo có: 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
 */

function generateRandomPassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '@#$%^&*!';
  
  let password = '';
  
  // Đảm bảo có ít nhất 1 từ mỗi loại
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Lấy các ký tự còn lại từ tất cả các loại
  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Xáo trộn password
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  return password;
}

module.exports = {
  generateRandomPassword
};
