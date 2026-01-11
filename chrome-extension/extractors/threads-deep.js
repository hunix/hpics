// Intel CRM - Deep Threads Extraction Module
// Handles comprehensive Threads profile data extraction

/**
 * Deep Threads profile extraction with scroll support
 */
export class ThreadsDeepExtractor {
  constructor(options = {}) {
    this.maxThreads = options.maxThreads || 100;
    this.scrollDelay = options.scrollDelay || 1500;
    this.captureReplies = options.captureReplies || true;
  }

  /**
   * Extract comprehensive Threads profile data
   */
  async extractFullProfile() {
    const data = {
      profile: this.extractProfileHeader(),
      recentThreads: [],
      repliesGiven: [],
      capturedAt: new Date().toISOString(),
    };

    return data;
  }

  /**
   * Extract profile header information
   */
  extractProfileHeader() {
    const profile = {
      handle: '',
      displayName: '',
      bio: '',
      followersCount: 0,
      followingCount: 0,
      isVerified: false,
      profilePicUrl: '',
      instagramLinked: false,
      instagramHandle: '',
      location: '',
      website: '',
    };

    try {
      // Handle from URL
      const urlMatch = window.location.pathname.match(/\/@?([^\/]+)/);
      if (urlMatch) {
        profile.handle = urlMatch[1].replace('@', '');
      }

      // Profile picture
      const avatarEl = document.querySelector('img[alt*="profile picture"], img[data-testid="user-avatar"]');
      if (avatarEl) {
        profile.profilePicUrl = avatarEl.src;
      }

      // Display name - usually in the header area
      const nameSelectors = [
        '[data-testid="profile-header"] span:first-of-type',
        'header h1',
        '[role="main"] h1',
        'span[dir="auto"]'
      ];
      
      for (const selector of nameSelectors) {
        const nameEl = document.querySelector(selector);
        if (nameEl && nameEl.textContent.trim().length > 0 && nameEl.textContent.trim().length < 50) {
          profile.displayName = nameEl.textContent.trim();
          break;
        }
      }

      // Bio - look for descriptive text near profile
      const bioSelectors = [
        '[data-testid="bio-text"]',
        '[data-testid="profile-header"] + div span',
        'header ~ div span[dir="auto"]'
      ];
      
      for (const selector of bioSelectors) {
        const bioEl = document.querySelector(selector);
        if (bioEl && bioEl.textContent.trim().length > 10 && bioEl.textContent.trim().length < 500) {
          profile.bio = bioEl.textContent.trim();
          break;
        }
      }

      // Followers/Following from text content
      const pageText = document.body.innerText;
      
      const followersPatterns = [
        /([\d,]+(?:\.\d+)?)\s*[KMB]?\s*followers?/i,
        /followers?\s*([\d,]+(?:\.\d+)?)\s*[KMB]?/i,
      ];
      
      for (const pattern of followersPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          profile.followersCount = this.parseNumber(match[1] + (match[0].match(/[KMB]/i)?.[0] || ''));
          break;
        }
      }

      const followingPatterns = [
        /([\d,]+(?:\.\d+)?)\s*[KMB]?\s*following/i,
        /following\s*([\d,]+(?:\.\d+)?)\s*[KMB]?/i,
      ];
      
      for (const pattern of followingPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          profile.followingCount = this.parseNumber(match[1] + (match[0].match(/[KMB]/i)?.[0] || ''));
          break;
        }
      }

      // Verified badge
      const verifiedBadge = document.querySelector('svg[aria-label*="Verified"], [data-testid="verified-badge"]');
      profile.isVerified = !!verifiedBadge;

      // Instagram link
      const instagramLink = document.querySelector('a[href*="instagram.com"]');
      if (instagramLink) {
        profile.instagramLinked = true;
        const igMatch = instagramLink.href.match(/instagram\.com\/([^\/\?]+)/);
        if (igMatch) profile.instagramHandle = igMatch[1];
      }

      // Website
      const websiteLink = document.querySelector('a[rel*="nofollow"][href^="http"]');
      if (websiteLink && !websiteLink.href.includes('instagram.com') && !websiteLink.href.includes('threads.net')) {
        profile.website = websiteLink.href;
      }

    } catch (e) {
      console.warn('[ThreadsDeepExtractor] Profile header extraction error:', e);
    }

    return profile;
  }

  /**
   * Extract visible threads from the feed
   */
  extractVisibleThreads() {
    const threads = [];
    
    try {
      // Threads post containers - various possible selectors
      const threadSelectors = [
        '[data-testid="thread-post"]',
        'article[role="article"]',
        '[role="main"] > div > div > div > div', // Fallback structure
      ];

      let threadElements = [];
      for (const selector of threadSelectors) {
        threadElements = document.querySelectorAll(selector);
        if (threadElements.length > 0) break;
      }

      threadElements.forEach((threadEl, index) => {
        if (threads.length >= this.maxThreads) return;

        const thread = this.extractSingleThread(threadEl);
        if (thread.content || thread.hasMedia) {
          // Check for duplicates
          if (!threads.some(t => t.content === thread.content && t.timestamp === thread.timestamp)) {
            threads.push(thread);
          }
        }
      });

    } catch (e) {
      console.warn('[ThreadsDeepExtractor] Threads extraction error:', e);
    }

    return threads;
  }

  /**
   * Extract data from a single thread element
   */
  extractSingleThread(threadEl) {
    const thread = {
      content: '',
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      timestamp: '',
      hasMedia: false,
      mediaType: '',
      mediaUrl: '',
      hashtags: [],
      mentions: [],
      isReply: false,
      replyToUser: '',
      threadUrl: '',
    };

    try {
      // Thread content
      const contentEl = threadEl.querySelector('[data-testid="post-text-container"], span[dir="auto"]');
      if (contentEl) {
        thread.content = contentEl.textContent.trim();
        
        // Extract hashtags and mentions
        thread.hashtags = (thread.content.match(/#[\w\u0400-\u04FF]+/g) || []);
        thread.mentions = (thread.content.match(/@[\w\.]+/g) || []);
      }

      // Engagement metrics
      const statsText = threadEl.textContent || '';
      
      // Likes
      const likesMatch = statsText.match(/([\d,]+(?:\.\d+)?)\s*[KMB]?\s*(?:likes?|❤️)/i);
      if (likesMatch) thread.likes = this.parseNumber(likesMatch[0]);

      // Replies
      const repliesMatch = statsText.match(/([\d,]+(?:\.\d+)?)\s*[KMB]?\s*(?:replies?|comments?|💬)/i);
      if (repliesMatch) thread.replies = this.parseNumber(repliesMatch[0]);

      // Reposts
      const repostsMatch = statsText.match(/([\d,]+(?:\.\d+)?)\s*[KMB]?\s*(?:reposts?|🔁)/i);
      if (repostsMatch) thread.reposts = this.parseNumber(repostsMatch[0]);

      // Quotes
      const quotesMatch = statsText.match(/([\d,]+(?:\.\d+)?)\s*[KMB]?\s*quotes?/i);
      if (quotesMatch) thread.quotes = this.parseNumber(quotesMatch[0]);

      // Timestamp
      const timeEl = threadEl.querySelector('time[datetime]');
      if (timeEl) {
        thread.timestamp = timeEl.getAttribute('datetime') || '';
      } else {
        // Try to find relative time
        const timePatterns = [/\d+[hmd]\s*ago/i, /just now/i, /\d+\s*(hours?|minutes?|days?)\s*ago/i];
        for (const pattern of timePatterns) {
          const match = statsText.match(pattern);
          if (match) {
            thread.timestamp = match[0];
            break;
          }
        }
      }

      // Media detection
      const mediaEl = threadEl.querySelector('img:not([alt*="profile"]), video');
      if (mediaEl) {
        thread.hasMedia = true;
        thread.mediaType = mediaEl.tagName.toLowerCase() === 'video' ? 'video' : 'image';
        thread.mediaUrl = mediaEl.src || '';
      }

      // Check if this is a reply
      const replyIndicator = threadEl.querySelector('[data-testid="reply-line"], [aria-label*="Reply"]');
      if (replyIndicator) {
        thread.isReply = true;
        // Try to find who they're replying to
        const replyToLink = threadEl.querySelector('a[href^="/@"]');
        if (replyToLink) {
          thread.replyToUser = replyToLink.textContent.replace('@', '').trim();
        }
      }

      // Thread URL
      const threadLink = threadEl.querySelector('a[href*="/post/"]');
      if (threadLink) {
        thread.threadUrl = threadLink.href;
      }

    } catch (e) {
      console.warn('[ThreadsDeepExtractor] Single thread extraction error:', e);
    }

    return thread;
  }

  /**
   * Scroll and extract all threads up to maxThreads
   */
  async extractAllThreadsWithScroll(progressCallback) {
    const allThreads = [];
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;
    let lastThreadCount = 0;
    let noNewThreadsCount = 0;

    while (allThreads.length < this.maxThreads && scrollAttempts < maxScrollAttempts) {
      const currentThreads = this.extractVisibleThreads();
      
      // Add new threads
      currentThreads.forEach(thread => {
        const isDuplicate = allThreads.some(
          t => t.content === thread.content && t.timestamp === thread.timestamp
        );
        if (!isDuplicate) {
          allThreads.push(thread);
        }
      });

      // Check if we got new threads
      if (allThreads.length === lastThreadCount) {
        noNewThreadsCount++;
        if (noNewThreadsCount >= 3) {
          console.log('[ThreadsDeepExtractor] No new threads after 3 scrolls, stopping');
          break;
        }
      } else {
        noNewThreadsCount = 0;
      }
      lastThreadCount = allThreads.length;

      if (progressCallback) {
        progressCallback({
          threadsCollected: allThreads.length,
          maxThreads: this.maxThreads,
          scrollAttempts,
        });
      }

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });

      await this.sleep(this.scrollDelay);
      scrollAttempts++;
    }

    return allThreads;
  }

  /**
   * Navigate to Replies tab and extract
   */
  async extractReplies(progressCallback) {
    const replies = [];
    
    try {
      // Find and click Replies tab
      const repliesTab = document.querySelector('a[href*="/replies"], [role="tab"][aria-label*="Replies"]');
      if (!repliesTab) {
        console.log('[ThreadsDeepExtractor] Replies tab not found');
        return replies;
      }

      repliesTab.click();
      await this.sleep(2000);

      // Extract replies (similar to threads but focus on reply context)
      let scrollAttempts = 0;
      const maxScrollAttempts = 15;
      let lastCount = 0;

      while (replies.length < 50 && scrollAttempts < maxScrollAttempts) {
        const replyEls = document.querySelectorAll('[data-testid="thread-post"], article[role="article"]');
        
        replyEls.forEach((el) => {
          if (replies.length >= 50) return;
          
          const replyData = this.extractSingleThread(el);
          
          // Only capture if it's actually a reply
          if (replyData.isReply || replyData.replyToUser) {
            const isDuplicate = replies.some(
              r => r.content === replyData.content && r.timestamp === replyData.timestamp
            );
            if (!isDuplicate) {
              replies.push({
                replyContent: replyData.content,
                repliedToUser: replyData.replyToUser,
                likes: replyData.likes,
                timestamp: replyData.timestamp,
                hashtags: replyData.hashtags,
                mentions: replyData.mentions,
              });
            }
          }
        });

        if (replies.length === lastCount) break;
        lastCount = replies.length;

        if (progressCallback) {
          progressCallback({ repliesCollected: replies.length });
        }

        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await this.sleep(this.scrollDelay);
        scrollAttempts++;
      }

      // Navigate back to Threads tab
      const threadsTab = document.querySelector('a[href$="/"], [role="tab"][aria-label*="Threads"]');
      if (threadsTab) threadsTab.click();

    } catch (e) {
      console.warn('[ThreadsDeepExtractor] Replies extraction error:', e);
    }

    return replies;
  }

  /**
   * Analyze collected threads for content patterns
   */
  analyzeContent(threads) {
    if (!threads || threads.length === 0) {
      return null;
    }

    const analysis = {
      totalThreads: threads.length,
      totalEngagement: 0,
      avgLikes: 0,
      avgReplies: 0,
      avgReposts: 0,
      topHashtags: {},
      topMentions: {},
      mediaRatio: 0,
      replyRatio: 0,
      contentLength: { short: 0, medium: 0, long: 0 },
    };

    let totalLikes = 0;
    let totalReplies = 0;
    let totalReposts = 0;
    let mediaCount = 0;
    let replyCount = 0;

    threads.forEach(thread => {
      totalLikes += thread.likes || 0;
      totalReplies += thread.replies || 0;
      totalReposts += thread.reposts || 0;
      
      if (thread.hasMedia) mediaCount++;
      if (thread.isReply) replyCount++;

      // Content length categories
      const len = (thread.content || '').length;
      if (len < 100) analysis.contentLength.short++;
      else if (len < 280) analysis.contentLength.medium++;
      else analysis.contentLength.long++;

      // Aggregate hashtags
      (thread.hashtags || []).forEach(tag => {
        analysis.topHashtags[tag] = (analysis.topHashtags[tag] || 0) + 1;
      });

      // Aggregate mentions
      (thread.mentions || []).forEach(mention => {
        analysis.topMentions[mention] = (analysis.topMentions[mention] || 0) + 1;
      });
    });

    analysis.totalEngagement = totalLikes + totalReplies + totalReposts;
    analysis.avgLikes = Math.round(totalLikes / threads.length);
    analysis.avgReplies = Math.round(totalReplies / threads.length);
    analysis.avgReposts = Math.round(totalReposts / threads.length);
    analysis.mediaRatio = Math.round((mediaCount / threads.length) * 100);
    analysis.replyRatio = Math.round((replyCount / threads.length) * 100);

    // Convert hashtag/mention counts to sorted arrays
    analysis.topHashtags = Object.entries(analysis.topHashtags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    analysis.topMentions = Object.entries(analysis.topMentions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([mention, count]) => ({ mention, count }));

    return analysis;
  }

  /**
   * Parse number string with K/M/B suffixes
   */
  parseNumber(str) {
    if (!str) return 0;
    
    const cleanStr = str.toString().replace(/,/g, '').trim();
    const match = cleanStr.match(/([\d.]+)\s*([KMB])?/i);
    
    if (!match) return 0;
    
    let value = parseFloat(match[1]);
    const suffix = (match[2] || '').toUpperCase();
    
    if (suffix === 'K') value *= 1000;
    else if (suffix === 'M') value *= 1000000;
    else if (suffix === 'B') value *= 1000000000;
    
    return Math.round(value);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.ThreadsDeepExtractor = ThreadsDeepExtractor;
}
