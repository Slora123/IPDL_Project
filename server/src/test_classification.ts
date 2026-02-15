import { classifyVoiceTransaction } from './voice.js';

async function test() {
    const testCases = [
        {
            transcript: "Aah, 2,000 r.p. as we all know munafa hua",
            expected: 'income'
        },
        {
            transcript: "aaj 500 rupaye kamaye",
            expected: 'income'
        },
        {
            transcript: "200 kharch kiya",
            expected: 'expense'
        },
        {
            transcript: "Today, 2000 were made.",
            expected: 'income',
            note: 'Poor translation of "aaj do hazar rupayo k munafa hua"'
        }
    ];

    for (const testCase of testCases) {
        const result = await classifyVoiceTransaction(testCase.transcript);
        console.log(`Test: "${testCase.transcript}"`);
        console.log(`Expected: ${testCase.expected}, Got: ${result.action}`);
        console.log(`Amount: ${result.amount}, Item: ${result.item}, Category: ${result.category}`);
        console.log('---');
    }
}

test();
