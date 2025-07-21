import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Creativity AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            A Next.js application with chat interface designed for Qualtrics survey integration and data collection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Chat Interface Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              🗨️ Chat Interface
            </h2>
            <p className="text-gray-600 mb-4">
              Test the interactive chat interface with mock responses. Perfect for testing dataflow and Qualtrics integration.
            </p>
            <Link 
              href="/chat"
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
              Open Chat Interface →
            </Link>
          </div>

          {/* Features Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              ✨ Features
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Real-time chat with timestamps
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Session data logging
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Data export functionality
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Qualtrics API integration
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🔗 Qualtrics Integration
          </h2>
          <p className="text-gray-600 mb-4">
            This application is designed to seamlessly integrate with Qualtrics surveys. You can:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900">Embed in Surveys</h3>
              <p className="text-sm text-gray-600">Use iframe embedding in Qualtrics questions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-medium text-gray-900">Collect Data</h3>
              <p className="text-sm text-gray-600">Automatically log chat interactions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-medium text-gray-900">Transfer Data</h3>
              <p className="text-sm text-gray-600">Pass data back to Qualtrics for analysis</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              See the integration guide for detailed setup instructions
            </p>
            <code className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-700">
              https://your-app-name.vercel.app/chat
            </code>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Deploy to Vercel →
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://github.com/your-username/creativity-ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-gray-500">
        <span>Built with Next.js 15 + TypeScript + Tailwind CSS</span>
        <span>•</span>
        <span>Ready for Vercel deployment</span>
      </footer>
    </div>
  );
}
