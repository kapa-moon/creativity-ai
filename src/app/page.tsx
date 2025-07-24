import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Creativity Support Tools
          </h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              🗨️ Co-Pilot AI
            </h2>

            <Link 
              href="/chat"
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
              Open Chat Interface →
            </Link>
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
