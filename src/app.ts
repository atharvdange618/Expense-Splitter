import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// core middlewares
app.use(helmet())
app.use(cors())
app.use(morgan("dev"))
app.use(express.json())

// health check route
app.get('/health', (_, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString()
  })
})

app.use((_, res) => {
  res.status(404).json({
    success: false,
    message: "Ye route exist nhi karta bhai, path acche se check karo"
  })
})

export default app;
