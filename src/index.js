import dotenv from "dotenv";
import express from "express";
import connectToDB from "./db/index.js";
dotenv.config({ path: "./.env" });

connectToDB()
  .then(() => {
    console.log("Database connection established successfully.");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });
