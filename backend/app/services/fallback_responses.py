"""
Keyword-based fallback responses for when the Gemini API is rate-limited (429).
Each emotion group has 10+ unique messages so responses feel natural and varied.
A random message is selected each time to avoid repetition.
"""
import random

# ---------------------------------------------------------------------------
# ENGLISH FALLBACK RESPONSES
# ---------------------------------------------------------------------------

KEYWORD_RESPONSES_EN = {
    "anxiety": {
        "keywords": ["anxious", "anxiety", "nervous", "worried", "panic", "fear", "scared", "frightened", "uneasy", "dread"],
        "responses": [
            "It sounds like you're dealing with some anxious feelings right now, and that's completely valid. Try taking a slow, deep breath — inhale for 4 counts, hold for 4, and exhale for 4. Even one round can help calm your nervous system. 💙",
            "Anxiety can feel overwhelming, but remember — it's your body trying to protect you. Ground yourself by naming 5 things you can see right now. This simple trick can bring you back to the present moment. 🌿",
            "I hear you. Anxiety is tough, but you've gotten through anxious moments before, and you can do it again. Try placing your hand on your chest and feeling your heartbeat — it's a gentle reminder that you're here and you're okay. 💙",
            "When anxiety shows up, it can feel like everything is urgent. But most of the time, it's not. Try asking yourself: 'Will this matter in a week? A month?' Often, that perspective shift can bring relief. 🌱",
            "Feeling nervous is your brain's way of saying it cares about something. That's not a weakness — it's human. Try wiggling your toes or pressing your feet firmly into the ground. It sounds simple, but it really helps. 💙",
            "Anxiety often lives in the 'what ifs.' Try gently redirecting your thoughts to 'what is.' What's true right now, in this moment? You're here, you're breathing, and you're reaching out. That takes courage. 🌟",
            "I want you to know that feeling anxious doesn't mean something is wrong with you. It's one of the most common human experiences. Try splashing cold water on your face — it activates your body's calming response. 💙",
            "When worry spirals start, try writing down your anxious thoughts on paper. Getting them out of your head and onto something physical can make them feel much more manageable. You've got this. 📝",
            "Take a moment and try the physiological sigh: two quick inhales through the nose, then a long exhale through the mouth. It's one of the fastest ways to calm your nervous system. You're doing great by reaching out. 💙",
            "Remember, anxiety is temporary — even when it doesn't feel that way. Picture your anxious thoughts as clouds passing through the sky. They come, and they go. You are the sky, not the clouds. ☁️",
        ],
    },

    "sadness": {
        "keywords": ["sad", "sadness", "unhappy", "crying", "tears", "heartbroken", "grief", "mourning", "loss", "depressed", "down", "blue", "miserable"],
        "responses": [
            "I can sense you're feeling sad, and I want you to know it's okay to feel this way. Sadness is a natural part of being human. Be gentle with yourself today. 💛",
            "It's okay to not be okay. Sometimes the bravest thing you can do is simply let yourself feel. If you need to cry, let it out — tears are healing in their own way. 💛",
            "I'm sorry you're going through this. Sadness can feel heavy, but it won't last forever. For now, try doing one small kind thing for yourself — a warm drink, a cozy blanket, or your favorite song. 🫂",
            "Your feelings matter, and it's okay to sit with sadness for a while. You don't have to rush to feel better. Healing isn't linear, and every emotion has its purpose. I'm here for you. 💛",
            "When we're sad, it can feel like the world has lost its color. But color always comes back. Try stepping outside for just a few minutes — fresh air and sunlight can gently lift your spirits. 🌤️",
            "Sadness often means you cared deeply about something. That's a beautiful, human thing. Take your time to process, and know that brighter moments are ahead. 💛",
            "You don't have to carry this alone. Even sharing what you're feeling — like you just did — is a step toward healing. I'm honored you trusted me with this. 🤗",
            "If sadness feels like a weight on your chest, try placing both hands over your heart and breathing slowly. This simple gesture can create a sense of safety and comfort. 💛",
            "It's perfectly normal to feel down sometimes. Try writing a letter to yourself with the same kindness you'd show a close friend going through the same thing. You deserve that compassion too. ✉️",
            "Remember that feeling sad doesn't mean you're weak. It means you're human. Tomorrow is a new day, and you have the strength to meet it. I believe in you. 💛",
        ],
    },

    "anger": {
        "keywords": ["angry", "anger", "furious", "frustrated", "annoyed", "irritated", "mad", "rage", "pissed", "resentful", "bitter"],
        "responses": [
            "It sounds like you're feeling frustrated or angry right now. That's a completely normal emotion. Try stepping away for a moment and taking a few deep breaths. Sometimes space helps us see things more clearly. 🧡",
            "Anger is a valid emotion — it's often telling us that a boundary has been crossed. Take a moment to breathe, and when you're ready, think about what specific thing triggered this feeling. 🧡",
            "I hear your frustration. When anger is intense, try clenching your fists tightly for 5 seconds, then releasing. Feel the tension leave. Repeat a few times — it's surprisingly effective. 🧡",
            "Being angry doesn't make you a bad person. It makes you human. Try channeling that energy into something physical — a brisk walk, squeezing a pillow, or even cleaning something. Movement helps. 💪",
            "Anger can feel like fire inside. Try the 'cooling breath': breathe in through your mouth as if sipping through a straw, then exhale slowly through your nose. It literally cools you down. 🧡",
            "It's okay to feel angry. What matters is how we respond to it. Before reacting, try counting to 10 slowly. This small pause can make a huge difference in how the situation unfolds. 🧡",
            "Frustration often comes from feeling unheard or powerless. Your feelings are valid. Try writing down exactly what's bothering you — sometimes seeing it on paper takes away some of its power. 📝",
            "When anger shows up, it's usually protecting a softer feeling underneath — like hurt or disappointment. Be curious about what's beneath the surface. You might find something important there. 🧡",
            "I understand you're going through something frustrating. Try tensing every muscle in your body for 5 seconds, then letting go completely. This helps reset your physical stress response. 🧡",
            "Remember, you're allowed to feel angry without acting on it immediately. Give yourself permission to cool down first. You'll make better decisions from a calm place. Take your time. 🧡",
        ],
    },

    "stress": {
        "keywords": ["stressed", "stress", "overwhelmed", "overloaded", "burned out", "burnout", "exhausted", "pressure", "swamped", "drowning", "too much"],
        "responses": [
            "It sounds like you're carrying a heavy load right now. Feeling overwhelmed is a sign that you care deeply. Try a 'brain dump' — write everything on your mind onto paper. It can feel surprisingly freeing. 💜",
            "When everything feels like too much, remember: you don't have to solve it all at once. Pick just ONE thing to focus on right now. Everything else can wait. 💜",
            "Stress is your body's signal that you need a break, even a small one. Try stepping away for just 5 minutes — stretch, breathe, look out a window. You deserve that pause. 💜",
            "Being stressed doesn't mean you're failing — it means you're pushing through something challenging. But you also need to recharge. What's one thing you can take off your plate today? 💜",
            "I can hear how overwhelmed you are. Try the 'two-minute rule': if something takes less than two minutes, do it now. It creates a small sense of accomplishment that can shift your mood. ✨",
            "When stress piles up, our breathing gets shallow. Right now, try three slow belly breaths — inflate your stomach like a balloon on the inhale, flatten it on the exhale. Simple but powerful. 💜",
            "You're doing more than you give yourself credit for. It's okay to say 'not right now' to things that aren't urgent. Protect your energy — it's a limited resource and you matter. 🛡️",
            "Overwhelm often comes from trying to hold everything in our heads. Try listing your tasks and circling just the top 3 priorities. Let go of the rest for today. You've got this. 💜",
            "Burnout is real, and it's not something to push through with willpower alone. Listen to your body. Rest isn't lazy — it's necessary. What's one restful thing you can do today? 💜",
            "Stress makes everything feel urgent, but most things aren't. Try asking: 'Does this need to happen today, or just eventually?' You might be surprised how much you can let breathe. 🌿",
        ],
    },

    "loneliness": {
        "keywords": ["lonely", "alone", "isolated", "nobody", "no one", "friendless", "disconnected", "abandoned", "left out"],
        "responses": [
            "Feeling lonely can be really tough, and I'm glad you reached out. Connection matters, even small moments of it. Consider texting someone today — even a simple 'hey, how are you?' can open a door. 💙",
            "Loneliness doesn't mean there's something wrong with you. It means you're human and you crave connection — that's healthy. You've already taken a brave step by sharing this. 💙",
            "Even in lonely moments, you're not truly alone. There are people who care about you, even if it doesn't feel like it right now. Try reaching out to one person today — you might be surprised. 💙",
            "I hear you, and I want you to know that this feeling is temporary. Loneliness comes in waves, and this wave will pass. In the meantime, try doing something that makes you feel alive — a walk, music, cooking. 🎵",
            "Sometimes loneliness is an invitation to reconnect with yourself first. Try journaling about what kind of connection you're craving. Understanding the need is the first step to meeting it. 💙",
            "Feeling disconnected is painful, but it's also very common — more people feel this way than you might think. You're not alone in feeling alone, if that makes sense. 💙",
            "When loneliness hits, try going somewhere with gentle human presence — a coffee shop, a park, a library. You don't have to talk to anyone. Just being around others can quietly ease the feeling. ☕",
            "I'm sorry you're feeling this way. Remember, loneliness is not about how many people are around you — it's about feeling understood. I'm here to listen, anytime. 💙",
            "Reaching out when you feel isolated takes real courage, and you just did that. That says something wonderful about your strength. You deserve connection, and it will come. 💙",
            "Try an act of kindness for a stranger today — a smile, holding a door, a small compliment. Kindness creates tiny connections that can lighten loneliness in unexpected ways. 🌟",
        ],
    },

    "sleep": {
        "keywords": ["sleep", "insomnia", "can't sleep", "tired", "fatigue", "restless", "nightmares", "awake", "tossing", "turning"],
        "responses": [
            "Sleep struggles can really affect how we feel during the day. Try putting screens away 30 minutes before bed, keep your room cool and dark, and try a body scan meditation. Rest is important — you deserve it. 🌙",
            "I'm sorry you're having trouble sleeping. Try the 4-7-8 technique: inhale for 4 seconds, hold for 7, exhale for 8. It's designed specifically to help your body prepare for sleep. 🌙",
            "Not being able to sleep is so frustrating. Instead of fighting it, try getting up and doing something quiet and boring — read something dull, fold laundry. Your body will let you know when it's ready. 🌙",
            "Sleep issues often come from a racing mind. Try a 'worry journal' before bed — write down everything on your mind, then close the notebook. It's like telling your brain 'I'll handle this tomorrow.' 📝",
            "Being tired affects everything — your mood, your focus, your patience. Be extra kind to yourself today. And tonight, try a warm shower before bed — the temperature drop afterward signals your body to sleep. 🌙",
            "If your mind won't quiet down at night, try counting your breaths backward from 100. It's boring enough to calm your brain but engaging enough to stop the thought spiral. 🌙",
            "Rest and sleep are your body's way of healing. Even if you can't sleep, lying still in a dark room gives your body some recovery. Don't stress about the clock — that makes it harder. 🌙",
            "Try creating a tiny bedtime ritual — the same tea, the same calming music, the same stretches. Your brain will start associating these cues with sleep over time. Consistency is key. 🍵",
            "Sleep deprivation is exhausting in every way. Please know it's okay to take things slower today. You don't have to operate at 100% all the time. Rest when you can. 🌙",
            "If nighttime anxiety keeps you up, try placing a hand on your stomach and focusing on making it rise and fall slowly. This activates your parasympathetic nervous system — your body's rest mode. 🌙",
        ],
    },

    "happiness": {
        "keywords": ["happy", "good", "great", "wonderful", "amazing", "blessed", "grateful", "thankful", "joy", "excited", "fantastic", "cheerful", "delighted"],
        "responses": [
            "That's wonderful to hear! 😊 Positive feelings are worth savoring. Take a moment to really sit with this good feeling — notice where you feel it in your body. Keep shining! ✨",
            "I love hearing that! 🌟 Hold onto this feeling. Try writing down what made you happy — on tough days, you can look back at it and remember that joy always returns.",
            "Your happiness just made me smile! 😊 Did you know that sharing good news with someone you trust actually makes the positive feeling last longer? Tell someone today! 🎉",
            "That's amazing! Positive emotions are like nutrients for your mental health. Soak it in. You deserve every bit of this happiness. ✨",
            "So glad you're feeling good! 🌈 Try to notice the small details of this moment — the sounds, the light, how your body feels. Mindfully experiencing joy makes it even richer.",
            "What a beautiful thing to share! Happiness isn't just about big moments — it's these everyday good feelings that build a fulfilling life. Enjoy every bit of it! 🌻",
            "You're glowing with positivity and I'm here for it! 🌟 Consider starting a gratitude jar — write down happy moments on slips of paper. On hard days, pull one out. It's magical.",
            "That's so great to hear! Remember, you're allowed to enjoy the good times without waiting for the other shoe to drop. This joy is yours. Own it! 😊",
            "Your positive energy is contagious! ☀️ Studies show that savoring good moments — really pausing to appreciate them — actually rewires your brain for more happiness. Keep savoring!",
            "I'm so happy for you! 🌟 Moments like these are proof that even when things are tough, good things still find their way to you. You attract what you radiate! ✨",
        ],
    },

    "confidence": {
        "keywords": ["confident", "proud", "accomplished", "achievement", "success", "won", "winning", "achieved", "promotion", "nailed"],
        "responses": [
            "That's amazing — you should be proud of yourself! 🌟 Recognizing your achievements is so important. Celebrate this win, no matter how small it might seem. You've earned it!",
            "Look at you go! 🎉 Your hard work is paying off. Take a moment to genuinely acknowledge what you accomplished — you deserve that recognition, especially from yourself.",
            "That's incredible! Remember this feeling when self-doubt creeps in. You proved you can do hard things. Write this win down somewhere you'll see it often. 🌟",
            "I love this for you! 💪 Confidence is built one accomplishment at a time, and you just added another block to the foundation. Keep building!",
            "You did it! 🎉 Don't downplay this — celebrate properly. Tell someone who cares about you, treat yourself to something nice. You earned this moment.",
            "Success looks good on you! 🌟 Remember, you didn't get here by accident. Your effort, your persistence, your choices — they all led to this. Be proud.",
            "What an accomplishment! 🏆 Moments like these are proof that you're more capable than you sometimes believe. Save this feeling for the days when you doubt yourself.",
            "That's worth celebrating! 🎊 People often rush past their wins to focus on the next challenge. Pause here. Let this success really sink in. You're doing great.",
            "You should absolutely be proud! 💪 Confidence isn't about being perfect — it's about showing up and doing your best. And that's exactly what you did.",
            "I'm so happy to hear that! 🌟 Your accomplishments are a reflection of who you are — someone determined, capable, and resilient. Keep that energy going!",
        ],
    },

    "confusion": {
        "keywords": ["confused", "lost", "uncertain", "don't know", "unsure", "stuck", "indecisive", "torn", "conflicted", "unclear"],
        "responses": [
            "Feeling uncertain can be uncomfortable, but it's also a sign that you're thinking deeply about things. Write down what's weighing on you — seeing things on paper helps bring clarity. 💙",
            "It's okay not to have all the answers right now. Confusion is often part of the process of figuring things out. Be patient with yourself — clarity will come. 🌱",
            "Feeling stuck is uncomfortable, but it doesn't mean you're going backwards. Sometimes pausing is the wisest thing you can do. The right path will become clearer with time. 💙",
            "When you feel lost, try asking yourself: 'What do I value most?' Decisions become easier when you connect them to your core values. Take your time with this. 🧭",
            "Confusion is just your brain processing a lot of information at once. That's actually a sign of growth. Try breaking the big question into smaller, more manageable ones. 💙",
            "It's perfectly fine to not know what to do next. Try talking it through with someone you trust — sometimes hearing your own thoughts out loud brings surprising clarity. 💙",
            "Feeling torn between options? Try writing a simple pros and cons list for each. It won't make the decision for you, but it can highlight what matters most to you. 📝",
            "When everything feels unclear, zoom out. Ask yourself: 'What would I tell my best friend in this same situation?' You often know more than you think. 💙",
            "Uncertainty is not a sign of weakness — it's a sign that you care about making the right choice. That thoughtfulness is a strength. Trust yourself. 🌟",
            "If you're feeling stuck, try changing your environment — go for a walk, sit in a different room, visit a park. Physical movement can help unstick mental blocks. 🚶",
        ],
    },

    "motivation": {
        "keywords": ["unmotivated", "lazy", "procrastinating", "can't focus", "distracted", "bored", "apathetic", "unproductive", "unmotivated", "no energy", "drained"],
        "responses": [
            "It's okay to have low-energy moments — they don't define you. Try starting with just one tiny task, even something as small as making your bed or drinking a glass of water. Small wins build momentum. 🌱",
            "Motivation isn't something you wait for — it's something that builds with action. Start with the smallest possible step. Just one. The rest will follow. 🌱",
            "Feeling unmotivated doesn't mean you're lazy. It often means you're mentally tired. Give yourself permission to rest guilt-free, then start fresh with one tiny action. 💚",
            "Try the '5-minute rule': commit to doing something for just 5 minutes. If you want to stop after that, you can. But most of the time, starting is the hardest part. ⏱️",
            "Productivity doesn't have to mean doing everything. Some days, just getting through the day is enough. Be proud of yourself for the small things you accomplish. 🌱",
            "When motivation is low, try changing your environment. Open a window, play upbeat music, tidy one small area. Small shifts in your surroundings can shift your energy too. 🎵",
            "You don't need to feel motivated to start — sometimes action creates motivation, not the other way around. Do one small thing, and notice how it feels. 🌱",
            "Procrastination often comes from perfectionism or fear, not laziness. Be compassionate with yourself. Ask: 'What's the easiest version of this task I can do right now?' 💚",
            "If you can't focus, your brain might be telling you it needs a break. Step away for 10 minutes — stretch, hydrate, breathe fresh air. Then come back with fresh eyes. 🧠",
            "Remember: rest is not the opposite of productivity. It's part of it. You can't pour from an empty cup. Take care of yourself first, and the motivation will follow. 🌱",
        ],
    },
}


# ---------------------------------------------------------------------------
# THAI FALLBACK RESPONSES
# ---------------------------------------------------------------------------

KEYWORD_RESPONSES_TH = {
    "anxiety": {
        "keywords": ["กังวล", "วิตก", "กลัว", "ตกใจ", "หวาดกลัว", "ประสาท", "ตื่นกลัว", "หวาดหวั่น"],
        "responses": [
            "ดูเหมือนคุณกำลังรู้สึกกังวลอยู่ และนั่นเป็นเรื่องปกติมากเลยค่ะ ลองหายใจเข้าลึกๆ ช้าๆ นับ 4 กลั้น 4 แล้วหายใจออกนับ 4 แค่รอบเดียวก็ช่วยให้ระบบประสาทสงบลงได้ 💙",
            "ความกังวลเป็นเรื่องธรรมชาติค่ะ ลองทำ grounding ดูนะคะ — บอกชื่อสิ่งของ 5 อย่างที่คุณเห็นรอบตัว จะช่วยดึงคุณกลับมาสู่ปัจจุบัน 🌿",
            "เข้าใจนะคะ ความกังวลมันหนักมาก แต่คุณเคยผ่านมันมาได้ก่อนหน้านี้ และครั้งนี้ก็จะผ่านได้เช่นกัน ลองวางมือบนหน้าอกแล้วรู้สึกจังหวะการเต้นของหัวใจนะคะ 💙",
            "เมื่อความกังวลมา มันอาจรู้สึกเหมือนทุกอย่างเร่งด่วน ลองถามตัวเองว่า 'อีกสัปดาห์หนึ่ง เรื่องนี้จะยังสำคัญไหม?' บางทีมุมมองนี้อาจช่วยได้ค่ะ 🌱",
            "การรู้สึกกลัวเป็นสัญญาณว่าสมองคุณกำลังพยายามปกป้องคุณ ลองขยับนิ้วเท้าหรือกดเท้าลงพื้นแน่นๆ มันช่วยให้รู้สึกมั่นคงขึ้นได้ค่ะ 💙",
            "ความกังวลมักอยู่ใน 'ถ้าเกิด...' ลองเปลี่ยนมาถาม 'ตอนนี้เป็นยังไง?' คุณอยู่ที่นี่ คุณหายใจอยู่ และคุณกล้าที่จะเล่าให้ฟัง นั่นคือความกล้าค่ะ 🌟",
            "อยากให้รู้ว่าการรู้สึกกังวลไม่ได้หมายความว่ามีอะไรผิดปกติกับคุณ ลองสาดน้ำเย็นบนใบหน้า — มันจะกระตุ้นการตอบสนองที่ทำให้ร่างกายสงบลงค่ะ 💙",
            "เมื่อความกังวลวนอยู่ในหัว ลองเขียนความคิดเหล่านั้นลงกระดาษ การเอาออกจากหัวไปเป็นตัวหนังสือช่วยให้จัดการได้ง่ายขึ้นค่ะ 📝",
            "ลองหายใจแบบ physiological sigh: สูดเข้าสั้นๆ สองครั้งทางจมูก แล้วหายใจออกยาวๆ ทางปาก เป็นวิธีที่เร็วที่สุดในการทำให้ระบบประสาทสงบค่ะ 💙",
            "จำไว้นะคะ ความกังวลเป็นเรื่องชั่วคราว ลองนึกภาพความคิดที่กังวลเหมือนก้อนเมฆลอยผ่านท้องฟ้า มันมาแล้วก็ไป คุณคือท้องฟ้า ไม่ใช่ก้อนเมฆค่ะ ☁️",
        ],
    },

    "sadness": {
        "keywords": ["เศร้า", "ร้องไห้", "เสียใจ", "สูญเสีย", "อกหัก", "ซึมเศร้า", "หดหู่", "ทุกข์"],
        "responses": [
            "รับรู้ได้ว่าคุณกำลังรู้สึกเศร้า และอยากให้รู้ว่ามันไม่เป็นไรเลยที่จะรู้สึกแบบนี้ ความเศร้าเป็นส่วนหนึ่งของการเป็นมนุษย์ค่ะ ดูแลตัวเองวันนี้นะคะ 💛",
            "ไม่เป็นไรเลยนะคะที่จะไม่โอเค บางทีสิ่งที่กล้าที่สุดคือการปล่อยให้ตัวเองรู้สึก ถ้าอยากร้องไห้ก็ร้องเลยค่ะ น้ำตาก็เป็นการเยียวยาในแบบของมัน 💛",
            "เสียใจที่คุณต้องเจอแบบนี้นะคะ ความเศร้ามันหนัก แต่มันจะไม่อยู่ตลอดไป ลองทำสิ่งเล็กๆ ดีๆ ให้ตัวเองสักอย่าง เช่น เครื่องดื่มอุ่นๆ หรือเพลงที่ชอบ 🫂",
            "ความรู้สึกของคุณสำคัญค่ะ และไม่เป็นไรที่จะอยู่กับความเศร้าสักพัก ไม่ต้องรีบร้อนให้ดีขึ้น การเยียวยาไม่ได้เป็นเส้นตรง อยู่ที่นี่เพื่อคุณค่ะ 💛",
            "เมื่อรู้สึกเศร้า โลกอาจดูไร้สีสัน แต่สีสันจะกลับมาเสมอค่ะ ลองออกไปข้างนอกสักสองสามนาที แสงแดดและอากาศเสาะอาจช่วยยกจิตใจได้ 🌤️",
            "ความเศร้ามักหมายความว่าคุณใส่ใจบางสิ่งอย่างลึกซึ้ง นั่นเป็นสิ่งที่สวยงาม ค่อยๆ ผ่านไปนะคะ ช่วงเวลาที่สดใสรออยู่ข้างหน้าค่ะ 💛",
            "คุณไม่ต้องแบกรับสิ่งนี้คนเดียวนะคะ แค่การเล่าความรู้สึก — อย่างที่คุณเพิ่งทำ — ก็เป็นก้าวหนึ่งของการเยียวยาแล้วค่ะ 🤗",
            "ถ้าความเศร้ารู้สึกเหมือนน้ำหนักบนหน้าอก ลองวางมือทั้งสองข้างลงบนหัวใจแล้วหายใจช้าๆ ท่าทางง่ายๆ นี้สร้างความรู้สึกปลอดภัยและอบอุ่นได้ค่ะ 💛",
            "เป็นเรื่องปกติที่จะรู้สึกไม่ดีบางวัน ลองเขียนจดหมายถึงตัวเองด้วยความเมตตาแบบเดียวกับที่คุณจะให้เพื่อนสนิท คุณสมควรได้รับความเมตตานั้นเช่นกันค่ะ ✉️",
            "จำไว้ว่าการรู้สึกเศร้าไม่ได้หมายความว่าคุณอ่อนแอ มันหมายความว่าคุณเป็นมนุษย์ พรุ่งนี้เป็นวันใหม่ และคุณมีพลังที่จะก้าวไป เชื่อในตัวคุณค่ะ 💛",
        ],
    },

    "anger": {
        "keywords": ["โกรธ", "หงุดหงิด", "รำคาญ", "โมโห", "เดือด", "อารมณ์ร้อน", "ฉุนเฉียว"],
        "responses": [
            "ดูเหมือนคุณกำลังรู้สึกหงุดหงิดหรือโกรธอยู่ ซึ่งเป็นอารมณ์ที่เป็นธรรมชาติมากค่ะ ลองถอยออกมาสักครู่แล้วหายใจลึกๆ สักสองสามครั้งนะคะ 🧡",
            "ความโกรธเป็นอารมณ์ที่ถูกต้องค่ะ มันมักบอกว่ามีขอบเขตบางอย่างถูกข้าม ลองหายใจก่อน แล้วค่อยคิดว่าอะไรเป็นตัวกระตุ้น 🧡",
            "เข้าใจความหงุดหงิดของคุณค่ะ เมื่อโกรธมากๆ ลองกำมือแน่นๆ 5 วินาที แล้วปล่อย รู้สึกความตึงคลายออก ทำสองสามครั้งนะคะ 🧡",
            "การโกรธไม่ได้ทำให้คุณเป็นคนไม่ดี มันทำให้คุณเป็นมนุษย์ ลองเปลี่ยนพลังงานนั้นเป็นการเคลื่อนไหว เดินเร็วๆ หรือบีบหมอน การขยับตัวช่วยได้ค่ะ 💪",
            "ความโกรธรู้สึกเหมือนไฟข้างใน ลองหายใจ 'เย็น': สูดเข้าทางปากเหมือนดูดหลอด แล้วหายใจออกช้าๆ ทางจมูก มันช่วยให้เย็นลงจริงๆ ค่ะ 🧡",
            "ไม่เป็นไรที่จะรู้สึกโกรธ สิ่งสำคัญคือเราตอบสนองอย่างไร ก่อนทำอะไร ลองนับ 1 ถึง 10 ช้าๆ การหยุดนิดเดียวช่วยได้มากค่ะ 🧡",
            "ความหงุดหงิดมักมาจากการรู้สึกไม่ได้ถูกรับฟัง ความรู้สึกของคุณถูกต้องค่ะ ลองเขียนสิ่งที่กวนใจลงกระดาษ บางทีเห็นเป็นตัวหนังสือจะเบาลง 📝",
            "เมื่อความโกรธมา มันมักจะปกป้องความรู้สึกอ่อนโยนข้างใต้ เช่น ความเจ็บปวดหรือความผิดหวัง ลองสำรวจว่ามีอะไรซ่อนอยู่ข้างใต้บ้าง 🧡",
            "เข้าใจว่าคุณกำลังเผชิญสิ่งที่น่าหงุดหงิด ลองเกร็งกล้ามเนื้อทั้งตัว 5 วินาที แล้วปล่อยหมด จะช่วยรีเซ็ตการตอบสนองความเครียดค่ะ 🧡",
            "คุณมีสิทธิ์โกรธโดยไม่ต้องลงมือทำอะไรทันที ให้เวลาตัวเองสงบก่อน คุณจะตัดสินใจได้ดีขึ้นเมื่อใจเย็นค่ะ 🧡",
        ],
    },

    "stress": {
        "keywords": ["เครียด", "กดดัน", "ท้อ", "เหนื่อย", "หมดแรง", "ล้า", "หนักใจ"],
        "responses": [
            "ดูเหมือนคุณกำลังแบกภาระหนักอยู่นะคะ ลองเขียนทุกอย่างที่อยู่ในหัวออกมา เพื่อปล่อยความคิดออกจากหัว ค่อยๆ ทำทีละขั้นนะคะ 💜",
            "เมื่อทุกอย่างรู้สึกเยอะเกินไป จำไว้ว่าไม่ต้องแก้ทุกอย่างพร้อมกัน เลือกแค่สิ่งเดียวที่จะโฟกัสตอนนี้ ที่เหลือรอได้ค่ะ 💜",
            "ความเครียดเป็นสัญญาณว่าร่างกายต้องการพัก แม้แค่เล็กน้อย ลองพักสัก 5 นาที ยืดตัว หายใจ มองออกนอกหน้าต่าง คุณสมควรได้พักค่ะ 💜",
            "การเครียดไม่ได้หมายความว่าคุณล้มเหลว มันหมายความว่าคุณกำลังผ่านสิ่งที่ท้าทาย แต่คุณก็ต้องเติมพลังด้วยนะคะ มีอะไรที่ลดได้บ้างไหมวันนี้? 💜",
            "เข้าใจความรู้สึกหนักใจ ลองกฎ '2 นาที': ถ้าอะไรทำได้ใน 2 นาที ทำเลยตอนนี้ มันสร้างความรู้สึกสำเร็จเล็กๆ ที่ช่วยเปลี่ยนอารมณ์ได้ ✨",
            "เมื่อเครียดสะสม การหายใจมักตื้น ลองหายใจเข้าท้องลึกๆ 3 ครั้ง พองท้องเหมือนลูกโป่ง แล้วยุบลง ง่ายแต่ได้ผลค่ะ 💜",
            "คุณทำได้มากกว่าที่คุณคิด ไม่เป็นไรที่จะพูดว่า 'ยังไม่ใช่ตอนนี้' กับสิ่งที่ไม่เร่งด่วน ปกป้องพลังงานของคุณนะคะ 🛡️",
            "ความเหนื่อยล้ามักมาจากการพยายามเก็บทุกอย่างไว้ในหัว ลองเขียนรายการงานแล้ววงกลมแค่ 3 อย่างที่สำคัญที่สุด ปล่อยที่เหลือไปก่อนวันนี้ค่ะ 💜",
            "ภาวะหมดแรงเป็นเรื่องจริง และมันไม่ใช่สิ่งที่จะเอาชนะด้วยแรงใจอย่างเดียว ฟังร่างกายของคุณนะคะ การพักผ่อนไม่ใช่ความขี้เกียจค่ะ 💜",
            "ความเครียดทำให้ทุกอย่างรู้สึกเร่งด่วน แต่ส่วนใหญ่ไม่ได้เร่ง ลองถามว่า 'เรื่องนี้ต้องทำวันนี้ หรือแค่ทำเมื่อไหร็ก็ได้?' อาจจะเบาใจขึ้นค่ะ 🌿",
        ],
    },

    "happiness": {
        "keywords": ["ดีใจ", "มีความสุข", "สนุก", "ขอบคุณ", "ยินดี", "ตื่นเต้น", "เยี่ยม", "สุดยอด"],
        "responses": [
            "ดีใจด้วยนะคะ! 😊 ความรู้สึกดีๆ แบบนี้ควรค่าแก่การเก็บรักษา ลองสังเกตความรู้สึกนี้ในร่างกายของคุณ แล้วปล่อยให้ตัวเองเพลิดเพลินกับมันอย่างเต็มที่ค่ะ ✨",
            "ชอบเมื่อได้ยินแบบนี้! 🌟 ลองจดสิ่งที่ทำให้มีความสุขไว้นะคะ ในวันที่ยากลำบาก จะได้กลับมาอ่านแล้วนึกออกว่าความสุขกลับมาเสมอ",
            "ความสุขของคุณทำให้ยิ้มตามเลย! 😊 รู้ไหมคะว่าการเล่าข่าวดีให้คนที่ไว้ใจฟังทำให้ความรู้สึกดีๆ อยู่นานขึ้น ลองเล่าให้ใครฟังวันนี้นะคะ! 🎉",
            "วิเศษมากเลย! อารมณ์เชิงบวกเหมือนสารอาหารสำหรับสุขภาพจิตค่ะ ซึมซับมัน คุณสมควรได้รับความสุขนี้ทุกประการ ✨",
            "ดีใจที่คุณรู้สึกดี! 🌈 ลองสังเกตรายละเอียดเล็กๆ ของช่วงเวลานี้ — เสียง แสง ร่างกายรู้สึกอย่างไร การสัมผัสความสุขอย่างมีสติทำให้มันลึกซึ้งยิ่งขึ้นค่ะ",
            "สิ่งที่สวยงามที่ได้แบ่งปัน! ความสุขไม่ได้มีแค่ช่วงเวลาใหญ่ๆ มันคือความรู้สึกดีๆ ในทุกวันที่สร้างชีวิตที่เติมเต็ม เพลิดเพลินให้เต็มที่นะคะ! 🌻",
            "คุณเปล่งประกายพลังบวกเลย! 🌟 ลองทำ gratitude jar — เขียนช่วงเวลาดีๆ ลงกระดาษเล็กๆ ในวันที่ยาก หยิบออกมาอ่านสักใบ มันวิเศษค่ะ",
            "ดีใจมากที่ได้ยินแบบนี้! จำไว้ว่าคุณมีสิทธิ์เพลิดเพลินกับช่วงเวลาดีๆ โดยไม่ต้องกลัวว่ามันจะหายไป ความสุขนี้เป็นของคุณ ถือไว้เลยค่ะ! 😊",
            "พลังบวกของคุณติดต่อได้เลย! ☀️ การหยุดชื่นชมช่วงเวลาดีๆ จริงๆ ช่วยให้สมองพร้อมรับความสุขมากขึ้น ชื่นชมต่อไปนะคะ!",
            "ดีใจสำหรับคุณ! 🌟 ช่วงเวลาแบบนี้พิสูจน์ว่าแม้ในช่วงที่ยากลำบาก สิ่งดีๆ ก็ยังมาหาคุณ คุณแผ่สิ่งที่คุณเป็นออกไปค่ะ! ✨",
        ],
    },
}


# ---------------------------------------------------------------------------
# DEFAULT FALLBACK (when no keywords match)
# ---------------------------------------------------------------------------

DEFAULT_RESPONSES_EN = [
    "Thank you for sharing that with me. I'm here for you. Take a moment to breathe deeply — in through your nose, out through your mouth. When you're ready, tell me more about how you're feeling. 💙",
    "I appreciate you opening up. Whatever you're going through, know that your feelings are valid. Take a gentle breath and know that I'm listening. 💙",
    "Thank you for trusting me with how you feel. I may not have all the answers, but I'm here to support you. Would you like to tell me more? 💙",
    "I hear you, and I want you to know that reaching out is a strong and brave thing to do. Take things at your own pace — there's no rush. 💙",
    "Whatever you're experiencing right now, you don't have to face it alone. I'm here to listen. Try taking a slow breath and sharing what's on your mind. 💙",
    "Thank you for being open with me. Sometimes just putting feelings into words can help. Take your time, and know I'm here whenever you need. 💙",
    "I'm glad you reached out. Even when things feel uncertain, talking about it is a great first step. Take a breath, and let's take it from here. 💙",
    "Your feelings matter, and I'm here to listen without judgment. Take a moment for yourself — a deep breath, a sip of water — and share whatever feels right. 💙",
    "I may not know exactly what you're going through, but I care about how you feel. Let's take this one step at a time. You're not alone. 💙",
    "Reaching out takes courage, and I'm glad you did. Whatever it is, we can work through it together. Start with a breath, and go from there. 💙",
]

DEFAULT_RESPONSES_TH = [
    "ขอบคุณที่เล่าให้ฟังนะคะ อยู่ที่นี่เพื่อคุณเสมอ ลองหายใจเข้าลึกๆ สักสองสามครั้ง แล้วบอกเพิ่มเติมว่าคุณรู้สึกอย่างไร พร้อมรับฟังค่ะ 💙",
    "ขอบคุณที่เปิดใจ สิ่งที่คุณกำลังเผชิญ ความรู้สึกของคุณเป็นสิ่งที่ถูกต้อง หายใจเบาๆ แล้วรู้ว่ามีคนรับฟังอยู่นะคะ 💙",
    "ขอบคุณที่ไว้ใจเล่าให้ฟัง อาจไม่มีคำตอบทุกอย่าง แต่อยู่ที่นี่เพื่อสนับสนุนคุณค่ะ อยากเล่าเพิ่มเติมไหมคะ? 💙",
    "รับฟังอยู่ค่ะ และอยากให้รู้ว่าการเอื้อมมือออกมาเป็นสิ่งที่เข้มแข็งและกล้าหาญมาก ค่อยๆ ไปตามจังหวะของคุณนะคะ 💙",
    "สิ่งที่คุณกำลังประสบอยู่ คุณไม่ต้องเผชิญมันคนเดียว อยู่ที่นี่เพื่อรับฟัง ลองหายใจช้าๆ แล้วเล่าสิ่งที่อยู่ในใจค่ะ 💙",
    "ขอบคุณที่เปิดใจ บางทีแค่ใส่ความรู้สึกเป็นคำพูดก็ช่วยได้แล้ว ค่อยๆ มานะคะ อยู่ที่นี่เสมอเมื่อคุณต้องการ 💙",
    "ดีใจที่คุณเอื้อมมือมา แม้ตอนนี้อาจรู้สึกไม่แน่นอน การพูดคุยเป็นก้าวแรกที่ดีค่ะ หายใจลึกๆ แล้วเริ่มจากตรงนี้กันค่ะ 💙",
    "ความรู้สึกของคุณสำคัญ และพร้อมรับฟังโดยไม่ตัดสิน ให้เวลาตัวเอง หายใจลึกๆ ดื่มน้ำสักแก้ว แล้วเล่าสิ่งที่รู้สึกค่ะ 💙",
    "อาจไม่รู้ว่าคุณกำลังเจออะไร แต่ใส่ใจความรู้สึกของคุณค่ะ ค่อยๆ ไปทีละขั้น คุณไม่ได้อยู่คนเดียวนะคะ 💙",
    "การเอื้อมมือออกมาต้องใช้ความกล้า และดีใจที่คุณทำ ไม่ว่าจะเป็นเรื่องอะไร เราจะผ่านมันไปด้วยกัน เริ่มจากหายใจก่อนนะคะ 💙",
]


def get_keyword_fallback(message: str, language: str = 'en') -> str:
    """
    Return a contextual, random fallback response based on keywords in the user's message.
    Used when the Gemini API is rate-limited (429 error).
    """
    msg = message.lower()
    
    # Select the appropriate response bank
    if language == 'th':
        # Check Thai keywords first
        for category in KEYWORD_RESPONSES_TH.values():
            if any(kw in msg for kw in category["keywords"]):
                return random.choice(category["responses"])
    
    # Check English keywords (also serves as fallback for Thai if no Thai keyword matched)
    for category in KEYWORD_RESPONSES_EN.values():
        if any(kw in msg for kw in category["keywords"]):
            return random.choice(category["responses"])
    
    # Default fallback if no keywords match
    if language == 'th':
        return random.choice(DEFAULT_RESPONSES_TH)
    
    return random.choice(DEFAULT_RESPONSES_EN)
