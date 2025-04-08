const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const getBatchCollection = (batchYear) => {
    return mongoose.connection.collection(batchYear);
};

// Define the batch completion data
const batchCompletion = {
    "2021": 7,
    "2022": 5,
    "2023": 3,
    "2024": 1
};

// Fetch semester-wise SGPA trends for a batch
router.get("/sgpa-trends", async (req, res) => {
    try {
        const { batchYear } = req.query;
        if (!batchYear) {
            return res.status(400).json({ error: "Batch year is required" });
        }

        const collection = getBatchCollection(batchYear);
        const students = await collection.find({}, { projection: { semesterResults: 1 } }).toArray();

        if (!students.length) {
            return res.status(404).json({ error: "No student data found for this batch" });
        }

        let semesterSGPA = {};
        
        students.forEach(student => {
            student.semesterResults.forEach(({ semester, SGPA }) => {
                if (!semesterSGPA[semester]) {
                    semesterSGPA[semester] = [];
                }
                semesterSGPA[semester].push(SGPA);
            });
        });

        let avgSGPA = {};
        Object.entries(semesterSGPA).forEach(([sem, sgpaValues]) => {
            avgSGPA[sem] = sgpaValues.reduce((a, b) => a + b, 0) / sgpaValues.length;
        });

        res.json({ batchYear, avgSGPA });
    } catch (error) {
        console.error("❌ Error fetching SGPA trends:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
