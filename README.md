# Town Square

A digital town square where residents stay informed and engaged with their local community. Town Square removes barriers to civic engagement by making council decisions relevant and accessible, translating bureaucratic language into neighborhood-focused conversations.

<img height="250" alt="demopic1" src="https://github.com/user-attachments/assets/26b3482a-6a26-4f52-be02-c5a896bf45ce" />
<img height="250" alt="demopic3" src="https://github.com/user-attachments/assets/d026c93f-bc29-4663-aa83-99da1844297b" />

## Inspiration

The internet was meant to keep us informed, but now many of us know more about what is happening halfway across the world than in our own backyards.

Only 20% of Canadians reported that they have ever participated in a city council meeting. Although they may seem mundane, these meetings have lasting impacts on our local communities, spanning schools, hospitals, homes, and businesses.

We wanted to build a digital Town Square where people could go to get acquainted with the decisions that hit closest to home.

**Stay engaged. Stay informed. Stay local.**

## What it does

Town Square is a digital town square where residents stay informed and engaged with their community. It removes barriers to civic engagement by making council decisions relevant and accessible. By translating bureaucratic language into neighbourhood-focused conversations, Town Square helps bridge the gap between government decisions and the communities they affect, empowering more Vancouverites to participate in local democracy.

## How we built it

- **Frontend**: React + TypeScript with Leaflet for interactive mapping
- **Backend**: Node.js/Express fetching meeting metadata from the Vancouver City Council website to download PDF minutes
- **AI Summary**: Google's Gemini 2.5 Flash Lite generates summaries and extracts location-specific decisions with geocoded coordinates
- **Agentic AI Chat**: Fully autonomous assistant that reads available data and proactively triggers searches to find what users need

## Challenges we ran into

- **Prompt Engineering**: Achieving the "Town Square"-vibe responses that feel like a friendly neighbour talking about the local community, not generic AI speak
- **Performance & UX**: LLM responses are slow, so we implemented thread pools for concurrent processing and Server-Sent Events for streaming, plus fun local trivia during loading to keep users engaged

## Accomplishments that we're proud of

- **Automated AI information system**: The AI summary automatically retrieves information related to the decisions made and processes them on the fly.
- **User-controlled information depth**: We provide users with "In a nutshell" summaries for quick scanning + simple/detailed modes in AI chat so users control explanation depth
- **Fully Agentic AI chat**: Our chat proactively suggests date ranges when no data exists and autonomously triggers searches, anticipating user needs and making complex government decisions instantly digestible

## What we learned

We learned how to use AI in our product to make information more accessible to our users, using prompt engineering to make sure the AI uses simply understandable terms and agentic information retrieval to make sure that it is easy for the user to interact with the information if they have further questions.

We also learned how to use AI responsibly to assist development. Rather than blindly committing any AI change, we verified and tested it and made sure that it was doing what we intended to do before breaking our app.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open `http://localhost:5173` in your browser
