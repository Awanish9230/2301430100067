import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const Log = async (stack, level, pkg, message) => {
  try {
    console.log("========== LOGGER ==========");
    console.log("URL:", process.env.LOG_API_URL);
    console.log(
      "TOKEN:",
      process.env.ACCESS_TOKEN
        ? process.env.ACCESS_TOKEN.substring(0, 25) + "..."
        : "UNDEFINED"
    );

    const response = await axios.post(
      process.env.LOG_API_URL,
      {
        stack,
        level,
        logClass: pkg,
        logMessage: message,
      },
      {
        headers: {
          Authorization: `${process.env.ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("LOG SUCCESS:", response.data);

    return response.data;
  } catch (error) {
    console.log("========== LOGGER ERROR ==========");

    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("DATA:", error.response.data);
    } else {
      console.log("ERROR:", error.message);
    }
  }
};

export default Log;