import app from './app'
import { prisma } from "./config/prisma"
import { validateEnv } from "./config/env"

const PORT = process.env.PORT || 3000

async function serverStartKaroBhai() {
  validateEnv()
  try {
    await prisma.$connect();
    console.log("Database connected guyss")

    app.listen(PORT, () => {
      console.log(`Server start ho chuka hai ye address par: http:localhost:${PORT}`);
      console.log(`Aap abhi iss environment mein server run kar rahe hoo: ${process.env.NODE_ENV || "development"}`)
    });
  } catch (err) {
    console.error("Kuch toh matter ho gaya bhai, ye dekho error:", err)
    console.info("Tab tak main database se disconnect karke server band kar raha hoon, tataaaaaaaaaa")
    await prisma.$disconnect();
    process.exit(1)
  }
}

serverStartKaroBhai()

// ijjat se band karna
process.on("SIGTERM", async () => {
  console.log("SIGTERM mil chuka hai - pyaar se server band karenge ab")
  await prisma.$disconnect()
  process.exit(0)
})
