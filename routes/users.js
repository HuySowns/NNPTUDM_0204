var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
let userController = require("../controllers/users");
const { checkLogin,checkRole } = require("../utils/authHandler");
let bcrypt = require('bcrypt');
let { sendPasswordEmail } = require("../utils/mailHandler");
let { generateRandomPassword } = require("../utils/passwordGenerator");
let roleModel = require("../schemas/roles");


router.get("/", checkLogin,checkRole("ADMIN","MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email,
      req.body.role, req.body.fullname, req.body.avatarUrl
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

/**
 * POST /import
 * Import người dùng mới với password được tạo ngẫu nhiên
 * Body: { username, email, roleId (optional - default là role "user") }
 */
router.post("/import", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let { username, email, roleId } = req.body;

    // Validate input
    if (!username || !email) {
      return res.status(400).send({ 
        message: "username và email là bắt buộc" 
      });
    }

    // Kiểm tra username đã tồn tại
    let existingUser = await userModel.findOne({ username: username, isDeleted: false });
    if (existingUser) {
      return res.status(400).send({ 
        message: "username đã tồn tại" 
      });
    }

    // Kiểm tra email đã tồn tại
    let existingEmail = await userModel.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existingEmail) {
      return res.status(400).send({ 
        message: "email đã tồn tại" 
      });
    }

    // Lấy role "user" nếu không được chỉ định
    let role = roleId;
    if (!roleId) {
      let userRole = await roleModel.findOne({ name: "USER" }).select('_id');
      if (!userRole) {
        return res.status(400).send({ 
          message: "Không tìm thấy role mặc định (USER)" 
        });
      }
      role = userRole._id;
    }

    // Tạo password ngẫu nhiên 16 ký tự
    let randomPassword = generateRandomPassword(16);
    
    // Hash password
    let hashedPassword = bcrypt.hashSync(randomPassword, 10);

    // Tạo user mới
    let newUser = new userModel({
      username: username,
      password: hashedPassword,
      email: email.toLowerCase(),
      role: role,
      status: true,
      fullName: "",
      avatarUrl: "https://i.sstatic.net/l60Hf.png",
      loginCount: 0
    });

    await newUser.save();

    // Gửi email chứa password
    await sendPasswordEmail(email, username, randomPassword);

    // Trả về user (không trả password)
    let newUserPopulated = await userModel.findById(newUser._id).populate('role');
    
    res.send({
      message: "Tạo user thành công. Password đã được gửi tới email",
      user: newUserPopulated,
      emailSent: true
    });

  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;