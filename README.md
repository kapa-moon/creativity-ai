# Creativity AI - Next.js React App

A modern Next.js application built with TypeScript, Tailwind CSS, and optimized for Vercel deployment.

## 🚀 Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **ESLint** for code quality
- **Vercel-optimized** configuration
- **Security headers** pre-configured
- **Image optimization** enabled
- **Performance optimizations** built-in

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [ESLint](https://eslint.org/) - Code linting
- [Vercel](https://vercel.com/) - Deployment platform

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd creativity-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your environment variables.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
creativity-ai/
├── src/
│   ├── app/                 # App Router pages and layouts
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
├── public/                  # Static assets
├── .env.local.example       # Environment variables template
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment configuration
```

## 🚀 Deployment on Vercel

This project is optimized for Vercel deployment:

### Automatic Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to [Vercel](https://vercel.com/)
3. Vercel will automatically deploy your app

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

In your Vercel dashboard, add any necessary environment variables:
- Go to your project settings
- Navigate to "Environment Variables"
- Add your variables (same as in `.env.local.example`)

## 🔧 Configuration

### Vercel Configuration

The `vercel.json` file includes:
- Build and install commands
- Function configuration
- Security headers
- Regional deployment settings

### Next.js Configuration

The `next.config.ts` includes:
- Image optimization
- Performance optimizations
- Security headers
- Bundle optimization

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Security

This project includes several security optimizations:
- CSP headers
- X-Frame-Options
- X-Content-Type-Options
- XSS Protection
- Referrer Policy

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
# Trigger redeploy
