# [xayan.nu](https://xayan.nu/)

**The Adversary's Guide to the Galaxy**

*There are no stupid questions, only stupid people.*

## About

**xayan.nu** is a personal blog focused on interdisciplinary analysis, commentary, and critique covering a wide range of controversial and thought-provoking topics including:

- **Technology & AI**: LLM jailbreaking, prompt engineering, analytics implementation
- **Philosophy & Epistemology**: Critical thinking, religious analysis, logical reasoning
- **Politics & Society**: Migration policy analysis, political extremism, free speech
- **Law & Sociology**: European legal frameworks, societal tensions, institutional critique

The blog ventures fearlessly into complex and often contentious areas, prioritizing evidence-based analysis over popular opinion.

## Tech Stack

- **Framework**: [Hugo](https://gohugo.io/) - Static site generator
- **Theme**: [hugo-blog-awesome](https://github.com/hugo-sid/hugo-blog-awesome) (heavily customized)
- **Analytics**: [PostHog](https://posthog.com/) with custom engagement tracking
- **Hosting**: Static deployment with CDN
- **Comments**: [giscus](https://giscus.app/)

## Template & Customizations

This site uses the [hugo-blog-awesome](https://github.com/hugo-sid/hugo-blog-awesome) theme as a base but includes extensive modifications and overrides:

### Layout Overrides

Due to Hugo's template system, many customizations required copying entire template files to modify small parts:

- **`layouts/_default/single.html`** - Added per-post analytics configuration injection
- **`layouts/_default/list.html`** - Custom post listing with series support
- **`layouts/partials/meta/analytics.html`** - PostHog integration with custom CID handling
- **`layouts/partials/comments.html`** - giscus integration with custom styling
- **`layouts/partials/bio.html`** - Author bio with responsive image handling
- **`layouts/partials/postCard.html`** - Enhanced post cards with TTR (Time to Read)

### Custom Styling

- **`assets/sass/_custom.scss`** - Comprehensive style overrides including:
  - Custom color scheme with neon accent colors (`#33ffab`, `#23ad73`)
  - Chat message styling for LLM conversation displays
  - Responsive table containers with horizontal scrolling
  - Neon title effects and custom typography
  - Enhanced form styling and interactive elements

### Custom Shortcodes

- **`layouts/shortcodes/chat.html`** - Renders LLM conversations in a familiar chat format
  - Supports user/assistant message threading
  - Markdown rendering within chat bubbles
  - Customizable participant names

## Implemented Functionality

### Analytics & Engagement Tracking

- **Custom Analytics Script** (`assets/js/pikachu.js`):
  - PostHog event tracking with privacy-focused implementation
  - Per-post configurable "valued reader" detection
  - Scroll depth tracking with smart thresholds
  - Engagement time measurement with idle detection
  - Session management and activity monitoring
  - **Content selection tracking**: Captures user text selections and copy behavior
    - `content-selected`: Fires 500ms after text selection (debounced)
    - `content-copied`: Fires immediately on copy events (Ctrl/Cmd+C)
    - Payload includes selected text (truncated to 255 chars), paragraph count, image sources, and link hrefs

- **Per-Post Analytics Configuration**:
  ```yaml
  # In post front matter
  valued_time: 300   # 5 minutes (optional)
  valued_scroll: 70  # 70% scroll depth (optional)
  ```

### Content Features

- **Series Support**: Multi-part post series with navigation
- **Time to Read (TTR)**: Manual reading time estimates
- **Table of Contents**: Collapsible TOC for long-form content
- **Responsive Images**: Optimized image delivery with multiple formats
- **Social Integration**: Facebook, X (Twitter), GitHub, RSS feeds

### Development Features

- **Hot Reload**: Hugo's built-in development server
- **Asset Pipeline**: Sass compilation with custom variables
- **SEO Optimization**: Meta tags, structured data, sitemap generation
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

### Privacy & Performance

- **First-party Analytics**: PostHog hosted on custom subdomain
- **No Tracking Cookies**: Uses localStorage and server-side CID
- **Static Generation**: Fast loading with CDN optimization
- **Minimal Dependencies**: Custom implementations over heavy frameworks

## Content Licensing

- **Code**: MIT License - Free for commercial and non-commercial use
- **Content** (`/content/` directory): CC BY-NC 4.0 - Attribution required, non-commercial use only

## Development

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/Xayan/xayan-nu.git

# Start development server
hugo server

# Build for production
hugo --minify
```

---

*Built with ❤️ and a healthy dose of skepticism*
