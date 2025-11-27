// =================================================================
// 1. GLOBAL VARIABLES AND CUSTOM MATRICES
// =================================================================

let myChart; 

// Define custom risk matrices for different policies
const riskMatrices = {
    // Original Matrix: [Impact High, Medium, Low] x [Likelihood Low, Medium, High]
    standard: [
        ["Medium", "High", "Critical"],
        ["Low", "Medium", "High"],
        ["Note", "Low", "Medium"]
    ]
};
// Use 'standard' as the default risk matrix
let currentMatrix = riskMatrices.standard;

// =================================================================
// 2. DOM CONTENT LOADED (Initialization Block - runs once page is ready)
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // CHART INITIALIZATION
    var ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Threat Agent', 'Vulnerability Factors', 'Technical Impact', 'Business Impact'],
            datasets: [{
                label: 'Score',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMin:0,
                    suggestedMax:10
                }
            }
        }
    });
    
    // INITIAL FUNCTION CALLS
    calc_score(); 
    loadHistory();
});


// =================================================================
// 3. GLOBAL CALCULATION FUNCTIONS
// =================================================================

function calc_score()
{
  var LS = 0;
  var IS = 0;
  var dataset = [];
  const WEIGHT_MULTIPLIER = 1.5;
  
  // Get elements for weighted factors
  const motiveElement = document.getElementById('motive');
  const finanElement = document.getElementById('finan');
  const weightMotiveChecked = document.getElementById('weight_motive').checked;
  const weightFinanChecked = document.getElementById('weight_finan').checked;
  
  // Threat Agent Factors (TA)
  var motiveValue = parseInt(motiveElement.value);
  var TA =  parseInt(document.getElementById('sl').value)+ 
   (weightMotiveChecked ? motiveValue * WEIGHT_MULTIPLIER : motiveValue) + // Apply weight to Motive
    parseInt(document.getElementById('oppor').value) + 
    parseInt(document.getElementById('size').value);
  
  // Vulnerability Factors (VF)
  var VF =  parseInt(document.getElementById('eod').value) + 
    parseInt(document.getElementById('eoe').value) + 
    parseInt(document.getElementById('aware').value) + 
    parseInt(document.getElementById('intrude').value) + 0;
    
  LS = TA + VF;
  
  // Normalization for Chart (TA)
  const TA_DIVISOR = weightMotiveChecked ? 4 + (WEIGHT_MULTIPLIER - 1) : 4;
  TA = (TA / TA_DIVISOR).toFixed(3); 
  dataset.push(TA);
  VF = (VF/4).toFixed(3);
  dataset.push(VF);
  
  // Overall Likelihood Average (Normalization adjusted for weighting)
  const LS_DIVISOR = 8 + (weightMotiveChecked ? (WEIGHT_MULTIPLIER - 1) : 0);
  var LS_Avg = (LS / LS_DIVISOR).toFixed(3);
  
  var score_LS = 0;
  var s1 = document.getElementById('like_score');
  s1.innerHTML = LS_Avg;
  
  // Likelihood Score Coloring
  if(LS_Avg < 3)
  {
    s1.className = "btn btn-success";
    score_LS = 0; // Low (Index 0 for matrix lookup)
  }
  else if(LS_Avg >= 3 && LS_Avg < 6 )
  {
    s1.className = "btn btn-warning";
    score_LS = 1; // Medium (Index 1)
  }
  else
  {
    s1.className = "btn btn-danger";
    score_LS = 2; // High (Index 2)
  }
 
  // Technical Impact Factors (TI)
  var TI =  parseInt(document.getElementById('loc').value)+ 
   parseInt(document.getElementById('loi').value)+ 
    parseInt(document.getElementById('loa').value) + 
    parseInt(document.getElementById('loacc').value);
    
  // Business Impact Factors (BI)
  var finanValue = parseInt(finanElement.value);
  var BI =  (weightFinanChecked ? finanValue * WEIGHT_MULTIPLIER : finanValue) + // Apply weight to Finan
    parseInt(document.getElementById('reput').value) + 
    parseInt(document.getElementById('comply').value) + 
    parseInt(document.getElementById('privacy').value) + 0;

  IS = TI + BI;
  
  // Overall Impact Average (Normalization adjusted for weighting)
  const IS_DIVISOR = 8 + (weightFinanChecked ? (WEIGHT_MULTIPLIER - 1) : 0);
  var IS_Avg = (IS / IS_DIVISOR).toFixed(3);
  
  // Normalization for Chart (BI)
  const BI_DIVISOR = weightFinanChecked ? 4 + (WEIGHT_MULTIPLIER - 1) : 4;
  TI = (TI/4).toFixed(3);
  dataset.push(TI);
  BI = (BI / BI_DIVISOR).toFixed(3);
  dataset.push(BI);
  
  var s2 = document.getElementById('impact_score');
  s2.innerHTML = IS_Avg;
  var score_IS = 0;
  
  // Impact Score Coloring (OWASP matrix is inverted here for Y-axis lookup)
  if(IS_Avg < 3)
  {
    s2.className = "btn btn-success";
    score_IS = 2; // Low Impact (Maps to row index 2 in matrix)
  }
  else if(IS_Avg >= 3 && IS_Avg < 6 )
  {
    s2.className = "btn btn-warning";
    score_IS = 1; // Medium Impact (Maps to row index 1)
  }
  else
  {
    s2.className = "btn btn-danger";
    score_IS = 0; // High Impact (Maps to row index 0)
  }

  // Final Risk Matrix Lookup: matrix[Impact_Index][Likelihood_Index]
  var matrix = currentMatrix;
  var o_score = document.getElementById('overall_score');
  var final_score = matrix[score_IS][score_LS]
  o_score.innerHTML = final_score;
  o_score.style.color = "black";
  
  // Overall Score Background Color
  if(final_score == "Note")
  {
    o_score.style.background = 'lightgreen';
  }
  else if(final_score == "Low")
  {
    o_score.style.background = "Yellow";
  }
  else if(final_score == "Medium")
  {
    o_score.style.background = "Orange"
  }
  else if(final_score == "High")
  {
    o_score.style.background = "Red"
  }
  else if(final_score == "Critical")
  {
    o_score.style.background = "Pink"; 
  }

  updateChart(dataset);
}
    
function updateChart(dataset)
{
  if (myChart) {
    myChart.data.datasets[0].data = dataset;
    myChart.update();
  }
}

// =================================================================
// 4. PERSISTENCE FUNCTIONS (UPDATED FOR DATABASE INTEGRATION)
// =================================================================

// Base URL for the API endpoints
const API_URL = 'http://127.0.0.1:5000';

// Replaces the old loadHistory function (fetches data from the Python server)
async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/history`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const history = await response.json();
        displayHistory(history);
        return history;
    } catch (error) {
        console.error("Failed to load history from database:", error);
        // Display an error message if the server is down
        document.getElementById('history_output').innerHTML = '<p class="text-center text-danger">Database connection failed. Is the Python server running?</p>';
        return [];
    }
}

// Replaces the old saveAssessment function (sends data to the Python server)
async function saveAssessment() {
    const vulnName = document.getElementById('vuln_name').value.trim();
    const finalScore = document.getElementById('overall_score').innerHTML;
    const likelihoodScore = document.getElementById('like_score').innerHTML;
    const impactScore = document.getElementById('impact_score').innerHTML;
    
    // Validation check
    if (!vulnName || finalScore === '0' || finalScore === 'Note') {
        alert('Please enter a Vulnerability Name and complete a non-"Note" calculation before saving.');
        return;
    }

    const newAssessment = {
        name: vulnName,
        finalScore: finalScore,
        likelihood: likelihoodScore,
        impact: impactScore,
        // Send 1 (True) or 0 (False) to the database
        weighted: document.getElementById('weight_motive').checked || document.getElementById('weight_finan').checked ? 1 : 0
    };
    
    try {
        const response = await fetch(`${API_URL}/history/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAssessment)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(`Assessment for '${vulnName}' saved successfully to the database!`);
            document.getElementById('vuln_name').value = ''; 
            loadHistory(); // Reload history from the database
        } else {
            alert(`Save failed: ${data.error}`);
        }
    } catch (error) {
        console.error("Failed to save assessment:", error);
        alert("Connection Error: Could not reach the server to save assessment.");
    }
}

// Replaces the old clearHistory function (sends request to clear database)
async function clearHistory() {
    if (confirm("Are you sure you want to permanently delete all saved assessment history from the database?")) {
        try {
            const response = await fetch(`${API_URL}/history/clear`, { method: 'POST' });
            if (response.ok) {
                alert("Assessment history successfully cleared from the database!");
                loadHistory(); // Reloads the empty history list
            } else {
                alert("Failed to clear history on the server.");
            }
        } catch (error) {
            console.error("Failed to clear history:", error);
            alert("Connection Error: Could not reach the server to clear history.");
        }
    }
}

// Display function remains mostly the same, handling data from the DB
function displayHistory(history) {
    const outputDiv = document.getElementById('history_output');
    
    if (history.length === 0) {
        outputDiv.innerHTML = '<p class="text-center text-muted">No previous assessments saved in the database.</p>';
        return;
    }

    let tableHtml = `
        <table class="table table-striped table-hover">
            <thead class="thead-dark">
                <tr>
                    <th>Date</th>
                    <th>Vulnerability</th>
                    <th>Likelihood</th>
                    <th>Impact</th>
                    <th>Final Risk</th>
                    <th>Weighted?</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    history.forEach(item => {
        let colorClass;
        // Logic to assign color class based on final_score
        if (item.final_score && item.final_score.includes('Critical')) colorClass = 'table-danger';
        else if (item.final_score && item.final_score.includes('High')) colorClass = 'table-warning';
        else if (item.final_score && item.final_score.includes('Medium')) colorClass = 'table-info';
        else if (item.final_score && item.final_score.includes('Low')) colorClass = 'table-success';
        else colorClass = '';

        // Note the field names now match the database column names (snake_case)
        tableHtml += `
            <tr class="${colorClass}">
                <td>${item.date_saved ? item.date_saved.substring(0, 10) : 'N/A'}</td>
                <td>${item.name}</td>
                <td>${item.likelihood}</td>
                <td>${item.impact}</td>
                <td><strong>${item.final_score}</strong></td>
                <td>${item.weighted === 1 ? 'Yes' : 'No'}</td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    outputDiv.innerHTML = tableHtml;
}


// =================================================================
// 5. CHATBOT FUNCTIONS (REMAINS UNCHANGED FROM LAST UPDATE)
// =================================================================

// Function to toggle the chat window visibility
function toggleChat() {
    const chatWindow = document.getElementById('chatbot-window');
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
}

// --- CORE FUNCTION: USES FETCH API TO CONTACT PYTHON SERVER ---
async function processUserInput() {
    const inputField = document.getElementById('user-input');
    const history = document.getElementById('chat-history');
    let userInput = inputField.value.trim();
    
    if (userInput === '') return;
    
    // 1. Display user message immediately
    history.innerHTML += `<p class="user-message">${userInput}</p>`;
    history.scrollTop = history.scrollHeight;
    
    // Show a temporary "thinking" message
    const thinkingMessage = `<p class="bot-message" id="thinking-msg">... Gemini is thinking ...</p>`;
    history.innerHTML += thinkingMessage;
    history.scrollTop = history.scrollHeight;

    // Clear the input field while the server thinks
    inputField.value = '';
    
    try {
        // 2. Send the message to your Python server using Fetch
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Send the user message to the server
            body: JSON.stringify({ message: userInput }) 
        });

        // 3. Get the response from the server
        const data = await response.json();
        
        let botResponse;

        if (response.ok) {
             // The server returned a 200 OK status
             botResponse = data.response;
        } else {
            // The server returned an error status (e.g., 500)
            botResponse = `Server Error: ${data.response || 'Unknown server error.'}`;
        }
        
        // 4. Remove the temporary thinking message
        const thinkingElement = document.getElementById('thinking-msg');
        if (thinkingElement) {
            thinkingElement.remove();
        }

        // 5. Display the final bot response
        history.innerHTML += `<p class="bot-message">${botResponse}</p>`;
        history.scrollTop = history.scrollHeight;

    } catch (error) {
        // This catches network errors (e.g., if the Python server is not running)
        console.error("Fetch Error:", error);
        
        const thinkingElement = document.getElementById('thinking-msg');
        if (thinkingElement) {
            thinkingElement.remove();
        }
        
        history.innerHTML += `<p class="bot-message error">Connection Error: Could not reach the Python server at 127.0.0.1:5000. Is the server running?</p>`;
        history.scrollTop = history.scrollHeight;
    }
}