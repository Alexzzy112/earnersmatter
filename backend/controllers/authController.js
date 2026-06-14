const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const helpers = require('../utils/helpers');
const { logAction } = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

const register = async (req, res) => {
  try {
    const { username, email, phone, password, referralCode } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }

    const userData = {
      username,
      email,
      phone,
      password,
      referralCode: helpers.generateReferralCode(),
    };

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        userData.referredBy = referrer._id;
      }
    }

    const user = await User.create(userData);
    const token = helpers.generateToken(user._id);

    await logAction({
      userId: user._id,
      action: 'user_registered',
      entityType: 'User',
      entityId: user._id,
      details: { email },
      req,
    });

    const userDataResponse = user.toObject();
    delete userDataResponse.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user: userDataResponse },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = helpers.generateToken(user._id);

    await logAction({
      userId: user._id,
      action: 'user_login',
      entityType: 'User',
      entityId: user._id,
      details: { email },
      req,
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user: userData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    await logAction({
      userId: req.user._id,
      action: 'user_logout',
      entityType: 'User',
      entityId: req.user._id,
      req,
    });

    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000);

    await PasswordReset.create({
      userId: user._id,
      token,
      expiresAt,
    });

    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: 'Password reset token generated',
        data: { resetToken: token },
      });
    }

    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const resetRecord = await PasswordReset.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    await logAction({
      userId: user._id,
      action: 'password_reset',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { phone, username } = req.body;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (username) updateData.username = username;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction({
      userId: user._id,
      action: 'profile_updated',
      entityType: 'User',
      entityId: user._id,
      details: updateData,
      req,
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await logAction({
      userId: user._id,
      action: 'password_changed',
      entityType: 'User',
      entityId: user._id,
      details: {},
      req,
    });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.emailVerifiedAt) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    const verificationToken = uuidv4();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // In production, send actual email. In dev, return token
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        message: 'Verification email sent. Dev mode token:',
        verificationToken
      });
    }
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    await logAction({
      userId: user._id, action: 'email_verified', entityType: 'User',
      entityId: user._id, details: {}, req
    });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
};
