# HƯỚNG DẪN KIỂM THỬ MESSAGING API
## Testing Guide for Message Routing System

---

### 📋 PHẦN 1: TỔNG QUAN HỆ THỐNG

#### 1.1 Schema Message
```
{
  "_id": ObjectId,
  "from": ObjectId (Reference to User),
  "to": ObjectId (Reference to User),
  "messageContent": {
    "type": String (enum: "text" | "file"),
    "text": String (nội dung hoặc đường dẫn file)
  },
  "isDeleted": Boolean (default: false),
  "createdAt": Date,
  "updatedAt": Date
}
```

---

### 🚀 PHẦN 2: BA ROUTER CHÍNH

| Thứ tự | Method | Endpoint | Chức Năng | Auth |
|--------|--------|----------|----------|------|
| 1 | POST | /api/v1/messages/ | Gửi message mới | Bearer Token |
| 2 | GET | /api/v1/messages/ | Lấy message cuối cùng của mỗi conversation | Bearer Token |
| 3 | GET | /api/v1/messages/:userId | Lấy tất cả messages giữa 2 user (2 chiều) | Bearer Token |

---

### 🔧 PHẦN 3: HƯỚNG DẪN SETUP

**Bước 1:** Cài đặt dependencies
```bash
npm install
```

**Bước 2:** Khởi động server
```bash
npm start
```
Server chạy trên: `http://localhost:3000`

**Bước 3:** Cài đặt Postman (nếu chưa có)
- Download tại: https://www.postman.com/downloads/

**Bước 4:** Lấy JWT Token
- Gọi endpoint: `POST /api/v1/auth/login`
- Gửi: `{ "username": "...", "password": "..." }`
- Lấy token từ response

---

### 📝 PHẦN 4: CHI TIẾT CÁC ROUTER

#### ROUTER 1: POST /api/v1/messages/ - Gửi Message

**Mô Tả:**
- Gửi message mới đến một user khác
- Hỗ trợ 2 kiểu: text hoặc file reference

**Quy Tắc:**
- Nếu `type` = "text": `text` là nội dung message
  ```json
  {
    "to": "userId",
    "messageContent": {
      "type": "text",
      "text": "Xin chào, bạn khỏe không?"
    }
  }
  ```

- Nếu `type` = "file": `text` là đường dẫn file
  ```json
  {
    "to": "userId",
    "messageContent": {
      "type": "file",
      "text": "/uploads/report_2024.pdf"
    }
  }
  ```

**Trong Postman:**
| Thành Phần | Giá Trị |
|-----------|--------|
| Method | POST |
| URL | http://localhost:3000/api/v1/messages/ |
| Headers → Authorization | Bearer [YOUR_JWT_TOKEN] |
| Headers → Content-Type | application/json |
| Body | JSON như trên |
| Response Code | 201 (Success) |

**Response Thành Công (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "645abc123...",
    "from": {
      "_id": "user1_id",
      "username": "user1",
      "email": "user1@email.com",
      "fullName": "User One",
      "avatarUrl": "..."
    },
    "to": {
      "_id": "user2_id",
      "username": "user2",
      "email": "user2@email.com",
      "fullName": "User Two",
      "avatarUrl": "..."
    },
    "messageContent": {
      "type": "text",
      "text": "Xin chào, bạn khỏe không?"
    },
    "createdAt": "2024-04-02T11:30:00Z",
    "updatedAt": "2024-04-02T11:30:00Z"
  }
}
```

**Các Lỗi Có Thể Gặp:**
| Status | Lỗi | Nguyên Nhân | Giải Pháp |
|--------|-----|-----------|----------|
| 400 | "Recipient ID is required" | Thiếu field `to` | Thêm `to` vào body |
| 400 | "Message content with type and text is required" | Thiếu `messageContent` | Thêm đầy đủ structure |
| 400 | "Message type must be 'text' or 'file'" | Type khác "text"/"file" | Kiểm tra lại type |
| 400 | "Cannot send message to yourself" | to = currentUserId | Gửi cho user khác |
| 404 | "Recipient not found" | userId không tồn tại | Kiểm tra userId |
| 401 | "ban chua dang nhap" | Token không hợp lệ | Lấy token mới |

---

#### ROUTER 2: GET /api/v1/messages/ - Lấy Danh Sách Conversations

**Mô Tả:**
- Lấy message cuối cùng của mỗi conversation
- Danh sách tất cả user hiện tại đã chat với
- Sắp xếp theo newest first

**Trong Postman:**
| Thành Phần | Giá Trị |
|-----------|--------|
| Method | GET |
| URL | http://localhost:3000/api/v1/messages/ |
| Headers → Authorization | Bearer [YOUR_JWT_TOKEN] |
| Response Code | 200 (Success) |

**Response Thành Công (200):**
```json
{
  "success": true,
  "data": [
    {
      "otherUser": {
        "_id": "user2_id",
        "username": "user2",
        "email": "user2@email.com",
        "fullName": "User Two",
        "avatarUrl": "..."
      },
      "lastMessage": {
        "_id": "msg_id_123",
        "from": {
          "_id": "user1_id",
          "username": "user1",
          ...
        },
        "to": {
          "_id": "user2_id",
          "username": "user2",
          ...
        },
        "messageContent": {
          "type": "text",
          "text": "Mình sẽ liên hệ bạn sau"
        },
        "createdAt": "2024-04-02T14:25:00Z"
      }
    },
    {
      "otherUser": {
        "_id": "user3_id",
        "username": "user3",
        ...
      },
      "lastMessage": {
        ...
      }
    }
  ],
  "count": 2
}
```

---

#### ROUTER 3: GET /api/v1/messages/:userId - Lấy Tất Cả Messages

**Mô Tả:**
- Lấy toàn bộ messages giữa user hiện tại và :userId
- Messages 2 chiều: (from: current AND to: target) OR (from: target AND to: current)
- Sắp xếp từ cũ → mới (ASC)

**Trong Postman:**
| Thành Phần | Giá Trị |
|-----------|--------|
| Method | GET |
| URL | http://localhost:3000/api/v1/messages/[TARGET_USER_ID] |
| Headers → Authorization | Bearer [YOUR_JWT_TOKEN] |
| Response Code | 200 (Success) / 404 (User Not Found) |

**Response Thành Công (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "msg_1",
      "from": {
        "_id": "user1_id",
        "username": "user1",
        "email": "user1@email.com",
        "fullName": "User One",
        "avatarUrl": "..."
      },
      "to": {
        "_id": "user2_id",
        "username": "user2",
        "email": "user2@email.com",
        "fullName": "User Two",
        "avatarUrl": "..."
      },
      "messageContent": {
        "type": "text",
        "text": "Chào bạn"
      },
      "createdAt": "2024-04-02T10:00:00Z"
    },
    {
      "_id": "msg_2",
      "from": {
        "_id": "user2_id",
        ...
      },
      "to": {
        "_id": "user1_id",
        ...
      },
      "messageContent": {
        "type": "text",
        "text": "Chào bạn, bạn khỏe không?"
      },
      "createdAt": "2024-04-02T10:15:00Z"
    }
  ],
  "count": 2
}
```

---

### ✅ PHẦN 5: BƯỚC TEST CHI TIẾT

#### BƯỚC 1: Tạo Message 1 (Text)
1. Mở Postman → **New** → **Request**
2. **Method:** POST
3. **URL:** `http://localhost:3000/api/v1/messages/`
4. **Tab Headers:** Thêm 2 header
   ```
   Authorization: Bearer [TOKEN_USER_1]
   Content-Type: application/json
   ```
5. **Tab Body** → **raw** → **JSON:**
   ```json
   {
     "to": "[USER_ID_2]",
     "messageContent": {
       "type": "text",
       "text": "Xin chào! Đây là tin nhắn text"
     }
   }
   ```
6. **Click Send** → Response: **201 Created**
7. **Screenshot:** Lưu ảnh

#### BƯỚC 2: Tạo Message 2 (File)
1. Tương tự bước 1
2. **Body:**
   ```json
   {
     "to": "[USER_ID_2]",
     "messageContent": {
       "type": "file",
       "text": "/uploads/document.pdf"
     }
   }
   ```
3. **Click Send** → Response: **201 Created**
4. **Screenshot:** Lưu ảnh

#### BƯỚC 3: Lấy Tất Cả Messages
1. Mở Postman → **New** → **Request**
2. **Method:** GET
3. **URL:** `http://localhost:3000/api/v1/messages/[USER_ID_2]`
4. **Tab Headers:**
   ```
   Authorization: Bearer [TOKEN_USER_1]
   ```
5. **Click Send** → Response: **200 OK**
6. **Kiểm tra:** Phải thấy 2 messages (text + file)
7. **Screenshot:** Lưu ảnh

#### BƯỚC 4: Lấy Danh Sách Conversations
1. Mở Postman → **New** → **Request**
2. **Method:** GET
3. **URL:** `http://localhost:3000/api/v1/messages/`
4. **Tab Headers:**
   ```
   Authorization: Bearer [TOKEN_USER_1]
   ```
5. **Click Send** → Response: **200 OK**
6. **Kiểm tra:** Phải thấy otherUser (USER_ID_2) với lastMessage là file message
7. **Screenshot:** Lưu ảnh

#### BƯỚC 5: Test Error Cases
**Case 1: Gửi lại từ User 2 cho User 1**
1. Dùng token của User 2
2. POST `/api/v1/messages/` với body:
   ```json
   {
     "to": "[USER_ID_1]",
     "messageContent": {
       "type": "text",
       "text": "Cảm ơn bạn!"
     }
   }
   ```
3. **Response:** 201 Created
4. **Screenshot:** Lưu ảnh

**Case 2: Lấy messages từ User 2 perspective**
1. Dùng token User 2
2. GET `/api/v1/messages/[USER_ID_1]`
3. **Kiểm tra:** Phải thấy 3 messages (2 từ User 1 + 1 từ User 2)
4. **Screenshot:** Lưu ảnh

**Case 3: Test Invalid Type**
1. POST `/api/v1/messages/` với body:
   ```json
   {
     "to": "[USER_ID_2]",
     "messageContent": {
       "type": "invalid",
       "text": "test"
     }
   }
   ```
2. **Response:** 400 Bad Request (Message type must be 'text' or 'file')
3. **Screenshot:** Lưu ảnh

---

### ✨ PHẦN 6: TIÊU CHÍ KIỂM THỬ THÀNH CÔNG

- ✅ POST /api/v1/messages/ tạo message text thành công (HTTP 201)
- ✅ POST /api/v1/messages/ tạo message file thành công (HTTP 201)
- ✅ POST /api/v1/messages/ reject invalid type (HTTP 400)
- ✅ POST /api/v1/messages/ reject non-existent user (HTTP 404)
- ✅ POST /api/v1/messages/ reject self-messaging (HTTP 400)
- ✅ GET /api/v1/messages/ trả về danh sách conversations (HTTP 200)
- ✅ GET /api/v1/messages/:userId trả về messages 2 chiều (HTTP 200)
- ✅ GET /api/v1/messages/:userId sắp xếp đúng thứ tự (createdAt ASC)
- ✅ User info populate đầy đủ (username, email, fullName, avatarUrl)
- ✅ Messages chỉ lấy isDeleted: false

---

### 📁 PHẦN 7: CẤU TRÚC FILE ĐÃ TẠO

```
d:\son\NNPTUDM_0204\
├── schemas/
│   └── messages.js          ← MỚI: Message model
├── routes/
│   └── messages.js          ← MỚI: 3 routers chính
├── app.js                   ← SỬA: Thêm route messages
```

---

### 🔗 PHẦN 8: GIT COMMIT

**Commit Message:**
```
Add message schema and messaging routers with 3 endpoints
```

**Các file thay đổi:**
- `schemas/messages.js` (NEW)
- `routes/messages.js` (NEW)
- `app.js` (MODIFIED)

**Xem chi tiết:**
```bash
git log --oneline -3
git show HEAD
```

---

### 🐛 PHẦN 9: KHẮC PHỤC SỰ CỐ

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|----------|
| "ban chua dang nhap" (401) | Token hết hạn | Lấy token mới từ login |
| "User not found" (404) | UserID không tồn tại | Kiểm tra userId trong DB |
| "Message type must be 'text' or 'file'" (400) | Type sai | Kiểm tra body JSON |
| "Cannot send message to yourself" (400) | to = current user | Gửi cho user khác |
| POSTMAN không kết nối | Server không chạy | Chạy `npm start` |
| 500 Internal Server Error | MongoDB disconnect | Kiểm tra kết nối MongoDB |

---

### 📞 HỖ TRỢ THÊM

- Postman Documentation: https://learning.postman.com/
- Express.js Guide: https://expressjs.com/
- MongoDB Documentation: https://docs.mongodb.com/

---

**Document Generated:** April 2, 2026
**Author:** Development Team
**Version:** 1.0

