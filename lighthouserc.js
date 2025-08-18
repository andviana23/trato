module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000",
        "http://localhost:3000/agenda",
        "http://localhost:3000/fila",
        "http://localhost:3000/dashboard",
      ],
      startServerCommand: "npm start",
      startServerReadyPattern: "ready on",
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        interactive: ["warn", { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};

