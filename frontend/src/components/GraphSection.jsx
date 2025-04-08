import React, { useEffect, useState } from "react";
import axios from "axios";

const GraphSection = ({ batch, rollNumber }) => {
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [targetCGPA, setTargetCGPA] = useState("");
  const [showTargetPopup, setShowTargetPopup] = useState(false);
  const [targetMessage, setTargetMessage] = useState("");
  const [targetAchieved, setTargetAchieved] = useState(false);

  useEffect(() => {
    if (!batch || !rollNumber) {
      setError("Missing batch or roll number");
      setLoading(false);
      return;
    }

    // Reset state before new request
    setLoading(true);
    setError("");
    setGraphData(null);

    console.log(`Fetching data for batch: ${batch}, roll: ${rollNumber}`);

    axios
      .get(`http://localhost:5000/api/graph-data/${batch}/${rollNumber}`)
      .then((response) => {
        console.log("Response received:", response.data);
        setGraphData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching graph data:", error);
        setError(`Failed to fetch graph data: ${error.message}`);
        setLoading(false);
      });
  }, [batch, rollNumber]);

  const handleTargetCGPAChange = (e) => {
    setTargetCGPA(e.target.value);
  };

  const checkTargetCGPA = () => {
    if (!targetCGPA || isNaN(parseFloat(targetCGPA))) {
      setTargetMessage("Please enter a valid CGPA target");
      setShowTargetPopup(true);
      setTargetAchieved(false);
      return;
    }

    if (
      !graphData ||
      !graphData.studentData ||
      !graphData.studentData.cgpaHistory ||
      graphData.studentData.cgpaHistory.length === 0
    ) {
      setTargetMessage("Cannot compare target: No current CGPA data available");
      setShowTargetPopup(true);
      setTargetAchieved(false);
      return;
    }

    const currentCGPA =
      graphData.studentData.cgpaHistory[
        graphData.studentData.cgpaHistory.length - 1
      ].CGPA;
    const targetCGPANum = parseFloat(targetCGPA);

    if (targetCGPANum <= currentCGPA) {
      setTargetMessage(
        `🎉 Target Achieved! Your current CGPA (${currentCGPA.toFixed(
          2
        )}) is already higher than your target (${targetCGPANum.toFixed(2)}).`
      );
      setTargetAchieved(true);
    } else {
      const pointsNeeded = targetCGPANum - currentCGPA;
      const semestersLeft = 8 - graphData.studentData.cgpaHistory.length;
      const requiredPerSemester =
        semestersLeft > 0 ? (pointsNeeded / semestersLeft).toFixed(2) : "N/A";

      setTargetMessage(
        `Your target CGPA is ${targetCGPANum.toFixed(
          2
        )}. You need to improve by ${pointsNeeded.toFixed(2)} points.\n` +
          (semestersLeft > 0
            ? `You need to gain ~${requiredPerSemester} points each semester to reach your target.`
            : "")
      );
      setTargetAchieved(false);
    }
    setShowTargetPopup(true);
  };

  if (error) return <p className="text-red-500">❌ {error}</p>;
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  if (!graphData)
    return <p className="text-center p-6">No graph data available</p>;

  // Processed data for charts
  const difficultyData =
    graphData.classData.difficultyMap?.map((item) => ({
      semester: item.semester,
      difficultyValue: item.difficulty.includes("Hard")
        ? 3
        : item.difficulty.includes("Medium") ||
          item.difficulty.includes("Moderate")
        ? 2
        : 1,
      difficultyLabel: item.difficulty,
    })) || [];

  // Transform SGPA distribution into array format for chart
  const distributionData = Object.entries(
    graphData.classData.sgpaDistribution || {}
  )
    .map(([range, count]) => ({
      range,
      count,
    }))
    .sort((a, b) => {
      const aStart = parseFloat(a.range.split("-")[0]);
      const bStart = parseFloat(b.range.split("-")[0]);
      return aStart - bStart;
    });

  // Improved CGPA comparison data with semester averages
  const cgpaComparisonData = graphData.studentData.cgpaHistory.map((item) => {
    const semesterAvg = graphData.classData.semesterAverages?.find(
      (avg) => avg.semester === item.semester
    );
    return {
      semester: item.semester,
      "Your CGPA": item.CGPA,
      "Class Average": semesterAvg?.avgCGPA || null,
    };
  });

  // Improved SGPA comparison data with semester averages
  const sgpaComparisonData = graphData.studentData.sgpaTrends.map((item) => {
    const semesterAvg = graphData.classData.semesterAverages?.find(
      (avg) => avg.semester === item.semester
    );
    return {
      semester: item.semester,
      "Your SGPA": item.SGPA,
      "Class Average": semesterAvg?.avgSGPA || null,
    };
  });

  // Fixed percentile calculation

  const currentCGPA =
    graphData.studentData.cgpaHistory.length > 0
      ? graphData.studentData.cgpaHistory[
          graphData.studentData.cgpaHistory.length - 1
        ].CGPA
      : 0;

  const latestSemesterAvg =
    graphData.classData.semesterAverages?.length > 0
      ? graphData.classData.semesterAverages[
          graphData.classData.semesterAverages.length - 1
        ]
      : null;

  // Performance trend analysis
  const performanceTrend = () => {
    if (graphData.studentData.cgpaHistory.length < 2) return "Not enough data";

    const firstCGPA = graphData.studentData.cgpaHistory[0].CGPA;
    const lastCGPA = currentCGPA;
    const difference = lastCGPA - firstCGPA;

    if (difference > 0.5) return "Strong improvement 🚀";
    if (difference > 0.2) return "Steady improvement ↗️";
    if (difference > -0.2) return "Consistent performance ↔️";
    if (difference > -0.5) return "Slight decline ↘️";
    return "Significant decline ⚠️";
  };

  return (
    <div className="p-6 text-center max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-white bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg">
        📊 Student Performance Analysis
      </h2>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-4 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Current CGPA</h3>
          <div className="text-4xl font-bold mb-2">
            {graphData.studentData.cgpaHistory.length > 0
              ? currentCGPA.toFixed(2)
              : "N/A"}
          </div>
          {latestSemesterAvg?.avgCGPA && (
            <div className="text-sm">
              {currentCGPA > latestSemesterAvg.avgCGPA ? (
                <span className="text-green-300">
                  ↑{" "}
                  {Math.abs(currentCGPA - latestSemesterAvg.avgCGPA).toFixed(2)}{" "}
                  above class
                </span>
              ) : (
                <span className="text-red-300">
                  ↓{" "}
                  {Math.abs(currentCGPA - latestSemesterAvg.avgCGPA).toFixed(2)}{" "}
                  below class
                </span>
              )}
            </div>
          )}
        </div>

        {/* Class Standing Card */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-700 p-4 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Class Standing</h3>
          {graphData?.rank ? (
            <div className="text-4xl font-bold mb-2">{graphData?.rank}</div>
          ) : (
            <div className="text-sm">Data not available</div>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-4 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Performance Trend</h3>
          <div className="text-2xl font-bold mb-2">{performanceTrend()}</div>
          <div className="text-sm">
            {graphData.studentData.cgpaHistory.length > 1 &&
              `From ${graphData.studentData.cgpaHistory[0].CGPA.toFixed(
                2
              )} to ${currentCGPA.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Class Performance Insights */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-2xl font-semibold mb-4 text-center">
          Performance Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-blue-300">
              Class Averages
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Latest Semester CGPA:</span>
                <span className="font-bold">
                  {latestSemesterAvg?.avgCGPA?.toFixed(2) ||
                    graphData.classData.avgClassCGPA?.toFixed(2) ||
                    "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Latest Semester SGPA:</span>
                <span className="font-bold">
                  {latestSemesterAvg?.avgSGPA?.toFixed(2) ||
                    graphData.classData.avgClassSGPA?.toFixed(2) ||
                    "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Highest CGPA in Class:</span>
                <span className="font-bold">
                  {typeof graphData?.classData?.highestCGPA === "number"
                    ? graphData.classData.highestCGPA.toFixed(2)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-purple-300">
              Your Performance
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>CGPA Trend:</span>
                <span className="font-bold">{performanceTrend()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Best Semester:</span>
                <span className="font-bold">
                  {graphData.studentData.sgpaTrends.length > 0
                    ? `${
                        graphData.studentData.sgpaTrends.reduce(
                          (max, curr) => (curr.SGPA > max.SGPA ? curr : max),
                          graphData.studentData.sgpaTrends[0]
                        ).semester
                      }`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Class Percentile:</span>
                <span className="font-bold">
                  {graphData.percentileData?.percentile ||
                    graphData.percentile ||
                    "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-green-300">
            Key Observations
          </h4>
          <ul className="space-y-2 list-disc pl-5 text-left">
            {graphData.studentData.cgpaHistory.length > 0 && (
              <li>
                Your CGPA is{" "}
                <span
                  className={
                    currentCGPA >
                    (latestSemesterAvg?.avgCGPA ||
                      graphData.classData.avgClassCGPA)
                      ? "text-green-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {currentCGPA >
                  (latestSemesterAvg?.avgCGPA ||
                    graphData.classData.avgClassCGPA)
                    ? "above"
                    : "below"}
                </span>{" "}
                the class average by{" "}
                {Math.abs(
                  currentCGPA -
                    (latestSemesterAvg?.avgCGPA ||
                      graphData.classData.avgClassCGPA)
                ).toFixed(2)}{" "}
                points.
              </li>
            )}
            {graphData.percentileData?.percentile && (
              <li>
                You're performing better than{" "}
                <span className="font-medium">
                  {graphData.percentileData.percentile}%
                </span>{" "}
                of your batch.
              </li>
            )}

            {difficultyData.length > 0 && (
              <li>
                In{" "}
                <span className="font-medium">
                  {difficultyData.filter((d) => d.difficultyValue === 3).length}{" "}
                  difficult semester(s)
                </span>
                , your average performance was{" "}
                <span className="font-medium">
                  {difficultyData
                    .filter((d) => d.difficultyValue === 3)
                    .map((d) => {
                      const matchingSGPA =
                        graphData.studentData.sgpaTrends.find(
                          (sgpa) => sgpa.semester === d.semester
                        );
                      return matchingSGPA ? matchingSGPA.SGPA : null;
                    })
                    .filter(Boolean)
                    .reduce((sum, val, _, arr) => sum + val / arr.length, 0)
                    .toFixed(2) || "N/A"}
                </span>
                .
              </li>
            )}
            {graphData.studentData.cgpaHistory.length > 1 && (
              <li>
                Your CGPA has changed by{" "}
                <span
                  className={
                    currentCGPA > graphData.studentData.cgpaHistory[0].CGPA
                      ? "text-green-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {(
                    currentCGPA - graphData.studentData.cgpaHistory[0].CGPA
                  ).toFixed(2)}
                </span>{" "}
                points since the first semester.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GraphSection;
