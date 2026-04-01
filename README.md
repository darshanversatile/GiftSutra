# 🎁 GiftSutra

A full-stack MERN application to manage and organize gift items with ease.  
GiftSutra helps you track products, manage inventory, and perform CRUD operations efficiently.

---

## 🚀 Features

- 🛍️ Add new gift items  
- ✏️ Edit existing items  
- ❌ Delete products  
- 📦 View all gifts in one place  
- 🔍 Search and filter functionality  
- 💰 Track price and product details  
- ⚡ Fast and responsive UI  
- 🔒 Single-user system (No authentication)

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- Axios  
- CSS / Tailwind CSS  

### Backend
- Node.js  
- Express.js  

### Database
- MongoDB (Mongoose)  

---

## 📂 Project Structure
- GiftSutra/
- │
- ├── client/ # React frontend
- ├── server/ # Backend (Node + Express)
- ├── models/ # Database schemas
- ├── routes/ # API routes
- ├── controllers/ # Business logic
- ├── config/ # Database configuration
- └── README.md

---

## ⚙️ Installation & Setup

### 1. Clone the repository

git clone https://github.com/Sujal1444/GiftSutra.git
cd GiftSutra

---

### 2. Install dependencies

Backend:
- cd backend
- npm install

Frontend:
- cd frontend
- npm install

---

### 3. Environment Variables

Create a .env file inside the server folder:
PORT=5000
MONGO_URI=your_mongodb_connection_string

### 4. Run the app
- Backend:
- npm run dev

- Frontend:
- npm run dev

---

### 🔗 API Endpoints
| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| GET    | /api/gifts     | Get all gifts |
| POST   | /api/gifts     | Add new gift  |
| PUT    | /api/gifts/:id | Update gift   |
| DELETE | /api/gifts/:id | Delete gift   |

---

### 📈 Future Improvements

- 🔐 Add authentication system
- 🧠 AI-based gift suggestions
- 🛒 Wishlist / cart system
- 📱 Improve mobile responsiveness

---

###👨‍💻 Author

Sujal Patel
GitHub: https://github.com/Sujal1444

****




If you like this project, give it a ⭐ on Git
Hub!
