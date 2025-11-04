# Cricket-chrome-widget-with-win-predictor
# I made my own dataset for ts, rest was just JS, used FAST API to get the info from ML model. I used linear regression, so accuracy ain't that high. API key from rapid API.

## 🏏 Overview

A smart Chrome browser extension that displays live T20 cricket scores and predicts the chasing team's win probability using Machine Learning. No more switching between apps or tabs - get real-time match updates and AI-powered predictions directly on any webpage you're browsing.

## 🎯 Problem Statement

Cricket fans constantly switch between multiple apps or websites to check live scores and match predictions, causing inconvenience and breaking their workflow. This extension solves that by providing instant access to live T20 scores and ML-powered win predictions through a simple floating widget that appears on any website.

## ✨ Features

- **🔴 Live T20 Scores**: Real-time match data fetched from Cricbuzz API
- **🤖 AI Win Predictions**: Machine Learning model predicts chasing team's win probability during second innings
- **🌐 Works Everywhere**: Floating widget appears on any website without disrupting your browsing
- **⚡ One-Click Access**: Click extension icon to instantly view matches
- **🎮 Multi-Match Navigation**: Browse through multiple live T20 matches with prev/next buttons
- **🚫 Smart Filtering**: Automatically shows only T20 matches (excludes Test/ODI)
- **📊 Real-Time Updates**: Predictions update as you navigate between matches

## 🏗️ Architecture

```
┌─────────────────┐
│  Chrome Browser │
│   (Any Webpage) │
└────────┬────────┘
         │ Click Extension Icon
         ↓
┌─────────────────────────────────────┐
│    Chrome Extension (Frontend)      │
│  • JavaScript (Vanilla)             │
│  • Floating Widget UI               │
│  • Match Data Processing            │
└─────┬───────────────────┬───────────┘
      │                   │
      │ Fetch Scores      │ Send Features
      ↓                   ↓
┌──────────────┐    ┌─────────────────┐
│ Cricbuzz API │    │  FastAPI Server │
│ (RapidAPI)   │    │  (localhost)    │
└──────────────┘    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │   ML Model      │
                    │ (Linear Regr.)  │
                    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend (Chrome Extension)
- **Language**: JavaScript (ES6+)
- **Framework**: Chrome Manifest V3
- **API**: Cricbuzz via RapidAPI
- **UI**: Vanilla HTML/CSS/JS

### Backend (ML Server)
- **Framework**: FastAPI (Python)
- **ML Library**: scikit-learn
- **Model**: Linear Regression
- **Server**: Uvicorn
- **Serialization**: joblib/pickle

### APIs & External Services
- **Cricbuzz API**: Live cricket match data
- **RapidAPI**: API gateway

## 📋 Prerequisites

- **Google Chrome** browser
- **Python 3.10** (for pickle compatibility)
- **Anaconda** (recommended)
- **RapidAPI Key** (for Cricbuzz API)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cricket-win-predictor.git
cd cricket-win-predictor
```

### 2. Setup Python Environment
```bash
# Create conda environment with Python 3.10
conda create -n cricket-api python=3.10 -y

# Activate environment
conda activate cricket-api

# Install dependencies
pip install fastapi uvicorn joblib scikit-learn pandas numpy
```

### 3. Configure API Key
Edit `background.js` and replace the RapidAPI key:
```javascript
const RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE";
```

Get your key from: [RapidAPI - Cricbuzz](https://rapidapi.com/cricketapilive/api/cricbuzz-cricket/)

### 4. Start FastAPI Server
```bash
python app.py
```
Server will run on `http://127.0.0.1:5000`

### 5. Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the project folder
5. Extension icon will appear in toolbar

## 📖 Usage

1. **Start the FastAPI server** (keep it running)
   ```bash
   conda activate cricket-api
   python app.py
   ```

2. **Browse any website** (Google, YouTube, etc.)

3. **Click the extension icon** in Chrome toolbar

4. **Widget appears** showing:
   - Live T20 match scores
   - Team names and venue
   - Match status
   - **Win prediction** (if 2nd innings is in progress)

5. **Navigate matches** using `<` and `>` buttons

6. **Close widget** by clicking the `X` button

## 🎓 How It Works

### Match Data Fetching
1. Extension calls Cricbuzz API via RapidAPI
2. Filters only T20 matches
3. Extracts match details (teams, scores, overs, wickets)

### Win Prediction (Second Innings Only)
When the chasing team is batting:

1. **Feature Extraction** (10 features):
   - Current overs (e.g., 15.3)
   - Target score (Team 1's total)
   - Current score (Team 2's runs)
   - Wickets fallen
   - Balls bowled & remaining
   - Runs required
   - Current Run Rate (CRR)
   - Required Run Rate (RRR)
   - Wickets in hand

2. **ML Prediction**:
   - Features sent to FastAPI backend
   - Linear Regression model predicts win probability
   - Returns value between 0-1 (0% - 100%)

3. **Display**:
   - Green card shows: "XX.X% win probability"
   - Updates when navigating between matches

### UI States
- **2nd Innings + Live**: Shows green prediction card
- **1st Innings**: Shows "Prediction available in 2nd innings"
- **Match Complete**: No prediction shown
- **Test/ODI**: Filtered out (not displayed)

## 📁 Project Structure

```
cricket-win-predictor/
├── manifest.json              # Extension configuration
├── background.js              # Main extension logic (350+ lines)
├── app.py                     # FastAPI backend server
├── win_predictor.pkl          # Trained ML model (1.08 KB)
├── README.md                  # This file
└── screenshots/               # (Optional) Demo images
```

## 🧠 ML Model Details

- **Algorithm**: Linear Regression (scikit-learn)
- **Training Data**: Historical T20 match data
- **Input Features**: 10 (overs, runs, wickets, run rates, etc.)
- **Output**: Win probability (float, 0-1)
- **Model Size**: 1.08 KB
- **Response Time**: <500ms

### Feature Importance
The model considers:
- **Required Run Rate (RRR)**: Most critical factor
- **Wickets in Hand**: Team's batting depth
- **Balls Remaining**: Time pressure
- **Current Run Rate (CRR)**: Momentum indicator
- **Runs Required**: Target proximity

## 🎨 Screenshots

<!-- Add screenshots here -->
```
Widget showing live match:
[Screenshot of widget on webpage]

Win probability prediction:
[Screenshot of green prediction card]

Multiple matches navigation:
[Screenshot of prev/next buttons]
```

## 🔧 Configuration

### Change ML API URL
Edit `background.js` (line ~103):
```javascript
const ML_API_URL = "http://127.0.0.1:5000/predict";
```

### Adjust Widget Position
Edit `background.js` (lines ~30-35):
```javascript
position: "fixed",
top: "20px",    // Change position
right: "20px",  // Change position
width: "320px",
height: "240px"
```

### Filter Other Formats
Currently filters for T20 only. To include ODI, edit `background.js` (line ~230):
```javascript
if (matchFormat === "T20" && (m.matchInfo || m.matchScore)) {
```

## 🐛 Troubleshooting

### Issue: No matches showing
**Solution**: 
- Check if there are live T20 matches currently
- Verify RapidAPI key is valid
- Check browser console for errors (F12)

### Issue: Win probability not appearing
**Solution**:
- Ensure FastAPI server is running (`python app.py`)
- Check match is in 2nd innings (not complete)
- Verify in console: Look for "✅ Prediction received"

### Issue: "Connection refused" error
**Solution**:
- Start the FastAPI server: `python app.py`
- Verify it's running on port 5000
- Check firewall isn't blocking localhost connections

### Issue: CORS error
**Solution**:
- Ensure `app.py` has CORS middleware:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```

### Issue: Model loading error
**Solution**:
- Use Python 3.10 (pickle compatibility)
- Verify `win_predictor.pkl` is in project folder
- Check file isn't corrupted

## 🎯 Future Enhancements

- [ ] Deploy FastAPI to cloud (Heroku/Railway) for remote access
- [ ] Add auto-refresh every 30 seconds
- [ ] Support for ODI matches with separate model
- [ ] Historical prediction accuracy graph
- [ ] User settings (favorite teams, notification preferences)
- [ ] Ball-by-ball commentary
- [ ] Prediction confidence intervals
- [ ] Dark/Light theme toggle
- [ ] Export match statistics

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍💻 Author

**Karthick Aerupula**
- Email: karthickaerupula@gmail.com

## 🙏 Acknowledgments

- **Cricbuzz API** for providing live cricket data
- **RapidAPI** for API gateway services
- **scikit-learn** for ML framework
- **FastAPI** for backend framework
- Cricket fans worldwide for inspiration! 🏏

## 📞 Support

If you encounter any issues or have questions:
maybe ask claude

---

⭐ ya better **Star this repo**

🐛 **Report bugs** to help improve the project and solve them yourself.

🔄 **Share** with fellow cricket enthusiasts! (yeah, no shit)

---

Made with ❤️ and ☕ by karthick aerupula
