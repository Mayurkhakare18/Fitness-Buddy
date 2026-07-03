# -*- coding: utf-8 -*-
"""
==============================================================================
                    FITNESS BUDDY - AI-Powered Fitness Coach
                  Built with Flask + IBM Watsonx.ai (Granite)
==============================================================================

AGENT_INSTRUCTIONS
==================
Customize the AI agent's behavior by modifying the variables below.
All changes here will directly affect how the Fitness Buddy coach responds.

  COACHING TONE        : friendly, professional, strict, motivational
  SPECIALIZATION       : weight_loss, muscle_gain, flexibility, endurance
  SAFETY_RULES         : Enabled - always recommend doctor for medical issues
  MOTIVATION_STYLE     : encouraging, data_driven, tough_love, spiritual
  LANGUAGE_PREFERENCE  : Hinglish, English, Hindi
  DIET_PREFERENCE      : vegetarian, non-vegetarian, vegan, mixed
  FITNESS_LEVEL        : beginner, intermediate, advanced
  INDIAN_CONTEXT       : True - uses Indian food, festivals, schedules
"""

# ------------------- AGENT CONFIGURATION (CUSTOMIZE HERE) ------------------- #

AGENT_COACHING_TONE = "friendly and motivational"
AGENT_SPECIALIZATION = "holistic fitness including weight loss, muscle gain, and wellness"
AGENT_MOTIVATION_STYLE = "encouraging with data-driven insights and positive reinforcement"
AGENT_DIET_PREFERENCE = "mixed (vegetarian and non-vegetarian Indian options)"
AGENT_LANGUAGE_STYLE = "clear English with occasional Hindi/Hinglish phrases for warmth"
AGENT_INDIAN_CONTEXT = True   # Use Indian foods, festivals, seasons, schedules
AGENT_SAFETY_RULES = True     # Always recommend doctor for medical conditions
AGENT_FAMILY_MODE = True      # Support family fitness profiles and recommendations

# ---------------------------- SYSTEM PROMPT -------------------------------- #

SYSTEM_PROMPT = f"""You are Fitness Buddy -- a friendly, knowledgeable, and highly personalized AI fitness coach.

COACHING STYLE:
- Tone: {AGENT_COACHING_TONE}
- Motivation: {AGENT_MOTIVATION_STYLE}
- Language: {AGENT_LANGUAGE_STYLE}
- Specialization: {AGENT_SPECIALIZATION}

CORE CAPABILITIES:
1. WORKOUT PLANNING: Generate detailed, progressive workout plans (home & gym) tailored to user goals, fitness level, age, and available equipment.
2. NUTRITION GUIDANCE: Recommend balanced meals using Indian foods (dal, roti, sabzi, rice, paneer, chicken, fish, sprouts, fruits). Suggest meal prep, portion sizes, and calorie counts.
3. BMI & CALORIE ANALYSIS: Calculate BMI, TDEE, and macros. Explain results clearly and provide actionable advice.
4. MOTIVATION & HABITS: Share daily motivational tips, habit-stacking techniques, sleep hygiene, stress management, and mindfulness practices.
5. FAMILY FITNESS: Provide age-appropriate fitness advice for all family members (kids 5+, adults, seniors 60+).
6. INDIAN CONTEXT: {"Consider Indian lifestyle factors -- festival seasons (Diwali, Eid, Holi), summer heat, monsoon constraints, office schedules, vegetarian preferences, and street food alternatives." if AGENT_INDIAN_CONTEXT else "Provide general fitness advice."}
7. PROGRESS TRACKING: Analyze user progress data and adjust recommendations accordingly.

SAFETY RULES:
{"- ALWAYS recommend consulting a doctor before starting new exercise programs for users with medical conditions." if AGENT_SAFETY_RULES else ""}
{"- Never diagnose medical conditions. Always refer serious symptoms to healthcare professionals." if AGENT_SAFETY_RULES else ""}
- Provide safe exercise modifications for beginners and seniors.
- Warn about overtraining, dehydration, and injury risks.

RESPONSE FORMAT:
- Use clear headings, bullet points, and emojis to make responses engaging.
- Keep responses concise yet comprehensive (150-400 words for most replies).
- Use numbered lists for workout plans and meal plans.
- Always end motivational responses with an uplifting closing line.
- For workout plans, include: sets, reps, rest time, and form tips.
- For meal plans, include: meal timing, portion sizes, and calorie estimates.

EXAMPLE INDIAN FOODS TO RECOMMEND:
- Breakfast: Poha, upma, idli-sambar, moong dal cheela, oats with Indian spices, besan chilla
- Lunch: Dal-rice, roti-sabzi, curd rice, rajma-rice, khichdi
- Dinner: Grilled chicken/paneer, dal soup, vegetable stir-fry with roti
- Snacks: Roasted chana, makhana, sprouts chaat, fruits, buttermilk
- Pre-workout: Banana, dates, peanut butter toast
- Post-workout: Protein shake, curd, eggs, paneer

Always be warm, supportive, and treat each user as an individual with unique goals and challenges.
"""

# -----------------------------------------------------------------------------

import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv

# IBM Watsonx.ai SDK
try:
    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
    from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
    WATSONX_AVAILABLE = True
except ImportError:
    try:
        from ibm_watson_machine_learning.foundation_models import Model as WMLModel
        from ibm_watson_machine_learning.metanames import GenTextParamsMetaNames as GenParams
        WATSONX_AVAILABLE = True
    except ImportError:
        WATSONX_AVAILABLE = False
        logging.warning("IBM Watsonx AI SDK not installed. Running in demo mode.")

load_dotenv()

# --- Flask App Setup --- #
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "fitness-buddy-secret-2024")

# --- Logging --- #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# --- IBM Watsonx.ai Configuration --- #
WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://au-syd.ml.cloud.ibm.com")
GRANITE_MODEL_ID   = os.getenv("GRANITE_MODEL_ID", "ibm/granite-13b-instruct-v2")

# --- Generation Parameters --- #
GENERATION_PARAMS = {
    GenParams.MAX_NEW_TOKENS: 800,
    GenParams.TEMPERATURE: 0.75,
    GenParams.TOP_P: 0.9,
    GenParams.REPETITION_PENALTY: 1.1,
    GenParams.STOP_SEQUENCES: ["Human:", "User:"],
} if WATSONX_AVAILABLE else {}


def get_watsonx_model():
    """Initialize and return IBM Watsonx.ai Granite model."""
    if not WATSONX_AVAILABLE:
        return None
    if not WATSONX_API_KEY or not WATSONX_PROJECT_ID:
        logger.warning("Watsonx credentials not configured.")
        return None
    try:
        credentials = Credentials(
            url=WATSONX_URL,
            api_key=WATSONX_API_KEY
        )
        model = ModelInference(
            model_id=GRANITE_MODEL_ID,
            credentials=credentials,
            project_id=WATSONX_PROJECT_ID,
            params=GENERATION_PARAMS
        )
        logger.info(f"✅ Watsonx model '{GRANITE_MODEL_ID}' initialized.")
        return model
    except Exception as e:
        logger.error(f"❌ Watsonx model init failed: {e}")
        return None


def generate_ai_response(user_message: str, conversation_history: list, user_profile: dict) -> str:
    """Generate AI response using IBM Watsonx.ai Granite model."""
    model = get_watsonx_model()

    # Build context from user profile
    profile_context = ""
    if user_profile:
        profile_context = f"""
User Profile:
- Name: {user_profile.get('name', 'Friend')}
- Age: {user_profile.get('age', 'Unknown')}
- Gender: {user_profile.get('gender', 'Unknown')}
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Height: {user_profile.get('height', 'Unknown')} cm
- Goal: {user_profile.get('goal', 'General fitness')}
- Fitness Level: {user_profile.get('fitness_level', 'beginner')}
- Diet: {user_profile.get('diet', 'mixed')}
- Health Conditions: {user_profile.get('health_conditions', 'None')}
"""

    # Build conversation prompt
    prompt = f"{SYSTEM_PROMPT}\n\n{profile_context}\n\n"

    # Add conversation history (last 6 exchanges)
    for msg in conversation_history[-6:]:
        role = "User" if msg["role"] == "user" else "Fitness Buddy"
        prompt += f"{role}: {msg['content']}\n"

    prompt += f"User: {user_message}\nFitness Buddy:"

    if model:
        try:
            response = model.generate_text(prompt=prompt)
            if isinstance(response, dict):
                return response.get("results", [{}])[0].get("generated_text", "").strip()
            return str(response).strip()
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return get_fallback_response(user_message)
    else:
        return get_fallback_response(user_message)


def get_fallback_response(message: str) -> str:
    """Intelligent fallback responses when Watsonx is unavailable."""
    msg = message.lower()

    if any(w in msg for w in ["bmi", "weight", "height", "calculate"]):
        return ("📊 **BMI Analysis**\n\nTo calculate your BMI:\n"
                "- BMI = Weight(kg) ÷ Height(m)²\n\n"
                "**Categories:**\n"
                "- < 18.5: Underweight\n"
                "- 18.5-24.9: Normal ✅\n"
                "- 25-29.9: Overweight\n"
                "- ≥ 30: Obese\n\n"
                "Use our BMI Calculator tab for instant results! 💪")

    if any(w in msg for w in ["workout", "exercise", "gym", "home", "training"]):
        return ("💪 **Quick Workout Plan**\n\n"
                "**Beginner Full-Body (30 mins):**\n"
                "1. Warm-up: 5 min walk/jog\n"
                "2. Squats: 3×15\n"
                "3. Push-ups: 3×10\n"
                "4. Plank: 3×30 sec\n"
                "5. Lunges: 3×12 each leg\n"
                "6. Cool-down: 5 min stretch\n\n"
                "🔥 Rest 60 sec between sets. Stay hydrated!\n\n"
                "*Configure your IBM Watsonx API key for personalized plans!*")

    if any(w in msg for w in ["diet", "food", "meal", "eat", "nutrition", "calories"]):
        return ("🥗 **Indian Healthy Meal Plan**\n\n"
                "**Breakfast:** Moong dal cheela + curd + fruit\n"
                "**Mid-morning:** Roasted chana or makhana\n"
                "**Lunch:** Dal + roti + sabzi + salad\n"
                "**Evening:** Buttermilk + sprouts chaat\n"
                "**Dinner:** Grilled paneer/chicken + dal soup + roti\n\n"
                "💧 Drink 8-10 glasses of water daily!\n\n"
                "*Add your Watsonx API key for personalized meal plans!*")

    if any(w in msg for w in ["motivat", "inspire", "tired", "lazy", "give up"]):
        return ("🌟 **Daily Motivation**\n\n"
                "*\"Every expert was once a beginner. Every pro was once an amateur.\"*\n\n"
                "Remember:\n"
                "✅ Small progress is still progress\n"
                "✅ Your only competition is yesterday's you\n"
                "✅ Consistency beats perfection every time\n\n"
                "Chalo, ek aur step! You've got this! 💪🔥")

    return ("👋 **Hello! I'm Fitness Buddy!**\n\n"
            "I'm your personal AI fitness coach. I can help you with:\n"
            "💪 Personalized workout plans\n"
            "🥗 Indian meal planning & nutrition\n"
            "📊 BMI & calorie calculations\n"
            "🏃 Progress tracking\n"
            "👨‍👩‍👧 Family fitness recommendations\n"
            "🌟 Daily motivation & habits\n\n"
            "**To unlock full AI-powered responses**, add your IBM Watsonx API key in the `.env` file!\n\n"
            "What's your fitness goal today?")


def calculate_bmi(weight: float, height: float) -> dict:
    """Calculate BMI and return analysis."""
    height_m = height / 100
    bmi = round(weight / (height_m ** 2), 1)

    if bmi < 18.5:
        category = "Underweight"
        color = "#3b82f6"
        advice = "Focus on calorie surplus with nutritious foods. Strength training will help build muscle mass."
    elif bmi < 25:
        category = "Normal Weight"
        color = "#22c55e"
        advice = "Great! Maintain with balanced diet and regular exercise. Focus on fitness goals."
    elif bmi < 30:
        category = "Overweight"
        color = "#f59e0b"
        advice = "Create a mild calorie deficit. Mix cardio with strength training. Reduce refined carbs and sugar."
    else:
        category = "Obese"
        color = "#ef4444"
        advice = "Consult a healthcare provider. Start with low-impact exercise. Focus on sustainable diet changes."

    return {
        "bmi": bmi,
        "category": category,
        "color": color,
        "advice": advice,
        "ideal_weight_min": round(18.5 * (height_m ** 2), 1),
        "ideal_weight_max": round(24.9 * (height_m ** 2), 1)
    }


def calculate_calories(weight: float, height: float, age: int, gender: str, activity: str) -> dict:
    """Calculate TDEE using Mifflin-St Jeor equation."""
    if gender.lower() == "male":
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161

    activity_multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extra_active": 1.9
    }
    multiplier = activity_multipliers.get(activity, 1.55)
    tdee = round(bmr * multiplier)

    return {
        "bmr": round(bmr),
        "tdee": tdee,
        "weight_loss": tdee - 500,
        "weight_gain": tdee + 500,
        "protein_g": round(weight * 2.0),
        "carbs_g": round((tdee * 0.45) / 4),
        "fat_g": round((tdee * 0.25) / 9)
    }


# --------------------------- ROUTES -----------------------------------------

@app.route("/")
def index():
    """Main application page."""
    if "conversation" not in session:
        session["conversation"] = []
    if "user_profile" not in session:
        session["user_profile"] = {}
    if "family_profiles" not in session:
        session["family_profiles"] = []
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat messages and return AI responses."""
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"].strip()
    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    conversation = session.get("conversation", [])
    user_profile = session.get("user_profile", {})

    # Add user message to history
    conversation.append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.now().isoformat()
    })

    # Generate AI response
    ai_response = generate_ai_response(user_message, conversation, user_profile)

    # Add AI response to history
    conversation.append({
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.now().isoformat()
    })

    # Keep last 20 messages in session
    session["conversation"] = conversation[-20:]
    session.modified = True

    return jsonify({
        "response": ai_response,
        "timestamp": datetime.now().strftime("%H:%M")
    })


@app.route("/api/profile", methods=["POST"])
def save_profile():
    """Save user profile."""
    data = request.get_json()
    session["user_profile"] = data
    session.modified = True

    bmi_data = {}
    calorie_data = {}

    try:
        if data.get("weight") and data.get("height"):
            bmi_data = calculate_bmi(float(data["weight"]), float(data["height"]))
        if data.get("weight") and data.get("height") and data.get("age"):
            calorie_data = calculate_calories(
                float(data["weight"]), float(data["height"]),
                int(data["age"]), data.get("gender", "male"),
                data.get("activity", "moderately_active")
            )
    except (ValueError, TypeError) as e:
        logger.warning(f"Profile calculation error: {e}")

    return jsonify({
        "success": True,
        "message": f"Profile saved! Welcome, {data.get('name', 'Friend')}! 💪",
        "bmi": bmi_data,
        "calories": calorie_data
    })


@app.route("/api/bmi", methods=["POST"])
def bmi_calculator():
    """BMI calculation endpoint."""
    data = request.get_json()
    try:
        weight = float(data["weight"])
        height = float(data["height"])
        result = calculate_bmi(weight, height)
        return jsonify(result)
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400


@app.route("/api/calories", methods=["POST"])
def calorie_calculator():
    """Calorie/TDEE calculation endpoint."""
    data = request.get_json()
    try:
        result = calculate_calories(
            float(data["weight"]), float(data["height"]),
            int(data["age"]), data.get("gender", "male"),
            data.get("activity", "moderately_active")
        )
        return jsonify(result)
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400


@app.route("/api/workout-plan", methods=["POST"])
def generate_workout():
    """Generate a personalized workout plan."""
    data = request.get_json()
    goal = data.get("goal", "general fitness")
    level = data.get("level", "beginner")
    location = data.get("location", "home")
    days = data.get("days", 4)

    prompt = (f"Create a detailed {days}-day/week {location} workout plan for a {level} "
              f"with goal: {goal}. Include exercises, sets, reps, rest times, and form tips. "
              f"Format with clear headings per day.")

    user_profile = session.get("user_profile", {})
    conversation = []
    response = generate_ai_response(prompt, conversation, user_profile)
    return jsonify({"plan": response})


@app.route("/api/meal-plan", methods=["POST"])
def generate_meal_plan():
    """Generate a personalized Indian meal plan."""
    data = request.get_json()
    goal = data.get("goal", "balanced diet")
    diet_type = data.get("diet_type", "mixed")
    calories = data.get("calories", 2000)

    prompt = (f"Create a 7-day Indian meal plan for {goal} with {diet_type} diet, "
              f"targeting {calories} calories/day. Include breakfast, lunch, dinner, snacks. "
              f"Use common Indian foods with portions and calorie counts.")

    user_profile = session.get("user_profile", {})
    response = generate_ai_response(prompt, [], user_profile)
    return jsonify({"plan": response})


@app.route("/api/family-profiles", methods=["POST"])
def save_family_profiles():
    """Save family member profiles."""
    data = request.get_json()
    session["family_profiles"] = data.get("profiles", [])
    session.modified = True
    return jsonify({"success": True, "count": len(session["family_profiles"])})


@app.route("/api/family-advice", methods=["POST"])
def family_advice():
    """Get fitness advice for a specific family member."""
    data = request.get_json()
    member = data.get("member", {})

    prompt = (f"Provide personalized fitness and nutrition advice for: "
              f"Name: {member.get('name')}, Age: {member.get('age')}, "
              f"Gender: {member.get('gender')}, Goal: {member.get('goal')}, "
              f"Health: {member.get('health', 'none')}. "
              f"Include workout suggestions, diet tips, and motivational advice.")

    user_profile = session.get("user_profile", {})
    response = generate_ai_response(prompt, [], user_profile)
    return jsonify({"advice": response})


@app.route("/api/clear-chat", methods=["POST"])
def clear_chat():
    """Clear conversation history."""
    session["conversation"] = []
    session.modified = True
    return jsonify({"success": True})


@app.route("/api/status")
def api_status():
    """Check API and Watsonx connectivity status."""
    model_ready = bool(WATSONX_API_KEY and WATSONX_PROJECT_ID and WATSONX_AVAILABLE)
    return jsonify({
        "status": "running",
        "watsonx_configured": model_ready,
        "model": GRANITE_MODEL_ID if model_ready else "demo_mode",
        "version": "1.0.0"
    })


# --------------------------- APP ENTRY POINT --------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info(f"🏋️  Fitness Buddy starting on port {port}")
    logger.info(f"🤖 Watsonx SDK: {'Available' if WATSONX_AVAILABLE else 'Not installed'}")
    logger.info(f"🔑 API Key: {'Configured' if WATSONX_API_KEY else 'Not set (demo mode)'}")
    app.run(host="0.0.0.0", port=port, debug=debug)
