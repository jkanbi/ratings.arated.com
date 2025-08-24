const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to users CSV file
const USERS_FILE = path.join(__dirname, '../../users.csv');

// Helper function to read users from CSV
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const lines = data.trim().split('\n');
    const users = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [name, email] = line.split(',');
        // Use a hash of the email as a consistent ID
        const id = email.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        users.push({ id: Math.abs(id), name, email });
      }
    }
    
    return users;
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Helper function to write users to CSV
async function writeUsers(users) {
  try {
    const csvContent = ['Name,Email\n'];
    users.forEach(user => {
      csvContent.push(`${user.name},${user.email}\n`);
    });
    
    await fs.writeFile(USERS_FILE, csvContent.join(''));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await readUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    const users = await readUsers();
    
    // Check for duplicate email
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Generate new ID (hash of email for consistency)
    const newUser = {
      id: email.trim().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0),
      name: name.trim(),
      email: email.trim()
    };
    
    users.push(newUser);
    const writeSuccess = await writeUsers(users);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save user'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email } = req.body;
    
    // Validation
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (name or email) is required'
      });
    }
    
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update fields
    if (name) users[userIndex].name = name.trim();
    if (email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
      
      // Check for duplicate email (excluding current user)
      const existingUser = users.find(u => u.id !== userId && u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
      
      users[userIndex].email = email.trim();
    }
    
    const writeSuccess = await writeUsers(users);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    const writeSuccess = await writeUsers(users);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

module.exports = router;

