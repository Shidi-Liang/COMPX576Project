# 🧭 Smart Travel Buddy  
**COMPX576 Project — University of Waikato (2025)**  
*Author: Shidi Liang (1665337)*  

---

## 🌍 Overview
**Smart Travel Buddy** is a web application that helps users plan **customized travel routes** based on their **starting point**, **destination**, and **preferences** such as travel time or interests.  

The system integrates **OpenAI GPT** and **Google Maps APIs** to automatically generate multiple route options, visualize them on an interactive map, and provide human-readable trip summaries.

---

## 🚀 Features

### ✨ Core Functionality
- 🧠 **AI Route Generation** — Generates five different travel routes using OpenAI GPT combined with Google Directions API data.  
- 🗺️ **Interactive Map View** — Displays multiple route options with real-time visualization on Google Maps.  
- 🕒 **Timeline View** — Shows trip details in a clear chronological timeline for each selected route.  
- 🔁 **Multi-route Comparison** — Allows users to switch between up to 5 AI-generated route options.  
- 🔐 **User Authentication** — Supports user registration and login using a secure Express + MongoDB backend.  

### 🧩 Additional Features
- Dynamic map updates when changing routes  
- Responsive UI with smooth transitions  
- Easy-to-use form-based input for origin and destination  

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React, Vite, TailwindCSS |
| **Backend** | Node.js, Express |
| **Database** | MongoDB Atlas |
| **AI Integration** | OpenAI API (GPT-4) |
| **Maps & Data** | Google Maps JavaScript API, Directions API, Places API |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 🖼️ System Architecture
User → React Frontend → Express API → MongoDB Atlas
↘ OpenAI GPT API
↘ Google Maps + Directions + Places API

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Shidi-Liang/COMPX576Project.git
cd SmartTravelBuddy
```
### 2. Install dependencies
Frontend
```bash
cd client
npm install
```
Backend
```bash
cd server
npm install
```
### 3. Configure environment variables

Create .env files in both client/ and server/ directories.

Example .env (server):
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_google_api_key
MONGO_URI=your_mongodb_connection_string

### 4. Run locally
Backend:
```bash
node index.js
```
Frontend:
```bash
npm start
```
This service starts the React application, which will automatically open in your browser, usually at http://localhost:3000.

## 🌐 Deployment URLs

Frontend: https://smart-travel-buddy.vercel.app

Backend API: https://smart-travel-buddy-api.onrender.com

## 🧠 Example Workflow

Enter your starting point and destination.

Click “Generate Route” to initiate AI-based route planning.

The backend fetches routes via the Google Directions API and passes them to GPT for descriptive summaries.

View up to five generated route options displayed on the interactive map.

Explore trip timelines for more detailed insights.

## 🧑‍💻 Author

Shidi Liang (1665337) — Full-stack development, UI design, and API integration




