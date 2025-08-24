# Ratings and Reviews API

A RESTful API for managing user profiles and reviews with support for different rating types including product reviews with barcode scanning.

## Features

- **User Management**: CRUD operations for user profiles
- **Review System**: Comprehensive review management with rating types
- **Product Reviews**: Special handling for product reviews with barcode support
- **Statistics**: Review analytics and insights
- **CSV Integration**: Works with existing CSV data files
- **RESTful Design**: Standard HTTP methods and status codes

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the API directory:
   ```bash
   cd API
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | Get all reviews |
| GET | `/api/reviews/:id` | Get review by ID |
| GET | `/api/reviews/user/:userId` | Get reviews by user ID |
| GET | `/api/reviews/stats/overview` | Get review statistics |
| POST | `/api/reviews` | Create new review |
| PUT | `/api/reviews/:id` | Update review |
| DELETE | `/api/reviews/:id` | Delete review |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/api/health` | Health check |

## Request/Response Examples

### Create User

**Request:**
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1703123456789,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Create Review

**Request:**
```http
POST /api/reviews
Content-Type: application/json

{
  "userId": 1703123456789,
  "title": "Great Product!",
  "rating": 5,
  "content": "This product exceeded my expectations.",
  "ratingType": "product",
  "productBarcode": "1234567890123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1703123456790,
    "userId": 1703123456789,
    "title": "Great Product!",
    "rating": 5,
    "content": "This product exceeded my expectations.",
    "ratingType": "product",
    "productBarcode": "1234567890123"
  }
}
```

## Data Models

### User
```json
{
  "id": "number (timestamp)",
  "name": "string",
  "email": "string (unique)"
}
```

### Review
```json
{
  "id": "number (timestamp)",
  "userId": "number (references user.id)",
  "title": "string",
  "rating": "number (1-5)",
  "content": "string (optional)",
  "ratingType": "string (general|product|service)",
  "productBarcode": "string (optional, required for product reviews)"
}
```

## Rating Types

- **general**: General reviews without specific product/service context
- **product**: Product reviews that require a product barcode
- **service**: Service reviews for service-based experiences

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Configuration

The API can be configured through environment variables:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origin
- `HELMET_ENABLED`: Enable security headers
- `LOG_LEVEL`: Logging level

## Development

### Project Structure
```
API/
├── server.js          # Main server file
├── config.js          # Configuration
├── package.json       # Dependencies
├── routes/            # Route handlers
│   ├── users.js      # User endpoints
│   └── reviews.js    # Review endpoints
└── README.md         # This file
```

### Adding New Features

1. Create new route files in the `routes/` directory
2. Add route registration in `server.js`
3. Update this README with new endpoint documentation

### Testing

The API can be tested using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## Performance

- **Async/Await**: Non-blocking I/O operations
- **File-based Storage**: Lightweight CSV storage
- **Efficient Parsing**: Optimized CSV reading/writing

## License

MIT License - see LICENSE file for details.

