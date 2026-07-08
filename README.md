# 🏋️ Fitness Buddy — AI-Powered Fitness Coach

> Built with **Flask** + **IBM Watsonx.ai** (Granite models) · Responsive · Dark Mode · Indian Nutrition

---

## 🌟 Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat Coach** | Real-time fitness coaching powered by IBM Granite |
| 💪 **Workout Planner** | Personalized home & gym plans (AI-generated) |
| 🥗 **Indian Meal Plans** | 7-day diet plans using Indian foods |
| 📊 **BMI Calculator** | Visual BMI meter with health advice |
| 🔥 **Calorie & Macro Tracker** | TDEE, macros, weight loss targets |
| 👨‍👩‍👧 **Family Profiles** | Age-appropriate advice for all family members |
| 📈 **Progress Tracker** | Weight trend charts, workout streaks |
| 🌙 **Dark Mode** | Full dark/light theme toggle |
| 📱 **Mobile Responsive** | Works on all screen sizes |

---

## 🚀 Quick Start (Local)

### 1. Prerequisites
- Python 3.9+
- IBM Cloud Account (free Lite tier)
- IBM Watsonx.ai Project

### 2. Clone & Setup

```bash
# Navigate to project folder
cd fitness-buddy

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy the example file
copy .env.example .env        # Windows
# OR
cp .env.example .env          # macOS/Linux

# Edit .env with your credentials (see below)
```

Edit `.env`:
```env
WATSONX_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
GRANITE_MODEL_ID=ibm/granite-13b-instruct-v2
SECRET_KEY=any-strong-random-string
```

### 4. Run the App

```bash
python app.py
```

Open browser: **http://localhost:5000**

---

## 🔑 Getting IBM Watsonx Credentials (Free Lite Tier)

### Step 1: IBM Cloud Account
1. Go to [https://cloud.ibm.com/registration](https://cloud.ibm.com/registration)
2. Register for a **free Lite account** (no credit card needed)

### Step 2: Create API Key
1. Go to **IBM Cloud Dashboard** → top-right menu → **Manage** → **Access (IAM)**
2. Click **API Keys** → **Create an IBM Cloud API key**
3. Copy the key immediately — it won't be shown again!

### Step 3: Create Watsonx.ai Project
1. Go to [https://dataplatform.cloud.ibm.com/](https://dataplatform.cloud.ibm.com/)
2. Click **New Project** → **Create an empty project**
3. Name it "Fitness Buddy"
4. Once created, go to **Manage** tab → copy your **Project ID**

### Step 4: Note Your Region URL
| Region | URL |
|---|---|
| US South | `https://us-south.ml.cloud.ibm.com` |
| EU-DE (Frankfurt) | `https://eu-de.ml.cloud.ibm.com` |
| AU-SYD (Sydney) | `https://au-syd.ml.cloud.ibm.com` |
| JP-TOK (Tokyo) | `https://jp-tok.ml.cloud.ibm.com` |

---

## ☁️ Deploy to IBM Cloud (Cloud Foundry — Free Lite Tier)

### Prerequisites
- [IBM Cloud CLI](https://cloud.ibm.com/docs/cli) installed
- Cloud Foundry plugin: `ibmcloud cf install-plugin`

### Deploy Steps

```bash
# Login to IBM Cloud
ibmcloud login --apikey YOUR_API_KEY -r us-south

# Target Cloud Foundry
ibmcloud target --cf

# Set environment variables (DON'T put credentials in manifest.yml)
ibmcloud cf set-env fitness-buddy WATSONX_API_KEY "your_key"
ibmcloud cf set-env fitness-buddy WATSONX_PROJECT_ID "your_project_id"
ibmcloud cf set-env fitness-buddy WATSONX_URL "https://us-south.ml.cloud.ibm.com"
ibmcloud cf set-env fitness-buddy GRANITE_MODEL_ID "ibm/granite-13b-instruct-v2"
ibmcloud cf set-env fitness-buddy SECRET_KEY "your-strong-secret"

# Push the app
ibmcloud cf push fitness-buddy

# Check status
ibmcloud cf apps
```

App will be live at: `https://fitness-buddy-2nl7.onrender.com'

---

## 🎛️ Customizing the AI Agent

Open **`app.py`** and find the `AGENT_INSTRUCTIONS` section at the top:

```python
# ─────────────────────── AGENT CONFIGURATION (CUSTOMIZE HERE) ─────────────────────── #

AGENT_COACHING_TONE = "friendly and motivational"
AGENT_SPECIALIZATION = "holistic fitness including weight loss, muscle gain, and wellness"
AGENT_MOTIVATION_STYLE = "encouraging with data-driven insights and positive reinforcement"
AGENT_DIET_PREFERENCE = "mixed (vegetarian and non-vegetarian Indian options)"
AGENT_LANGUAGE_STYLE = "clear English with occasional Hindi/Hinglish phrases for warmth"
AGENT_INDIAN_CONTEXT = True   # Use Indian foods, festivals, seasons, schedules
AGENT_SAFETY_RULES = True     # Always recommend doctor for medical conditions
AGENT_FAMILY_MODE = True      # Support family fitness profiles and recommendations
```

**Examples:**
- Change `AGENT_COACHING_TONE = "strict and disciplined"` for a tough coach
- Change `AGENT_LANGUAGE_STYLE = "Hinglish"` for Hindi/English mixed responses
- Set `AGENT_INDIAN_CONTEXT = False` to disable Indian-specific suggestions

---

## 📁 Project Structure

```
fitness-buddy/
├── app.py                   # 🐍 Flask backend + AI agent + all routes
├── requirements.txt         # 📦 Python dependencies
├── Procfile                 # ☁️ Gunicorn startup for IBM Cloud
├── manifest.yml             # ☁️ IBM Cloud Foundry config
├── runtime.txt              # 🐍 Python version spec
├── .env.example             # 🔑 Environment variables template
├── templates/
│   └── index.html           # 🎨 Full single-page application UI
└── static/
    ├── css/
    │   └── style.css        # 🎨 Complete responsive stylesheet
    └── js/
        └── app.js           # ⚡ All frontend logic
```

---

## 🔧 IBM Granite Models Reference

| Model ID | Best For | Tokens |
|---|---|---|
| `ibm/granite-13b-instruct-v2` | Instructions, coaching | 8192 |
| `ibm/granite-13b-chat-v2` | Conversations | 8192 |
| `ibm/granite-7b-lab` | Fast responses | 4096 |
| `ibm/granite-3-8b-instruct` | Latest Granite 3 | 8192 |
| `ibm/granite-3-2b-instruct` | Lightweight | 4096 |

Change model in `.env`: `GRANITE_MODEL_ID=ibm/granite-3-8b-instruct`

---

## 🔒 Security Notes

- ✅ `.env` file is in `.gitignore` — never committed
- ✅ API keys loaded via `python-dotenv` — not hardcoded
- ✅ Input sanitization on all form fields
- ✅ Session-based conversation history (server-side)
- ✅ HTTPS enforced on IBM Cloud deployment

---

## 🆓 IBM Cloud Lite Tier Limits

| Resource | Free Limit |
|---|---|
| Watsonx.ai Token Usage | 25,000 tokens/month |
| Cloud Foundry Memory | 256 MB |
| Cloud Foundry Apps | 1 app |
| App Uptime | Always on (Lite) |

> **Note:** For production use, upgrade to IBM Cloud Pay-As-You-Go for more tokens and resources.



---

## 📞 Support & Customization

For questions, open an issue or contact the project maintainer.

Built with ❤️ using **IBM Watsonx.ai** | **Flask** | **Bootstrap 5**
