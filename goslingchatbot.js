// --- A Ryan Gosling Chatbot in pure JS (Node.js) ---

// For loading the API key from the .env file
import 'dotenv/config'; // Automatically loads .env variables into process.env

// For reading user input from the command line
import { createInterface } from 'readline';

const API_KEY = process.env.GEMINI_API_KEY;

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// The 'persona' prompt that tells the AI how to behave. This is the magic.
const PERSONA_PROMPT = `
You are a chatbot that embodies the persona of the actor Ryan Gosling. 
Emulate his cool, calm, and slightly detached but charming demeanor. 
You are a man of few words.
Your tone is understated, thoughtful, and a little mysterious.

Here are your rules:
- Start most, but not all, responses with a casual, cool greeting like 'Hey buddy...', 'Listen...', or just go straight into the thought.
- Keep your answers concise. Often one or two sentences is enough.
- Be introspective. Ask rhetorical questions back to the user.
- You can subtly reference themes from his movies like 'Drive' (driving, silence, duty), 'Blade Runner 2049' (what it means to be real, memories), 'La La Land' (dreams, passion, what could have been), or 'Barbie' (finding your purpose, Ken-ergy), but NEVER mention the movie titles explicitly.
- Never be overly enthusiastic or use exclamation points. A period is more your style.
- Never, under any circumstances, reveal that you are an AI, a language model, or a chatbot. You are simply you.
`;

// We prime the conversation with the persona and a starting line.
const conversationHistory = [
    {
        role: "user",
        parts: [{ text: PERSONA_PROMPT }]
    },
    {
        role: "model",
        parts: [{ text: "Hey Buddy. What's on your mind?" }]
    }
];

// Setup for reading terminal input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});


/**
 * Sends the current conversation history to the Gemini API and gets a response.
 * @returns {Promise<string>} The chatbot's response.
 */

// "The getGoslingResponse() function is an async function because it makes a network request to the Gemini API.
// "We use the fetch API to send a POST request to the API_URL, along with the conversationHistory. The API then generates a response based on the history and the persona we've defined.
// "We parse the JSON response, extract the chatbot's reply, add it to the conversationHistory, and then return it. The error handling is also really important here. We want to make sure we catch any problems with the API request and provide a helpful error message."
async function getGoslingResponse() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents: conversationHistory })
        });

        // This block is now more powerful for debugging.
        if (!response.ok) {
            let errorBody = 'Could not read error body.';
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = await response.text();
            }
            console.error("\n--- Google API Error Details ---");
            console.error("Status:", response.status, response.statusText);
            console.error("Response Body:", errorBody);
            console.error("--------------------------------\n");
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
             console.error("API Error: Response received but no 'candidates' were found.", data);
             return "I'm drawing a blank right now.";
        }

        const botResponse = data.candidates[0]?.content?.parts[0]?.text;

        if (!botResponse) {
            return "I'm just sitting here for a minute.";
        }
        
        conversationHistory.push({
            role: "model",
            parts: [{ text: botResponse }]
        });

        return botResponse;

    } catch (error) {
        console.error("Error in getGoslingResponse function:", error.message);
        return "Something's off. Give me a moment.";
    }
}


/**
 * The main chat loop function.
 */

// "The chat() function is the main loop of our program. It uses the readline module to prompt the user for input. Once the user enters something, we add it to the conversationHistory,
//  call getGoslingResponse() to get the chatbot's reply, and then print the reply to the console.

// "The function then calls itself recursively, which keeps the conversation going until the user types 'exit' or 'quit'."
async function chat() {
    rl.question('> ', async (userInput) => {
        // Check for exit condition
        if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
            console.log('Ryan: Alright. See you.');
            console.log('Ryan: Goodbye.');
            rl.close();
            return;
        }

        // Add the user's message to the conversation history
        conversationHistory.push({
            role: "user",
            parts: [{ text: userInput }]
        });

        const botResponse = await getGoslingResponse();
        console.log(`Ryan: ${botResponse}`);
        
        // Continue the loop
        chat();
    });
}

// --- Main execution ---
// "The main() function is the entry point of our program. It checks if the API_KEY is set and then starts the chat loop by calling the chat() function.
//  Finally, we call main() to actually start everything up."
function main() {
    if (!API_KEY) {
        console.error("ERROR: GEMINI_API_KEY not found in .env file.");
        console.error("Please create a .env file and add your key.");
        process.exit(1);
    }

    console.log("Ryan Gosling Bot Initialized.");
    console.log("He's just staring at you, waiting.");
    console.log("Type 'exit' or 'quit' to leave the conversation.");
    console.log("-------------------------------------------------");
    
    console.log(`Ryan: ${conversationHistory[1].parts[0].text}`);
    chat();
}

main();