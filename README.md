# Jimat AI - Intelligent Energy Bill Analysis Dashboard

Jimat AI is a modern, AI-powered dashboard designed to help households understand and optimize their energy consumption. By leveraging Google's Gemini 2.5 Flash model, it transforms static PDF electricity bills into interactive, actionable insights.

## 🌟 Key Features

-   **Smart Bill Analysis**: Simply upload your PDF electricity bill. The system uses advanced AI to extract and analyze key data points instantly.
-   **Interactive Dashboard**: Visualize your energy usage with intuitive charts and metrics:
    -   **6-Month Usage History**: Track trends over time.
    -   **Cost Breakdown**: See exactly where your money goes (Generation Costs, Green Incentives, etc.).
    -   **Daily & Monthly Averages**: Understand your consumption patterns.
-   **Energy Forecast AI**: Predict future energy consumption based on household parameters (e.g., family size, AC usage) and get solar optimization tips.
-   **AI Assistant**: A built-in context-aware chatbot that can answer specific questions about your bill (e.g., "Why is my bill higher this month?").
-   **Profile Management**: Customize your profile with a display name and avatar.
-   **Secure & Private**: Support for both guest access and secure user authentication.
-   **Responsive Design**: A beautiful, mobile-friendly interface built with Tailwind CSS 4.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **AI Model**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) via `@google/generative-ai`
-   **Visualization**: [Recharts](https://recharts.org/) for data visualization
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

-   Node.js (v18 or later)
-   npm, yarn, pnpm, or bun
-   A Google Gemini API Key (Get one [here](https://aistudio.google.com/app/apikey))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/JS-2005/C1G8_Snow-White-and-4-Dwarf_SourceCode.git
    cd C1G8_Snow-White-and-4-Dwarf_SourceCode
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**
    Modify the `.env.local` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

5.  **Open the application:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

-   `app/`: Next.js App Router pages and layouts.
    -   `page.tsx`: Login/Welcome page.
    -   `dashboard/`: Main dashboard interface.
    -   `predict/`: Energy Forecast AI page.
    -   `profile/`: User profile settings.
    -   `api/analyze/`: API route for processing PDF uploads.
-   `components/`: Reusable UI components (Sidebar, Navbar, FileUpload, Charts).
-   `lib/`: Utility functions and Gemini AI configuration.
-   `contexts/`: React contexts for state management (Auth, Dashboard data).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the GPL 3.0 License.
