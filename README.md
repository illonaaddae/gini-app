# Gift Genie 🎁

An AI-powered gift suggestion app that helps users find thoughtful and practical gifts using OpenAI's chat API.

## Features

- 🤖 AI-powered gift suggestions using OpenAI API
- 📝 Markdown rendering for rich text formatting
- 🛡️ XSS protection with DOMPurify sanitization
- ⚡ Fast bundling with Vite
- 🎨 Responsive UI with auto-resizing textarea
- 🔒 Environment-based configuration

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Build Tool:** Vite
- **AI Provider:** OpenAI (compatible with any OpenAI-compatible API)
- **Dependencies:**
  - `openai` - OpenAI API client
  - `marked` - Markdown parser
  - `dompurify` - XSS sanitization

## Installation

1. Clone the repository:
```bash
git clone https://github.com/illonaaddae/gini-app.git
cd gini-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
AI_KEY=your_openai_api_key
AI_URL=https://api.openai.com/v1
AI_MODEL=gpt-4
```

> **Note:** Don't commit `.env` to version control. The file is excluded in `.gitignore`.

## Development

Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:5173`

## Building

Build for production:
```bash
npm run build
```

Output files will be in the `dist/` directory.

## Deployment

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard:
   - `AI_KEY`
   - `AI_URL`
   - `AI_MODEL`
6. Deploy!

## How It Works

1. User enters gift preferences in the input field
2. The app sends the request to OpenAI API with a system prompt for gift suggestions
3. OpenAI returns gift recommendations
4. The response is parsed as Markdown and sanitized for security
5. HTML is rendered safely in the output area

## Security

- **DOMPurify:** All HTML output is sanitized to prevent XSS attacks
- **.env Protection:** API keys are stored in environment variables and excluded from git
- **Server-side API:** Sensitive operations should be delegated to a backend in production

## License

MIT

## Author

Created as part of the Scrimba AI Engineering Fundamentals course
