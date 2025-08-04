import dotenv from "dotenv";
dotenv.config();

export const WORKER_JWT_SECRET = process.env.JWT_SECRET + "Worker";


export const TOTAL_DECIMALS = 1000_000;