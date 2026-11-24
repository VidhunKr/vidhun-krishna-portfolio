/**
 * Portfolio chat answers — friendly first-person voice (as Vidhun).
 * Edit this file to update what the chat says.
 */
window.PORTFOLIO_CHAT = {
  reply(question) {
    const q = String(question || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const has = (words) => words.some((w) => q.includes(w));

    if (!q || /^(hi|hello|hey|hai|hii|yo)\b/.test(q) || q.length <= 3) {
      return "Hey! Nice to meet you. I’m Vidhun — ask me about my Angular/TypeScript work, projects like Aviator and RedTeam CRM, my experience, or how we can get in touch. What would you like to know?";
    }

    if (has(["hire", "hiring", "available", "job", "recruit", "opportunity"])) {
      return [
        "Yes — I’m open to new work and hiring conversations!",
        "",
        "Email me at vidhunkrishna007@gmail.com",
        "I’m based in Kerala, India",
        "",
        "Or just use the Contact section on this site — I’d love to hear from you.",
      ].join("\n");
    }

    if (has(["contact", "email", "phone", "reach", "linkedin", "github", "call"])) {
      return [
        "Sure — here’s how you can reach me:",
        "",
        "Email: vidhunkrishna007@gmail.com",
        "Phone: +91 7012305384",
        "LinkedIn: linkedin.com/in/vidhun-krishna-m",
        "GitHub: github.com/VidhunKr",
        "",
        "Or drop a message through the Contact form here.",
      ].join("\n");
    }

    if (has(["where", "location", "based", "kerala", "kochi", "from"])) {
      return "I’m from Kerala, India — based around the Kochi area.";
    }

    if (has(["educat", "degree", "college", "study", "bsc", "b.sc", "diploma"])) {
      return [
        "Here’s my education:",
        "",
        "• B.Sc. Computer Science",
        "  Universal College Mannarkkad (2020–2023)",
        "",
        "• Diploma in MEAN Stack Development",
        "  Unique Ocassio Tech, Kochi (2023–2024)",
        "",
        "I speak English, Malayalam, and Tamil.",
      ].join("\n");
    }

    if (has(["experience", "work", "company", "career", "saihasoft", "tinos"])) {
      return [
        "I’ve got about 1.7 years of experience so far:",
        "",
        "• Frontend Developer (Angular)",
        "  Saihasoft Technologies, Kochi",
        "  Sep 2025 — Present",
        "",
        "• Junior Full-Stack Web Developer Trainee",
        "  Tinos Software and Security Solutions LLP, Kochi",
        "  Oct 2024 — Jan 2025",
      ].join("\n");
    }

    if (has(["angular"])) {
      return [
        "Angular is my main focus — I build frontend apps with it every day.",
        "",
        "• TypeScript, RxJS, reactive forms",
        "• Routing, guards, interceptors",
        "• Angular Material",
        "",
        "You’ll see that stack in projects like Aviator, RedTeam CRM, Samedha, and TranzCars.",
      ].join("\n");
    }

    if (has(["ionic", "mobile", "android", "ios", "cordova"])) {
      return [
        "Yep — I build Ionic + Angular mobile apps",
        "(and Cordova too) for web, Android, and iOS.",
        "",
        "A couple of examples:",
        "• Aviator (Ionic 8 / Angular 20)",
        "• ClikPay",
      ].join("\n");
    }

    if (has(["backend", "node", "express", "mongo", "jwt", "fullstack", "full-stack", "full stack"])) {
      return [
        "I also work on the backend side when needed:",
        "",
        "• Node.js",
        "• Express.js",
        "• REST APIs",
        "• JWT authentication",
        "• MongoDB",
        "",
        "One example is CoVecart (React / Node / Express / MongoDB).",
      ].join("\n");
    }

    if (has(["typescript", "javascript", "rxjs", "scss", "html", "css", "bootstrap", "material"])) {
      return [
        "My day-to-day stack looks like this:",
        "",
        "• Angular, TypeScript, JavaScript",
        "• HTML5, CSS3 / SCSS, Bootstrap",
        "• Angular Material, RxJS",
        "• Reactive forms, routing, guards, interceptors",
      ].join("\n");
    }

    if (has(["skill", "tech", "stack", "technologies", "tools"])) {
      return [
        "Here’s what I work with most:",
        "",
        "• Angular, TypeScript, JavaScript, RxJS",
        "• Ionic, HTML / CSS / SCSS",
        "• Bootstrap, Angular Material",
        "• Node.js, Express, MongoDB",
        "• Git, Figma",
      ].join("\n");
    }

    if (has(["aviator"])) {
      return "Aviator is a pilot exam prep platform I worked on — dashboards, study modules, tests, live classes, OTP auth, subscriptions, quizzes, and analytics. Built with Ionic 8, Angular 20, Cordova, and REST APIs.";
    }

    if (has(["redteam", "crm"])) {
      return "RedTeam CRM is a lead management system I built — multi-branch capture, follow-ups, role-based access, dashboards, and REST APIs. Stack: Angular, Angular Material, Firebase, Chart.js.";
    }

    if (has(["samedha"])) {
      return "Samedha Ayurvedics is an e-commerce and booking platform I worked on — treatments, products, appointments, cart, OTP auth, and RxJS services. Tech: Angular 20, SSR, REST APIs.";
    }

    if (has(["tranz", "tranzcars"])) {
      return "TranzCars is a self-drive car rental platform I built — vehicle search, booking, payments, and Google Maps. Tech: Angular 22, Bootstrap, Razorpay, REST APIs.";
    }

    if (has(["project", "portfolio", "built", "covecart", "clikpay"])) {
      return "Some of my key projects: Aviator, RedTeam CRM, Samedha Ayurvedics, TranzCars, CoVecart, ClikPay, Executive Analytics, and Contacts Pipeline. Ask about any one and I’ll share more!";
    }

    return "I’m Vidhun Krishna — a Frontend / Angular Developer from Kerala, India, with about 1.7 years of experience. Ask me about my skills, projects, experience, or how to get in touch. Happy to chat!";
  },
};
