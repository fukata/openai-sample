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

/**
 * request/repsonse でメッセージを送信する
 * @param [OpenAIApi] openai
 * @param [String] message
 * @return [String] 返答結果 
 */
async function sendMessage(openai, message) {
    const response = await openai.createChatCompletion({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: gMessages,
    });

    return response.data;
}

/**
 * stream でメッセージを送信する
 * @param [OpenAIApi] openai
 * @param [String] message
 * @param [Function] onCallback
 */
async function sendMessageStream(openai, message, onCallback) {
    const response = await openai.createChatCompletion({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: gMessages,
        stream: true,
    }, { responseType: 'stream' });

    for await (const chunk of response.data) {
        const lines = chunk
          .toString("utf8")
          .split("\n")
          .filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
            const message = line.replace(/^data: /, "");
            if (message === "[DONE]") {
                const result = { role: 'assistant', content: '', finish: true };
                onCallback(result);
                return; // 完了
            }

            const json = JSON.parse(message);
            const token = json.choices[0].delta.content;
            const result = { role: 'assistant', content: token || '', finish: false };
            onCallback(result);
        }
    }
}

/**
 * メッセージの取得時の処理（表示・メッセージの追加）
 * @param [Object] sendMessage のレスポンス
 */
function receiveMessage(data) {
    // console.log(data.choices);
    const message = data.choices[0].message;
    addMessage(message.role, message.content);
    console.log(`AI: ${message.content}`);
}

/**
 * メッセージの取得時の処理（表示・メッセージの追加）
 * @param [Object] sendMessageStream のレスポンス
 * @param [String] fullContent chunkのcontentを結合した文字列
 */
function receiveMessageStream(data, fullContent) {
    // console.log(data);
    process.stdout.write(data.content);
    if (data.finish) {
      addMessage(data.role, fullContent);
      console.log('');
    }
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

async function processMessage(openai, message) {
    // console.log(message);
    if (message.length === 0) {
        return;
    }

    addMessage('user', message);

    if (process.env.OPENAI_STREAM === '1') {
        process.stdout.write(`AI: `);
        let fullContent = ''; 
        const onCallback = function(data) {
          fullContent += data.content;
          receiveMessageStream(data, fullContent);
        };
        await sendMessageStream(openai, message, onCallback);
    } else {
        const data = await sendMessage(openai, message);
        receiveMessage(data);
    }
}

async function main() {
    if (process.env.DEBUG === '1') {
      console.log(`== DEBUG ==
OPENAI_MODEL=${process.env.OPENAI_MODEL}
OPENAI_STREAM=${process.env.OPENAI_STREAM}
`);
    }

    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    while(true) {
        const message = await inputMessage(`あなた: `);
        await processMessage(openai, message);
    }
}

main();
