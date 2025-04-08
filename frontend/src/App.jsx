import { Routes, Route, Link } from "react-router-dom"; // ✅ No BrowserRouter here
import { useState } from "react";
import axios from "axios";
import "./App.css";
import PredictionCard from "./components/Card";
import GraphSection from "./components/GraphSection";
import TermsAndConditions from "./components/TermsConditions";
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

function PredictorPage() {
  const [rollNumber, setRollNumber] = useState("");
  const [targetCGPA, setTargetCGPA] = useState("");
  const [batch, setBatch] = useState("");
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateInputs = () => {
    if (!/^[0-9]{4}[A-Z]{2}[A-Z0-9]+$/.test(rollNumber.toUpperCase())) {
      setError("Invalid Roll Number format");
      return false;
    }
    if (isNaN(targetCGPA) || targetCGPA < 0 || targetCGPA > 10) {
      setError("Target CGPA must be between 0 and 10");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPredictionData(null);
    if (!validateInputs()) return;

    setLoading(true);
    setBatch(rollNumber.substring(0, 4));

    try {
      const response = await axios.post(`${BASE_URL}/api/predict-cgpa`, {
        roll_number: rollNumber.toUpperCase(),
        target_cgpa: targetCGPA,
      });
      
      setPredictionData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎓 CGPA Predictor</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md w-96">
        <label className="block mb-2 font-semibold">Roll Number:</label>
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
          className="w-full p-2 rounded bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
          required
        />

        <label className="block mb-2 font-semibold">Target CGPA:</label>
        <input
          type="number"
          step="any"
          value={targetCGPA}
          onChange={(e) => setTargetCGPA(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-bold transition duration-200 disabled:bg-gray-600"
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict CGPA"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">❌ {error}</p>}
      {predictionData && <PredictionCard predictionData={predictionData} />}
      {batch && rollNumber && <GraphSection batch={batch} rollNumber={rollNumber} />}

      <Link to="/terms-and-conditions" className="mt-6 text-yellow-400 hover:underline text-sm">
        Terms and Conditions
      </Link>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PredictorPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
    </Routes>
  );
}

export default App;
