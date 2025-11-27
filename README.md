OWASP Risk Assessment Tool with AI Assistant

This is a full-stack, AI-powered web application designed to help cybersecurity professionals and developers perform standardized risk assessments based on the OWASP Risk Rating Methodology.
The application allows users to rate various Likelihood and Impact factors, calculates a final risk score (0-81), and permanently logs the results in a local database. It also features a contextual AI assistant (powered by Google Gemini) that can answer general security questions and analyze the user's saved assessment history.

Features
 * OWASP Standard Calculation: Uses Likelihood (L) and Impact (I) scoring (0-9 scale) to determine the final risk score (L x I).
 * Persistent History: Stores all assessments in a local SQLite database (risk_history.db) via the Python backend.
 * Contextual AI Chatbot: The AI assistant uses the Gemini API and is fed the user's recent assessment history to provide data-aware advice.
 * Data Visualization: Renders a Chart.js graph of the last 10 assessments for quick trend analysis.
 * Professional Dark Theme: Modern, dark-mode UI suitable for technical work.

Technologies Used
 * Frontend: HTML5, CSS3 (Bootstrap 5), JavaScript, Chart.js
 * Backend: Python, Flask, flask-cors, python-dotenv
 * Database: SQLite
 * AI/LLM: Google Gemini API (gemini-2.5-flash)

How to Run the Project

Prerequisites
 * Python 3.x installed.
 * An API Key for the Google Gemini API.
 * Git installed (for cloning and managing the project).

Setup Instructions
 * Clone the Repository:
   git clone [https://github.com/](https://github.com/)[YOUR_USERNAME]/owasp-risk-calculator.git
cd owasp-risk-calculator

 * Install Python Dependencies:
   It is recommended to use a virtual environment.
   pip install flask flask-cors python-dotenv google-genai

 * Configure AI Key:
   * Create a file named .env in the root directory (same place as owasp_risk_calculator.html).
   * Add your Gemini API key to this file:
     GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

 * Start the Flask Backend Server:
   Open your terminal in the project root and run:
   python backend/app.py

   This server must remain running for the database and AI features to work.
 * Open the Frontend:
   * While the server is running, open the file owasp_risk_calculator.html in your web browser.
The calculator and AI assistant should now be fully functional and connected to the server.