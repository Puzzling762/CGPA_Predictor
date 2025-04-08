import React from "react";
import { Typography, Box, Link } from "@mui/material";

const TermsAndConditions = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        px: { xs: 2, sm: 4, md: 8 },
        py: 6,
      }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{
          background: "linear-gradient(to right, #FACC15, #FF9F00)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
        }}
      >
        Terms and Conditions
      </Typography>

      <Typography variant="body2" color="#9CA3AF" textAlign="center" gutterBottom>
        Last updated: April 8, 2025
      </Typography>

      <Box component="section" mt={4} maxWidth="1000px" mx="auto">
        {[
          {
            title: "1. Purpose",
            content: [
              "This App is designed for educational and informational use only. It uses academic data from past and current batches of students to provide:",
              "• CGPA and SGPA analysis",
              "• Performance trend visualization",
              "• Class standing insights",
              "• CGPA target checkers and predictions",
              "The goal is to empower students with better academic self-awareness using available data trends."
            ]
          },
          {
            title: "2. Eligibility",
            content: [
              "This platform is primarily intended for students of NIT Jamshedpur.",
              "You may use the platform freely for personal academic insight and planning.",
              "Unauthorized use for commercial purposes, data scraping, or mass analysis without permission is prohibited."
            ]
          },
          {
            title: "3. Data Usage & Privacy",
            content: [
              "The platform processes academic data such as roll numbers, names, SGPA/CGPA history, and batch-wise results.",
              "This data is stored securely in the backend only, and is not publicly visible unless a user enters their own roll number.",
              "No contact information, passwords, or financial data is collected.",
              "All visualizations shown are anonymized unless the user chooses to view their personal academic data.",
              "The developer takes reasonable precautions to ensure data is handled responsibly and is used only for academic and research purposes.",
              "If you're a student and would like your data removed or anonymized, you can make a request via the contact form."
            ]
          },
          {
            title: "4. Predictions & Accuracy",
            content: [
              "All CGPA predictions are estimates based on trends observed in previous student data.",
              "The predictions do not guarantee actual future performance and should not be considered official or absolute.",
              "Users are advised to use their own judgment and consult academic mentors where necessary."
            ]
          },
          {
            title: "5. Intellectual Property",
            content: [
              "All code, visualizations, and analytics models are developed by the creator of this platform.",
              "Unauthorized reproduction, redistribution, or modification of the platform, codebase, or results is strictly prohibited."
            ]
          },
          {
            title: "6. Limitation of Liability",
            content: [
              "The creator of the platform is not liable for any decisions made based on the predictions or analytics provided.",
              "This tool is a student-led academic resource, and not an official product of NIT Jamshedpur.",
              "Use of the tool is entirely at your own discretion and risk."
            ]
          },
          {
            title: "7. Changes to Terms",
            content: [
              "These terms may be updated periodically. Continued use of the platform after changes indicates your acceptance of the revised terms."
            ]
          },
          {
            title: "8. Contact",
            content: [
              "For any concerns, data removal requests, or feedback, please contact:",
              "Name: Raj Lucky",
              "Gmail: raj376457@gmail.com",
              "LinkedIn:",
              "GitHub:"
            ],
            links: {
              LinkedIn: "https://www.linkedin.com/in/raj-lucky-7215aa259/",
              GitHub: "https://github.com/Puzzling762"
            }
          }
        ].map(section => (
          <Box key={section.title} mt={5}>
            <Typography variant="h6" sx={{ color: '#FACC15', fontWeight: 'bold', mb: 1 }}>
              {section.title}
            </Typography>
            {section.content.map((line, idx) => (
              <Typography
                key={idx}
                variant="body2"
                paragraph
                sx={{ ml: line.startsWith('•') ? 2 : 0 }}
              >
                {section.links && section.links[line.replace(":", "")] ? (
                  <>
                    {line}{" "}
                    <Link
                      href={section.links[line.replace(":", "")]}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "#60A5FA", textDecoration: "underline", wordBreak: "break-word" }}
                    >
                      {section.links[line.replace(":", "")]}
                    </Link>
                  </>
                ) : (
                  line
                )}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TermsAndConditions;
