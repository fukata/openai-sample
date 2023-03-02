require('dotenv').config();

/**
 * チャットメッセージ
 * @type {*[]}
 */
const gMessages = [];

/**
 * あなたの名前
 * @type {string}
 */
let gName = '';

function addMessage(role, name, content) {
    gMessages.push(
        {
            role: role,
            name: name,
            content: content,
        }
    );
}

async function sendMessage(openai, message) {
    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: gMessages,
    });

    return response.data;
}

function receiveMessage(data) {
    // console.log(data.choices);
    const message = data.choices[0].message;
    addMessage(message.role, 'AI', message.content);
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

    gName = await inputMessage('あなたの名前を教えてください：');
    if (gName.length === 0) {
        console.error('名前を入力してください。');
        process.exit(1);
    }

    while(true) {
        const message = await inputMessage(`${gName}: `);
        // console.log(message);
        if (message.length > 0) {
            addMessage('user', gName, message);
            const data = await sendMessage(openai, message);
            receiveMessage(data);
        }
    }
}

main();