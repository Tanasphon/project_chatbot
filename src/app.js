require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const app = express();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web/static')));
app.set('views', path.join(__dirname, '../web/templates'));
app.set('view engine', 'ejs');

// Load game data
const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/game_info.json'), 'utf-8'));

// Function to find games by genre
function findGamesByGenre(genre) {
    return gameData.games.filter(game => 
        game.genre.toLowerCase().includes(genre.toLowerCase())
    );
}

// Function to format game list
function formatGameList(games, lang = 'th') {
    if (games.length === 0) return null;
    
    const gameList = games.map(game => 
        `- ${game.title} (${game.platform})`
    ).join('\n');

    return `เกมในหมวดหมู่นี้มีดังนี้:\n${gameList}\n\nต้องการทราบข้อมูลเพิ่มเติมเกี่ยวกับเกมไหนเป็นพิเศษไหมครับ?`;
}

// Function to analyze platform query
function analyzePlatformQuery(query) {
    const platforms = {
        'pc': ['pc', 'computer', 'windows', 'คอม', 'พีซี'],
        'ps5': ['ps5', 'playstation 5', 'เพลย์ 5'],
        'ps4': ['ps4', 'playstation 4', 'เพลย์ 4'],
        'switch': ['switch', 'nintendo', 'นินเทนโด', 'สวิตช์'],
        'xbox': ['xbox', 'เอ็กบอก']
    };

    for (const [platform, keywords] of Object.entries(platforms)) {
        if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
            return platform;
        }
    }
    return null;
}

// Function to find games by platform
function findGamesByPlatform(platform) {
    return gameData.games.filter(game => 
        game.platform.toLowerCase().includes(platform.toLowerCase())
    );
}

// Function to generate platform-specific response
function generatePlatformResponse(platform, games, lang = 'th') {
    if (games.length === 0) return null;

    const gamesByRating = [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const topGames = gamesByRating.slice(0, 3);

    let response = `เกมที่แนะนำสำหรับ ${platform.toUpperCase()}:\n\n`;
    
    topGames.forEach(game => {
        response += `🎮 ${game.title}\n`;
        if (game.rating) response += `⭐ คะแนน: ${game.rating}/100\n`;
        if (game.price) response += `💰 ราคา: ${game.price} บาท\n`;
        response += `📝 ${game.description}\n`;
        if (game.features) response += `🎯 จุดเด่น: ${game.features.join(', ')}\n`;
        if (game.multiplayer) response += `👥 รองรับการเล่นหลายคน\n`;
        response += '\n';
    });

    response += `ต้องการทราบข้อมูลเพิ่มเติมเกี่ยวกับเกมใดเป็นพิเศษไหมครับ?`;
    return response;
}

// Function to retrieve relevant game information
function getRelevantGameInfo(query) {
    // Check for platform-specific query
    const platform = analyzePlatformQuery(query);
    if (platform) {
        const platformGames = findGamesByPlatform(platform);
        if (platformGames.length > 0) {
            return { 
                type: 'platform', 
                data: platformGames,
                platform: platform 
            };
        }
    }

    // Check for genre query
    const genreKeywords = ['แนว', 'genre', 'ประเภท', 'rpg', 'action', 'fps', 'mmorpg'];
    const isGenreQuery = genreKeywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isGenreQuery) {
        const genres = ['RPG', 'Action', 'FPS', 'MMORPG', 'Adventure', 'Sandbox'];
        const matchedGenre = genres.find(genre => 
            query.toLowerCase().includes(genre.toLowerCase())
        );

        if (matchedGenre) {
            const gamesByGenre = findGamesByGenre(matchedGenre);
            if (gamesByGenre.length > 0) {
                return { type: 'genre', data: gamesByGenre };
            }
        }
    }

    // Regular game search
    const games = gameData.games.filter(game => 
        game.title.toLowerCase().includes(query.toLowerCase()) ||
        game.description.toLowerCase().includes(query.toLowerCase())
    );

    return { type: 'game', data: games };
}

// Function to detect language
function detectLanguage(text) {
    // ตรวจสอบว่ามีตัวอักษรภาษาไทยหรือไม่
    const thaiPattern = /[\u0E00-\u0E7F]/;
    return thaiPattern.test(text) ? 'th' : 'en';
}

// Function to format game information based on language
function formatGameInfo(games, lang = 'th') {
    return games.map(game => {
        const lines = [
            lang === 'th' ? 'ข้อมูลเกม:' : 'Game Information:',
            `${lang === 'th' ? 'ชื่อ' : 'Title'}: ${lang === 'th' && game.title_th ? game.title_th : game.title}`,
            `${lang === 'th' ? 'แพลตฟอร์ม' : 'Platform'}: ${game.platform}`,
            `${lang === 'th' ? 'ประเภท' : 'Genre'}: ${lang === 'th' && game.genre_th ? game.genre_th : game.genre}`,
            `${lang === 'th' ? 'วันวางจำหน่าย' : 'Release Date'}: ${game.release_date}`,
            `${lang === 'th' ? 'รายละเอียด' : 'Description'}: ${lang === 'th' && game.description_th ? game.description_th : game.description}`,
            `${lang === 'th' ? 'จำนวนผู้เล่น' : 'Player Count'}: ${lang === 'th' && game.player_count_th ? game.player_count_th : game.player_count}`,
            `${lang === 'th' ? 'คะแนน' : 'Rating'}: ${game.rating}/100`,
            `${lang === 'th' ? 'ราคา' : 'Price'}: ${game.price} ${lang === 'th' ? 'บาท' : 'THB'}`,
            `${lang === 'th' ? 'จุดเด่น' : 'Features'}: ${lang === 'th' && game.features_th ? game.features_th.join(', ') : game.features.join(', ')}`
        ];

        if (game.system_requirements) {
            lines.push(
                lang === 'th' ? '\nความต้องการของระบบ:' : '\nSystem Requirements:',
                lang === 'th' ? 'ขั้นต่ำ:' : 'Minimum:',
                `- OS: ${game.system_requirements.minimum.os}`,
                `- CPU: ${game.system_requirements.minimum.cpu}`,
                `- GPU: ${game.system_requirements.minimum.gpu}`,
                `- RAM: ${game.system_requirements.minimum.ram}`,
                lang === 'th' ? 'แนะนำ:' : 'Recommended:',
                `- OS: ${game.system_requirements.recommended.os}`,
                `- CPU: ${game.system_requirements.recommended.cpu}`,
                `- GPU: ${game.system_requirements.recommended.gpu}`,
                `- RAM: ${game.system_requirements.recommended.ram}`
            );
        }

        return lines.join('\n');
    }).join('\n\n');
}

// เพิ่มฟังก์ชันใหม่
function analyzeQuery(query) {
    // คำสำคัญสำหรับประเภทคำถามต่างๆ
    const keywords = {
        genre: ['แนว', 'genre', 'ประเภท', 'style', 'type'],
        price: ['ราคา', 'price', 'cost', 'แพง', 'ถูก'],
        rating: ['rating', 'score', 'review', 'คะแนน', 'รีวิว'],
        multiplayer: ['multiplayer', 'เล่นหลายคน', 'ออนไลน์', 'coop', 'เล่นกับเพื่อน'],
        similar: ['เหมือน', 'คล้าย', 'similar', 'แนวเดียวกับ', 'เทียบกับ'],
        compare: ['เทียบ', 'compare', 'vs', 'หรือ', 'ดีกว่า', 'แตกต่าง'],
        recommendation: ['แนะนำ', 'recommend', 'น่าเล่น', 'ดีไหม', 'ควรซื้อ']
    };

    // ตรวจสอบประเภทคำถาม
    for (const [type, keywordList] of Object.entries(keywords)) {
        if (keywordList.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
            return type;
        }
    }
    return 'general';
}

function generateResponse(type, query, games, lang = 'th') {
    switch (type) {
        case 'price':
            return formatPriceResponse(games, lang);
        case 'rating':
            return formatRatingResponse(games, lang);
        case 'multiplayer':
            return formatMultiplayerResponse(games, lang);
        case 'similar':
            return formatSimilarGamesResponse(games, lang);
        case 'compare':
            return formatComparisonResponse(games, lang);
        case 'recommendation':
            return formatRecommendationResponse(games, lang);
        default:
            return formatGameInfo(games, lang);
    }
}

function formatPriceResponse(games, lang = 'th') {
    const priceList = games.map(game => 
        `${game.title}: ${game.price} ${lang === 'th' ? 'บาท' : 'THB'}`
    ).join('\n');
    return `ข้อมูลราคาเกม:\n${priceList}`;
}

function formatRatingResponse(games, lang = 'th') {
    const ratingList = games.map(game => 
        `${game.title}: ${game.rating}/100 คะแนน`
    ).join('\n');
    return `คะแนนรีวิว:\n${ratingList}`;
}

function formatMultiplayerResponse(games, lang = 'th') {
    return games.map(game => 
        `${game.title}: ${game.multiplayer ? 'รองรับการเล่นหลายคน' : 'เล่นคนเดียวเท่านั้น'}`
    ).join('\n');
}

function formatSimilarGamesResponse(games, lang = 'th') {
    return games.map(game => 
        `เกมที่คล้ายกับ ${game.title}:\n${game.similar_games.join(', ')}`
    ).join('\n\n');
}

function formatRecommendationResponse(games, lang = 'th') {
    const recommendations = games.map(game => 
        `${game.title}\n- Rating: ${game.rating}/100\n- ${game.description}\n- จุดเด่น: ${game.features.join(', ')}`
    ).join('\n\n');
    return `เกมที่แนะนำ:\n${recommendations}`;
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const lang = detectLanguage(userMessage);
        const queryType = analyzeQuery(userMessage);
        const searchResult = getRelevantGameInfo(userMessage);

        let responseText;

        if (searchResult.data.length > 0) {
            if (searchResult.type === 'platform') {
                responseText = generatePlatformResponse(searchResult.platform, searchResult.data, lang);
            } else if (searchResult.type === 'genre') {
                responseText = formatGameList(searchResult.data, lang);
            } else {
                responseText = generateResponse(queryType, userMessage, searchResult.data, lang);
            }
        } else {
            const prompt = lang === 'th' ? 
                `คุณเป็นผู้เชี่ยวชาญด้านเกม โปรดตอบคำถามนี้: ${userMessage}` :
                `You are a gaming expert. Please answer this question: ${userMessage}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        "role": "system", 
                        "content": lang === 'th' ?
                            "คุณเป็นผู้เชี่ยวชาญด้านเกมที่ให้คำแนะนำอย่างละเอียดและเป็นกันเอง ตอบคำถามเป็นภาษาไทยเสมอ" :
                            "You are a gaming expert who provides detailed and friendly advice. Always respond in English."
                    },
                    {"role": "user", "content": prompt}
                ]
            });
            responseText = completion.choices[0].message.content;
        }
        
        res.json({ response: responseText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: detectLanguage(req.body.message) === 'th' ? 
                'ขออภัย เกิดข้อผิดพลาดในการประมวลผล' : 
                'Sorry, an error occurred'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 