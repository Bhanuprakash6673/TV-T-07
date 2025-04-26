document.addEventListener('DOMContentLoaded', () => {
  // Authentication
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const loggedInUser = localStorage.getItem('loggedInUser');

  // Update welcome message on index.html
  const welcomeMessage = document.getElementById('welcomeMessage');
  if (welcomeMessage && loggedInUser) {
    welcomeMessage.textContent = `Welcome, ${loggedInUser}!`;
  } else if (welcomeMessage) {
    welcomeMessage.textContent = 'Welcome!';
  }

  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        localStorage.setItem('loggedInUser', user.name);
        window.location.href = 'index.html';
      } else {
        alert('Invalid credentials');
      }
    });
  }

  // Signup
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      if (users.find(u => u.email === email)) {
        alert('Email already exists');
        return;
      }
      users.push({ name, email, password });
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('loggedInUser', name);
      window.location.href = 'index.html';
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('loggedInUser');
      window.location.href = 'login.html';
    });
  }

  // Redirect if not logged in
  if (!loggedInUser && !['login.html', 'signup.html'].includes(window.location.pathname.split('/').pop())) {
    window.location.href = 'login.html';
  }

  // Home page: Start interview
  const startInterviewBtn = document.getElementById('startInterview');
  if (startInterviewBtn) {
    startInterviewBtn.addEventListener('click', () => {
      const language = document.getElementById('language').value;
      localStorage.setItem('interviewLanguage', language);
      window.location.href = 'interview.html';
    });
  }

  // Interview logic
  const interviewSection = document.getElementById('interviewSection');
  if (interviewSection) {
    const questions = [
      // Technical Questions
      { text: "Explain the box model in CSS.", category: "technical" },
      { text: "How do you optimize a webpage for performance?", category: "technical" },
      { text: "What is a closure in JavaScript?", category: "technical" },
      { text: "Describe event delegation in JavaScript.", category: "technical" },
      { text: "How do you ensure accessibility in web design?", category: "technical" },
      { text: "What is the difference between `let`, `const`, and `var` in JavaScript?", category: "technical" },
      { text: "How do you implement responsive design in CSS?", category: "technical" },
      { text: "What are the benefits of using a framework like React or Vue?", category: "technical" },
      { text: "Explain the difference between synchronous and asynchronous JavaScript.", category: "technical" },
      { text: "How do you handle cross-browser compatibility issues?", category: "technical" },
      // General Questions
      { text: "Tell me about yourself.", category: "general" },
      { text: "What are your strengths and weaknesses?", category: "general" },
      { text: "Where do you see yourself in five years?", category: "general" },
      { text: "Why do you want to work here?", category: "general" },
      { text: "Describe a challenging situation and how you handled it.", category: "general" }
    ].sort((a, b) => {
      const categoryOrder = { technical: 1, general: 2 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });

    let selectedQuestions = [];
    let currentQuestionIndex = 0;
    let responses = [];
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    // DOM elements
    const startInterviewBtn = document.getElementById('startInterviewBtn');
    const interviewSetup = document.getElementById('interviewSetup');
    const categorySelect = document.getElementById('category');
    const jobRoleSelect = document.getElementById('jobRole');
    const questionCountSelect = document.getElementById('questionCount');
    const currentQuestionEl = document.getElementById('currentQuestion');
    const questionNumberEl = document.getElementById('questionNumber');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const startSpeechBtn = document.getElementById('startSpeech');
    const stopSpeechBtn = document.getElementById('stopSpeech');
    const nextQuestionBtn = document.getElementById('nextQuestion');
    const responseOutputEl = document.getElementById('responseOutput');
    const instantFeedbackEl = document.getElementById('instantFeedback');
    const feedbackTextEl = document.getElementById('feedbackText');
    const scoreTextEl = document.getElementById('scoreText');
    const overallFeedbackEl = document.getElementById('overallFeedback');
    const feedbackContentEl = document.getElementById('feedbackContent');

    // Start interview
    startInterviewBtn.addEventListener('click', () => {
      const jobRole = jobRoleSelect.value;
      localStorage.setItem('selectedJobRole', jobRole);
      const category = categorySelect.value;
      const questionCount = parseInt(questionCountSelect.value);
      const filteredQuestions = questions.filter(q => q.category === category);
      selectedQuestions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount);
      currentQuestionIndex = 0;
      responses = [];
      interviewSection.classList.remove('hidden');
      startInterviewBtn.classList.add('hidden');
      interviewSetup.classList.add('hidden'); // Hide the entire setup section
      displayQuestion();
    });

    // Display question
    function displayQuestion() {
      currentQuestionEl.textContent = selectedQuestions[currentQuestionIndex].text;
      questionNumberEl.textContent = currentQuestionIndex + 1;
      totalQuestionsEl.textContent = selectedQuestions.length;
      responseOutputEl.value = '';
      instantFeedbackEl.classList.add('hidden');
      nextQuestionBtn.classList.add('hidden');
    }

    // Speech recognition setup
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('interviewLanguage') || 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        responseOutputEl.value = finalTranscript + interimTranscript;
      };

      recognition.onerror = (event) => {
        alert('Speech recognition error: ' + event.error);
        stopRecording();
      };

      recognition.onend = () => {
        if (isRecording) recognition.start();
      };
    } else {
      alert('Speech recognition not supported.');
      startSpeechBtn.disabled = true;
    }

    // Start recording
    startSpeechBtn.addEventListener('click', () => {
      if (recognition && !isRecording) {
        responseOutputEl.value = '';
        recognition.start();
        isRecording = true;
        startSpeechBtn.classList.add('hidden');
        stopSpeechBtn.classList.remove('hidden');
      }
    });

    // Stop recording
    stopSpeechBtn.addEventListener('click', () => {
      stopRecording();
      const response = responseOutputEl.value.trim();
      if (response) {
        const evalResult = evaluateResponse(response, selectedQuestions[currentQuestionIndex].category);
        responses.push({
          question: selectedQuestions[currentQuestionIndex].text,
          category: selectedQuestions[currentQuestionIndex].category,
          response,
          score: evalResult.score,
          feedback: evalResult.feedback
        });
        feedbackTextEl.textContent = evalResult.feedback;
        scoreTextEl.textContent = `Score: ${evalResult.score}/10`;
        instantFeedbackEl.classList.remove('hidden');
        instantFeedbackEl.classList.add('fade-in');
        nextQuestionBtn.classList.remove('hidden');
      } else {
        alert('Please provide a response.');
      }
    });

    function stopRecording() {
      if (recognition && isRecording) {
        recognition.stop();
        isRecording = false;
        startSpeechBtn.classList.remove('hidden');
        stopSpeechBtn.classList.add('hidden');
      }
    }

    // Next question
    nextQuestionBtn.addEventListener('click', () => {
      currentQuestionIndex++;
      if (currentQuestionIndex < selectedQuestions.length) {
        displayQuestion();
      } else {
        showOverallFeedback();
      }
    });

    // Evaluation logic
    function evaluateResponse(response, category) {
      const keywords = {
        technical: [
          'html', 'css', 'javascript', 'flexbox', 'grid', 'promise', 'async', 'dom', 'responsive', 'closure',
          'let', 'const', 'var', 'media', 'react', 'vue', 'component', 'synchronous', 'asynchronous', 'browser', 'polyfill'
        ],
        general: [
          'experience', 'skills', 'goals', 'team', 'challenge', 'strength', 'weakness', 'career', 'motivation', 'future'
        ]
      };
      let score = 0;
      const maxScore = 10;
      const words = response.toLowerCase().split(/\s+/);
      keywords[category].forEach(keyword => {
        if (words.includes(keyword)) score += 2;
      });
      score = Math.min(score, maxScore);
      return {
        score,
        feedback: score >= 7 ? `Strong ${category} skills.` : 
                  score >= 4 ? `Moderate ${category} skills, needs specificity.` : 
                  `Weak ${category} skills, requires improvement.`
      };
    }

    // Overall feedback
    function showOverallFeedback() {
        interviewSection.classList.add('hidden');
        overallFeedbackEl.classList.remove('hidden');
        overallFeedbackEl.classList.add('fade-in');
      
        let totalScore = responses.reduce((acc, r) => acc + r.score, 0);
        const maxTotal = responses.length * 10;
        const percentage = Math.round((totalScore / maxTotal) * 100);
        let summaryText = percentage >= 80 ? "Excellent" : percentage >= 50 ? "Good" : "Needs Improvement";
        const candidateName = localStorage.getItem("loggedInUser") || "Candidate";
      
        const cardsHTML = responses.map((r, i) => `
          <div class="bg-neutral-charcoal border border-neutral-taupe rounded-lg p-4 shadow-md transition transform hover:scale-[1.02]">
            <h4 class="text-main-gold font-semibold mb-2">Question ${i + 1}</h4>
            <p class="text-neutral-cream text-sm mb-1"><strong>Q:</strong> ${r.question}</p>
            <p class="text-sm text-neutral-taupe"><strong>Score:</strong> ${r.score}/10</p>
            <p class="text-sm italic text-accent-copper mt-2">${r.feedback}</p>
          </div>
        `).join('');
      
        feedbackContentEl.innerHTML = `
          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-main-gold">Interview Coach</h3>
            <p class="text-neutral-taupe">Feedback for <span class="text-neutral-cream font-semibold">${candidateName}</span></p>
            <div class="mt-4">
              <span class="text-4xl font-extrabold text-main-gold">${(totalScore / responses.length).toFixed(1)}</span>
              <span class="text-neutral-taupe">/ 10</span>
              <p class="text-sm text-accent-rust mt-1">${summaryText} Performance</p>
            </div>
          </div>
      
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${cardsHTML}
          </div>
        `;
      }
  }
});