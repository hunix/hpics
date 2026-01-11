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

  async function handleCapture(deepScrape = false) {
    if (isCapturing) return;
    isCapturing = true;

    const btn = captureButton.querySelector('.intel-crm-btn');
    const status = captureButton.querySelector('.intel-crm-status');
    
    btn.classList.add('capturing');
    status.textContent = deepScrape ? 'Deep scraping...' : 'Capturing...';
    status.className = 'intel-crm-status visible';

    try {
      // Check context validity before extraction
      if (!chrome.runtime?.id) {
        throw new Error('Please refresh the page to reconnect the extension');
      }
      
      // Get config to check if deep scrape is enabled
      const configResponse = await safeSendMessage({ type: 'GET_CONFIG' });
      const config = configResponse?.data || {};
      const useDeepScrape = deepScrape || config.deepScrape;
      
      let profileData;
      
      if (useDeepScrape) {
        profileData = await extractProfileDataDeep(status);
      } else {
        profileData = await extractProfileData();
      }
      
      if (!profileData) {
        throw new Error('Could not extract profile data');
      }

      // Use safe message sender with retry logic
      const response = await safeSendMessage({
        type: 'CAPTURE_PROFILE',
        payload: profileData
      });

      if (response?.success) {
        const postCount = profileData.recentPosts?.length || profileData.posts?.length || 0;
        status.textContent = `✓ Captured ${postCount} posts!`;
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
    }, 4000);
  }

  /**
   * Deep extraction with scroll support
   */
  async function extractProfileDataDeep(statusEl) {
    const url = window.location.href;
    const match = url.match(currentPlatform.profilePattern);
    
    if (!match) {
      console.log('[Intel CRM] Not on a profile page');
      return null;
    }

    const username = match[currentPlatform.name === 'twitter' ? 2 : 1];
    
    const data = {
      platform: currentPlatform.name,
      url: url,
      username: username,
      capturedAt: new Date().toISOString(),
      captureMode: 'deep',
    };

    // Platform-specific deep extraction
    switch (currentPlatform.name) {
      case 'instagram':
        await extractInstagramDeep(data, statusEl);
        break;
      case 'threads':
        await extractThreadsDeep(data, statusEl);
        break;
      default:
        // Fall back to regular extraction for unsupported platforms
        return extractProfileData();
    }

    // Get page HTML for additional AI processing
    data.pageHtml = extractCleanedHtml();
    data.rawContent = document.body.innerText.substring(0, 100000);

    console.log('[Intel CRM] Deep extracted data:', data);
    return data;
  }

  /**
   * Deep Instagram extraction
   */
  async function extractInstagramDeep(data, statusEl) {
    // Extract profile header
    data.profile = extractInstagramProfileDeep();
    data.name = data.profile.displayName || data.username;
    data.bio = data.profile.bio;
    data.avatarUrl = data.profile.profilePicUrl;
    data.stats = {
      posts: data.profile.postsCount?.toString(),
      followers: data.profile.followersCount?.toString(),
      following: data.profile.followingCount?.toString(),
    };

    // Extract highlights
    data.highlights = extractInstagramHighlights();

    // Scroll and collect posts
    data.recentPosts = [];
    let scrollAttempts = 0;
    const maxScrolls = 15;
    let lastCount = 0;
    let noNewCount = 0;

    while (data.recentPosts.length < 50 && scrollAttempts < maxScrolls) {
      if (statusEl) {
        statusEl.textContent = `Collecting posts... ${data.recentPosts.length}`;
      }

      const visiblePosts = extractInstagramPostsDeep();
      visiblePosts.forEach(post => {
        if (!data.recentPosts.some(p => p.postUrl === post.postUrl)) {
          data.recentPosts.push(post);
        }
      });

      if (data.recentPosts.length === lastCount) {
        noNewCount++;
        if (noNewCount >= 3) break;
      } else {
        noNewCount = 0;
      }
      lastCount = data.recentPosts.length;

      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await sleep(1500);
      scrollAttempts++;
    }

    // Try to extract Reels if we have few posts
    if (data.recentPosts.length < 20) {
      const reelsTab = document.querySelector('a[href*="/reels/"]');
      if (reelsTab) {
        data.reels = [];
        try {
          reelsTab.click();
          await sleep(2000);
          
          const reelLinks = document.querySelectorAll('a[href*="/reel/"]');
          reelLinks.forEach((link, idx) => {
            if (idx >= 20) return;
            const img = link.querySelector('img');
            data.reels.push({
              reelUrl: link.href,
              thumbnailUrl: img?.src,
              alt: img?.alt,
            });
          });

          // Go back to posts
          window.history.back();
          await sleep(1000);
        } catch (e) {
          console.warn('[Intel CRM] Reels extraction failed:', e);
        }
      }
    }

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Deep Threads extraction
   */
  async function extractThreadsDeep(data, statusEl) {
    // Extract profile header
    data.profile = extractThreadsProfileDeep();
    data.name = data.profile.displayName || data.profile.handle || data.username;
    data.bio = data.profile.bio;
    data.avatarUrl = data.profile.profilePicUrl;
    data.stats = {
      followers: data.profile.followersCount?.toString(),
      following: data.profile.followingCount?.toString(),
    };

    // Scroll and collect threads
    data.recentThreads = [];
    let scrollAttempts = 0;
    const maxScrolls = 20;
    let lastCount = 0;
    let noNewCount = 0;

    while (data.recentThreads.length < 50 && scrollAttempts < maxScrolls) {
      if (statusEl) {
        statusEl.textContent = `Collecting threads... ${data.recentThreads.length}`;
      }

      const visibleThreads = extractThreadsPostsDeep();
      visibleThreads.forEach(thread => {
        const isDuplicate = data.recentThreads.some(
          t => t.content === thread.content && t.timestamp === thread.timestamp
        );
        if (!isDuplicate && (thread.content || thread.hasMedia)) {
          data.recentThreads.push(thread);
        }
      });

      if (data.recentThreads.length === lastCount) {
        noNewCount++;
        if (noNewCount >= 3) break;
      } else {
        noNewCount = 0;
      }
      lastCount = data.recentThreads.length;

      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await sleep(1500);
      scrollAttempts++;
    }

    // Analyze content patterns
    data.contentAnalysis = analyzeThreadsContent(data.recentThreads);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Deep Instagram profile extraction with enhanced selectors
   */
  function extractInstagramProfileDeep() {
    const profile = {
      displayName: null,
      username: null,
      bio: null,
      pronouns: null,
      category: null,
      isVerified: false,
      isPrivate: false,
      isBusiness: false,
      profilePicUrl: null,
      externalUrl: null,
      followersCount: null,
      followingCount: null,
      postsCount: null,
      linkedAccounts: [],
    };

    // Header section extraction
    const header = document.querySelector('header');
    if (header) {
      // Profile picture - get highest res
      const avatar = header.querySelector('img[alt*="profile picture"], img[alt*="\'s profile picture"]');
      if (avatar) {
        profile.profilePicUrl = avatar.src
          .replace(/s150x150/g, 's640x640')
          .replace(/s110x110/g, 's640x640')
          .replace(/s320x320/g, 's640x640');
      }

      // Display name and verification
      const nameEl = header.querySelector('h2, section h1');
      if (nameEl) {
        profile.displayName = nameEl.textContent?.trim();
        profile.isVerified = !!header.querySelector('[aria-label*="Verified"], [title*="Verified"]');
      }

      // Bio section
      const bioSection = header.querySelector('section > div:last-of-type');
      if (bioSection) {
        const spans = bioSection.querySelectorAll('span');
        spans.forEach(span => {
          const text = span.textContent?.trim();
          if (text && text.length > 10 && !text.includes('followers') && !text.includes('following')) {
            if (!profile.bio || text.length > profile.bio.length) {
              profile.bio = text;
            }
          }
        });
      }

      // Pronouns
      const pronounEl = header.querySelector('[class*="pronoun"], span:contains("he/him"), span:contains("she/her"), span:contains("they/them")');
      if (pronounEl) {
        profile.pronouns = pronounEl.textContent?.trim();
      }

      // External link
      const linkEl = header.querySelector('a[href*="l.instagram.com"], a[href*="linktr.ee"], a[rel="me nofollow noopener"]');
      if (linkEl) {
        profile.externalUrl = linkEl.href;
      }

      // Stats
      const statsList = header.querySelector('ul');
      if (statsList) {
        const items = statsList.querySelectorAll('li');
        items.forEach(item => {
          const text = item.textContent?.toLowerCase() || '';
          const numMatch = text.match(/[\d,\.]+[km]?/i);
          if (numMatch) {
            const numStr = numMatch[0].replace(/,/g, '');
            let value = parseFloat(numStr);
            if (numStr.toLowerCase().includes('k')) value *= 1000;
            if (numStr.toLowerCase().includes('m')) value *= 1000000;

            if (text.includes('post')) profile.postsCount = Math.round(value);
            else if (text.includes('follower')) profile.followersCount = Math.round(value);
            else if (text.includes('following')) profile.followingCount = Math.round(value);
          }
        });
      }
    }

    // Check for private account
    profile.isPrivate = !!document.querySelector('[aria-label*="This account is private"]') ||
                        document.body.innerText.includes('This account is private');

    // Check for business/creator account
    const categoryEl = document.querySelector('[class*="category"], section header + div');
    if (categoryEl && categoryEl.textContent?.length < 50) {
      profile.category = categoryEl.textContent?.trim();
      profile.isBusiness = true;
    }

    return profile;
  }

  /**
   * Extract Instagram highlights from profile
   */
  function extractInstagramHighlights() {
    const highlights = [];
    const highlightContainer = document.querySelector('ul[class*="highlight"], div[class*="highlight"]');
    
    if (highlightContainer) {
      const items = highlightContainer.querySelectorAll('li, button, [role="button"]');
      items.forEach((item, idx) => {
        if (idx >= 20) return;
        const img = item.querySelector('img');
        const nameEl = item.querySelector('span') || item.querySelector('div[dir="auto"]');
        
        if (img || nameEl) {
          highlights.push({
            name: nameEl?.textContent?.trim() || `Highlight ${idx + 1}`,
            coverUrl: img?.src,
          });
        }
      });
    }

    return highlights;
  }

  /**
   * Extract Instagram posts with deep detail
   */
  function extractInstagramPostsDeep() {
    const posts = [];
    const postLinks = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
    
    postLinks.forEach((link, index) => {
      if (index >= 100) return;
      
      const img = link.querySelector('img');
      const videoIcon = link.querySelector('[aria-label*="Video"], [aria-label*="Reel"], svg');
      const carouselIcon = link.querySelector('[aria-label*="Carousel"]');
      
      // Get engagement hints from aria-labels
      const container = link.closest('article') || link.closest('div');
      const likesHint = container?.querySelector('[aria-label*="likes"]')?.getAttribute('aria-label');
      const commentsHint = container?.querySelector('[aria-label*="comments"]')?.getAttribute('aria-label');
      
      const post = {
        postUrl: link.href,
        thumbnailUrl: img?.src,
        alt: img?.alt || '',
        isVideo: !!videoIcon && link.href.includes('/reel/'),
        isReel: link.href.includes('/reel/'),
        isCarousel: !!carouselIcon,
        caption: img?.alt?.replace(/^Photo by .+ on .+\. /, '').substring(0, 500),
        likesHint: likesHint ? parseInt(likesHint.replace(/\D/g, '')) : null,
        commentsHint: commentsHint ? parseInt(commentsHint.replace(/\D/g, '')) : null,
      };

      // Extract hashtags from alt text
      const hashtagMatches = post.alt?.match(/#\w+/g);
      if (hashtagMatches) {
        post.hashtags = [...new Set(hashtagMatches)];
      }

      // Extract mentions from alt text
      const mentionMatches = post.alt?.match(/@\w+/g);
      if (mentionMatches) {
        post.mentions = [...new Set(mentionMatches)];
      }

      posts.push(post);
    });

    return posts;
  }

  /**
   * Deep Threads profile extraction
   */
  function extractThreadsProfileDeep() {
    const profile = {
      handle: null,
      displayName: null,
      bio: null,
      followersCount: null,
      followingCount: null,
      isVerified: false,
      instagramConnected: false,
      profilePicUrl: null,
    };

    // Handle and name
    const handleEl = document.querySelector('h2, [data-testid="profile-handle"]');
    if (handleEl) {
      profile.handle = handleEl.textContent?.trim()?.replace('@', '');
    }

    const nameEl = document.querySelector('h1, [data-testid="profile-name"]');
    if (nameEl) {
      profile.displayName = nameEl.textContent?.trim();
      profile.isVerified = !!nameEl.parentElement?.querySelector('[aria-label*="Verified"]');
    }

    // Bio
    const bioEl = document.querySelector('[data-testid="bio-text"], header + div > span, main div[dir="auto"]');
    if (bioEl && bioEl.textContent?.length > 5 && bioEl.textContent?.length < 500) {
      profile.bio = bioEl.textContent?.trim();
    }

    // Profile picture
    const avatar = document.querySelector('img[alt*="profile"], header img');
    if (avatar) {
      profile.profilePicUrl = avatar.src;
    }

    // Stats from page text
    const pageText = document.body.innerText;
    const followersMatch = pageText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*followers?/i);
    const followingMatch = pageText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*following/i);
    
    if (followersMatch) {
      const num = followersMatch[1].replace(/,/g, '');
      let value = parseFloat(num);
      if (num.toLowerCase().includes('k')) value *= 1000;
      if (num.toLowerCase().includes('m')) value *= 1000000;
      profile.followersCount = Math.round(value);
    }
    if (followingMatch) {
      const num = followingMatch[1].replace(/,/g, '');
      let value = parseFloat(num);
      if (num.toLowerCase().includes('k')) value *= 1000;
      if (num.toLowerCase().includes('m')) value *= 1000000;
      profile.followingCount = Math.round(value);
    }

    // Check Instagram connection
    profile.instagramConnected = !!document.querySelector('a[href*="instagram.com"]') ||
                                  pageText.includes('instagram.com');

    return profile;
  }

  /**
   * Extract Threads posts with engagement data
   */
  function extractThreadsPostsDeep() {
    const threads = [];
    const articles = document.querySelectorAll('article, [data-testid="thread-post"], div[data-pressable-container="true"]');
    
    articles.forEach((article, index) => {
      if (index >= 100) return;

      const contentEl = article.querySelector('[data-testid="post-text-container"], div[dir="auto"], span');
      const timeEl = article.querySelector('time[datetime], time');
      
      const thread = {
        content: contentEl?.textContent?.trim()?.substring(0, 1000) || '',
        timestamp: timeEl?.getAttribute('datetime') || timeEl?.textContent,
        likes: 0,
        replies: 0,
        reposts: 0,
        hasMedia: !!article.querySelector('img:not([alt*="profile"]), video'),
      };

      // Extract engagement numbers
      const engagementText = article.textContent || '';
      
      const likesMatch = engagementText.match(/(\d+(?:,\d+)*)\s*(?:likes?|❤)/i);
      if (likesMatch) thread.likes = parseInt(likesMatch[1].replace(/,/g, ''));

      const repliesMatch = engagementText.match(/(\d+(?:,\d+)*)\s*(?:replies?|comments?)/i);
      if (repliesMatch) thread.replies = parseInt(repliesMatch[1].replace(/,/g, ''));

      const repostsMatch = engagementText.match(/(\d+(?:,\d+)*)\s*(?:reposts?)/i);
      if (repostsMatch) thread.reposts = parseInt(repostsMatch[1].replace(/,/g, ''));

      // Extract mentions and hashtags
      const mentionMatches = thread.content.match(/@\w+/g);
      if (mentionMatches) thread.mentions = [...new Set(mentionMatches)];

      const hashtagMatches = thread.content.match(/#\w+/g);
      if (hashtagMatches) thread.hashtags = [...new Set(hashtagMatches)];

      // Only add if we have meaningful content
      if (thread.content.length > 0 || thread.hasMedia) {
        threads.push(thread);
      }
    });

    return threads;
  }

  /**
   * Analyze content patterns from Threads
   */
  function analyzeThreadsContent(threads) {
    const analysis = {
      totalThreads: threads.length,
      avgLikes: 0,
      avgReplies: 0,
      totalEngagement: 0,
      topHashtags: {},
      topMentions: {},
      postsWithMedia: 0,
      estimatedPostFrequency: null,
    };

    threads.forEach(thread => {
      analysis.avgLikes += thread.likes || 0;
      analysis.avgReplies += thread.replies || 0;
      analysis.totalEngagement += (thread.likes || 0) + (thread.replies || 0) + (thread.reposts || 0);
      if (thread.hasMedia) analysis.postsWithMedia++;

      thread.hashtags?.forEach(tag => {
        analysis.topHashtags[tag] = (analysis.topHashtags[tag] || 0) + 1;
      });

      thread.mentions?.forEach(mention => {
        analysis.topMentions[mention] = (analysis.topMentions[mention] || 0) + 1;
      });
    });

    if (threads.length > 0) {
      analysis.avgLikes = Math.round(analysis.avgLikes / threads.length);
      analysis.avgReplies = Math.round(analysis.avgReplies / threads.length);
    }

    // Sort and limit top items
    analysis.topHashtags = Object.entries(analysis.topHashtags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    analysis.topMentions = Object.entries(analysis.topMentions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    return analysis;
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
