// Intel CRM - Deep Instagram Extraction Module
// Handles comprehensive profile data extraction with scroll support

/**
 * Deep Instagram profile extraction with infinite scroll support
 */
export class InstagramDeepExtractor {
  constructor(options = {}) {
    this.maxPosts = options.maxPosts || 100;
    this.maxReels = options.maxReels || 50;
    this.scrollDelay = options.scrollDelay || 1500;
    this.captureComments = options.captureComments || false;
    this.captureLikes = options.captureLikes || false;
  }

  /**
   * Extract comprehensive profile data
   */
  async extractFullProfile() {
    const data = {
      profile: this.extractProfileHeader(),
      highlights: this.extractHighlights(),
      recentPosts: [],
      reels: [],
      taggedPosts: [],
      stories: this.extractStoriesBar(),
      capturedAt: new Date().toISOString(),
    };

    return data;
  }

  /**
   * Extract profile header information
   */
  extractProfileHeader() {
    const profile = {
      username: '',
      displayName: '',
      bio: '',
      pronouns: '',
      category: '',
      isVerified: false,
      isPrivate: false,
      isBusiness: false,
      profilePicUrl: '',
      externalUrl: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      location: '',
      contactEmail: '',
      contactPhone: '',
    };

    try {
      // Username from URL or header
      const urlMatch = window.location.pathname.match(/\/([^\/]+)\/?$/);
      if (urlMatch) profile.username = urlMatch[1];

      // Profile picture - try to get highest resolution
      const avatarEl = document.querySelector('header img[alt*="profile picture"], header img[draggable="false"]');
      if (avatarEl) {
        let avatarUrl = avatarEl.src;
        // Instagram uses different size suffixes, try to get larger version
        avatarUrl = avatarUrl.replace(/s150x150/g, 's320x320').replace(/s110x110/g, 's320x320');
        profile.profilePicUrl = avatarUrl;
      }

      // Display name
      const nameEl = document.querySelector('header section h2, header h1, header span[dir="auto"]');
      if (nameEl) profile.displayName = nameEl.textContent.trim();

      // Bio - handle multi-line bios
      const bioContainer = document.querySelector('header section > div > span, header section h1 + div span');
      if (bioContainer) {
        const bioLines = [];
        bioContainer.querySelectorAll('span, br').forEach((el) => {
          if (el.tagName === 'BR') {
            bioLines.push('\n');
          } else if (el.textContent) {
            bioLines.push(el.textContent.trim());
          }
        });
        profile.bio = bioLines.join('').trim() || bioContainer.textContent.trim();
      }

      // Stats (posts, followers, following)
      const statElements = document.querySelectorAll('header ul li, header section ul li');
      statElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        const numberMatch = text.match(/([\d,\.]+)\s*([kmb])?/i);
        if (numberMatch) {
          let value = parseFloat(numberMatch[1].replace(/,/g, ''));
          const suffix = (numberMatch[2] || '').toLowerCase();
          if (suffix === 'k') value *= 1000;
          else if (suffix === 'm') value *= 1000000;
          else if (suffix === 'b') value *= 1000000000;
          value = Math.round(value);

          if (text.includes('post')) profile.postsCount = value;
          else if (text.includes('follower')) profile.followersCount = value;
          else if (text.includes('following')) profile.followingCount = value;
        }
      });

      // Verified badge
      const verifiedBadge = document.querySelector('header svg[aria-label*="Verified"], header span[title*="Verified"]');
      profile.isVerified = !!verifiedBadge;

      // Private account indicator
      const privateIndicator = document.querySelector('[aria-label*="Private"], [title*="private"]');
      profile.isPrivate = !!privateIndicator;

      // External link
      const externalLink = document.querySelector('header a[href*="l.instagram.com"], header a[rel="me nofollow noopener"]');
      if (externalLink) profile.externalUrl = externalLink.href;

      // Category (for business/creator accounts)
      const categoryEl = document.querySelector('header section > div[role="presentation"] > div');
      if (categoryEl) {
        const possibleCategory = categoryEl.textContent.trim();
        if (possibleCategory.length < 50 && !possibleCategory.match(/^\d/)) {
          profile.category = possibleCategory;
        }
      }

      // Pronouns
      const pronounsEl = document.querySelector('header span[style*="color"][style*="gray"]');
      if (pronounsEl && pronounsEl.textContent.match(/\//)) {
        profile.pronouns = pronounsEl.textContent.trim();
      }

    } catch (e) {
      console.warn('[InstagramDeepExtractor] Profile header extraction error:', e);
    }

    return profile;
  }

  /**
   * Extract story highlights
   */
  extractHighlights() {
    const highlights = [];
    
    try {
      const highlightContainer = document.querySelector('[role="menu"], ul[style*="padding"]');
      const highlightItems = document.querySelectorAll(
        '[aria-label*="Highlight"], [role="button"][tabindex="0"] canvas, ' +
        'ul > li > div[role="button"]'
      );
      
      highlightItems.forEach((item, index) => {
        if (index >= 20) return; // Limit to 20 highlights
        
        const img = item.querySelector('img');
        const label = item.getAttribute('aria-label') || item.textContent?.trim() || `Highlight ${index + 1}`;
        
        highlights.push({
          name: label.replace(/^Highlight:?\s*/i, '').trim(),
          coverUrl: img?.src || '',
          index,
        });
      });
    } catch (e) {
      console.warn('[InstagramDeepExtractor] Highlights extraction error:', e);
    }

    return highlights;
  }

  /**
   * Extract stories bar (currently active stories)
   */
  extractStoriesBar() {
    const stories = [];
    
    try {
      const storyItems = document.querySelectorAll('[role="button"] > img[alt*="story"], [aria-label*="Story"]');
      
      storyItems.forEach((item, index) => {
        if (index >= 10) return;
        
        const hasUnseen = item.closest('[style*="gradient"]') !== null;
        const username = item.alt?.replace(/'s story/i, '').trim();
        
        stories.push({
          username,
          hasUnseen,
          avatarUrl: item.src,
        });
      });
    } catch (e) {
      console.warn('[InstagramDeepExtractor] Stories bar extraction error:', e);
    }

    return stories;
  }

  /**
   * Extract visible posts from the grid
   */
  extractVisiblePosts() {
    const posts = [];
    
    try {
      const postLinks = document.querySelectorAll('article a[href*="/p/"], a[href*="/reel/"]');
      
      postLinks.forEach((link, index) => {
        if (posts.length >= this.maxPosts) return;
        
        const postUrl = link.href;
        // Avoid duplicates
        if (posts.some(p => p.postUrl === postUrl)) return;

        const img = link.querySelector('img');
        const videoIndicator = link.querySelector('[aria-label*="video"], svg[aria-label*="Reel"], [aria-label*="Clip"]');
        const carouselIndicator = link.querySelector('[aria-label*="Carousel"], svg[aria-label*="slides"]');
        
        // Try to get engagement from aria labels
        const parent = link.closest('article') || link.closest('div');
        const likesMatch = parent?.textContent?.match(/([\d,]+)\s*likes?/i);
        const commentsMatch = parent?.textContent?.match(/([\d,]+)\s*comments?/i);
        const viewsMatch = parent?.textContent?.match(/([\d,]+)\s*views?/i);

        posts.push({
          postUrl,
          thumbnailUrl: img?.src || '',
          alt: img?.alt || '', // Often contains caption preview
          isVideo: !!videoIndicator,
          isReel: postUrl.includes('/reel/'),
          isCarousel: !!carouselIndicator,
          likes: likesMatch ? parseInt(likesMatch[1].replace(/,/g, '')) : null,
          comments: commentsMatch ? parseInt(commentsMatch[1].replace(/,/g, '')) : null,
          views: viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, '')) : null,
        });
      });
    } catch (e) {
      console.warn('[InstagramDeepExtractor] Posts extraction error:', e);
    }

    return posts;
  }

  /**
   * Scroll and extract all posts up to maxPosts
   */
  async extractAllPostsWithScroll(progressCallback) {
    const allPosts = [];
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;
    let lastPostCount = 0;
    let noNewPostsCount = 0;

    while (allPosts.length < this.maxPosts && scrollAttempts < maxScrollAttempts) {
      // Get current visible posts
      const currentPosts = this.extractVisiblePosts();
      
      // Add new posts
      currentPosts.forEach(post => {
        if (!allPosts.some(p => p.postUrl === post.postUrl)) {
          allPosts.push(post);
        }
      });

      // Check if we got new posts
      if (allPosts.length === lastPostCount) {
        noNewPostsCount++;
        if (noNewPostsCount >= 3) {
          console.log('[InstagramDeepExtractor] No new posts after 3 scrolls, stopping');
          break;
        }
      } else {
        noNewPostsCount = 0;
      }
      lastPostCount = allPosts.length;

      // Report progress
      if (progressCallback) {
        progressCallback({
          postsCollected: allPosts.length,
          maxPosts: this.maxPosts,
          scrollAttempts,
        });
      }

      // Scroll down
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });

      // Wait for content to load
      await this.sleep(this.scrollDelay);
      scrollAttempts++;
    }

    return allPosts;
  }

  /**
   * Navigate to Reels tab and extract
   */
  async extractReels(progressCallback) {
    const reels = [];
    
    try {
      // Find and click Reels tab
      const reelsTab = document.querySelector('a[href*="/reels/"]');
      if (!reelsTab) {
        console.log('[InstagramDeepExtractor] Reels tab not found');
        return reels;
      }

      reelsTab.click();
      await this.sleep(2000);

      // Scroll and collect reels
      let scrollAttempts = 0;
      const maxScrollAttempts = 20;
      let lastCount = 0;

      while (reels.length < this.maxReels && scrollAttempts < maxScrollAttempts) {
        const reelLinks = document.querySelectorAll('a[href*="/reel/"]');
        
        reelLinks.forEach(link => {
          if (reels.length >= this.maxReels) return;
          if (reels.some(r => r.reelUrl === link.href)) return;

          const img = link.querySelector('img');
          const viewsEl = link.querySelector('[aria-label*="Play"]')?.parentElement;
          const viewsMatch = viewsEl?.textContent?.match(/([\d,\.]+)\s*([KMB])?/i);
          
          let views = 0;
          if (viewsMatch) {
            views = parseFloat(viewsMatch[1].replace(/,/g, ''));
            const suffix = (viewsMatch[2] || '').toUpperCase();
            if (suffix === 'K') views *= 1000;
            else if (suffix === 'M') views *= 1000000;
            else if (suffix === 'B') views *= 1000000000;
          }

          reels.push({
            reelUrl: link.href,
            thumbnailUrl: img?.src || '',
            views: Math.round(views),
            alt: img?.alt || '',
          });
        });

        if (reels.length === lastCount) break;
        lastCount = reels.length;

        if (progressCallback) {
          progressCallback({
            reelsCollected: reels.length,
            maxReels: this.maxReels,
          });
        }

        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await this.sleep(this.scrollDelay);
        scrollAttempts++;
      }

      // Navigate back to posts
      const postsTab = document.querySelector('a[href$="/"]');
      if (postsTab) postsTab.click();

    } catch (e) {
      console.warn('[InstagramDeepExtractor] Reels extraction error:', e);
    }

    return reels;
  }

  /**
   * Extract tagged posts tab
   */
  async extractTaggedPosts(progressCallback) {
    const tagged = [];
    
    try {
      const taggedTab = document.querySelector('a[href*="/tagged/"]');
      if (!taggedTab) {
        console.log('[InstagramDeepExtractor] Tagged tab not found');
        return tagged;
      }

      taggedTab.click();
      await this.sleep(2000);

      const taggedLinks = document.querySelectorAll('a[href*="/p/"]');
      taggedLinks.forEach((link, index) => {
        if (index >= 30) return;
        
        const img = link.querySelector('img');
        tagged.push({
          postUrl: link.href,
          thumbnailUrl: img?.src || '',
          alt: img?.alt || '',
        });
      });

      if (progressCallback) {
        progressCallback({ taggedCollected: tagged.length });
      }

      // Navigate back
      const postsTab = document.querySelector('a[href$="/"]');
      if (postsTab) postsTab.click();

    } catch (e) {
      console.warn('[InstagramDeepExtractor] Tagged extraction error:', e);
    }

    return tagged;
  }

  /**
   * Extract individual post details (when viewing a single post)
   */
  extractSinglePostDetails() {
    const post = {
      caption: '',
      likes: 0,
      comments: [],
      commentsCount: 0,
      timestamp: '',
      location: '',
      hashtags: [],
      mentions: [],
      taggedUsers: [],
      mediaUrls: [],
    };

    try {
      // Caption
      const captionEl = document.querySelector('h1, [role="dialog"] span[dir="auto"]');
      if (captionEl) {
        post.caption = captionEl.textContent.trim();
        
        // Extract hashtags and mentions from caption
        post.hashtags = (post.caption.match(/#[\w\u0400-\u04FF]+/g) || []);
        post.mentions = (post.caption.match(/@[\w\.]+/g) || []);
      }

      // Likes count
      const likesEl = document.querySelector('[href$="/liked_by/"] span, button[aria-label*="like"] + span');
      if (likesEl) {
        const likesMatch = likesEl.textContent.match(/([\d,]+)/);
        if (likesMatch) post.likes = parseInt(likesMatch[1].replace(/,/g, ''));
      }

      // Comments count  
      const commentsCountEl = document.querySelector('[aria-label*="comments"]');
      if (commentsCountEl) {
        const commentsMatch = commentsCountEl.textContent.match(/([\d,]+)/);
        if (commentsMatch) post.commentsCount = parseInt(commentsMatch[1].replace(/,/g, ''));
      }

      // Timestamp
      const timeEl = document.querySelector('time[datetime]');
      if (timeEl) {
        post.timestamp = timeEl.getAttribute('datetime') || '';
      }

      // Location
      const locationEl = document.querySelector('a[href*="/explore/locations/"]');
      if (locationEl) post.location = locationEl.textContent.trim();

      // Tagged users in photo
      const taggedEls = document.querySelectorAll('[aria-label*="tagged"] a, a[href^="/"]');
      taggedEls.forEach(el => {
        if (el.closest('[aria-label*="tagged"]')) {
          post.taggedUsers.push(el.textContent.replace('@', '').trim());
        }
      });

      // Media URLs
      const mediaEls = document.querySelectorAll('article img[src*="instagram"], article video source');
      mediaEls.forEach(el => {
        const url = el.src || el.getAttribute('src');
        if (url && !post.mediaUrls.includes(url)) {
          post.mediaUrls.push(url);
        }
      });

      // Extract top comments if enabled
      if (this.captureComments) {
        const commentEls = document.querySelectorAll('ul li[role="menuitem"], div[role="button"] + ul > div');
        commentEls.forEach((el, index) => {
          if (index >= 20) return;
          
          const usernameEl = el.querySelector('a[href^="/"]');
          const textEl = el.querySelector('span[dir="auto"]');
          const likeButton = el.querySelector('[aria-label*="Like"]');
          
          if (usernameEl && textEl) {
            post.comments.push({
              username: usernameEl.textContent.trim(),
              text: textEl.textContent.trim(),
              hasLiked: likeButton?.getAttribute('aria-pressed') === 'true',
            });
          }
        });
      }

    } catch (e) {
      console.warn('[InstagramDeepExtractor] Single post extraction error:', e);
    }

    return post;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.InstagramDeepExtractor = InstagramDeepExtractor;
}
