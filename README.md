# 🏠 Aptly — AI-Powered Apartment Hunter

**The smartest way to rent your next home.**  
Aptly helps students, young adults, and anyone searching for a home **research, schedule, and organize** their entire rental hunt — all in one place.

---

## 📖 Table of Contents
- [Inspiration](#inspiration)
- [What It Does](#what-it-does)
- [How We Built It](#how-we-built-it)
- [Tech Stack](#tech-stack)
- [Challenges](#challenges)
- [Accomplishments](#accomplishments)
- [What's Next](#whats-next)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## 💡 Inspiration
One of our team members is a student at UT Austin, where on-campus dorms house only ~9,000 of 50,000 students. This forces most students into the competitive West Campus apartment market, where finding the right balance between **location, quality, and price** is incredibly hard.  
This isn’t just an Austin problem — **60% of U.S. college students** live off-campus, nearly **10 million undergraduates** who could benefit from Aptly.

---

## 🚀 What It Does
Aptly automates the apartment hunting process:
- **Understands your needs** via natural language.
- **Processes hundreds of listings** from major platforms.
- **Calls top properties** to verify availability and gather details.
- **Schedules tours** based on your calendar.
- **Keeps all info organized** so you spend minutes deciding, not hours searching.

---

## 🛠 How We Built It
- **Natural Language Processing**: Qwen 3 Instruct model via Cerebras to parse user preferences.
- **Data Gathering**: Exa API for intelligent scraping from Zillow, Apartments.com, StreetEasy, etc.
- **Data Structuring**: Google Gemini 2.5 Pro to extract rent, beds/baths, amenities, and contact info.
- **Visualization**: Interactive map showing top 10 listings via a weighted scoring algorithm.
- **Automation**: Vapi AI voice agents to call properties, verify details, and book tours.
- **Integration**: Google Calendar for automatic tour scheduling and transcript storage.

---

## 🧰 Tech Stack
- **Languages**: Node.js, TypeScript
- **AI/ML**: Qwen 3 Instruct, Gemini 2.5 Pro
- **APIs**: Exa API, Vapi, Google Maps, Google Calendar
- **Database**: Supabase
- **Other**: Web scraping, interactive mapping

---

## ⚠️ Challenges
- Coordinating multiple APIs and AI models in real-time.
- Structuring unstructured property data into a consistent format.
- Building a smooth end-to-end user flow for first-time users.

---

## 🏆 Accomplishments
- Built a **fully functional MVP** with all planned core features.
- Created a **voice-first AI pipeline** that can research and schedule tours in hours instead of weeks.
- Designed a **beautiful, intuitive web app** despite being first-time hackathon participants.

---

## 🔮 What's Next
- Expand to more cities and property platforms.
- Add user accounts with saved preferences.
- Implement advanced filtering and recommendation algorithms.
- Integrate with more calendar and messaging platforms.

---

## 📦 Installation
```bash
# Clone the repository
git clone https://github.com/FowwazM/Aptly.git

# Navigate into the project folder
cd Aptly

# Install dependencies
npm install

# Start the development server
npm run dev
