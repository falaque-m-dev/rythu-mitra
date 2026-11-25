# Speech Engine & Multimodal AI Specifications

## 1. Web Speech API Integration
Rythu Mitra leverages the W3C Web Speech API for voice interactions without server roundtrips:
- **SpeechRecognition (`webkitSpeechRecognition`)**:
  - Dynamically configured based on current language state:
    - English: `rec.lang = 'en-IN'` (Indian English accent recognition)
    - Telugu: `rec.lang = 'te-IN'` (Telugu phonetic recognition)
  - Features real-time interim results and automatic silence detection.
- **SpeechSynthesis (`window.speechSynthesis`)**:
  - Cleans markdown symbols (`*`, `#`, `_`) before reading.
  - Automatically queries available system voices (`speechSynthesis.getVoices()`) to select regional voices (`te` / `en-IN`).
  - Sets playback rate to `0.95` for enhanced comprehension among rural users.

---

## 2. Multimodal AI Data Contract
The backend `/api/diagnose` endpoint adheres to a standardized JSON schema:

```json
{
  "crop": "Chilli (Capsicum annuum)",
  "crop_te": "మిరప తోట",
  "disease": "Chilli Leaf Curl Virus",
  "disease_te": "మిరప ఆకు ముడత వైరస్",
  "severity": "High",
  "severity_te": "తీవ్రం",
  "symptoms": "Upward curling, puckering, stunted bush growth.",
  "symptoms_te": "ఆకులు పైకి ముడుచుకుపోవడం, మొక్క గిడసబారడం.",
  "organic_cure": "Spray Neem oil 5ml/L or 5% NSKE.",
  "organic_te": "వేప నూనె 5 మి.లీ లీటరు నీటికి పిచికారీ చేయాలి.",
  "chemical_cure": "Spray Fipronil 5% SC @ 2ml/L.",
  "chemical_te": "ఫిпроనిల్ 5% SC @ 2 మి.లీ లీటరు నీటికి కలపాలి.",
  "prevention": "Avoid excess urea, destroy infected weeds.",
  "prevention_te": "అధిక యూరియా వాడరాదు, కలుపు తొలగించాలి."
}
```

---

## 3. Expo Offline Resilience Guarantee
In exhibition halls with congested or failing Wi-Fi networks:
1. Online: Routes image and prompt to the Gemini Multimodal Vision API.
2. Offline Fallback: If network latency exceeds 3.5s or fails, queries local agricultural matrix (`data/crops_knowledge.json` & `data/demo_scenarios.json`).
3. The UI seamlessly displays verified agronomy prescriptions without crashing, freezing, or showing generic error dialogues to judges.
