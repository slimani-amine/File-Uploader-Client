# File Uploader Client

A modern React-based client application for handling file uploads with a beautiful UI.

## Features

- Modern React with TypeScript
- Drag and drop file upload
- File upload queue management
- Progress tracking
- Responsive design
- Beautiful UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd file-uploader-client
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your environment variables:

```env
VITE_API_URL=http://localhost:3000
```

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will start on http://localhost:5173 (or the port specified by Vite).

## Building for Production

To build the project:

```bash
npm run build
# or
yarn build
```

To preview the production build:

```bash
npm run preview
# or
yarn preview
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── hooks/         # Custom React hooks
  ├── lib/           # Utility functions and API clients
  ├── pages/         # Page components
  └── types/         # TypeScript type definitions
```

## License

MIT
