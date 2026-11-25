# Rythu Mitra (రైతు మిత్ర)

**A crop-first farm companion for farmers in Telangana.**

Rythu Mitra brings crop diagnosis, farm advice, weather, and mandi prices into one simple app. A farmer can photograph a sick crop, understand what to do, ask questions in their own language, hear the answer aloud, check the weather, and see real market prices without moving between different tools.

## Why use Rythu Mitra

Generic AI tools can answer general farming questions, but they do not automatically understand the farmer's crop, local weather, chosen mandi region, or preferred language. They give broad answers unless the user explains everything first.

Rythu Mitra is built around real farming decisions:

- It looks at a leaf photo and helps identify the crop problem.
- It gives practical treatment and prevention guidance.
- It supports English and Telugu.
- It can listen to a farmer's question and speak the answer aloud.
- It shows weather for Telangana cities with a clear 7-day view.
- It shows real government mandi prices, not guessed numbers.

## What makes it different

### Crop-focused AI, not a generic chatbot
The assistant is guided specifically for agriculture. It helps with crops, fertilizers, pests, diseases, and field work in simple farmer-friendly language. The goal is useful field guidance, not a long generic answer.

### Voice-friendly for real field use
Farmers can speak their question using the microphone and hear the reply automatically. Crop Doctor also reads the result aloud after a scan, so a farmer does not need to read a long screen of text.

### Telugu-first experience
Switch between English and Telugu. Replies and spoken voice follow the selected language, so farmers can use the app comfortably in the language they know best.

### Real weather, local to Telangana
Choose from major Telangana cities and see current conditions, large weather icons, a 7-day forecast, and a short field advisory that helps decide irrigation, spraying, and fieldwork.

### Real mandi prices
Market prices come from the Government of India's Agmarknet data published on data.gov.in and are filtered for Telangana. Prices are shown per kilogram and the app does not invent prices or silently fall back to made-up data.

### Practical expert advice
Short articles cover crop care, soil health, pest control, and better market timing.

## A typical journey

1. **Open the home screen** and see today's weather, popular crops, market preview, and quick actions.
2. **Scan a crop** in Crop Doctor by uploading or taking a photo.
3. **Read or listen** to the diagnosis, treatment, and prevention guidance.
4. **Ask the AI advisor** using text or voice from the floating AI button.
5. **Check weather** for your Telangana city and plan the week.
6. **Check mandi prices** by searching and filtering commodities.
7. **Read expert advice** when you want simpler explanations of farming practices.

## Built for trust

Rythu Mitra is designed to be honest with farmers. If live data or AI service is unavailable, the app says so instead of pretending. It does not invent crop diagnosis, prices, schemes, or guarantees. Farmers should still confirm local prices and treatment decisions with their local mandi, agriculture officer, or product label before taking action.

## Who is it for

- farmers who want quick crop help in the field
- farmers who prefer Telugu and voice over typing
- farmer producer groups and field workers
- anyone who wants crop, weather, and market information in one simple place

## Focus

Rythu Mitra is focused on **Telangana**. The weather cities, market data, and farmer guidance are designed around Telangana conditions and needs.

## Technology used

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Lucide icons, NumberFlow, Sonner notifications.
- **Backend:** A small Node.js API service that keeps private keys off the browser.
- **AI:** Google Gemini for crop-focused chat, leaf diagnosis, and natural text-to-speech. Browser speech recognition is used for speech-to-text.
- **Weather:** Open-Meteo for current conditions and the 7-day forecast.
- **Market prices:** Government of India Agmarknet data through data.gov.in, filtered for Telangana.
- **User preferences:** Language and theme are remembered in the browser.
- **No login or database:** Demo users can open the app directly and use it without creating accounts.

## Hosting for demo users

### Current local demo

While the app is running on this computer, phones and laptops on the same Wi-Fi can open:

`http://10.29.80.21:3100`

This works only while the computer, API container, and frontend are running. It is suitable for a quick same-network demo.

### Public demo hosting

For users outside this Wi-Fi, the app should be hosted on a public HTTPS address.

Recommended setup:

- Host the Next.js frontend on **Vercel**.
- Host the Node.js API on **Render**, **Railway**, or **Fly.io**.
- Point the frontend to the public API address.
- Store `GEMINI_API_KEY` and `DATA_GOV_IN_API_KEY` only on the API host.
- Allow the frontend's public domain in the API's CORS settings.
- Share the HTTPS frontend link with demo users.

A single platform such as Render or Railway can also host both the frontend and API in one project.

**Important for demos:** Phone microphones and cameras usually require HTTPS. The same-Wi-Fi `http://` address is fine for browsing, but a public HTTPS link is needed for reliable voice and camera use.
