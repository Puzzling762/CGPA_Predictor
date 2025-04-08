const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const getBatchCollection = (batchYear) => mongoose.connection.collection(batchYear);

const batchExists = async (batchYear) => {
    return await mongoose.connection.db
        .listCollections({ name: batchYear })
        .hasNext();
};

const batchCompletion = {
    "2021": 7,
    "2022": 5,
    "2023": 3,
    "2024": 1
};

router.post("/predict-cgpa", async (req, res) => {
    try {
        const { roll_number, target_cgpa } = req.body;

        if (!roll_number || !target_cgpa) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const userBatchYear = parseInt(roll_number.substring(0, 4));
        const userCollection = getBatchCollection(userBatchYear.toString());
        const user = await userCollection.findOne({ Regn: roll_number });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const completedSemesters = user.semesterResults.map(s => s.semester);
        const current_cgpa = user.semesterResults.length > 0
            ? user.semesterResults[user.semesterResults.length - 1].CGPA
            : 0;

        const currentSemester = completedSemesters.length > 0
            ? Math.max(...completedSemesters)
            : (batchCompletion[userBatchYear.toString()] || 1);

        if (current_cgpa >= target_cgpa) {
            return res.json({
                message: "Kya karre ho bhai, enjoy kro!",
                currentCGPA: current_cgpa.toFixed(2)
            });
        }

        const seniorBatches = [];
        for (let year = userBatchYear - 1; year >= 2021; year--) {
            if (await batchExists(year.toString())) {
                seniorBatches.push(year.toString());
            }
        }

        if (!seniorBatches.length) {
            return res.status(404).json({ error: "No senior batch data found" });
        }

        let seniorData = [];
        let maxCompletedSemester = Math.min(7, currentSemester);

        for (const batch of seniorBatches) {
            const collection = getBatchCollection(batch);
            const batchData = await collection.find({}).toArray();

            batchData.forEach((student) => {
                if (student.semesterResults.length > 0) {
                    maxCompletedSemester = Math.max(
                        maxCompletedSemester,
                        student.semesterResults[student.semesterResults.length - 1].semester
                    );
                    seniorData.push(student);
                }
            });
        }

        // 🔍 Extract student’s CGPA profile
        const userProfile = {};
        for (let i = 1; i <= currentSemester; i++) {
            const semResult = user.semesterResults.find(s => s.semester === i);
            if (semResult) userProfile[i] = semResult.CGPA;
        }

        // 🧠 Find similar seniors
        const similarSeniors = getSimilarSeniors(seniorData, userProfile);

        // 📊 Predict
        const prediction = analyzeSGPATrends(
            similarSeniors.length ? similarSeniors : seniorData, // fallback
            parseFloat(current_cgpa),
            parseFloat(target_cgpa),
            currentSemester,
            maxCompletedSemester,
            completedSemesters
        );

        // 🧠 Extract branch from roll number (e.g., "2022ugpi012" → "pi")
        const userBranch = roll_number.substring(6, 8).toLowerCase();

        // 🎯 Get classmates from same batch and branch
        const classData = await userCollection.find({
            Regn: { $regex: `^${userBatchYear}ug${userBranch}`, $options: 'i' }
        }).toArray();

        // 📈 Get latest CGPA for each valid student (non-zero CGPA)
        const validCGPAs = classData
            .map(s => {
                const lastResult = s.semesterResults[s.semesterResults.length - 1];
                return lastResult?.CGPA || 0;
            })
            .filter(cgpa => cgpa > 0);

        validCGPAs.sort((a, b) => b - a); // Descending

        const studentRank = validCGPAs.findIndex(cgpa => cgpa <= current_cgpa) + 1;

        const classStanding = {
            rank: studentRank,
            total: validCGPAs.length,
            percentile: ((1 - (studentRank - 1) / validCGPAs.length) * 100).toFixed(2) + "%"
        };

        res.json({
            message: prediction.message,
            currentCGPA: current_cgpa.toFixed(2),
            confidenceScore: prediction.confidenceScore,
            bestCaseCGPA: prediction.bestCaseCGPA,
            worstCaseCGPA: prediction.worstCaseCGPA,
            predictedSGPAs: prediction.predictedSGPAs,
            classStanding,
            details: prediction,
        });
    } catch (error) {
        console.error("Error in SGPA prediction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Personalized SGPA Trend Analyzer
const getSimilarSeniors = (seniorData, userProfile) => {
    const threshold = 0.3;
    return seniorData.filter(senior => {
        for (let sem in userProfile) {
            const result = senior.semesterResults.find(r => r.semester === parseInt(sem));
            if (!result || Math.abs(result.CGPA - userProfile[sem]) > threshold) {
                return false;
            }
        }
        return true;
    });
};

const analyzeSGPATrends = (
    seniorData,
    currentCGPA,
    targetCGPA,
    currentSemester,
    maxCompletedSemester,
    completedSemesters
) => {
    const semesterSGPAGrowth = {};
    const seniorSimilarityScores = [];

    // Build similarity scores
    seniorData.forEach((student) => {
        let score = 0;
        let count = 0;
        for (let sem = 1; sem <= currentSemester; sem++) {
            const sr = student.semesterResults.find(r => r.semester === sem);
            if (sr) {
                const diff = Math.abs(sr.CGPA - currentCGPA);
                score += (1 - Math.min(diff / 2, 1)); // Normalized: closer CGPA → higher score
                count++;
            }
        }
        if (count) {
            seniorSimilarityScores.push({
                student,
                weight: score / count,
            });
        }
    });

    // Build weighted SGPA growth per semester
    seniorSimilarityScores.forEach(({ student, weight }) => {
        student.semesterResults.forEach(({ semester, SGPA }) => {
            if (semester > currentSemester && semester <= 7) {
                if (!semesterSGPAGrowth[semester]) {
                    semesterSGPAGrowth[semester] = [];
                }
                semesterSGPAGrowth[semester].push({ SGPA, weight });
            }
        });
    });

    const weightedAvgSGPA = {};
    Object.keys(semesterSGPAGrowth).forEach((sem) => {
        const sgpaList = semesterSGPAGrowth[sem];
        const totalWeight = sgpaList.reduce((sum, s) => sum + s.weight, 0);
        const weightedSum = sgpaList.reduce((sum, s) => sum + s.SGPA * s.weight, 0);
        weightedAvgSGPA[sem] = totalWeight ? (weightedSum / totalWeight) : 6.5;
    });

    // Begin prediction
    let predictedSemester = currentSemester + 1;
    let predictedCGPA = currentCGPA;
    let confidenceScore = 1.0;
    let predictedSGPAs = {};
    let requiredSGPA = [];

    while (predictedCGPA < targetCGPA && predictedSemester <= 7) {
        if (completedSemesters.includes(predictedSemester)) {
            predictedSemester++;
            continue;
        }

        const predictedSGPA = weightedAvgSGPA[predictedSemester] || weightedAvgSGPA[predictedSemester - 1] || 6.5;
        requiredSGPA.push(predictedSGPA);

        let newTotalCredits = predictedSemester;
        predictedCGPA = ((predictedCGPA * (predictedSemester - 1)) + predictedSGPA) / newTotalCredits;
        predictedSGPAs[`Semester ${predictedSemester}`] = predictedSGPA.toFixed(2);

        if (predictedCGPA >= targetCGPA) break;

        predictedSemester++;
        confidenceScore *= 0.94;
    }

    const maxPossibleSGPA = Math.max(...requiredSGPA);

    return {
        semester: predictedSemester,
        predictedCGPA: predictedCGPA.toFixed(2),
        confidenceScore: (confidenceScore * 100).toFixed(2) + "%",
        predictedSGPAs,
        bestCaseCGPA: (predictedCGPA + 0.3).toFixed(2),
        worstCaseCGPA: (predictedCGPA - 0.3).toFixed(2),
        maxPossibleSGPA: maxPossibleSGPA.toFixed(2),
        message: predictedCGPA < targetCGPA
            ? `Based on closely matching students, achieving ${targetCGPA.toFixed(2)} is unlikely. Best estimate: ${predictedCGPA.toFixed(2)}`
            : `Predicted to reach ${targetCGPA.toFixed(2)} after Semester ${predictedSemester - 1} results`
    };
};

module.exports = router;
