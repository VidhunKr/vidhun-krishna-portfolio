/**
 * Portfolio chat answers — no API key, no server.
 * Edit this file to update what the assistant says.
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
      return "Hello! I'm Vidhun's portfolio assistant. I can tell you about his Angular/TypeScript skills, projects like Aviator and RedTeam CRM, experience, or how to contact him for hiring. What would you like to know?";
    }

    if (has(["hire", "hiring", "available", "job", "recruit", "opportunity"])) {
      return [
        "Vidhun is available for new work and hiring opportunities.",
        "",
        "Email: vidhunkrishna007@gmail.com",
        "Location: Kerala, India",
        "",
        "Or use the Contact section on this portfolio.",
      ].join("\n");
    }

    if (has(["contact", "email", "phone", "reach", "linkedin", "github", "call"])) {
      return [
        "You can reach Vidhun here:",
        "",
        "Email: vidhunkrishna007@gmail.com",
        "Phone: +91 7012305384",
        "LinkedIn: linkedin.com/in/vidhun-krishna-m",
        "GitHub: github.com/VidhunKr",
        "",
        "Or use the Contact form on this site.",
      ].join("\n");
    }

    if (has(["where", "location", "based", "kerala", "kochi", "from"])) {
      return "Vidhun is based in Kerala, India (Kochi area).";
    }

    if (has(["educat", "degree", "college", "study", "bsc", "b.sc", "diploma"])) {
      return [
        "Education:",
        "",
        "• B.Sc. Computer Science",
        "  Universal College Mannarkkad (2020–2023)",
        "",
        "• Diploma in MEAN Stack Development",
        "  Unique Ocassio Tech, Kochi (2023–2024)",
        "",
        "Languages: English, Malayalam, Tamil",
      ].join("\n");
    }

    if (has(["experience", "work", "company", "career", "saihasoft", "tinos"])) {
      return [
        "About 1.7 years of experience:",
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
        "Vidhun is an Angular-focused frontend developer.",
        "",
        "• TypeScript, RxJS, reactive forms",
        "• Routing, guards, interceptors",
        "• Angular Material",
        "",
        "Projects: Aviator, RedTeam CRM, Samedha, TranzCars",
      ].join("\n");
    }

    if (has(["ionic", "mobile", "android", "ios", "cordova"])) {
      return [
        "Yes — Vidhun builds Ionic + Angular mobile apps",
        "(also Cordova) for web, Android, and iOS.",
        "",
        "Examples:",
        "• Aviator (Ionic 8 / Angular 20)",
        "• ClikPay",
      ].join("\n");
    }

    if (has(["backend", "node", "express", "mongo", "jwt", "fullstack", "full-stack", "full stack"])) {
      return [
        "Backend experience:",
        "",
        "• Node.js",
        "• Express.js",
        "• REST APIs",
        "• JWT authentication",
        "• MongoDB",
        "",
        "Example: CoVecart (React / Node / Express / MongoDB)",
      ].join("\n");
    }

    if (has(["typescript", "javascript", "rxjs", "scss", "html", "css", "bootstrap", "material"])) {
      return [
        "Core stack:",
        "",
        "• Angular, TypeScript, JavaScript",
        "• HTML5, CSS3 / SCSS, Bootstrap",
        "• Angular Material, RxJS",
        "• Reactive forms, routing, guards, interceptors",
      ].join("\n");
    }

    if (has(["skill", "tech", "stack", "technologies", "tools"])) {
      return [
        "Main skills:",
        "",
        "• Angular, TypeScript, JavaScript, RxJS",
        "• Ionic, HTML / CSS / SCSS",
        "• Bootstrap, Angular Material",
        "• Node.js, Express, MongoDB",
        "• Git, Figma",
      ].join("\n");
    }

    if (has(["aviator"])) {
      return "Aviator is a pilot exam preparation platform with dashboards, study modules, tests, live classes, OTP auth, subscriptions, quizzes, and analytics. Tech: Ionic 8, Angular 20, Cordova, REST APIs.";
    }

    if (has(["redteam", "crm"])) {
      return "RedTeam CRM is a lead management system with multi-branch capture, follow-up, role-based access, dashboards, and REST APIs. Tech: Angular, Angular Material, Firebase, Chart.js.";
    }

    if (has(["samedha"])) {
      return "Samedha Ayurvedics is an e-commerce and booking platform with treatments, products, appointments, cart, OTP auth, and RxJS services. Tech: Angular 20, SSR, REST APIs.";
    }

    if (has(["tranz", "tranzcars"])) {
      return "TranzCars is a self-drive car rental platform with vehicle search, booking, payments, and Google Maps. Tech: Angular 22, Bootstrap, Razorpay, REST APIs.";
    }

    if (has(["project", "portfolio", "built", "covecart", "clikpay"])) {
      return "Key projects: Aviator, RedTeam CRM, Samedha Ayurvedics, TranzCars, CoVecart, ClikPay, Executive Analytics, and Contacts Pipeline. Ask about a specific name for more detail.";
    }

    return "Vidhun Krishna is a Frontend / Angular Developer from Kerala, India (~1.7 years experience). Ask about skills, projects, experience, or how to contact him — or use the Contact section for hiring.";
  },
};
