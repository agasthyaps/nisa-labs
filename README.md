<a href="#">
  <img alt="Advanced AI Chatbot with Artifacts and Integrations" src="app/(chat)/opengraph-image.png">
  <h1 align="center">nisa labs</h1>
</a>

<p align="center">
    An advanced AI chatbot with artifacts, integrations, and educational tools. Built with Next.js, AI SDK, and multiple powerful integrations for enhanced productivity and learning.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#integrations"><strong>Integrations</strong></a> ·
  <a href="#artifacts"><strong>Artifacts</strong></a> ·
  <a href="#setup"><strong>Setup</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a>
</p>
<br/>

## Features

### 🤖 Advanced AI Chat
- **Multiple AI Models**: OpenAI GPT-4.1 and reasoning models with intelligent model selection
- **Streaming Responses**: Real-time response generation with smooth streaming
- **Context-Aware**: Maintains conversation history and context across sessions
- **Role-Based Access**: Guest and authenticated user tiers with different capabilities

### 🎨 Artifacts System
- **Code Execution**: Write and run Python code with live console output
- **Text Documents**: Create and edit rich text documents with AI suggestions
- **Spreadsheets**: Generate and manipulate CSV data with dynamic editing
- **Image Generation**: Create images using DALL-E integration

### 🔧 Powerful Integrations
- **GitHub Expertise**: Access pedagogical knowledge base and teaching resources
- **Google Sheets**: Read, write, and append data to spreadsheets via natural language
- **Google Drive**: Knowledge base file management and note processing
- **Image Transcription**: Convert handwritten notes and images to text
- **Weather API**: Get current weather information

### 🎓 Educational Tools
- **Teaching Resources**: Access to coaching frameworks and educational best practices
- **Note Transcription**: Process classroom observation notes and student work
- **Decision Logging**: Track and manage educational decisions and outcomes
- **Knowledge Management**: Organize and retrieve teaching expertise

### 🔍 Observability & Analytics
- **Langfuse Integration**: Full LLM observability with tracing and session tracking
- **Dynamic Prompts**: Prompts managed via Langfuse for easy updates
- **Performance Monitoring**: Track model usage, costs, and conversation quality

## Integrations

### GitHub Expertise
Access teaching resources and pedagogical expertise from a connected GitHub repository.
- List and read expertise files
- Search content by keywords
- Get repository overviews
- [Setup Guide](GITHUB_EXPERTISE_SETUP.md)

### Google Sheets
Interact with Google Sheets using natural language commands.
- Read data from specific ranges
- Write and update spreadsheet content
- Append new rows and data
- [Setup Guide](GOOGLE_SHEETS_SETUP.md)

### Langfuse Observability
Complete LLM tracing and prompt management.
- Session tracking and user analytics
- Dynamic prompt management
- Cost and performance monitoring
- [Setup Guide](LANGFUSE_SETUP.md)

### Image Processing
Advanced image analysis and transcription capabilities.
- Handwritten text transcription
- Image description and analysis
- Automatic processing on upload
- [Feature Guide](TRANSCRIBE_NOTES_TOOL.md)

## Artifacts

The artifacts system allows users to create and interact with various content types:

### Code Artifacts
- **Languages**: Python with execution support
- **Features**: Live console output, error handling, syntax highlighting
- **Editor**: CodeMirror with themes and language support

### Text Artifacts
- **Rich Editing**: ProseMirror-based editor with markdown support
- **AI Suggestions**: Get intelligent suggestions for content improvement
- **Version Control**: Track changes and maintain document history

### Sheet Artifacts
- **Data Grid**: Interactive spreadsheet interface with editing capabilities
- **CSV Support**: Import/export CSV data
- **Dynamic Updates**: Real-time data manipulation

### Image Artifacts
- **Generation**: Create images using DALL-E
- **Editing**: Basic image manipulation tools
- **Integration**: Seamless integration with chat workflow

## Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/docs) with OpenAI models
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL
- **Authentication**: [Auth.js](https://authjs.dev) (NextAuth.js)
- **UI**: [shadcn/ui](https://ui.shadcn.com) with [Tailwind CSS](https://tailwindcss.com)
- **Deployment**: Optimized for [Vercel](https://vercel.com)
- **Observability**: [Langfuse](https://langfuse.com) for LLM tracing

## Models & Providers

- **Primary Chat Model**: OpenAI GPT-4.1 for general conversations
- **Reasoning Model**: OpenAI O1-mini for complex reasoning tasks
- **Artifact Model**: OpenAI GPT-4.1 for content generation
- **Title Model**: OpenAI GPT-4.1-nano for chat title generation
- **Image Model**: DALL-E 3 for image generation

## Setup

### Prerequisites

- Node.js 18+ with pnpm
- PostgreSQL database (or [Vercel Postgres](https://vercel.com/storage/postgres))
- OpenAI API key
- (Optional) Google Cloud Platform account for Sheets/Drive integration
- (Optional) GitHub Personal Access Token for expertise integration
- (Optional) Langfuse account for observability

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Required - Database
POSTGRES_URL=your_postgres_connection_string

# Required - Authentication
AUTH_SECRET=your_auth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Required - OpenAI
OPENAI_API_KEY=your_openai_api_key

# Optional - Langfuse Observability
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_HOST=https://us.cloud.langfuse.com

# Optional - GitHub Expertise Integration
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token

# Optional - Google Integrations
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=your_google_service_account_json

# Optional - File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Installation & Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ai-chatbot
   pnpm install
   ```

2. **Database Setup**
   ```bash
   # Generate database migrations
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # (Optional) Open Drizzle Studio
   pnpm db:studio
   ```

3. **Development Server**
   ```bash
   pnpm dev
   ```

   Your application will be running at [localhost:3000](http://localhost:3000)

### Integration Setup

Each integration has its own setup guide:

- **[GitHub Expertise Setup](GITHUB_EXPERTISE_SETUP.md)** - Access teaching resources and pedagogical content
- **[Google Sheets Setup](GOOGLE_SHEETS_SETUP.md)** - Read/write spreadsheet integration
- **[Langfuse Setup](LANGFUSE_SETUP.md)** - LLM observability and prompt management

## Deployment

### Vercel Deployment (Recommended)

This application is optimized for Vercel deployment:

1. **Fork/Clone Repository**
2. **Connect to Vercel**
   - Import your repository to Vercel
   - Configure environment variables in Vercel dashboard
3. **Database Setup**
   - Use [Vercel Postgres](https://vercel.com/storage/postgres) or external PostgreSQL
   - Set `POSTGRES_URL` in environment variables
4. **Deploy**
   - Vercel will automatically run migrations during build
   - Your app will be live at `your-app.vercel.app`

### Manual Deployment

For other platforms:

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

Ensure all environment variables are configured and the database is accessible.

## Usage

### Basic Chat
- Start conversations with AI models
- Upload images for transcription and analysis
- Switch between regular and reasoning models

### Creating Artifacts
- **Code**: "Create a Python script that..."
- **Text**: "Write a document about..."
- **Spreadsheet**: "Generate a CSV with..."
- **Image**: "Create an image of..."

### Using Integrations
- **Google Sheets**: "Read data from my spreadsheet" or "Add this data to Sheet1"
- **GitHub Expertise**: "Show me teaching frameworks" or "Search for warm demander strategies"
- **Image Processing**: Upload handwritten notes for automatic transcription

### Settings Management
- Configure Google Sheets URL in user settings
- Manage account preferences and integrations
- View usage analytics and conversation history

## Development

### Project Structure

```
ai-chatbot/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   └── (chat)/            # Main chat application
├── artifacts/             # Artifacts system (code, text, sheets, images)
├── components/            # React components
├── lib/                   # Shared utilities and logic
│   ├── ai/               # AI models, tools, and providers
│   ├── db/               # Database schema and queries
│   └── ...
├── hooks/                # Custom React hooks
└── tests/                # E2E and integration tests
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:push          # Push schema changes

# Code Quality
pnpm lint             # Run ESLint and Biome
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Biome

# Testing
pnpm test             # Run Playwright tests
```

### Adding New AI Tools

1. Create tool in `lib/ai/tools/your-tool.ts`
2. Export from `lib/ai/tools/index.ts`
3. Add to active tools in `app/(chat)/api/chat/route.ts`
4. Add UI components if needed

### Creating New Artifacts

1. Define artifact type in `lib/artifacts/types.ts`
2. Create server handler in `artifacts/your-type/server.ts`
3. Create client component in `artifacts/your-type/client.tsx`
4. Register in `artifacts/index.ts`

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Ensure `POSTGRES_URL` is correctly set
- Check database is running and accessible
- Run `pnpm db:migrate` to ensure schema is up to date

**OpenAI API Issues**
- Verify `OPENAI_API_KEY` is valid and has sufficient credits
- Check rate limits and usage quotas
- Ensure model names match available models

**Authentication Problems**
- Generate a secure `AUTH_SECRET` (32+ characters)
- Set correct `NEXTAUTH_URL` for your domain
- Clear browser cookies and try again

**Integration Failures**
- Check respective setup guides for each integration
- Verify API keys and permissions
- Check server logs for detailed error messages

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```bash
DEBUG=true
NODE_ENV=development
```

### Getting Help

- Check the integration-specific setup guides
- Review server logs for error details
- Open an issue with reproduction steps

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Use Biome for formatting and linting

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org) and [Vercel AI SDK](https://sdk.vercel.ai)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Database management with [Drizzle ORM](https://orm.drizzle.team)
- Educational focus and nisa labs branding for pedagogical applications
