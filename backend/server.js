require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Import Routes
const cgpaRoutes = require("./routes/cgpaRoutes");
const trendsRoutes = require("./routes/trendsRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", cgpaRoutes);
app.use("/api", trendsRoutes);

// MongoDB Connection with Error Handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true, // Ensure TLS is enabled
      tlsInsecure: true, // (Try this if TLS alone doesn't work)
      retryWrites: true, // Enable retryable writes
      maxPoolSize: 10, // Set a pool size limit to avoid unnecessary connections
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit process if MongoDB fails
  }
};

// Start Server Only After DB Connection

// Sample Route
app.get("/", (req, res) => {
  res.send("🎯 CGPA Predictor API is running...");
});

// 📌 API Route: Fetch Graph Data
// 📌 API Route: Fetch Graph Data
app.get("/api/graph-data/:batch/:rollNumber", async (req, res) => {
  try {
    const { batch, rollNumber } = req.params;
    const collection = mongoose.connection.db.collection(batch);

    const student = await collection.findOne({ Regn: rollNumber });
    if (!student) {
      console.log(`📉 No data found for student ${rollNumber} in batch ${batch}`);
      return res.status(404).json({ error: "No data found for this student." });
    }

    const allStudents = await collection.find({}, { projection: { Regn: 1, semesterResults: 1 } }).toArray();

    const cgpaHistory = [];
    const sgpaTrends = [];
    student.semesterResults.forEach(sem => {
      cgpaHistory.push({ semester: `Sem ${sem.semester}`, CGPA: sem.CGPA });
      sgpaTrends.push({ semester: `Sem ${sem.semester}`, SGPA: sem.SGPA });
    });

    const lastSemester = student.semesterResults[student.semesterResults.length - 1].semester;

    // ✅ SGPA Distribution (Full + Last Semester)
    let sgpaDistribution = {};
    let batchSgpaDistributionForLastSem = {};

    allStudents.forEach(s => {
      s.semesterResults.forEach(sem => {
        const range = `${Math.floor(sem.SGPA)}-${Math.floor(sem.SGPA) + 0.5}`;
        sgpaDistribution[range] = (sgpaDistribution[range] || 0) + 1;

        if (sem.semester === lastSemester) {
          batchSgpaDistributionForLastSem[range] = (batchSgpaDistributionForLastSem[range] || 0) + 1;
        }
      });
    });

    // ✅ Difficulty Map
    let semesterDifficulty = {};
    allStudents.forEach(s => {
      s.semesterResults.forEach(sem => {
        if (!semesterDifficulty[sem.semester]) {
          semesterDifficulty[sem.semester] = { totalSGPA: 0, count: 0 };
        }
        semesterDifficulty[sem.semester].totalSGPA += sem.SGPA;
        semesterDifficulty[sem.semester].count++;
      });
    });

    let difficultyMap = Object.keys(semesterDifficulty).map(sem => {
      const avgSGPA = semesterDifficulty[sem].totalSGPA / semesterDifficulty[sem].count;
      let difficulty = "🔴 Hard";
      if (avgSGPA >= 8) difficulty = "🟢 Easy";
      else if (avgSGPA >= 7) difficulty = "🟡 Medium";
      return { semester: `Sem ${sem}`, difficulty };
    });

    // ✅ Class Averages & Highest CGPA (excluding 0 CGPA)
    let totalCGPA = 0, totalSGPA = 0, highestCGPA = 0, validCGPACount = 0, validSGPACount = 0;

    allStudents.forEach(s => {
      const lastResult = s.semesterResults[s.semesterResults.length - 1];
      if (lastResult?.CGPA > 0) {
        totalCGPA += lastResult.CGPA;
        validCGPACount++;
        if (lastResult.CGPA > highestCGPA) highestCGPA = lastResult.CGPA;
      }
      if (lastResult?.SGPA > 0) {
        totalSGPA += lastResult.SGPA;
        validSGPACount++;
      }
    });

    const avgClassCGPAValue = validCGPACount > 0 ? totalCGPA / validCGPACount : 0;
    const avgClassSGPAValue = validSGPACount > 0 ? totalSGPA / validSGPACount : 0;

    // ✅ Rank & Percentile
    const latestCGPA = student.semesterResults[student.semesterResults.length - 1]?.CGPA || 0;

    const validStudents = allStudents.filter(s => {
      const last = s.semesterResults[s.semesterResults.length - 1];
      return last && last.CGPA > 0;
    });

    const totalStudents = validStudents.length;
    const sortedByCGPA = [...validStudents].sort((a, b) => {
      const cgpaA = a.semesterResults[a.semesterResults.length - 1]?.CGPA || 0;
      const cgpaB = b.semesterResults[b.semesterResults.length - 1]?.CGPA || 0;
      return cgpaB - cgpaA;
    });

    let rank = sortedByCGPA.findIndex(s => s.Regn === rollNumber) + 1;
    if (rank === 0) rank = totalStudents;

    const percentile = ((totalStudents - rank) / totalStudents * 100).toFixed(2);

    // ✅ Final Response
    res.json({
      studentData: {
        cgpaHistory,
        sgpaTrends,
      },
      classData: {
        avgClassCGPA: avgClassCGPAValue,
        avgClassSGPA: avgClassSGPAValue,
        highestCGPA
      },
      rank,
      totalStudents,
      percentile
    });

    console.log("📊 Graph Data Sent for Student:", {
      cgpaHistory,
      sgpaTrends,
      avgClassCGPAValue,
      avgClassSGPAValue,
      highestCGPA,
      rank,
      percentile
    });

  } catch (error) {
    console.error("❌ Error fetching student graph data:", error);
    res.status(500).json({ error: "Failed to fetch graph data" });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
