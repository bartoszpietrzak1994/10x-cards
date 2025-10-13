# 10xCards

## Project Description
10xCards is a web application designed to simplify the creation of educational flashcards by offering both manual creation and AI-assisted generation. It minimizes the manual work involved, shortening the feedback loop and allowing users to start learning quickly. The platform also supports flashcard management and integrates with a spaced repetition system for enhanced learning efficiency.

## Tech Stack
- **Frontend:**
  - **Astro 5:** Generates fast, efficient pages with minimal JavaScript.
  - **React 19:** Provides dynamic and interactive UI components.
  - **TypeScript 5:** Enhances code reliability through static typing.
  - **Tailwind 4:** Enables rapid and consistent styling.
  - **Shadcn/ui:** Offers high-quality React UI components.

- **Backend:**
  - **Supabase:** A comprehensive backend solution featuring PostgreSQL, built-in authentication, and streamlined integration.

- **AI Integration:**
  - **Openrouter.ai:** Integrates with multiple AI models (e.g., OpenAI, Anthropic, Google) to automatically generate flashcard suggestions, while managing API cost limits and efficiency.

- **CI/CD & Hosting:**
  - **GitHub Actions:** Automates the CI/CD pipelines.
  - **DigitalOcean:** Hosts the application using Docker containers for scalability and reliability.

## Getting Started Locally
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/10xCards.git
   cd 10xCards
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Set the Correct Node Version:**
   Ensure you are using Node version `22.14.0`:
   ```bash
   nvm use
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
5. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000` (or the port indicated in your terminal).

## Available Scripts
- **`npm run dev`**: Starts the Astro development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Previews the production build locally.
- **`npm run lint`**: Runs ESLint to check for errors.
- **`npm run lint:fix`**: Automatically fixes ESLint issues.
- **`npm run format`**: Formats the codebase using Prettier.

## Project Scope
- **AI-Powered Flashcard Generation:**
  - Users can paste text that ranges from 1000 to 10,000 characters.
  - The AI generates flashcard suggestions in under 30-40 seconds.
  - Interaction logs capture metadata such as timestamps, token counts, unique identifiers, and error details.
  
- **Manual Flashcard Creation:**
  - Users can manually create flashcards by defining both the front and back content.

- **Flashcard Management:**
  - The application allows users to view, edit, and delete flashcards.

- **User Account Management:**
  - Supports secure user registration and login with row-level security to protect user data.

- **Spaced Repetition Integration:**
  - Generated and manually created flashcards can be integrated with an existing spaced repetition algorithm to optimize learning retention.

## Project Status
The project is currently in active development, with key features such as AI-based flashcard generation, manual creation, and user management implemented. Further refinements and feature enhancements are underway.

## License
This project is licensed under the [MIT License](LICENSE).

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)
