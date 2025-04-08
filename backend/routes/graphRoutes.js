const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/graph-data/:batch", async (req, res) => {
  try {
    const { batch } = req.params;
    console.log(`🔍 Fetching academic graph data for batch: ${batch}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    const batchExists = collections.some((col) => col.name === batch);

    if (!batchExists) {
      console.warn(`❌ Batch "${batch}" not found.`);
      return res.status(404).json({ error: "Batch data not found." });
    }

    const students = await mongoose.connection.db.collection(batch).find({}).toArray();

    if (!students.length) {
      console.warn(`⚠️ No students found in batch "${batch}".`);
      return res.status(404).json({ error: "No data found for the selected batch." });
    }

    console.log(`✅ Found ${students.length} students in batch.`);

    let highestCGPAInClass = 0;
    let totalClassCGPA = 0;
    let totalClassSGPA = 0;
    let validCGPAStudents = 0;
    let validSGPAStudents = 0;

    const classSGPADistribution = {};
    const classSemesterDifficulty = {};
    const semesterData = {};

    students.forEach((student, idx) => {
      const results = student.semesterResults;
      if (Array.isArray(results) && results.length > 0) {
        const finalSem = results.reduce((a, b) => (b.semester > a.semester ? b : a));
        const finalCGPA = parseFloat(finalSem.CGPA);

        if (!isNaN(finalCGPA) && finalCGPA > 0) {
          if (finalCGPA > highestCGPAInClass) {
            highestCGPAInClass = finalCGPA;
            console.log(`🌟 New highest CGPA: ${highestCGPAInClass} (Student #${idx + 1})`);
          }
        }

        results.forEach((sem) => {
          const semLabel = `Sem ${sem.semester}`;

          // SGPA Bin (rounded to nearest 0.5)
          if (!isNaN(sem.SGPA) && sem.SGPA > 0) {
            const rounded = Math.floor(sem.SGPA * 2) / 2;
            const binLabel = `${rounded.toFixed(1)}-${(rounded + 0.5).toFixed(1)}`;
            classSGPADistribution[binLabel] = (classSGPADistribution[binLabel] || 0) + 1;
          }

          // Difficulty list for this semester
          if (!classSemesterDifficulty[sem.semester]) {
            classSemesterDifficulty[sem.semester] = [];
          }
          if (!isNaN(sem.SGPA) && sem.SGPA > 0) {
            classSemesterDifficulty[sem.semester].push(sem.SGPA);
          }

          // Totals for CGPA/SGPA (overall)
          if (!isNaN(sem.CGPA) && sem.CGPA > 0) {
            totalClassCGPA += sem.CGPA;
            validCGPAStudents++;
          }
          if (!isNaN(sem.SGPA) && sem.SGPA > 0) {
            totalClassSGPA += sem.SGPA;
            validSGPAStudents++;
          }

          // Semester-wise data
          if (!semesterData[semLabel]) {
            semesterData[semLabel] = {
              totalCGPA: 0,
              totalSGPA: 0,
              countCGPA: 0,
              countSGPA: 0,
            };
          }
          if (!isNaN(sem.CGPA) && sem.CGPA > 0) {
            semesterData[semLabel].totalCGPA += sem.CGPA;
            semesterData[semLabel].countCGPA += 1;
          }
          if (!isNaN(sem.SGPA) && sem.SGPA > 0) {
            semesterData[semLabel].totalSGPA += sem.SGPA;
            semesterData[semLabel].countSGPA += 1;
          }
        });
      }
    });

    const classAverageCGPA = validCGPAStudents > 0 ? totalClassCGPA / validCGPAStudents : 0;
    const classAverageSGPA = validSGPAStudents > 0 ? totalClassSGPA / validSGPAStudents : 0;

    const semesterAverages = Object.entries(semesterData)
      .sort(([a], [b]) => {
        const aNum = parseInt(a.replace("Sem ", ""));
        const bNum = parseInt(b.replace("Sem ", ""));
        return aNum - bNum;
      })
      .map(([semester, data]) => ({
        semester,
        avgCGPA: data.countCGPA > 0 ? data.totalCGPA / data.countCGPA : 0,
        avgSGPA: data.countSGPA > 0 ? data.totalSGPA / data.countSGPA : 0,
      }));

    const cgpaHistory = semesterAverages.map((s) => ({ semester: s.semester, CGPA: s.avgCGPA }));
    const sgpaTrends = semesterAverages.map((s) => ({ semester: s.semester, SGPA: s.avgSGPA }));

    const heatmap = Object.entries(classSemesterDifficulty).map(([sem, sgpas]) => {
      const avgSGPA = sgpas.reduce((sum, val) => sum + val, 0) / sgpas.length;
      let difficulty = "🔴 Hard";
      if (avgSGPA >= 8) difficulty = "🟢 Easy";
      else if (avgSGPA >= 7) difficulty = "🟡 Moderate";

      return { semester: `Sem ${sem}`, avgSGPA, difficulty };
    });

    const comparisonData = semesterAverages.map((avg) => ({
      semester: avg.semester,
      "Your CGPA": cgpaHistory.find((s) => s.semester === avg.semester)?.CGPA || null,
      "Your SGPA": sgpaTrends.find((s) => s.semester === avg.semester)?.SGPA || null,
      "Class CGPA": avg.avgCGPA,
      "Class SGPA": avg.avgSGPA,
    }));

    console.log("📊 Final Summary:");
    console.log(`   • Avg Class CGPA: ${classAverageCGPA.toFixed(2)}`);
    console.log(`   • Avg Class SGPA: ${classAverageSGPA.toFixed(2)}`);
    console.log(`   • Highest CGPA in Class: ${highestCGPAInClass}`);
    console.log(`   • Total Semesters: ${Object.keys(semesterData).length}`);

    res.json({
      studentData: {
        cgpaHistory,
        sgpaTrends
      },
      classData: {
        sgpaDistribution,
        difficultyMap,
        avgClassCGPA,
        avgClassSGPA,
        highestCGPA: highestCGPAInClass   // ✅ Add this line
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching graph data:", error);
    res.status(500).json({ error: "Failed to fetch graph data" });
  }
});

module.exports = router;
