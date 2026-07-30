import fs from 'fs';
import path from 'path';

const repoPath = path.join(process.cwd(), 'data/repository.json');
const qbPath = path.join(process.cwd(), 'data/question_bank_local.json');

let repo = [];
try {
  if (fs.existsSync(repoPath)) {
    repo = JSON.parse(fs.readFileSync(repoPath, 'utf8'));
  }
} catch (e) {
  repo = [];
}

let qb = [];
try {
  if (fs.existsSync(qbPath)) {
    qb = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
  }
} catch (e) {
  qb = [];
}

const worksheetsToSeed = [
  // --- ป.2: Food and Drinks (อาหารและเครื่องดื่ม) ---
  {
    id: "repo_seeded_p2_food_and_drinks_mc",
    createdAt: new Date().toISOString(),
    grade: "ป.2",
    topic: "Food and Drinks (อาหารและเครื่องดื่ม)",
    exerciseStyle: "multiple-choice",
    created_by: "admin",
    data: {
      title: "Food and Drinks (อาหารและเครื่องดื่ม)",
      gradeLabel: "ป.2",
      instructions: "Choose the correct answer for each question. (เลือกคำตอบที่ถูกต้องที่สุดสำหรับแต่ละข้อ)",
      passage: "",
      questions: [
        {
          id: 1,
          questionText: "What do you drink when you are thirsty? (คุณดื่มอะไรเมื่อรู้สึกกระหายน้ำ) 🥛",
          options: ["Milk", "Bread", "Rice", "Chicken"],
          correctAnswer: "Milk",
          explanation: "🥛 Milk แปลว่า นม เป็นเครื่องดื่มที่มีประโยชน์และดื่มแก้กระหายได้"
        },
        {
          id: 2,
          questionText: "Which one is a drink? (ข้อใดคือเครื่องดื่ม) 🧃",
          options: ["Apple juice", "Pizza", "Noodles", "Sandwich"],
          correctAnswer: "Apple juice",
          explanation: "🧃 Apple juice แปลว่า น้ำแอปเปิล เป็นเครื่องดื่ม"
        },
        {
          id: 3,
          questionText: "I like to eat _______ for breakfast. (ฉันชอบกิน... สำหรับอาหารเช้า) 🥪",
          options: ["a sandwich", "water", "tea", "soda"],
          correctAnswer: "a sandwich",
          explanation: "🥪 Sandwich เป็นอาหารที่นิยมรับประทานในมื้อเช้า"
        },
        {
          id: 4,
          questionText: "What do you drink in the morning? (คุณดื่มอะไรในตอนเช้า) 🥛",
          options: ["Hot milk", "Fried rice", "Salad", "Hamburger"],
          correctAnswer: "Hot milk",
          explanation: "Hot milk คือ นมร้อน เหมาะสำหรับดื่มมื้อเช้า"
        },
        {
          id: 5,
          questionText: "Which food is sweet? (อาหารชนิดใดมีรสหวาน) 🍦",
          options: ["Ice cream", "Soup", "Fish", "Rice"],
          correctAnswer: "Ice cream",
          explanation: "🍦 Ice cream (ไอศกรีม) มีรสหวาน"
        },
        {
          id: 6,
          questionText: "What is this food? 🍕",
          options: ["Pizza", "Water", "Orange juice", "Coffee"],
          correctAnswer: "Pizza",
          explanation: "🍕 Pizza แปลว่า พิซซ่า"
        },
        {
          id: 7,
          questionText: "Rabbits love to eat _______. (กระต่ายชอบกินอะไร) 🥕",
          options: ["carrots", "milk", "tea", "cake"],
          correctAnswer: "carrots",
          explanation: "🥕 carrots แปลว่า แครอท"
        },
        {
          id: 8,
          questionText: "Which one is healthy water to drink every day? (น้ำชนิดใดมีประโยชน์สูงสุดที่ควรดื่มทุกวัน) 💧",
          options: ["Pure water", "Cola", "Candy", "Ice cream"],
          correctAnswer: "Pure water",
          explanation: "💧 Pure water แปลว่า น้ำเปล่าบริสุทธิ์"
        },
        {
          id: 9,
          questionText: "We eat _______ with a spoon and fork. (เรารับประทานข้าวด้วยช้อนและส้อม) 🍚",
          options: ["rice", "water", "juice", "milk"],
          correctAnswer: "rice",
          explanation: "🍚 rice แปลว่า ข้าว"
        },
        {
          id: 10,
          questionText: "What do bees make? (ผึ้งผลิตอะไรที่มีรสหวาน) 🍯",
          options: ["Honey", "Lemonade", "Fried chicken", "Soup"],
          correctAnswer: "Honey",
          explanation: "🍯 Honey แปลว่า น้ำผึ้ง"
        }
      ]
    }
  },
  {
    id: "repo_seeded_p2_my_house_mc",
    createdAt: new Date().toISOString(),
    grade: "ป.2",
    topic: "My House (บ้านของฉัน)",
    exerciseStyle: "multiple-choice",
    created_by: "admin",
    data: {
      title: "My House (บ้านของฉัน)",
      gradeLabel: "ป.2",
      instructions: "Choose the correct answer for each room or object in the house. (เลือกคำตอบที่ถูกต้องสำหรับห้องหรือสิ่งของในบ้าน)",
      passage: "",
      questions: [
        {
          id: 1,
          questionText: "Where do you sleep? (คุณนอนหลับที่ห้องไหน) 🛏️",
          options: ["In the bedroom", "In the kitchen", "In the bathroom", "In the garden"],
          correctAnswer: "In the bedroom",
          explanation: "🛏️ bedroom คือ ห้องนอน"
        },
        {
          id: 2,
          questionText: "Where does mother cook food? (คุณแม่ทำอาหารที่ห้องไหน) 🍳",
          options: ["In the kitchen", "In the bedroom", "In the living room", "On the roof"],
          correctAnswer: "In the kitchen",
          explanation: "🍳 kitchen คือ ห้องครัว"
        },
        {
          id: 3,
          questionText: "Where do we watch television together? (เราดูทีวีร่วมกันในห้องไหน) 📺",
          options: ["In the living room", "In the bathroom", "In the garage", "On the stairs"],
          correctAnswer: "In the living room",
          explanation: "📺 living room คือ ห้องนั่งเล่น"
        },
        {
          id: 4,
          questionText: "Where do you wash your hands and take a shower? (คุณอาบน้ำและล้างมือที่ไหน) 🚿",
          options: ["In the bathroom", "In the dining room", "In the bedroom", "In the kitchen"],
          correctAnswer: "In the bathroom",
          explanation: "🚿 bathroom คือ ห้องน้ำ"
        },
        {
          id: 5,
          questionText: "Where do we eat dinner? (เรารับประทานอาหารเย็นที่ห้องไหน) 🍽️",
          options: ["In the dining room", "In the garage", "In the garden", "In the bathroom"],
          correctAnswer: "In the dining room",
          explanation: "🍽️ dining room คือ ห้องรับประทานอาหาร"
        }
      ]
    }
  },
  {
    id: "repo_seeded_p2_body_parts_mc",
    createdAt: new Date().toISOString(),
    grade: "ป.2",
    topic: "Parts of the Body (ร่างกาย)",
    exerciseStyle: "multiple-choice",
    created_by: "admin",
    data: {
      title: "Parts of the Body (ร่างกาย)",
      gradeLabel: "ป.2",
      instructions: "Choose the correct body part answer. (เลือกคำตอบส่วนต่างๆ ของร่างกายที่ถูกต้อง)",
      passage: "",
      questions: [
        {
          id: 1,
          questionText: "We see with our _______. (เรามองเห็นด้วย...) 👀",
          options: ["eyes", "ears", "nose", "legs"],
          correctAnswer: "eyes",
          explanation: "👀 eyes คือ ดวงตา"
        },
        {
          id: 2,
          questionText: "We listen to music with our _______. (เราฟังเพลงด้วย...) 👂",
          options: ["ears", "eyes", "mouth", "hands"],
          correctAnswer: "ears",
          explanation: "👂 ears คือ หู"
        },
        {
          id: 3,
          questionText: "We smell flowers with our _______. (เราดมกลิ่นดอกไม้ด้วย...) 👃",
          options: ["nose", "teeth", "feet", "arms"],
          correctAnswer: "nose",
          explanation: "👃 nose คือ จมูก"
        },
        {
          id: 4,
          questionText: "We walk and run with our _______. (เราเดินและวิ่งด้วย...) 🦵",
          options: ["legs and feet", "hands and fingers", "eyes and ears", "teeth and tongue"],
          correctAnswer: "legs and feet",
          explanation: "🦵 legs and feet คือ ขาและเท้า"
        },
        {
          id: 5,
          questionText: "We chew food with our _______. (เราเคี้ยวอาหารด้วย...) 🦷",
          options: ["teeth", "hair", "shoulders", "knees"],
          correctAnswer: "teeth",
          explanation: "🦷 teeth คือ ฟัน"
        }
      ]
    }
  },
  {
    id: "repo_seeded_p3_weather_mc",
    createdAt: new Date().toISOString(),
    grade: "ป.3",
    topic: "The Weather (สภาพอากาศ)",
    exerciseStyle: "multiple-choice",
    created_by: "admin",
    data: {
      title: "The Weather (สภาพอากาศ)",
      gradeLabel: "ป.3",
      instructions: "Select the correct weather term for each situation.",
      passage: "",
      questions: [
        {
          id: 1,
          questionText: "Take an umbrella! It is _______ today. 🌧️",
          options: ["rainy", "sunny", "windy", "snowy"],
          correctAnswer: "rainy",
          explanation: "🌧️ rainy หมายถึง ฝนตก ควรพกร่ม"
        },
        {
          id: 2,
          questionText: "Wear your sunglasses! The sun is shining. It is _______. ☀️",
          options: ["sunny", "cloudy", "stormy", "cold"],
          correctAnswer: "sunny",
          explanation: "☀️ sunny หมายถึง แดดจัด"
        },
        {
          id: 3,
          questionText: "Look at the kites flying high! It is very _______. 🪁",
          options: ["windy", "hot", "foggy", "rainy"],
          correctAnswer: "windy",
          explanation: "🪁 windy หมายถึง ลมแรง เหมาะกับการเล่นว่าว"
        },
        {
          id: 4,
          questionText: "Wear a thick jacket! It is very _______ outside. ❄️",
          options: ["cold", "hot", "sunny", "warm"],
          correctAnswer: "cold",
          explanation: "❄️ cold หมายถึง หนาวเย็น ควรใส่เสื้อแจ็กเก็ตหนาๆ"
        },
        {
          id: 5,
          questionText: "There are many dark clouds in the sky. It is _______. ☁️",
          options: ["cloudy", "sunny", "clear", "windy"],
          correctAnswer: "cloudy",
          explanation: "☁️ cloudy หมายถึง มีเมฆมาก"
        }
      ]
    }
  }
];

// Merge into repo
for (const item of worksheetsToSeed) {
  const existingIdx = repo.findIndex(r => r.id === item.id);
  if (existingIdx >= 0) {
    repo[existingIdx] = item;
  } else {
    repo.push(item);
  }

  // Also extract questions into local question bank entries
  if (item.data && Array.isArray(item.data.questions)) {
    for (const q of item.data.questions) {
      const qbId = `qb_${item.grade}_${item.topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${q.id}`;
      const qbItem = {
        id: qbId,
        subject: "English",
        grade: item.grade,
        cefr_level: item.grade === "ป.1" || item.grade === "ป.2" ? "Pre-A1" : "A1",
        topic: item.topic,
        grammar_focus: "Vocabulary & Grammar",
        vocabulary_focus: item.topic,
        question_type: item.exerciseStyle,
        difficulty: "Medium",
        learning_objective: `Master ${item.topic} for ${item.grade}`,
        source_id: "src_internal",
        source_category: "Internal Worksheet",
        ai_generated: "No",
        generation_method: "Curriculum Pre-seed",
        question_text: q.questionText,
        options: q.options || [],
        correct_answer: q.correctAnswer,
        explanation: q.explanation || "",
        tags: [item.grade, item.topic, item.exerciseStyle],
        created_at: new Date().toISOString(),
        created_by: "admin"
      };

      const existingQbIdx = qb.findIndex(x => x.id === qbId);
      if (existingQbIdx >= 0) {
        qb[existingQbIdx] = qbItem;
      } else {
        qb.push(qbItem);
      }
    }
  }
}

fs.writeFileSync(repoPath, JSON.stringify(repo, null, 2), 'utf8');
fs.writeFileSync(qbPath, JSON.stringify(qb, null, 2), 'utf8');

console.log(`Successfully seeded! Total Repository items: ${repo.length}, Total Question Bank items: ${qb.length}`);
