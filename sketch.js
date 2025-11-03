let table;
let questions = [];
let quizQuestions = [];
let currentQuestionIndex = 0;
let answeredQuestions = []; // 儲存作答記錄
let score = 0;
let gameState = 'start'; // 'start', 'quiz', 'result'
let feedback = '';
let feedbackColor;

// 互動效果的粒子
let particles = [];

// DOM 元素
let optionButtons = [];
let nextButton;
let startButton;

// 預載入資源，確保 CSV 在 setup() 前載入完成
function preload() {
  // 提供回呼函式來處理載入錯誤
  table = loadTable('quiz_questions.csv', 'csv', 'header', () => {}, (err) => {
    console.error(err);
    alert('錯誤：無法載入題庫檔案 (quiz_questions.csv)。請檢查檔案是否存在且格式正確。');
  });
}

function setup() {
  createCanvas(windowWidth * 0.8, windowHeight * 0.9);
  colorMode(HSB, 360, 100, 100, 100); // 使用 HSB 色彩模式，方便做色彩變化
  textAlign(CENTER, CENTER);

  // 解析 CSV 資料到 questions 陣列
  if (!table) return; // 如果表格載入失敗則停止
  for (let row of table.rows) {
    let q = row.obj;
    questions.push({
      question: q.question,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      answer: q.answer
    });
  }

  // 建立開始按鈕
  startButton = createButton('開始測驗').mousePressed(startQuiz);
  updateElementStyles(); // 更新按鈕樣式

  // 建立粒子效果
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  // 繪製漸層背景
  drawGradientBackground();

  // 更新和繪製粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.show();
    if (p.isDone()) {
      particles.splice(i, 1);
    }
  }

  // 根據遊戲狀態繪製不同畫面
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'quiz') {
    drawQuizScreen();
  } else if (gameState === 'result') {
    drawResultScreen();
  }
}

// --- 遊戲狀態管理 ---

function startQuiz() {
  // 隱藏開始按鈕
  startButton.hide();

  // 初始化測驗
  score = 0;
  currentQuestionIndex = 0;
  answeredQuestions = [];
  
  // 清空結果頁的特效粒子，並恢復預設的背景粒子
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }

  // 隨機抽取4題 (使用 p5.js 的 shuffle)
  let shuffledQuestions = shuffle(questions);
  quizQuestions = shuffledQuestions.slice(0, 4);

  gameState = 'quiz';
  displayQuestion();
}

function displayQuestion() {
  // 清除上一題的按鈕和回饋
  for (let btn of optionButtons) {
    btn.remove();
  }
  optionButtons = [];
  if (nextButton) {
    nextButton.remove();
  }
  feedback = '';

  // 取得目前題目
  let q = quizQuestions[currentQuestionIndex];

  // 將選項與其原始代號 (A,B,C,D) 綁定，然後隨機排序
  let answerOptions = [];
  for (let i = 0; i < q.options.length; i++) {
    answerOptions.push({
      text: q.options[i],
      originalLetter: String.fromCharCode(65 + i) // A, B, C, D
    });
  }
  answerOptions = shuffle(answerOptions);

  // 建立選項按鈕
  for (let i = 0; i < answerOptions.length; i++) {
    let btn = createButton(answerOptions[i].text);
    btn.mousePressed(() => checkAnswer(answerOptions[i].originalLetter));
    optionButtons.push(btn);
  }
  updateElementStyles(); // 統一更新所有按鈕樣式和位置
}

function checkAnswer(selectedOption) {
  // 儲存作答記錄
  answeredQuestions.push({
    question: quizQuestions[currentQuestionIndex],
    selected: selectedOption
  });

  let correctAnwer = quizQuestions[currentQuestionIndex].answer;

  // 停止所有按鈕的互動
  for (let btn of optionButtons) {
    btn.attribute('disabled', '');
    btn.style('cursor', 'default');
  }

  if (selectedOption === correctAnwer) {
    score++;
    feedback = '答對了！';
    feedbackColor = color(120, 80, 100); // 綠色
    // 答對時產生更多粒子
    for(let i = 0; i < 30; i++) {
        particles.push(new Particle(width/2, height/2));
    }
  } else {
    feedback = `答錯了，正確答案是 ${correctAnwer}`;
    feedbackColor = color(0, 80, 100); // 紅色
  }

  // 建立 "下一題" 或 "看結果" 按鈕
  let btnText = (currentQuestionIndex < quizQuestions.length - 1) ? '下一題' : '看結果';
  nextButton = createButton(btnText).mousePressed(next);
  updateElementStyles();
}

function next() {
  if (currentQuestionIndex < quizQuestions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
  } else {
    setupResultAnimation(); // 準備結果動畫
    gameState = 'result';
    // 清除最後一題的元素
    for (let btn of optionButtons) {
      btn.remove();
    }
    optionButtons = [];
    nextButton.remove();
    feedback = '';
  }
}

// --- 畫面繪製函式 ---

function drawStartScreen() {
  fill(255);
  noStroke();
  textSize(s(48));
  text('p5.js 互動測驗', width / 2, height / 2 - s(100));
}

function drawQuizScreen() {
  if (quizQuestions.length === 0) return;

  let q = quizQuestions[currentQuestionIndex];
  
  // 繪製題目進度
  fill(255);
  noStroke();
  textSize(s(20));
  text(`第 ${currentQuestionIndex + 1} / ${quizQuestions.length} 題`, width / 2, s(50));

  // 繪製題目
  textSize(s(32));
  text(q.question, width * 0.1, height / 2 - s(80), width * 0.8, s(100));

  // 繪製回饋
  if (feedback) {
    fill(feedbackColor);
    textSize(s(28));
    text(feedback, width / 2, height - s(150));
  }
}

function setupResultAnimation() {
  particles = []; // 清空舊的粒子
  let total = quizQuestions.length;
  let percentage = (score / total) * 100;

  if (percentage === 100) {
    // 完美：煙火噴泉
    for (let i = 0; i < 200; i++) {
      particles.push(new Particle(random(width), random(height), 'firework'));
    }
  } else if (percentage >= 75) {
    // 優秀：金色星星
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle(random(width), random(height * 0.5, height), 'star'));
    }
  } else if (percentage >= 50) {
    // 不錯：漂浮氣泡
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle(random(width), height, 'bubble'));
    }
  } else {
    // 加油：恢復預設背景粒子
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle(null, null, 'default'));
    }
  }
}

function drawResultScreen() {
  let total = quizQuestions.length;
  let percentage = (score / total) * 100;
  let resultMessage = '';

  // 根據分數決定訊息
  if (percentage === 100) resultMessage = '太完美了，全部答對！';
  else if (percentage >= 75) resultMessage = '表現得很好！';
  else if (percentage >= 50) resultMessage = '還不錯，再接再厲！';
  else resultMessage = '需要多加練習喔！';

  fill(255);
  noStroke();
  textSize(s(52));
  text('測驗結束', width / 2, height / 2 - s(150));
  
  textSize(s(36));
  text(`你的成績: ${score} / ${total}`, width / 2, height / 2 - s(50));

  textSize(s(28));
  text(resultMessage, width / 2, height / 2 + s(50));

  // 顯示重新開始按鈕
  startButton.show();
  startButton.html('再玩一次'); // 更新按鈕文字
  updateElementStyles();
}

function drawGradientBackground() {
  // 繪製背景的輔助函式
  const drawLine = (x, y, w, h, c1, c2) => {
    noFill();
    for (let i = y; i <= y + h; i++) {
      let inter = map(i, y, y + h, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x + w, i);
    }
  }
  drawLine(0, 0, width, height, color(240, 50, 20, 100), color(300, 80, 50, 100));
}

// --- 互動效果 ---

class Particle {
  constructor(x, y, type = 'default') {
    this.pos = createVector(x || random(width), y || random(height));
    this.type = type;
    this.lifespan = 255;

    if (this.type === 'firework') {
      this.vel = p5.Vector.random2D().mult(random(1, 4));
      this.acc = createVector(0, 0.2); // Gravity
      this.size = random(3, 6);
      this.hue = random(360);
    } else if (this.type === 'star') {
      this.vel = createVector(0, random(-1, -0.2));
      this.acc = createVector(0, 0);
      this.size = random(5, 10);
      this.hue = random(45, 60); // Gold/Yellow
    } else if (this.type === 'bubble') {
      this.vel = createVector(random(-1, 1), random(-2, -0.5));
      this.acc = createVector(0, 0);
      this.size = random(10, 30);
      this.hue = random(180, 220); // Cyan/Blue
    } else { // default
      this.vel = p5.Vector.random2D().mult(random(0.5, 2));
      this.acc = createVector(0, 0);
      this.size = random(2, 5);
      this.hue = random(200, 300); // Blue/Purple
    }
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    if (this.type !== 'default') {
      this.lifespan -= 1.5;
    }
    if (this.type === 'default') {
      this.edges();
    }
  }

  show() {
    noStroke();
    let alpha = this.type === 'default' ? 50 : map(this.lifespan, 0, 255, 0, 100);
    fill(this.hue, 80, 100, alpha);

    if (this.type === 'star') {
      // 畫星星
      push();
      translate(this.pos.x, this.pos.y);
      rotate(frameCount / 50.0);
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = TWO_PI * i / 5;
        let x = cos(angle) * this.size;
        let y = sin(angle) * this.size;
        vertex(x, y);
        angle += TWO_PI / 10;
        x = cos(angle) * (this.size / 2);
        y = sin(angle) * (this.size / 2);
        vertex(x, y);
      }
      endShape(CLOSE);
      pop();
    } else {
      // 畫圓形 (firework, bubble, default)
      ellipse(this.pos.x, this.pos.y, this.size * 2);
    }
  }

  isDone() {
    return this.lifespan < 0;
  }

  edges() {
    if (this.pos.x < -this.size) this.pos.x = width + this.size;
    if (this.pos.x > width + this.size) this.pos.x = -this.size;
    if (this.pos.y < -this.size) this.pos.y = height + this.size;
    if (this.pos.y > height + this.size) this.pos.y = -this.size;
  }
}

// --- 響應式設計輔助函式 ---

// 根據畫布寬度計算響應式大小
function s(size) {
  const baseWidth = 1200; // 設定一個基準寬度
  return size * (width / baseWidth);
}

// 更新所有 DOM 元素的位置和樣式
function updateElementStyles() {
  // 計算畫布相對於視窗的偏移量，因為按鈕定位是相對於視窗的
  const canvasX = (windowWidth - width) / 2;
  const canvasY = (windowHeight - height) / 2;

  // 開始/再玩一次 按鈕
  if (startButton) {
    const yPos = (gameState === 'start') ? height / 2 - s(25) : height / 2 + s(120);
    startButton.size(s(200), s(50));
    startButton.position(canvasX + width / 2 - s(100), canvasY + yPos);
    startButton.style('font-size', `${s(20)}px`);
    startButton.style('cursor', 'pointer');
  }

  // 選項按鈕
  if (optionButtons.length > 0) {
    const buttonWidth = s(240);
    const buttonHeight = s(50);
    const gap = s(20);
    const totalWidth = buttonWidth * 2 + gap;
    const startX = (width - totalWidth) / 2;

    for (let i = 0; i < optionButtons.length; i++) {
      const x = startX + (i % 2) * (buttonWidth + gap);
      const y = height / 2 + s(40) + Math.floor(i / 2) * (buttonHeight + s(10));
      let btn = optionButtons[i];
      btn.size(buttonWidth, buttonHeight);
      btn.position(canvasX + x, canvasY + y);
      btn.style('font-size', `${s(18)}px`);
      btn.style('cursor', 'pointer');
    }
  }

  // 下一題按鈕
  if (nextButton) {
    nextButton.size(s(150), s(50));
    nextButton.position(canvasX + width / 2 - s(75), canvasY + height - s(100));
    nextButton.style('font-size', `${s(18)}px`);
    nextButton.style('cursor', 'pointer');
  }
}

// 讓畫布隨視窗大小改變
function windowResized() {
  resizeCanvas(windowWidth * 0.8, windowHeight * 0.9);
  updateElementStyles(); // 視窗變化時更新所有元素
}
