// Intel CRM Chrome Extension - Content Script
// Handles profile detection and data extraction on social media sites

(function() {
  'use strict';

  // Platform detection
  const PLATFORMS = {
    instagram: {
      match: /instagram\.com/,
      profilePattern: /instagram\.com\/([^\/\?]+)\/?$/,
      selectors: {
        name: 'header section h2, header h1',
        bio: 'header section > div:last-child span',
        avatar: 'header img[alt*="profile"]',
        stats: 'header ul li span',
        posts: 'article a[href*="/p/"]',
      }
    },
    linkedin: {
      match: /linkedin\.com/,
      profilePattern: /linkedin\.com\/in\/([^\/\?]+)/,
      selectors: {
        name: '.text-heading-xlarge, h1.inline',
        headline: '.text-body-medium',
        avatar: '.pv-top-card-profile-picture__image',
        about: '#about ~ div .inline-show-more-text',
        experience: '#experience ~ div .pvs-entity',
      }
    },
    threads: {
      match: /threads\.net/,
      profilePattern: /threads\.net\/@?([^\/\?]+)/,
      selectors: {
        name: '[data-pressable-container] span',
        bio: '[data-pressable-container] + div span',
        avatar: 'img[alt*="profile"]',
      }
    },
    twitter: {
      match: /(twitter|x)\.com/,
      profilePattern: /(twitter|x)\.com\/([^\/\?]+)$/,
      selectors: {
        name: '[data-testid="UserName"] span',
        bio: '[data-testid="UserDescription"]',
        avatar: '[data-testid="UserAvatar"] img',
        stats: '[href$="/followers"], [href$="/following"]',
      }
    }
  };

  let currentPlatform = null;
  let captureButton = null;
  let isCapturing = false;
  let contextValid = true;

  // Wrapper to safely send messages with context invalidation recovery
  async function safeSendMessage(message) {
    const MAX_RETRIES = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
          contextValid = false;
          throw new Error('Extension context invalidated - please refresh the page');
        }
        
        const response = await chrome.runtime.sendMessage(message);
        contextValid = true;
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`[Intel CRM] Message attempt ${attempt + 1} failed:`, error.message);
        
        // Check for context invalidation errors
        if (error.message?.includes('Extension context invalidated') || 
            error.message?.includes('Could not establish connection') ||
            error.message?.includes('Receiving end does not exist')) {
          
          contextValid = false;
          
          if (attempt < MAX_RETRIES) {
            // Wait a bit and retry - service worker might wake up
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
        }
        
        // Non-recoverable error or max retries reached
        throw error;
      }
    }
    
    throw lastError;
  }

  // Initialize
  function init() {
    detectPlatform();
    if (currentPlatform) {
      injectCaptureButton();
      setupMessageListener();
      observePageChanges();
    }
  }

  function detectPlatform() {
    const url = window.location.href;
    for (const [name, config] of Object.entries(PLATFORMS)) {
      if (config.match.test(url)) {
        currentPlatform = { name, ...config };
        console.log(`[Intel CRM] Detected platform: ${name}`);
        return;
      }
    }
  }

  function injectCaptureButton() {
    if (captureButton) return;

    captureButton = document.createElement('div');
    captureButton.id = 'intel-crm-capture-btn';
    captureButton.innerHTML = `
      <button class="intel-crm-btn" title="Capture to Intel CRM">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        <span class="intel-crm-btn-text">Capture</span>
      </button>
      <div class="intel-crm-status"></div>
    `;
    document.body.appendChild(captureButton);

    captureButton.querySelector('.intel-crm-btn').addEventListener('click', handleCapture);
  }

  async function handleCapture() {
    if (isCapturing) return;
    isCapturing = true;

    const btn = captureButton.querySelector('.intel-crm-btn');
    const status = captureButton.querySelector('.intel-crm-status');
    
    btn.classList.add('capturing');
    status.textContent = 'Capturing...';
    status.className = 'intel-crm-status visible';

    try {
      // Check context validity before extraction
      if (!chrome.runtime?.id) {
        throw new Error('Please refresh the page to reconnect the extension');
      }
      
      const profileData = await extractProfileData();
      
      if (!profileData) {
        throw new Error('Could not extract profile data');
      }

      // Use safe message sender with retry logic
      const response = await safeSendMessage({
        type: 'CAPTURE_PROFILE',
        payload: profileData
      });

      if (response?.success) {
        status.textContent = '✓ Captured!';
        status.classList.add('success');
        btn.classList.remove('capturing');
        btn.classList.add('success');
      } else {
        throw new Error(response?.error || 'Capture failed');
      }
    } catch (error) {
      console.error('[Intel CRM] Capture error:', error);
      
      // Provide user-friendly error messages
      let errorMsg = error.message;
      if (error.message?.includes('Extension context invalidated') ||
          error.message?.includes('Could not establish connection')) {
        errorMsg = 'Connection lost - refresh page';
      } else if (error.message?.includes('Receiving end does not exist')) {
        errorMsg = 'Extension sleeping - try again';
      }
      
      status.textContent = '✗ ' + errorMsg;
      status.classList.add('error');
      btn.classList.remove('capturing');
      btn.classList.add('error');
    }

    setTimeout(() => {
      isCapturing = false;
      btn.classList.remove('success', 'error');
      status.classList.remove('visible', 'success', 'error');
    }, 4000); // Increased to 4s to give user time to read error
  }

  async function extractProfileData() {
    const url = window.location.href;
    const match = url.match(currentPlatform.profilePattern);
    
    if (!match) {
      console.log('[Intel CRM] Not on a profile page');
      return null;
    }

    const username = match[currentPlatform.name === 'twitter' ? 2 : 1];
    const selectors = currentPlatform.selectors;
    
    const data = {
      platform: currentPlatform.name,
      url: url,
      username: username,
      capturedAt: new Date().toISOString(),
    };

    // Extract name
    const nameEl = document.querySelector(selectors.name);
    if (nameEl) data.name = nameEl.textContent.trim();

    // Extract bio/headline
    const bioSelector = selectors.bio || selectors.headline;
    if (bioSelector) {
      const bioEl = document.querySelector(bioSelector);
      if (bioEl) data.bio = bioEl.textContent.trim();
    }

    // Extract avatar with highest resolution
    if (selectors.avatar) {
      const avatarEl = document.querySelector(selectors.avatar);
      if (avatarEl) {
        // Try to get the highest resolution version
        let avatarUrl = avatarEl.src;
        // For Instagram, try to get higher resolution
        if (currentPlatform.name === 'instagram' && avatarUrl) {
          avatarUrl = avatarUrl.replace(/s150x150/g, 's320x320').replace(/s110x110/g, 's320x320');
        }
        data.avatarUrl = avatarUrl;
      }
    }

    // Platform-specific extraction
    switch (currentPlatform.name) {
      case 'instagram':
        data.posts = extractInstagramPosts();
        data.stats = extractInstagramStats();
        // Try to extract recent post captions
        data.recentPosts = extractInstagramPostDetails();
        break;
      case 'linkedin':
        data.experience = extractLinkedInExperience();
        data.about = extractLinkedInAbout();
        data.education = extractLinkedInEducation();
        data.skills = extractLinkedInSkills();
        break;
      case 'twitter':
        data.stats = extractTwitterStats();
        data.recentTweets = extractTwitterTweets();
        break;
      case 'threads':
        data.stats = extractThreadsStats();
        break;
    }

    // Get page HTML for AI processing (more targeted extraction)
    data.pageHtml = extractCleanedHtml();

    console.log('[Intel CRM] Extracted data:', data);
    return data;
  }

  // Extract cleaner HTML for AI processing
  function extractCleanedHtml() {
    const mainContent = document.querySelector('main, article, [role="main"], body');
    if (!mainContent) return document.body.innerHTML.substring(0, 50000);
    
    // Clone and remove scripts, styles, and hidden elements
    const clone = mainContent.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg, [hidden]').forEach(el => el.remove());
    
    return clone.innerHTML.substring(0, 50000);
  }

  function extractInstagramPosts() {
    const posts = [];
    const postLinks = document.querySelectorAll('article a[href*="/p/"]');
    
    postLinks.forEach((link, index) => {
      if (index >= 12) return; // Limit to recent posts
      
      const img = link.querySelector('img');
      posts.push({
        url: link.href,
        imageUrl: img?.src,
        alt: img?.alt,
      });
    });

    return posts;
  }

  function extractInstagramStats() {
    const stats = {};
    const statElements = document.querySelectorAll('header ul li');
    
    statElements.forEach(el => {
      const text = el.textContent.toLowerCase();
      const numberMatch = text.match(/[\d,\.]+[km]?/i);
      if (numberMatch) {
        if (text.includes('post')) stats.posts = numberMatch[0];
        else if (text.includes('follower')) stats.followers = numberMatch[0];
        else if (text.includes('following')) stats.following = numberMatch[0];
      }
    });

    return stats;
  }

  function extractLinkedInExperience() {
    const experience = [];
    const expItems = document.querySelectorAll('#experience ~ div .pvs-entity');
    
    expItems.forEach((item, index) => {
      if (index >= 5) return;
      
      const title = item.querySelector('.t-bold span')?.textContent?.trim();
      const company = item.querySelector('.t-normal span')?.textContent?.trim();
      
      if (title || company) {
        experience.push({ title, company });
      }
    });

    return experience;
  }

  function extractLinkedInAbout() {
    const aboutEl = document.querySelector('#about ~ div .inline-show-more-text');
    return aboutEl?.textContent?.trim();
  }

  function extractTwitterStats() {
    const stats = {};
    
    const followersEl = document.querySelector('[href$="/verified_followers"] span span, [href$="/followers"] span span');
    const followingEl = document.querySelector('[href$="/following"] span span');
    
    if (followersEl) stats.followers = followersEl.textContent.trim();
    if (followingEl) stats.following = followingEl.textContent.trim();

    return stats;
  }

  // Additional extraction helpers for richer data
  function extractInstagramPostDetails() {
    const posts = [];
    const postLinks = document.querySelectorAll('article a[href*="/p/"]');
    
    postLinks.forEach((link, index) => {
      if (index >= 6) return; // Get top 6 posts
      
      const img = link.querySelector('img');
      const videoIndicator = link.querySelector('[aria-label*="video"], svg[aria-label*="Reel"]');
      
      posts.push({
        url: link.href,
        imageUrl: img?.src,
        alt: img?.alt, // Often contains caption preview
        hasVideo: !!videoIndicator,
      });
    });

    return posts;
  }

  function extractLinkedInEducation() {
    const education = [];
    const eduItems = document.querySelectorAll('#education ~ div .pvs-entity');
    
    eduItems.forEach((item, index) => {
      if (index >= 3) return;
      
      const school = item.querySelector('.t-bold span')?.textContent?.trim();
      const degree = item.querySelector('.t-normal span')?.textContent?.trim();
      
      if (school) {
        education.push({ school, degree });
      }
    });

    return education;
  }

  function extractLinkedInSkills() {
    const skills = [];
    const skillItems = document.querySelectorAll('#skills ~ div .pvs-entity');
    
    skillItems.forEach((item, index) => {
      if (index >= 10) return;
      
      const skill = item.querySelector('.t-bold span')?.textContent?.trim();
      if (skill) skills.push(skill);
    });

    return skills;
  }

  function extractTwitterTweets() {
    const tweets = [];
    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
    
    tweetArticles.forEach((article, index) => {
      if (index >= 5) return;
      
      const tweetText = article.querySelector('[data-testid="tweetText"]')?.textContent?.trim();
      const time = article.querySelector('time')?.getAttribute('datetime');
      
      if (tweetText) {
        tweets.push({
          content: tweetText.substring(0, 280),
          timestamp: time,
        });
      }
    });

    return tweets;
  }

  function extractThreadsStats() {
    const stats = {};
    
    // Threads uses similar patterns to Instagram
    const statsText = document.body.innerText;
    const followersMatch = statsText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*followers?/i);
    const followingMatch = statsText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*following/i);
    
    if (followersMatch) stats.followers = followersMatch[1];
    if (followingMatch) stats.following = followingMatch[1];

    return stats;
  }

  function setupMessageListener() {
    // Listen for messages from the web app
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'INTEL_CRM_EXTENSION_PING') {
        window.postMessage({ type: 'INTEL_CRM_EXTENSION_PONG' }, '*');
      }
    });

    // Respond to extension detection with context check
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ type: 'PONG', platform: currentPlatform?.name });
      } else if (message.type === 'WAKE_UP') {
        // Service worker woke up, we're still connected
        contextValid = true;
        sendResponse({ type: 'AWAKE', platform: currentPlatform?.name });
      }
      return true;
    });
    
    // Periodic context health check
    setInterval(() => {
      if (!chrome.runtime?.id) {
        console.warn('[Intel CRM] Context lost - button will show refresh message on next click');
        contextValid = false;
        // Update button to indicate refresh needed
        if (captureButton && !isCapturing) {
          const status = captureButton.querySelector('.intel-crm-status');
          if (status) {
            status.textContent = 'Refresh page to reconnect';
            status.className = 'intel-crm-status visible warning';
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  function observePageChanges() {
    // Re-detect platform on URL changes (SPA navigation)
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        detectPlatform();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
