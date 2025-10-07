# xayan.nu: Custom Instructions for GitHub Copilot

## Overview

xayan.nu is a personal website and blog focused on interdisciplinary analysis, commentary, and critique. The site covers a wide range of topics, including technology, politics, culture, and philosophy, often venturing into controversial and thought-provoking areas.

## Instructions

Your specific instructions depend on the task at hand.

### Development

When working on the website's codebase:

1. Follow best practices for web development, including code readability, maintainability, and performance optimization.
2. If you notice room for improvement beyond the scope of your current task, plug it briefly at the end of your response, but do not apply it automatically.

### Data Processing

1. When processing data, first analyze the structure and content of the data.
2. Identify the key requirements and objectives of the task.
3. Choose the most appropriate libraries and tools for the task.
4. If lacking information or means of execution, ask for clarification before proceeding.
5. When cross-referencing data, ensure consistency and accuracy of the information - if inconsistencies arise, abort and ask for clarification.
6. Break down the task into smaller, manageable steps - especially the processing code, so errors can be caught and fixed easily.

### Writing

When I explicitly ask you to, assess the quality of my writing:

1. Match the existing style and tone of the website.
2. Do not suggest significant rewrites, or tiny nitpicks.
3. Opine, rather than describe, and provide a perspective of a trusted 3rd party.
4. Look up sources when necessary, and cite them properly.

### Tools

Regardless of the task, always consider the following when calling tools:

1. When unsure about a solution, or running into issues, refer to the documentation of the relevant tools and libraries.
2. Give up after 3 failed attempts in a row, and briefly explain why it didn't work out.
3. If there are any files to download, put them into `temp/` and work from there.

## Backend: Hugo

### Documentation

Available at <https://github.com/gohugoio/hugoDocs>. Use the deepwiki MCP server, if available, or regular browsing otherwise.

### Customizations

- **Analytics**: Custom logic is used to watch for user activity and send custom events. See the file `assets/js/pikachu.js` for details.
- **Theme**: The site uses a heavily-customized version of [hugo-blog-awesome](https://github.com/hugo-sid/hugo-blog-awesome) theme.
  - It is cloned into the `themes` directory as a Git submodule. **Important:** Always initialize submodules first with `git submodule init && git submodule update` before working on the project.
  - Overrides are applied in the directories `layouts` and `assets`.
  - Custom styles are defined in `assets/sass/_custom.scss`.
- **Shortcodes**:
  - `chat`: Embeds conversations with LLMs in a familiar but non-interactive format. Each line should follow the format `(user|assistant|system): message` and may contain any Markdown content to be rendered within the chat bubble.
- **Front Matter**:
  - `toc` (boolean, optional, default: false): Toggle the table of contents for the post.
  - `hidden` (boolean, optional, default: false): If true, the page is excluded from the sitemap and lists of posts (e.g. Privacy Policy).
  - `comments` (boolean, optional, default: true): Toggle comments below the post.
  - `ttr` (string, optional): Time to read (e.g. "15~25m"), displayed in the post and lists.

## Analytics: PostHog

### Documentation

As per PostHog's official documentation:

> Markdown pages can be accessed by adding .md to the end of the URL, which serves the raw MDX we write our docs in.

Example: <https://posthog.com/docs/ai-engineering/markdown-llms-txt.md>

> You can find a directory of all our `.md` pages at <https://posthog.com/llms.txt>, a new proposed standard that helps LLMs index content.

### Instructions

1. Use tools exposed by the PostHog MCP server, if available. Otherwise, no access is assumed.
2. Queries are to be written in HogQL, PostHog's ClickHouse-based SQL dialect. Refer to the documentation for details.

### Custom Events

Besides the default ones, the following custom events are tracked:

- `engaged` + property `seconds`: Time actively spent on the page. This counter auto-increments within the same pageview and session - multiple events are sent, but only the one with the highest value is used for calculations.
- `scrolled` + property `percent`: Percentage of the page that was scrolled through. Similarly, only the highest value within the same pageview and session is used. This event is skipped for short pages (less than 4x the viewport height).

### Custom Views

The following tables are not included in the PostHog documentation but are defined as views within the project's codebase. They might be useful for generating SQL queries.

| Table Name | Description | Schema |
|------------|-------------|-------|
| `flags` | Mapping of country codes to their respective flag emojis | `country_code` (string), `flag` (string) |
| `countries` | Per-country statistics on pageviews and user engagement | `country` (string), `persons` (count, int), `pageviews` (count, int), `engaged_avg` (seconds, float), `scrolled_avg` (percentage, float) |
| `pageviews` | Detailed information on pageviews, including user activity metrics, grouped by session + pathname | `uuid` (string), `person_id` (string), `visit_time` (timestamp), `activity_time` (timestamp), `country_code` (string), `country_flag` (emoji, string), `country` (string), `city` (string), `pathname` (string), `engaged` (seconds, int), `scrolled` (percentage, float) |
| `visitors` | Summary of user activity, grouped by person_id | `uuid` (string), `person_id` (string), `engaged_sum` (seconds, int), `recent_activity` (timestamp), `countries` (array of strings), `visit_times` (array of timestamps), `pathnames` (array of strings), `engaged_values` (array of ints), `scrolled_values` (array of floats) |
