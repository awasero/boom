# Vibesites Multi-Model Architecture

## Overview

Vibesites uses a multi-model approach to optimize for speed, quality, and cost. Each Claude model has a specific role based on its strengths.

## Model Roles

### 1. Claude Haiku - Input Interpreter & Project Orchestrator
**Purpose:** Fast, lightweight analysis of user input before any generation begins.

**Responsibilities:**
- Parse and understand user intent from natural language prompts
- Extract key requirements (type of website, features, style preferences)
- Determine the project structure needed
- Create a structured brief for Opus
- Validate feasibility of the request
- Generate project metadata (name suggestions, categories, tags)

**When Used:** Immediately after user submits a prompt, before project creation.

**Example Input:**
```
"I want a plumbing company website in Miami with conversational tone and call to actions"
```

**Example Output:**
```json
{
  "projectType": "business-landing",
  "industry": "plumbing",
  "location": "Miami, FL",
  "tone": "conversational",
  "features": ["hero", "services", "cta-buttons", "contact-form", "about"],
  "style": {
    "suggested": "professional-friendly",
    "colors": "blue-trust-based"
  },
  "pages": ["index.html", "services.html", "contact.html"],
  "brief": "Create a professional yet approachable plumbing company website..."
}
```

---

### 2. Claude Opus - Design & Frontend Generation
**Purpose:** High-quality, creative design generation with exceptional attention to detail.

**Responsibilities:**
- Generate beautiful, production-ready HTML/CSS/JS
- Create unique, memorable designs (not generic AI aesthetics)
- Implement complex layouts and animations
- Ensure responsive design across all devices
- Apply appropriate typography, colors, and spacing
- Generate multiple pages with consistent design language

**When Used:** After Haiku has interpreted the request and created a structured brief.

**Input:** Structured brief from Haiku + any existing project files

**Output:** Complete HTML/CSS/JS files ready for deployment

---

### 3. Claude Sonnet - SEO/AEO Technical Optimization
**Purpose:** Technical optimization for search engines and AI answer engines.

**Responsibilities:**
- Add semantic HTML structure (proper headings, landmarks)
- Implement structured data (JSON-LD schemas)
- Optimize meta tags (title, description, Open Graph)
- Add accessibility attributes (ARIA labels, alt text)
- Implement performance optimizations
- Add sitemap and robots.txt
- Optimize for AI answer engines (clear, extractable content)

**When Used:** After Opus has generated the initial design, as a refinement pass.

**Input:** Generated HTML files from Opus

**Output:** Optimized HTML files with SEO/AEO enhancements

---

## Flow Diagram

```
User Prompt
     │
     ▼
┌─────────────┐
│   HAIKU     │ ─── Interpret & Plan (fast, cheap)
│  Interpreter │
└─────────────┘
     │
     │ Structured Brief
     ▼
┌─────────────┐
│   OPUS      │ ─── Generate Design (quality, creative)
│   Designer   │
└─────────────┘
     │
     │ HTML/CSS/JS Files
     ▼
┌─────────────┐
│   SONNET    │ ─── Optimize SEO/AEO (technical, precise)
│  Optimizer   │
└─────────────┘
     │
     │ Optimized Files
     ▼
  GitHub Commit
     │
     ▼
  Deploy to GitHub Pages
```

---

## API Endpoints

### POST /api/interpret
Uses Haiku to interpret user input.

**Request:**
```json
{
  "prompt": "user's natural language prompt"
}
```

**Response:**
```json
{
  "brief": "structured brief for Opus",
  "projectType": "landing|portfolio|blog|business",
  "features": ["list", "of", "features"],
  "pages": ["index.html", "about.html"],
  "metadata": { ... }
}
```

### POST /api/generate
Uses Opus to generate the design.

**Request:**
```json
{
  "brief": "structured brief from Haiku",
  "existingFiles": [],
  "projectContext": "optional context"
}
```

**Response:** Server-Sent Events stream with generated code

### POST /api/optimize
Uses Sonnet to optimize for SEO/AEO.

**Request:**
```json
{
  "files": [{ "path": "index.html", "content": "..." }],
  "projectType": "business-landing",
  "metadata": { ... }
}
```

**Response:**
```json
{
  "files": [{ "path": "index.html", "content": "optimized content" }],
  "changes": ["Added JSON-LD schema", "Optimized meta tags", ...]
}
```

---

## Cost Optimization

| Model | Input Cost | Output Cost | Use Case |
|-------|-----------|-------------|----------|
| Haiku | $0.25/M | $1.25/M | Interpretation, planning |
| Opus | $15/M | $75/M | Design generation |
| Sonnet | $3/M | $15/M | Technical optimization |

**Strategy:**
- Use Haiku for all quick tasks (validation, parsing, metadata)
- Reserve Opus for creative design work only
- Use Sonnet for technical/analytical tasks
- Cache Haiku responses for similar prompts

---

## Implementation Priority

1. **Phase 1:** Haiku interpreter for input analysis
2. **Phase 2:** Structured handoff to Opus
3. **Phase 3:** Sonnet SEO/AEO optimization pass
4. **Phase 4:** Caching and optimization
