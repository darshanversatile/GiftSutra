# 🎁 GiftSutra – Smart Gift Management System

A full-stack **Gift Management Platform** built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**.
GiftSutra helps manage, organize, and streamline gift-related data with a modern UI and scalable backend.

---

## 🚀 Features

* 🎁 Add, update, and delete gift items
* 📦 Manage product listings
* 🔍 Organized backend with MVC structure
* ⚡ Fast frontend powered by Vite
* 🎨 Modern UI using Tailwind CSS
* 🔗 RESTful API integration

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* HTML

### Backend

* Node.js
* Express.js

### Database

* MongoDB (Mongoose)

---

## 📂 Project Structure

```bash
GiftSutra/
│── backend/
│   ├── config/
│   ├── controllers/
│   ├── logs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── seed.js
│   ├── server.js
│   ├── vercel.json
│   └── package.json
│
│── frontend/
│   ├── src/
│   ├── public/
│   ├── .env
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
│
│── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Sujal1444/GiftSutra.git
cd GiftSutra
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `/backend`:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment

* 🚀 Frontend deployed using **Vercel**
* ⚙️ Backend deployment ready (`vercel.json` included)

---

## 🔌 API Endpoints (Example)

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| GET    | /api/gifts     | Get all gifts |
| POST   | /api/gifts     | Add new gift  |
| PUT    | /api/gifts/:id | Update gift   |
| DELETE | /api/gifts/:id | Delete gift   |

---

## 🎨 UI & Styling

* Tailwind CSS for modern design
* Fully responsive layout
* Clean and minimal interface

---

## ⚡ Future Improvements

* 🔐 Authentication & user roles
* ❤️ Wishlist feature
* 📊 Dashboard & analytics
* 🛒 E-commerce integration

---

## 🤝 Contributing

Contributions are welcome!
Fork the repo and submit a pull request 🚀

---

## 👨‍💻 Author

**Sujal Patel**
🔗 https://github.com/Sujal1444

---

⭐ If you like this project, don’t forget to star the repo!
