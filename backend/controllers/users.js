// backend/controllers/users.js
const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse the query
    let filterQuery = JSON.parse(queryStr);

    // Add search functionality
    if (req.query.search) {
      filterQuery.$or = [
        { nome: new RegExp(req.query.search, 'i') },
        { cognome: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }

    // Finding resource
    query = User.find(filterQuery);

    // Select Fields (exclude password)
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-password');
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments(filterQuery);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const users = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: total,
      pagination,
      data: users
    });
  } catch (err) {
    console.error('Errore get users:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get single user (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Errore get user:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Create new user (admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    console.log('=== DEBUG BACKEND CREATE USER ===');
    console.log('Dati ricevuti:', req.body);
    
    const { nome, cognome, email, password, ruolo } = req.body;

    // Validation
    if (!nome || !cognome || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tutti i campi sono obbligatori'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Un utente con questa email esiste già'
      });
    }

    const user = await User.create({
      nome,
      cognome,
      email,
      password,
      ruolo: ruolo || 'user'
    });

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (err) {
    console.error('=== ERRORE BACKEND CREATE USER ===');
    console.error('Errore completo:', err);
    console.error('Validation errors:', err.errors);
    console.error('Error message:', err.message);
    
    res.status(400).json({
      success: false,
      error: err.message,
      details: err.errors
    });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { nome, cognome, email, ruolo, attivo } = req.body;

    // Check if user exists
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Un utente con questa email esiste già'
        });
      }
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === req.params.id && attivo === false) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi disattivare il tuo stesso account'
      });
    }

    // Prevent admin from changing their own role
    if (req.user.id === req.params.id && ruolo && ruolo !== user.ruolo) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi modificare il tuo stesso ruolo'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { nome, cognome, email, ruolo, attivo },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    console.error('Errore update user:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update user password (admin only)
// @route   PUT /api/users/:id/password
// @access  Private/Admin
exports.updateUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La password deve essere di almeno 6 caratteri'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password aggiornata con successo'
    });
  } catch (err) {
    console.error('Errore update password:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi eliminare il tuo stesso account'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Errore delete user:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Toggle user active status (admin only)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi modificare lo stato del tuo stesso account'
      });
    }

    user.attivo = !user.attivo;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    console.error('Errore toggle status:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Get users statistics (admin only)
// @route   GET /api/users/statistics
// @access  Private/Admin
exports.getUsersStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ attivo: true });
    const adminUsers = await User.countDocuments({ ruolo: 'admin' });
    const regularUsers = await User.countDocuments({ ruolo: 'user' });

    // Users by creation month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Recent users (last 10)
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(10)
      .select('nome cognome email ruolo createdAt attivo');

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          adminUsers,
          regularUsers
        },
        usersByMonth,
        recentUsers
      }
    });
  } catch (err) {
    console.error('Errore users statistics:', err);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};