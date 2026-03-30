// Rule-based voice transaction classification (No API keys required!)

interface VoiceClassification {
    action: 'income' | 'expense' | 'none';
    amount: number | null;
    item: string | null;
    category: string | null;
}

// Multilingual keyword dictionaries
const incomeKeywords = {
    english: [
        'earned', 'earn', 'earning', 'salary', 'income', 'received', 'receive',
        'sold', 'sale', 'selling', 'profit', 'got', 'paid', 'payment',
        'owned', 'own', 'owning', 'and', 'end', 'on',
        'made', 'were made', 'today' // Common poor translations from Hindi financial phrases
    ],
    hindi: [
        'कमाया', 'आय', 'मिला', 'बेचा', 'लाभ', 'पगार', 'वेतन', 'मिले',
        'मुनाफा', 'munafa', 'नफा', 'nafa', 'कमाई', 'kamai', 'kama',
        'मुनाफा हुआ', 'profit', 'fayda', 'fayada', 'फायदा',
        'earn', 'own', 'and', 'end', 'aah', 'aaj' // 'aah/aaj' often heard at start
    ],
    marathi: [
        'मिळाले', 'उत्पन्न', 'पगार', 'विकले', 'नफा', 'कमावले',
        'मुनाफा', 'munafa', 'फायदा', 'fayda',
        'kama', 'milal'
    ]
};

const expenseKeywords = {
    english: ['spent', 'bought', 'paid', 'loss', 'purchase', 'expense', 'cost', 'bill', 'buy'],
    hindi: [
        'खर्च', 'खरीदी', 'खरीदा', 'दिया', 'खर्चा', 'बिल', 'लिया',
        'kharch', 'kharcha', 'khareed', 'loss', 'nuksan', 'nuksaan'
    ],
    marathi: [
        'खर्च', 'खरेदी', 'गमावले', 'दिले', 'बिल', 'घेतले',
        'kharch', 'khared', 'nuksan'
    ]
};

// Common item keywords for better categorization
const categoryKeywords: { [key: string]: string[] } = {
    'Food': ['food', 'lunch', 'dinner', 'breakfast', 'खाना', 'भोजन', 'जेवण', 'चाय', 'tea', 'coffee'],
    'Transport': ['taxi', 'bus', 'petrol', 'fuel', 'टैक्सी', 'पेट्रोल', 'auto', 'ऑटो'],
    'Groceries': ['grocery', 'vegetables', 'milk', 'सब्जी', 'दूध', 'भाजी', 'sabzi'],
    'Bills': ['electricity', 'water', 'rent', 'बिजली', 'पानी', 'किराया', 'bill'],
    'Shopping': ['clothes', 'shopping', 'कपड़े', 'खरीदारी', 'shirt', 'shoes'],
    'Salary': ['salary', 'वेतन', 'पगार', 'wage'],
    'Sales': ['sold', 'sale', 'customer', 'बेचा', 'ग्राहक', 'selling']
};

function extractAmount(text: string): number | null {
    // Remove commas from numbers like 2,000 to 2000
    const textWithoutCommas = text.replace(/(\d),(\d)/g, '$1$2');

    // Match numbers including decimals
    const numberMatch = textWithoutCommas.match(/\d+(\.\d+)?/);
    if (numberMatch) {
        return parseFloat(numberMatch[0]);
    }

    // Try to match word numbers (optional enhancement)
    const wordNumbers: { [key: string]: number } = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'ten': 10, 'twenty': 20, 'fifty': 50, 'hundred': 100,
        'thousand': 1000
    };

    const lowerText = text.toLowerCase();
    for (const [word, value] of Object.entries(wordNumbers)) {
        if (lowerText.includes(word)) {
            return value;
        }
    }

    return null;
}

function detectCategory(text: string): string {
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
            return category;
        }
    }

    return 'General';
}

function extractItem(text: string): string {
    // Remove numbers and common words to extract the item name
    const cleaned = text
        .replace(/\d+(\.\d+)?/g, '') // Remove numbers
        .replace(/rupees?|रुपये|रुपया|rs\.?|r\.p\./gi, '') // Remove currency words including phonetic mishearings
        .replace(/earned|spent|bought|paid|sold|कमाया|खर्च|खरीदा|मुनाफा|munafa|aaj|aah/gi, '') // Remove action words
        .trim();

    // Take first few meaningful words
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);
    const itemName = words.slice(0, 4).join(' ');

    return itemName || 'Transaction';
}

export async function classifyVoiceTransaction(transcript: string): Promise<VoiceClassification> {
    console.log('Classifying transcript:', transcript);

    const lowerText = transcript.toLowerCase();
    const amount = extractAmount(transcript);

    console.log('Extracted amount:', amount);

    // If no amount found, ignore
    if (!amount) {
        console.log('No amount detected, returning none');
        return {
            action: 'none',
            amount: null,
            item: null,
            category: null
        };
    }

    // Check for income keywords
    const allIncomeKeywords = [
        ...incomeKeywords.english,
        ...incomeKeywords.hindi,
        ...incomeKeywords.marathi
    ];

    const isIncome = allIncomeKeywords.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
    );

    // Check for expense keywords
    const allExpenseKeywords = [
        ...expenseKeywords.english,
        ...expenseKeywords.hindi,
        ...expenseKeywords.marathi
    ];

    const isExpense = allExpenseKeywords.some(keyword =>
        lowerText.includes(keyword.toLowerCase())
    );

    console.log('Is income:', isIncome, 'Is expense:', isExpense);

    // Determine action
    let action: 'income' | 'expense' | 'none' = 'none';
    if (isIncome && !isExpense) {
        action = 'income';
    } else if (isExpense && !isIncome) {
        action = 'expense';
    } else if (isExpense && isIncome) {
        // If both keywords present, default to expense (more common)
        action = 'expense';
    }

    const category = detectCategory(transcript);
    const item = extractItem(transcript);

    console.log('Classification result:', { action, amount, item, category });

    return {
        action,
        amount,
        item,
        category
    };
}
