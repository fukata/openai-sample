require('dotenv').config();
const nj = require('numjs');

async function main() {
    const {Configuration, OpenAIApi} = require("openai");
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // 参照させたいデータ
    const res1 = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: "fukata は フリーランス の プログラマー です",
    });
    // const data = res1.data;
    // console.log(JSON.stringify(data));

    // 質問文
    const res2 = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: "fukataとは？",
    });

    const result = nj.dot(res2.data.data[0].embedding, res1.data.data[0].embedding);
    console.log(result);
    console.log(`score=${result.get(0,0)}`);
}

main();
