require('dotenv').config();

/**
 * チャットメッセージ
 * @type {*[]}
 */
const gMessages = [];

function addMessage(role, content) {
    gMessages.push(
        {
            role: role,
            content: content,
        }
    );
}

async function sendMessage(openai, message) {
    const response = await openai.createChatCompletion({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: gMessages,
    });

    return response.data;
}

function receiveMessage(data) {
    // console.log(data.choices);
    const message = data.choices[0].message;
    addMessage(message.role, message.content);
    console.log(`AI: ${message.content}`)
}

function inputMessage(question) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        readline.question(question, (answer) => {
            resolve(answer);
            readline.close();
        });
    });
}

async function main() {
    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    while(true) {
        const message = await inputMessage(`あなた: `);
        // console.log(message);
        if (message.length > 0) {
            addMessage('user', message);
            const data = await sendMessage(openai, message);
            receiveMessage(data);
        }
    }
}

main();
