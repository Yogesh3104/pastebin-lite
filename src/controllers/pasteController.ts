import { Request, Response } from 'express';
import { createPaste, getPaste } from '../models/paste';
import { getTestTime, escapeHtml } from '../utils/helpers';

export async function createPasteHandler(req: Request, res: Response) {
  try {
    const { content, ttl_seconds, max_views } = req.body;

    // Validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required and must be a non-empty string' });
    }

    if (ttl_seconds !== undefined && (typeof ttl_seconds !== 'number' || ttl_seconds < 1 || !Number.isInteger(ttl_seconds))) {
      return res.status(400).json({ error: 'ttl_seconds must be an integer ≥ 1' });
    }

    if (max_views !== undefined && (typeof max_views !== 'number' || max_views < 1 || !Number.isInteger(max_views))) {
      return res.status(400).json({ error: 'max_views must be an integer ≥ 1' });
    }

    const paste = await createPaste({ 
      content: content.trim(), 
      ttl_seconds, 
      max_views 
    });

    res.status(201).json({
      id: paste.id,
      url: `${req.protocol}://${req.get('host')}/p/${paste.id}`
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPasteHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const now = getTestTime(req);

    const paste = await getPaste(id, now);

    if (!paste) {
      return res.status(404).json({ error: 'Paste not found or expired' });
    }

    // Calculate remaining views
    const remaining_views = paste.max_views 
      ? paste.max_views - paste.views 
      : null;

    res.status(200).json({
      content: paste.content,
      remaining_views,
      expires_at: paste.expires_at ? paste.expires_at.toISOString() : null
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPasteHtmlHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const now = getTestTime(req);

    const paste = await getPaste(id, now);

    if (!paste) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Paste Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; }
            .container { max-width: 600px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Paste Not Found</h1>
            <p>The paste you're looking for doesn't exist or has expired.</p>
            <a href="/">Create a new paste</a>
          </div>
        </body>
        </html>
      `);
    }

    // Calculate remaining info
    const remainingViews = paste.max_views ? paste.max_views - paste.views : 'Unlimited';
    const expiresInfo = paste.expires_at 
      ? `Expires: ${new Date(paste.expires_at).toLocaleString()}`
      : 'Never expires';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Paste: ${id}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8f9fa; 
            color: #333;
          }
          .paste-container { 
            background: white; 
            border-radius: 10px; 
            padding: 25px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
            margin-top: 20px;
          }
          pre { 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            overflow-x: auto;
          }
          .info { 
            color: #666; 
            font-size: 14px; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 1px solid #eee; 
          }
          .info span {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 5px;
          }
          .actions {
            margin-top: 20px;
            text-align: center;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            font-size: 14px;
          }
          .btn:hover {
            background: #0056b3;
          }
          .btn-copy {
            background: #6c757d;
            margin-left: 10px;
          }
          .btn-copy:hover {
            background: #545b62;
          }
        </style>
      </head>
      <body>
        <div class="paste-container">
          <div class="info">
            <span><strong>Paste ID:</strong> ${id}</span>
            <span><strong>Views:</strong> ${paste.views}</span>
            <span><strong>Remaining Views:</strong> ${remainingViews}</span>
            <span><strong>${expiresInfo}</strong></span>
          </div>
          
          <pre id="paste-content">${escapeHtml(paste.content)}</pre>
          
          <div class="actions">
            <button class="btn" onclick="copyToClipboard()">Copy Content</button>
            <a href="/" class="btn btn-copy">Create New Paste</a>
          </div>
        </div>
        
        <script>
          function copyToClipboard() {
            const content = document.getElementById('paste-content').textContent;
            navigator.clipboard.writeText(content).then(() => {
              const btn = document.querySelector('.btn');
              const originalText = btn.textContent;
              btn.textContent = 'Copied!';
              btn.style.background = '#28a745';
              setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#007bff';
              }, 2000);
            });
          }
        </script>
      </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    console.error('Error serving paste HTML:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Internal Server Error</h1>
        <p>Something went wrong. Please try again later.</p>
      </body>
      </html>
    `);
  }
}
