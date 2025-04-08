import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Alert } from '@mui/material';
import { EmojiEvents, TrendingUp, TrendingDown, BarChart, Whatshot } from '@mui/icons-material';

const PredictionCard = ({ predictionData }) => {
  // Check if predictionData or predictionData.details is undefined
  const hasDetails = predictionData && predictionData.details;
  
  // If no valid prediction data is available, show an error message
  if (!hasDetails) {
    return (
      <Card
        sx={{
          maxWidth: 500,
          mx: 'auto',
          mt: 4,
          p: 3,
          borderRadius: 3,
          background: 'rgba(30, 41, 59, 0.85)',
          color: 'white',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            sx={{
              background: 'linear-gradient(to right, #FACC15, #FF9F00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
            }}
          >
            CGPA Prediction Error
          </Typography>
          
          <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(239, 68, 68, 0.2)', color: 'white' }}>
            Unable to calculate prediction. Target CGPA might be lower than current CGPA.
          </Alert>
          
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
            Please set a target CGPA that is higher than your current CGPA to get a valid prediction.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Continue with the normal rendering if prediction data is available
  return (
    <Card
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 4,
        p: 3,
        borderRadius: 3,
        background: 'rgba(30, 41, 59, 0.85)',
        color: 'white',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <CardContent>
        {/* Title with Gradient Effect */}
        <Typography
          variant="h5"
          fontWeight="bold"
          gutterBottom
          sx={{
            background: 'linear-gradient(to right, #FACC15, #FF9F00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          CGPA Prediction Summary
        </Typography>

        {/* Final Prediction Message */}
        <Typography variant="body1" sx={{ fontSize: '1rem', mb: 2, fontStyle: 'italic', textAlign: 'center' }}>
          {predictionData.message}
        </Typography>

        {/* Estimated CGPA */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, alignItems: 'center' }}>
          <EmojiEvents sx={{ color: '#FACC15' }} />
          <Typography variant="body1">Estimated Final CGPA:</Typography>
          <Typography variant="body1" fontWeight="bold">{predictionData.details.predictedCGPA}</Typography>
        </Box>

        {/* Best & Worst Case Scenarios */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
          <TrendingUp sx={{ color: '#22C55E' }} />
          <Typography variant="body1" sx={{ color: '#22C55E' }}>Best-Case CGPA:</Typography>
          <Typography variant="body1" fontWeight="bold">{predictionData.details.bestCaseCGPA}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
          <TrendingDown sx={{ color: '#EF4444' }} />
          <Typography variant="body1" sx={{ color: '#EF4444' }}>Worst-Case CGPA:</Typography>
          <Typography variant="body1" fontWeight="bold">{predictionData.details.worstCaseCGPA}</Typography>
        </Box>

        {/* Semester-wise SGPA Predictions */}
        {predictionData.predictedSGPAs && (
          <>
            <Typography variant="body1" fontWeight="bold" mt={2}>📖 Predicted SGPA for Remaining Semesters:</Typography>
            {Object.entries(predictionData.predictedSGPAs).map(([semester, sgpa]) => (
              <Box key={semester} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">{semester}:</Typography>
                <Typography variant="body2" fontWeight="bold">{sgpa}</Typography>
              </Box>
            ))}
          </>
        )}

        {/* Confidence Score with Progress Bar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BarChart sx={{ color: '#60A5FA' }} />
            <Typography variant="body1">Confidence Score:</Typography>
            <Typography variant="body1" fontWeight="bold">{(predictionData.details.confidenceScore)}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Number(predictionData.details.confidenceScore)}
            sx={{ height: 6, borderRadius: 5, mt: 1, backgroundColor: '#374151', '& .MuiLinearProgress-bar': { backgroundColor: '#60A5FA' } }}
          />
        </Box>

        {/* Max Possible SGPA */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, alignItems: 'center' }}>
          <Whatshot sx={{ color: '#F97316' }} />
          <Typography variant="body1">Max Possible SGPA:</Typography>
          <Typography variant="body1" fontWeight="bold">{predictionData.details.maxPossibleSGPA}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PredictionCard;