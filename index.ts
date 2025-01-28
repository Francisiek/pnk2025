import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

// Serving static files (HTML, CSS, JS)
app.use(express.static('dist'));

// Starting the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});

