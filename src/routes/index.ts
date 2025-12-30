import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import { createPasteHandler, getPasteHandler, getPasteHtmlHandler } from '../controllers/pasteController';

const router = Router();

// API Routes
router.get('/api/healthz', healthCheck);
router.post('/api/pastes', createPasteHandler);
router.get('/api/pastes/:id', getPasteHandler);

// HTML Routes
router.get('/p/:id', getPasteHtmlHandler);

// Home page - Simple UI to create pastes
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pastebin-Lite</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #f8f9fa;
          color: #333;
        }
        h1 { 
          color: #2c3e50; 
          border-bottom: 2px solid #3498db; 
          padding-bottom: 10px;
        }
        textarea { 
          width: 100%; 
          height: 250px; 
          margin: 15px 0; 
          padding: 15px; 
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          resize: vertical;
        }
        input { 
          padding: 10px; 
          margin: 8px 0; 
          width: 200px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .form-group {
          margin: 15px 0;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }
        button { 
          background: #3498db; 
          color: white; 
          padding: 12px 24px; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer; 
          font-size: 16px;
          font-weight: 600;
          transition: background 0.3s;
        }
        button:hover { 
          background: #2980b9; 
        }
        button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }
        .result { 
          margin-top: 25px; 
          padding: 20px; 
          background: #d4edda; 
          border-radius: 5px; 
          border: 1px solid #c3e6cb;
          display: none;
        }
        .error { 
          background: #f8d7da; 
          color: #721c24; 
          padding: 15px; 
          border-radius: 5px; 
          border: 1px solid #f5c6cb;
          margin: 15px 0;
          display: none;
        }
        .url-display {
          background: white;
          padding: 15px;
          border-radius: 5px;
          border: 1px solid #ddd;
          font-family: monospace;
          word-break: break-all;
          margin: 10px 0;
        }
        .copy-btn {
          background: #27ae60;
          margin-left: 10px;
        }
        .copy-btn:hover {
          background: #219653;
        }
        .instructions {
          background: #e8f4fc;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          font-size: 14px;
        }
        .instructions h3 {
          margin-top: 0;
          color: #2c3e50;
        }
      </style>
    </head>
    <body>
      <h1>Pastebin-Lite</h1>
      <p>Create a text paste and share the link. Pastes can expire by time or view count.</p>
      
      <div class="instructions">
        <h3>How to use:</h3>
        <ol>
          <li>Paste your text below</li>
          <li>Set optional expiration (time or views)</li>
          <li>Click "Create Paste" to get a shareable link</li>
          <li>Share the link - content auto-expires based on your settings</li>
        </ol>
      </div>
      
      <form id="pasteForm">
        <div class="form-group">
          <label for="content">Content *</label>
          <textarea id="content" placeholder="Enter your text here..." required></textarea>
          <div style="color: #666; font-size: 14px;">
            <span id="charCount">0</span> characters, <span id="wordCount">0</span> words
          </div>
        </div>
        
        <div class="form-group">
          <label for="ttl_seconds">Time to Live (seconds, optional)</label>
          <input type="number" id="ttl_seconds" min="1" placeholder="e.g., 3600 (1 hour)">
          <small style="color: #666; margin-left: 10px;">Leave empty for no time limit</small>
        </div>
        
        <div class="form-group">
          <label for="max_views">Maximum Views (optional)</label>
          <input type="number" id="max_views" min="1" placeholder="e.g., 10">
          <small style="color: #666; margin-left: 10px;">Leave empty for unlimited views</small>
        </div>
        
        <button type="submit" id="createBtn">
          <span id="btnText">Create Paste</span>
          <span id="btnSpinner" style="display: none;"> Creating...</span>
        </button>
      </form>
      
      <div id="error" class="error"></div>
      
      <div id="result" class="result">
        <h3 style="margin-top: 0; color: #155724;">Paste Created Successfully!</h3>
        <p>Share this link:</p>
        <div class="url-display" id="pasteUrl"></div>
        <button class="btn copy-btn" onclick="copyUrl()">Copy URL</button>
        <p style="margin-top: 15px;">
          <a href="#" id="viewLink" target="_blank">View Paste</a> | 
          <a href="#" onclick="createNew()">Create Another</a>
        </p>
      </div>
      
      <script>
        // Update character and word count
        document.getElementById('content').addEventListener('input', function() {
          const content = this.value;
          const charCount = content.length;
          const wordCount = content.trim().split(/\\s+/).filter(word => word.length > 0).length;
          
          document.getElementById('charCount').textContent = charCount;
          document.getElementById('wordCount').textContent = wordCount;
        });

        // Handle form submission
        document.getElementById('pasteForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const content = document.getElementById('content').value;
          const ttl_seconds = document.getElementById('ttl_seconds').value;
          const max_views = document.getElementById('max_views').value;
          
          // Clear previous errors
          document.getElementById('error').style.display = 'none';
          document.getElementById('result').style.display = 'none';
          
          // Validate
          if (!content.trim()) {
            showError('Please enter some content');
            return;
          }
          
          // Prepare data
          const data = {
            content: content.trim(),
            ttl_seconds: ttl_seconds ? parseInt(ttl_seconds) : undefined,
            max_views: max_views ? parseInt(max_views) : undefined
          };
          
          // Show loading
          const btn = document.getElementById('createBtn');
          const btnText = document.getElementById('btnText');
          const btnSpinner = document.getElementById('btnSpinner');
          btn.disabled = true;
          btnText.textContent = 'Creating...';
          btnSpinner.style.display = 'inline';
          
          try {
            const response = await fetch('/api/pastes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
              showResult(result);
            } else {
              throw new Error(result.error || 'Failed to create paste');
            }
          } catch (error) {
            showError(error.message);
          } finally {
            // Reset button
            btn.disabled = false;
            btnText.textContent = 'Create Paste';
            btnSpinner.style.display = 'none';
          }
        });

        function showResult(data) {
          const url = data.url;
          const viewUrl = \`\${window.location.origin}/p/\${data.id}\`;
          
          document.getElementById('pasteUrl').textContent = url;
          document.getElementById('viewLink').href = viewUrl;
          document.getElementById('result').style.display = 'block';
          
          // Scroll to result
          document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
        }

        function showError(message) {
          const errorDiv = document.getElementById('error');
          errorDiv.textContent = message;
          errorDiv.style.display = 'block';
          
          // Scroll to error
          errorDiv.scrollIntoView({ behavior: 'smooth' });
        }

        function copyUrl() {
          const url = document.getElementById('pasteUrl').textContent;
          navigator.clipboard.writeText(url).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.background = '#2ecc71';
            
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.background = '#27ae60';
            }, 2000);
          });
        }

        function createNew() {
          document.getElementById('content').value = '';
          document.getElementById('ttl_seconds').value = '';
          document.getElementById('max_views').value = '';
          document.getElementById('charCount').textContent = '0';
          document.getElementById('wordCount').textContent = '0';
          document.getElementById('result').style.display = 'none';
          document.getElementById('error').style.display = 'none';
          
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      </script>
    </body>
    </html>
  `);
});

export default router;
