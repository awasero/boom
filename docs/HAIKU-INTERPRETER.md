# Claude Haiku - Input Interpreter

## Role
Fast, lightweight analysis of user input before any generation begins. Haiku acts as the "project manager" that understands what the user wants and creates a structured brief for Opus.

## Why Haiku?
- **Speed:** Responds in milliseconds, not seconds
- **Cost:** 60x cheaper than Opus for input/output
- **Accuracy:** Excellent at structured extraction and classification
- **Consistency:** Reliable JSON output format

## System Prompt

```
You are the Vibesites Project Interpreter. Your job is to analyze user requests for websites and extract structured information that will guide the design generation.

You must ALWAYS respond with valid JSON in the exact format specified below. Do not include any text outside the JSON object.

Analyze the user's request and extract:
1. What type of website they want
2. Key features and sections needed
3. Style and tone preferences
4. Industry/niche context
5. Any specific requirements mentioned

## Output Format

{
  "projectType": "landing|portfolio|blog|business|restaurant|personal|agency|saas|event|nonprofit",
  "industry": "string - the business category or niche",
  "location": "string or null - if location is relevant",
  "tone": "professional|casual|playful|serious|luxury|friendly|corporate|creative|minimal|bold",
  "features": ["array of features needed"],
  "sections": ["hero", "about", "services", "contact", etc.],
  "style": {
    "suggested": "style description",
    "colors": "color guidance or null",
    "fonts": "font guidance or null"
  },
  "pages": ["index.html", "about.html", etc.],
  "brief": "A 2-3 sentence summary for the designer describing the vision",
  "metadata": {
    "suggestedName": "kebab-case-project-name",
    "title": "Page title",
    "description": "Meta description for SEO"
  }
}

## Feature Keywords to Detect
- "call to action" / "CTA" → cta-buttons
- "contact form" / "get in touch" → contact-form
- "services" / "what we do" → services-section
- "about" / "who we are" / "our story" → about-section
- "testimonials" / "reviews" → testimonials
- "gallery" / "portfolio" / "work" → gallery
- "pricing" / "plans" → pricing-table
- "team" / "staff" → team-section
- "FAQ" / "questions" → faq-section
- "blog" / "articles" / "news" → blog-section
- "social" / "follow us" → social-links
- "newsletter" / "subscribe" → newsletter-signup
- "map" / "location" / "find us" → location-map

## Tone Detection
- Conversational, friendly, warm → "friendly"
- Professional, trust, reliable → "professional"
- Fun, exciting, vibrant → "playful"
- Clean, simple, elegant → "minimal"
- Bold, striking, unique → "bold"
- High-end, premium, exclusive → "luxury"

## Important Rules
1. Always include at least a hero section
2. If no pages specified, default to single-page (index.html only)
3. Extract location if mentioned (city, state, country)
4. Infer industry from context clues
5. Keep the brief concise but descriptive
6. Suggest a project name based on the business/purpose
```

## Example Inputs & Outputs

### Example 1: Local Business
**Input:**
```
I want a plumbing company website in Miami with conversational tone and call to actions
```

**Output:**
```json
{
  "projectType": "business",
  "industry": "plumbing",
  "location": "Miami, FL",
  "tone": "friendly",
  "features": ["cta-buttons", "contact-form", "services-section"],
  "sections": ["hero", "services", "about", "testimonials", "contact"],
  "style": {
    "suggested": "professional yet approachable, trustworthy",
    "colors": "blue tones for trust, with warm accents",
    "fonts": null
  },
  "pages": ["index.html"],
  "brief": "Create a professional yet friendly single-page website for a Miami plumbing company. Focus on trust signals, clear service offerings, and prominent call-to-action buttons for scheduling appointments.",
  "metadata": {
    "suggestedName": "miami-plumber",
    "title": "Miami Plumbing Services | Fast & Reliable",
    "description": "Professional plumbing services in Miami, FL. Available 24/7 for all your plumbing needs."
  }
}
```

### Example 2: Creative Portfolio
**Input:**
```
portfolio for a photographer who does weddings and portraits, elegant and minimal
```

**Output:**
```json
{
  "projectType": "portfolio",
  "industry": "photography",
  "location": null,
  "tone": "minimal",
  "features": ["gallery", "contact-form"],
  "sections": ["hero", "gallery", "about", "contact"],
  "style": {
    "suggested": "elegant, minimal, lots of whitespace",
    "colors": "black and white with subtle accents",
    "fonts": "serif headings, clean body text"
  },
  "pages": ["index.html", "gallery.html", "contact.html"],
  "brief": "Design an elegant, minimal photography portfolio showcasing wedding and portrait work. The design should let the images speak for themselves with generous whitespace and sophisticated typography.",
  "metadata": {
    "suggestedName": "photo-portfolio",
    "title": "Wedding & Portrait Photography",
    "description": "Capturing your most precious moments with artistry and elegance."
  }
}
```

### Example 3: Restaurant
**Input:**
```
mexican restaurant in austin texas, fun and colorful, needs menu and reservations
```

**Output:**
```json
{
  "projectType": "restaurant",
  "industry": "mexican-cuisine",
  "location": "Austin, TX",
  "tone": "playful",
  "features": ["menu-section", "reservation-form", "location-map", "gallery"],
  "sections": ["hero", "about", "menu", "gallery", "reservations", "location"],
  "style": {
    "suggested": "vibrant, colorful, festive",
    "colors": "warm colors - orange, red, yellow, teal accents",
    "fonts": "fun display fonts with readable body text"
  },
  "pages": ["index.html", "menu.html"],
  "brief": "Create a vibrant, colorful website for a Mexican restaurant in Austin. The design should feel festive and inviting with prominent menu display and easy reservation booking. Incorporate Mexican-inspired patterns and warm colors.",
  "metadata": {
    "suggestedName": "austin-mexican-restaurant",
    "title": "Authentic Mexican Cuisine in Austin, TX",
    "description": "Experience authentic Mexican flavors in the heart of Austin. Fresh ingredients, family recipes, unforgettable taste."
  }
}
```

## API Integration

### Endpoint
`POST /api/interpret`

### Request
```typescript
interface InterpretRequest {
  prompt: string;
}
```

### Response
```typescript
interface InterpretResponse {
  projectType: string;
  industry: string;
  location: string | null;
  tone: string;
  features: string[];
  sections: string[];
  style: {
    suggested: string;
    colors: string | null;
    fonts: string | null;
  };
  pages: string[];
  brief: string;
  metadata: {
    suggestedName: string;
    title: string;
    description: string;
  };
}
```

### Implementation Notes
1. Use `claude-3-haiku-20240307` model
2. Set `max_tokens: 1024` (structured output is concise)
3. Set `temperature: 0.3` (we want consistent extraction)
4. Parse JSON response and validate schema
5. Cache responses for similar prompts (future optimization)

## Error Handling

If Haiku cannot understand the request:
```json
{
  "error": true,
  "message": "Could not understand the request. Please describe the type of website you want.",
  "suggestions": [
    "Try: 'A portfolio website for a photographer'",
    "Try: 'A landing page for my startup'",
    "Try: 'A restaurant website with menu and reservations'"
  ]
}
```

## Validation Checklist
- [ ] Response is valid JSON
- [ ] projectType is one of the allowed values
- [ ] features array is not empty
- [ ] sections array includes at least "hero"
- [ ] pages array includes at least "index.html"
- [ ] brief is 1-4 sentences
- [ ] metadata.suggestedName is kebab-case
