import process from "node:process";

const config = {
  PORT: process.env.MOCK_SERVER_PORT
    ? parseInt(process.env.MOCK_SERVER_PORT, 10)
    : 3001,
  ORIGIN: process.env.MOCK_SERVER_ORIGIN || "http://localhost",
};

export default config;
