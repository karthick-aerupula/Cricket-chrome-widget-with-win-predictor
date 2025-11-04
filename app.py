from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = None
try:
    model = joblib.load('win_predictor.pkl')
    print(f"✓ Model loaded successfully!")
    print(f"Model type: {type(model)}")
    # Check if model has feature names
    if hasattr(model, 'feature_names_in_'):
        print(f"Expected features: {model.feature_names_in_}")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    import traceback
    traceback.print_exc()

class MatchData(BaseModel):
    Over: float
    team1Score: int
    team2Score: int
    Number_of_wickets_fell: int
    ballsBowled: int
    ballsRemaining: int
    runsRequired: int
    crr: float
    rrr: float
    wicketsInHand: int

@app.post("/predict")
async def predict(data: MatchData):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # IMPORTANT: Use the EXACT feature names from training
        # Your model was trained with 'Number of wickets fell' (with spaces)
        input_df = pd.DataFrame([{
            'Over': data.Over,
            'team1Score': data.team1Score,
            'team2Score': data.team2Score,
            'Number of wickets fell': data.Number_of_wickets_fell,  # Note: spaces, not underscores!
            'ballsBowled': data.ballsBowled,
            'ballsRemaining': data.ballsRemaining,
            'runsRequired': data.runsRequired,
            'crr': data.crr,
            'rrr': data.rrr,
            'wicketsInHand': data.wicketsInHand
        }])
        
        print(f"Input data:\n{input_df}")
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        
        # Ensure prediction is between 0 and 1
        prediction = float(np.clip(prediction, 0.0, 0.99))
        
        return {"win_prob": round(prediction, 4)}
    
    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/")
async def root():
    status = "Model loaded ✓" if model is not None else "Model NOT loaded ✗"
    features = list(model.feature_names_in_) if model and hasattr(model, 'feature_names_in_') else []
    return {
        "message": "Cricket Win Predictor API is running!",
        "model_status": status,
        "expected_features": features
    }

@app.get("/test")
async def test():
    """Test endpoint with sample data"""
    sample_data = MatchData(
        Over=15.0,
        team1Score=180,
        team2Score=120,
        Number_of_wickets_fell=3,
        ballsBowled=90,
        ballsRemaining=30,
        runsRequired=61,
        crr=8.0,
        rrr=12.2,
        wicketsInHand=7
    )
    result = await predict(sample_data)
    return {
        "sample_input": sample_data.dict(),
        "prediction": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)