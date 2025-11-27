import os
import sqlite3
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS 
from google import genai 

# ----------------- 1. SETUP AND INITIALIZATION -----------------

# Load the API Key from the hidden .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Setup Flask Server
app = Flask(__name__)
# Allows your HTML page (on a different port) to talk to this server
CORS(app) 

# Check key
if not GEMINI_API_KEY:
    print("Error: The secret key for the Gemini Brain is missing! Check your .env file.")
    exit(1)

# Setup Gemini Client and Chat Memory
client = genai.Client(api_key=GEMINI_API_KEY)
# Initialize the persistent chat session
chat = client.chats.create(model="gemini-2.5-flash")

# ----------------- 2. DATABASE FUNCTIONS -----------------

DATABASE_NAME = 'risk_history.db'

def get_db_connection():
    # Helper function to open and return a database connection
    conn = sqlite3.connect(DATABASE_NAME)
    # Allows accessing columns by name (like a dictionary)
    conn.row_factory = sqlite3.Row 
    return conn

def initialize_database():
    # Creates the database file and the main table if they don't exist
    conn = get_db_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                final_score TEXT NOT NULL,
                likelihood REAL NOT NULL,
                impact REAL NOT NULL,
                date_saved TEXT NOT NULL,
                weighted INTEGER NOT NULL
            );
        """)
        conn.commit()
    except Exception as e:
        print(f"Error initializing DB: {e}")
    finally:
        conn.close()

def get_recent_assessment_summary():
    """Fetches the 5 most recent assessments and formats them as a string for Gemini context."""
    conn = get_db_connection()
    assessments = conn.execute(
        'SELECT name, final_score, likelihood, impact, date_saved FROM assessments ORDER BY id DESC LIMIT 5'
    ).fetchall()
    conn.close()
    
    if not assessments:
        return "The user has no saved risk assessments yet in their database."
    
    summary = "The user's 5 most recent risk assessments are:\n"
    for row in assessments:
        # Format the summary for the AI to easily parse
        summary += (
            f"- Vuln: {row['name']} | Final: {row['final_score']} | "
            f"Likelihood: {row['likelihood']} | Impact: {row['impact']} | "
            f"Date: {row['date_saved'].split(' ')[0]}\n"
        )
        
    return summary

# Run the initialization when the app starts
initialize_database()

# ----------------- 3. API ENDPOINTS (ROUTES) -----------------

# ROUTE 1: Handles Gemini Chat Requests (CONTEXTUAL)
@app.route('/chat', methods=['POST'])
def handle_chat_message():
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({"response": "Please send a message."}), 400

    try:
        # 1. Fetch the user's past data summary from the database
        assessment_context = get_recent_assessment_summary()
        
        # 2. Construct the full prompt, including the context and instructions for the AI
        full_prompt = (
            f"SYSTEM INSTRUCTION: You are an expert cybersecurity and risk analysis assistant. "
            f"Use the CONTEXT FROM ASSESSMENT HISTORY below to answer the user's query if it asks about past data. "
            f"Otherwise, answer generally about risk factors or OWASP methodology. Keep answers concise.\n\n"
            f"--- CONTEXT FROM ASSESSMENT HISTORY ---\n"
            f"{assessment_context}\n"
            f"---------------------------------------\n\n"
            f"USER QUERY: {user_message}"
        )

        # 3. Send the contextual prompt to Gemini via the chat object to maintain memory
        response = chat.send_message(full_prompt)
        
        bot_response = response.text
        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"response": "Sorry, the Gemini brain is currently offline or busy."}), 500

# ROUTE 2: Fetches all history from the database
@app.route('/history', methods=['GET'])
def get_history():
    conn = get_db_connection()
    assessments = conn.execute('SELECT * FROM assessments ORDER BY id DESC').fetchall()
    conn.close()
    
    history_list = [dict(row) for row in assessments]
    return jsonify(history_list)

# ROUTE 3: Saves a new assessment to the database
@app.route('/history/save', methods=['POST'])
def save_assessment_to_db():
    data = request.json
    
    required_fields = ['name', 'finalScore', 'likelihood', 'impact', 'weighted']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required data fields."}), 400

    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO assessments (name, final_score, likelihood, impact, date_saved, weighted)
            VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?)
        """, (
            data['name'], 
            data['finalScore'], 
            float(data['likelihood']), 
            float(data['impact']), 
            int(data['weighted'])
        ))
        conn.commit()
        return jsonify({"message": "Assessment saved successfully."}), 201
    except Exception as e:
        conn.rollback()
        print(f"Database Save Error: {e}")
        return jsonify({"error": f"Database error during save: {e}"}), 500
    finally:
        conn.close()

# ROUTE 4: Clears all history from the database
@app.route('/history/clear', methods=['POST'])
def clear_history_db():
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM assessments')
        conn.commit()
        return jsonify({"message": "History cleared successfully."}), 200
    except Exception as e:
        conn.rollback()
        print(f"Database Clear Error: {e}")
        return jsonify({"error": "Database error during clear."}), 500
    finally:
        conn.close()

# ----------------- 4. RUN SERVER -----------------

if __name__ == '__main__':
    print("Server running! Ready for chat messages and database operations.")
    app.run(debug=True, port=5000)