# App Guide

Please follow the more thorough instructions in [Cursor for Designers](https://wiki.corp.adobe.com/display/AdobeDesign/Cursor+for+Designers)

## Getting Started

### Installation

1. **Get the code**
   
   Option A - If you're familiar with git:
   ```
   git clone [repository URL]
   cd [project folder]
   ```
   
   Option B - If you're new to development:
   - Go to the repository website
   - Look for a "Download ZIP" or "Code → Download ZIP" button
   - Download and extract the ZIP file to a folder on your computer
   - Open this folder in your Editor

2. **Install dependencies**
   
   Using VS Code tasks:
   - Open the project in your Editor
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the command palette
   - Type "Tasks: Run Task" and select it
   - Choose the "install" task

   Or manually:
   ```
   npm install
   ```
   or if you use Yarn:
   ```
   yarn
   ```

### Development

**Start the development server**

Using VS Code tasks:
- Open the project in your Editor
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the command palette
- Type "Tasks: Run Task" and select it
- Choose the "run" task

Or manually:
```
npm run dev
```
or with Yarn:
```
yarn dev
```

This will start the local development server, typically at http://localhost:5173


## Included API Examples

API's are external services that are used to fetch data from the internet.

This project includes knowledge and examples of the following API's:

- [OpenAI](https://platform.openai.com/) - For AI-powered text generation and chat completions
- [Adobe Firefly](https://www.adobe.com/products/firefly.html) - For AI-powered image generation, manipulation, and creative tasks including:
  - Image generation (v3 and v4)
  - Batch image generation
  - Image upload and processing
  - Similar image generation
  - Genfill (image inpainting/outpainting)
  - Video generation and status checking
- [Adobe Stock](https://www.adobe.io/apis/creativecloud/stock.html) - For accessing Adobe Stock assets including:
  - Search for images, videos, templates and other assets
  - Filter by content type, orientation, and other parameters
  - Access thumbnail and preview images
