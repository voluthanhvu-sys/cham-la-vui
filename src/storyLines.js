// Spoken lines of the story game: key -> variants. .tmp/voice/story.mjs turns them into sounds/v clips.
// Hero = the child Tô (told in the third person), plus ba, mẹ and the plush toys.
import { PLACE_LINES } from './storyPlaceLines.js';
export const LINES = {
  gpa: ['Ông bế Tô lên cao nào!', 'Ông thương Tô nhiều lắm!'], gma: ['Bà ôm Tô một cái nào!', 'Bà thơm má Tô, chụt chụt!'],
  next: ['Đi chỗ khác chơi nữa nào!', 'Xe tới rồi! Lên đường thôi!'], go: ['Đi thôi! Mình đi đâu nữa nhỉ?', 'Bíp bíp! Lên đường nào!'],
  hello: ['Chào Tô! Mình đi chơi thôi!', 'Tô ơi, hôm nay đi đâu nào?', 'A, Tô tới rồi! Vui quá!'],
  again: ['Tô quay lại rồi! Cả nhà nhớ Tô lắm!'],
  wake: ['Ò ó o! Tô dậy rồi!', 'Chào buổi sáng! Tô tỉnh ngủ rồi!'],
  shark: ['A, bạn cá mập! Ôm cá mập nào!'], capy: ['Bạn chuột lang nước đây! Ôm một cái!'],
  tart: ['Bạn bánh trứng! Thơm phức luôn!'], bamboo: ['Bạn cây tre cao ơi là cao!'], mosquito: ['Bạn muỗi bay vo ve! Vo ve, vo ve!'],
  panda: ['Bạn gấu trúc mũm mĩm! Ôm nào!'], puppy: ['Gâu gâu! Bạn cún đây rồi!'], dino: ['Bạn khủng long con! Dễ thương quá!'],
  muddyFriend: ['Bạn phủi bùn cho Tô nè.'],
  mom: ['Mẹ ôm Tô một cái thật chặt!', 'Mẹ thơm má Tô, chụt chụt!', 'Mẹ đây! Mẹ yêu Tô nhiều lắm!'],
  momClean: ['Mẹ lau sạch bùn cho Tô nè.'],
  dad: ['Ba tung Tô lên cao nào!', 'Ba cõng Tô chạy nhong nhong!', 'Ba đây! Hai ba con mình chơi nhé!'],
  stuck: ['Ôi, kẹt trong bùn rồi! Tô ơi, chạm vào cứu nào!'],
  float: ['Á, bay mất rồi! Tô ơi, kéo xuống nào!'],
  box: ['Ơ, tối thui! Ai ở trong hộp thế? Tô mở ra nào!'],
  saved: ['Hoan hô! Tô giỏi quá!', 'Thoát rồi! Ôm một cái nào!'],
  surprise: ['Tô ơi, nhìn nè!', 'Tô ơi, ba mẹ ở đây nè!', 'Ú òa! Đây nè!'],
  sleepy: ['Đi ngủ thôi. Tô ngủ ngon nhé.', 'Ngáp dài quá! Mình đi ngủ thôi Tô ơi.'],
};
for (const [id, [hi, ...rest]] of Object.entries(PLACE_LINES)) { LINES['p-' + id] = [hi]; LINES['d-' + id] = rest; }
