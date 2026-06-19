🏥 MediConnect

A full-stack healthcare platform that enables patients and doctors to manage appointments, communicate in real time, and track consultation records through a unified dashboard.

_____________________________________________________________________________________________

## Key Features

* Secure role-based authentication for patients and doctors using JWT.
* Patients can book, track, and manage appointments through an intuitive dashboard.
* Doctors can review appointment requests and accept or reject consultations.
* Real-time doctor–patient communication powered by Socket.IO chat.
* Health metrics and consultation records management with downloadable ODM reports.
* Responsive full-stack architecture built with React, Node.js, Express, and MongoDB.

_____________________________________________________________________________________________

![alt text](<Screenshot 2026-06-20 042422.png>)
![alt text](<Screenshot 2026-06-20 042630.png>) 
![alt text](<Screenshot 2026-06-20 042503.png>)
![alt text](<Screenshot 2026-06-20 042658.png>)

_____________________________________________________________________________________________

## Installation & Setup

### Requirements

* Node.js (v18+)
* npm
* MongoDB Atlas or Local MongoDB
* Git

### Clone Repository

```bash
git clone <repository-url>
cd MediConnect
```

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
npm start
```

### Frontend Setup

Open a new terminal:

```bash
cd client
npm install
```

Start the frontend:

```bash
npm run dev
```
