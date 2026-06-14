const Product = require('../../models/Product');
const Investment = require('../../models/Investment');
const { logAction } = require('../../utils/auditLogger');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ price: 1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    await logAction({
      userId: req.user._id,
      action: 'product_created',
      entityType: 'Product',
      entityId: product._id,
      details: { name: product.name },
      req,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'product_updated',
      entityType: 'Product',
      entityId: product._id,
      details: req.body,
      req,
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const activeInvestments = await Investment.countDocuments({
      productId: req.params.id,
      status: 'active',
    });

    if (activeInvestments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with active investments',
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'product_deleted',
      entityType: 'Product',
      entityId: product._id,
      details: { name: product.name },
      req,
    });

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();

    await logAction({
      userId: req.user._id,
      action: 'product_status_toggled',
      entityType: 'Product',
      entityId: product._id,
      details: { status: product.status },
      req,
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
