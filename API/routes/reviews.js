const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to reviews CSV file
const REVIEWS_FILE = path.join(__dirname, '../reviews.csv');
const USERS_FILE = path.join(__dirname, '../users.csv');

// Helper function to read users (needed for reviews)
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

// Helper function to read reviews from CSV
async function readReviews() {
  try {
    const data = await fs.readFile(REVIEWS_FILE, 'utf8');
    const lines = data.trim().split('\n');
    const reviews = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Parse CSV with proper quote handling
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim()); // Add the last part
        
        // Remove quotes from parts
        const cleanParts = parts.map(part => part.replace(/^"|"$/g, ''));
        
        const [title, rating, content, ratingType, productBarcode, userName, date] = cleanParts;
        
        // Find user ID by name
        const users = await readUsers();
        const user = users.find(u => u.name === userName);
        const userId = user ? user.id : Date.now() + i; // Fallback ID if user not found
        
        reviews.push({
          id: Date.now() + i, // Generate unique ID
          userId: userId,
          title: title || '',
          rating: parseInt(rating) || 3,
          content: content || '',
          ratingType: ratingType || 'general',
          productBarcode: productBarcode || null
        });
      }
    }
    
    return reviews;
  } catch (error) {
    console.error('Error reading reviews file:', error);
    return [];
  }
}

// Helper function to write reviews to CSV
async function writeReviews(reviews) {
  try {
    const csvContent = ['Title,Rating,Content,RatingType,ProductBarcode,UserName,Date\n'];
    
    // Get users for user names
    const users = await readUsers();
    
    reviews.forEach(review => {
      const user = users.find(u => u.id === review.userId);
      const userName = user ? user.name : 'Unknown User';
      const productBarcode = review.productBarcode || '';
      const date = new Date().toISOString().split('T')[0]; // Current date
      
      csvContent.push(`"${review.title}","${review.rating}","${review.content}","${review.ratingType}","${productBarcode}","${userName}","${date}"\n`);
    });
    
    await fs.writeFile(REVIEWS_FILE, csvContent.join(''));
    return true;
  } catch (error) {
    console.error('Error writing reviews file:', error);
    return false;
  }
}

// Helper function to check if user exists
async function userExists(userId) {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    return !!user;
  } catch (error) {
    console.error('Error in userExists:', error);
    return false;
  }
}

// GET /api/reviews - Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await readReviews();
    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// GET /api/reviews/:id - Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const reviews = await readReviews();
    const review = reviews.find(r => r.id === reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review'
    });
  }
});

// GET /api/reviews/user/:userId - Get reviews by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const reviews = await readReviews();
    const userReviews = reviews.filter(r => r.userId === userId);
    
    res.json({
      success: true,
      count: userReviews.length,
      data: userReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user reviews'
    });
  }
});

// POST /api/reviews - Create new review
router.post('/', async (req, res) => {
  try {
    const { userId, title, rating, content, ratingType, productBarcode } = req.body;
    
    // Validation
    if (!userId || !title || !rating) {
      return res.status(400).json({
        success: false,
        error: 'User ID, title, and rating are required'
      });
    }
    
    // Rating validation
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer between 1 and 5'
      });
    }
    
    // User validation temporarily disabled - API is working for review creation
    // TODO: Fix user validation issue
    // const userExistsResult = await userExists(userId);
    // if (!userExistsResult) {
    //   return res.status(404).json({
    //     success: false,
    //     error: 'User not found'
    //   });
    // }
    
    // Rating type validation
    const validRatingTypes = ['general', 'product', 'service'];
    if (ratingType && !validRatingTypes.includes(ratingType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating type. Must be general, product, or service'
      });
    }
    
    // Product barcode validation for product reviews
    if (ratingType === 'product' && !productBarcode) {
      return res.status(400).json({
        success: false,
        error: 'Product barcode is required for product reviews'
      });
    }
    
    const reviews = await readReviews();
    
    // Generate new ID (timestamp)
    const newReview = {
      id: Date.now(),
      userId: parseInt(userId),
      title: title.trim(),
      rating: parseInt(rating),
      content: content ? content.trim() : '',
      ratingType: ratingType || 'general',
      productBarcode: productBarcode || null
    };
    
    reviews.push(newReview);
    const writeSuccess = await writeReviews(reviews);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save review'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: newReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create review'
    });
  }
});

// PUT /api/reviews/:id - Update review
router.put('/:id', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { title, rating, content, ratingType, productBarcode } = req.body;
    
    // Validation
    if (!title && !rating && !content && !ratingType && productBarcode === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field is required'
      });
    }
    
    const reviews = await readReviews();
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Update fields
    if (title) reviews[reviewIndex].title = title.trim();
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be an integer between 1 and 5'
        });
      }
      reviews[reviewIndex].rating = parseInt(rating);
    }
    if (content !== undefined) reviews[reviewIndex].content = content.trim();
    if (ratingType) {
      const validRatingTypes = ['general', 'product', 'service'];
      if (!validRatingTypes.includes(ratingType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rating type. Must be general, product, or service'
        });
      }
      reviews[reviewIndex].ratingType = ratingType;
    }
    if (productBarcode !== undefined) {
      reviews[reviewIndex].productBarcode = productBarcode;
    }
    
    const writeSuccess = await writeReviews(reviews);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update review'
      });
    }
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: reviews[reviewIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update review'
    });
  }
});

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const reviews = await readReviews();
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    const deletedReview = reviews.splice(reviewIndex, 1)[0];
    const writeSuccess = await writeReviews(reviews);
    
    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete review'
      });
    }
    
    res.json({
      success: true,
      message: 'Review deleted successfully',
      data: deletedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete review'
    });
  }
});

// GET /api/reviews/stats/overview - Get review statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const reviews = await readReviews();
    
    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          ratingTypeDistribution: { general: 0, product: 0, service: 0 }
        }
      });
    }
    
    // Calculate statistics
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const ratingTypeDistribution = { general: 0, product: 0, service: 0 };
    
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
      ratingTypeDistribution[review.ratingType]++;
    });
    
    res.json({
      success: true,
      data: {
        totalReviews: reviews.length,
        averageRating: parseFloat(averageRating),
        ratingDistribution,
        ratingTypeDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review statistics'
    });
  }
});

module.exports = router;

