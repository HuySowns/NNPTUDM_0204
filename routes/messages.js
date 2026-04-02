var express = require("express");
var router = express.Router();
let messageModel = require("../schemas/messages");
let userModel = require("../schemas/users");
const { checkLogin } = require("../utils/authHandler");

// POST / - Create a new message
router.post("/", checkLogin, async function (req, res, next) {
  try {
    let { to, messageContent } = req.body;
    let currentUserId = req.user._id;

    // Validation
    if (!to) {
      return res.status(400).send({ message: "Recipient ID is required" });
    }

    if (!messageContent || !messageContent.type || !messageContent.text) {
      return res.status(400).send({
        message: "Message content with type and text is required"
      });
    }

    // Validate message type
    if (!["text", "file"].includes(messageContent.type)) {
      return res.status(400).send({
        message: "Message type must be 'text' or 'file'"
      });
    }

    // Check if recipient exists
    let recipientUser = await userModel.findById(to);
    if (!recipientUser) {
      return res.status(404).send({ message: "Recipient not found" });
    }

    // Cannot send message to self
    if (currentUserId.toString() === to) {
      return res.status(400).send({ message: "Cannot send message to yourself" });
    }

    // Create new message
    let newMessage = new messageModel({
      from: currentUserId,
      to: to,
      messageContent: {
        type: messageContent.type,
        text: messageContent.text
      }
    });

    let savedMessage = await newMessage.save();

    // Populate user information
    let populatedMessage = await messageModel
      .findById(savedMessage._id)
      .populate("from", "username email fullName avatarUrl")
      .populate("to", "username email fullName avatarUrl");

    res.status(201).send({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET / - Get last message from each conversation
router.get("/", checkLogin, async function (req, res, next) {
  try {
    let currentUserId = req.user._id;

    // Get all unique users that current user has messaged with
    let conversationUsers = await messageModel.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [
            { from: new (require("mongoose")).Types.ObjectId(currentUserId) },
            { to: new (require("mongoose")).Types.ObjectId(currentUserId) }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$from", new (require("mongoose")).Types.ObjectId(currentUserId)] },
              "$to",
              "$from"
            ]
          },
          lastMessageTime: { $max: "$createdAt" }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Get last message for each conversation
    let conversations = [];
    for (let conv of conversationUsers) {
      let lastMessage = await messageModel
        .findOne({
          isDeleted: false,
          $or: [
            { from: currentUserId, to: conv._id },
            { from: conv._id, to: currentUserId }
          ]
        })
        .populate("from", "username email fullName avatarUrl")
        .populate("to", "username email fullName avatarUrl")
        .sort({ createdAt: -1 })
        .limit(1);

      // Get other user info
      let otherUser = await userModel.findById(conv._id).select("_id username email fullName avatarUrl");

      conversations.push({
        otherUser: otherUser,
        lastMessage: lastMessage
      });
    }

    res.send({
      success: true,
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET /:userId - Get all messages between current user and specified user
router.get("/:userId", checkLogin, async function (req, res, next) {
  try {
    let currentUserId = req.user._id;
    let targetUserId = req.params.userId;

    // Validate if target user exists
    let targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).send({ message: "User not found" });
    }

    // Get all messages between current user and target user (both directions)
    let messages = await messageModel
      .find({
        isDeleted: false,
        $or: [
          { from: currentUserId, to: targetUserId },
          { from: targetUserId, to: currentUserId }
        ]
      })
      .populate("from", "username email fullName avatarUrl")
      .populate("to", "username email fullName avatarUrl")
      .sort({ createdAt: 1 });

    res.send({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
