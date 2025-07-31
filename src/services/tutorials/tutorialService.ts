import { webSearch } from '../utils/webSearchService';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  url: string;
  source: 'adobe-official' | 'adobe-community' | 'youtube-adobe' | 'third-party';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  topics: string[];
  apps: string[];
  qualityScore: number;
  thumbnailUrl?: string;
  lastUpdated?: string;
}

export interface TutorialSearchResult {
  tutorials: Tutorial[];
  totalFound: number;
  searchQuery: string;
  filters: TutorialFilters;
}

export interface TutorialFilters {
  apps?: string[];
  difficulty?: string[];
  sources?: string[];
  maxResults?: number;
  minQualityScore?: number;
}

export interface LearningResource {
  tutorials: Tutorial[];
  documentation: DocumentationLink[];
  practiceFiles: PracticeFile[];
  relatedCourses: RelatedCourse[];
}

interface DocumentationLink {
  title: string;
  url: string;
  type: 'user-guide' | 'api-docs' | 'tutorial' | 'help-article';
}

interface PracticeFile {
  name: string;
  description: string;
  downloadUrl: string;
  fileType: string;
}

interface RelatedCourse {
  title: string;
  provider: string;
  url: string;
  isPaid: boolean;
}

class TutorialService {
  private readonly ADOBE_DOMAINS = [
    'experienceleague.adobe.com',
    'helpx.adobe.com',
    'adobe.com',
    'blog.adobe.com'
  ];

  private readonly YOUTUBE_ADOBE_CHANNELS = [
    'Adobe',
    'Adobe Creative Cloud',
    'Adobe Photoshop',
    'Adobe Illustrator',
    'Adobe Premiere Pro'
  ];

  /**
   * Search for tutorials based on learning goals and apps
   */
  async searchTutorials(
    goals: string,
    apps: string[],
    difficulty: string = 'beginner',
    filters: TutorialFilters = {}
  ): Promise<TutorialSearchResult> {
    const searchQueries = this.buildSearchQueries(goals, apps, difficulty);
    const allResults: Tutorial[] = [];

    for (const query of searchQueries) {
      try {
        console.log(`🔍 Searching tutorials: ${query}`);
        const results = await webSearch(query);
        console.log(`📊 Web search returned ${results.length} results`);
        
        const tutorials = this.parseSearchResults(results, apps, difficulty);
        console.log(`✨ Parsed ${tutorials.length} tutorials from search results`);
        allResults.push(...tutorials);
      } catch (error) {
        console.error('Error searching tutorials:', error);
      }
    }

    // Remove duplicates and apply filters
    const uniqueTutorials = this.removeDuplicates(allResults);
    const filteredTutorials = this.applyFilters(uniqueTutorials, filters);
    const rankedTutorials = this.rankByQuality(filteredTutorials);

    const finalTutorials = rankedTutorials.slice(0, filters.maxResults || 10);
    console.log(`🎯 Final tutorial search result: ${finalTutorials.length} tutorials out of ${rankedTutorials.length} total found`);

    return {
      tutorials: finalTutorials,
      totalFound: rankedTutorials.length,
      searchQuery: searchQueries.join(' | '),
      filters
    };
  }

  /**
   * Get comprehensive learning resources for a specific learning path
   */
  async getLearningResources(
    goals: string,
    apps: string[],
    difficulty: string,
    focus: string
  ): Promise<LearningResource> {
    console.log(`🎯 Getting learning resources for: goals="${goals}", apps=[${apps.join(', ')}], difficulty="${difficulty}", focus="${focus}"`);

    // Distribute searches across different Adobe sources based on focus
    const sourcePreferences = this.getSourcePreferencesByFocus(focus);
    
    const [tutorials, documentation, practiceFiles, relatedCourses] = await Promise.all([
      this.searchTutorials(goals, apps, difficulty, { 
        maxResults: 8, 
        minQualityScore: 5,
        sources: sourcePreferences.tutorialSources
      }),
      this.findDocumentation(apps, sourcePreferences.docSource),
      this.findPracticeFiles(apps, goals),
      this.findRelatedCourses(focus, apps)
    ]);

    let finalTutorials = tutorials.tutorials;
    if (finalTutorials.length === 0) {
      console.log('⚠️ No tutorials found, generating fallback tutorials');
      finalTutorials = this.generateFallbackTutorials(apps, goals, difficulty);
    }

    return {
      tutorials: finalTutorials,
      documentation,
      practiceFiles,
      relatedCourses
    };
  }

  /**
   * Build search queries for different tutorial sources
   */
  private buildSearchQueries(goals: string, apps: string[], difficulty: string): string[] {
    const queries: string[] = [];
    const cleanGoals = goals.toLowerCase();
    
    // Adobe official tutorials
    for (const app of apps) {
      queries.push(
        `Adobe ${app} ${cleanGoals} tutorial ${difficulty} site:experienceleague.adobe.com OR site:helpx.adobe.com`
      );
      
      // YouTube Adobe official
      queries.push(
        `Adobe ${app} ${cleanGoals} tutorial ${difficulty} site:youtube.com "Adobe"`
      );
    }

    // General Adobe tutorials
    queries.push(
      `${cleanGoals} Adobe tutorial ${difficulty} ${apps.join(' OR ')}`
    );

    return queries;
  }

  /**
   * Parse search results into Tutorial objects
   */
  private parseSearchResults(
    searchResults: any[],
    targetApps: string[],
    targetDifficulty: string
  ): Tutorial[] {
    if (!Array.isArray(searchResults)) return [];

    return searchResults.map((result, index) => {
      const url = result.url || '';
      const title = result.title || '';
      const description = result.content || result.description || '';
      
      return {
        id: `tutorial-${Date.now()}-${index}`,
        title: this.cleanTitle(title),
        description: this.extractDescription(description),
        url,
        source: this.determineSource(url, title),
        difficulty: this.determineDifficulty(title, description, targetDifficulty),
        duration: this.estimateDuration(description),
        topics: this.extractTopics(title, description),
        apps: this.extractApps(title, description, targetApps),
        qualityScore: this.calculateQualityScore(url, title, description, targetApps),
        lastUpdated: this.extractDate(description)
      };
    }).filter(tutorial => tutorial.qualityScore > 0);
  }

  /**
   * Determine the source quality of a tutorial
   */
  private determineSource(url: string, title: string): Tutorial['source'] {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Adobe official domains
    if (this.ADOBE_DOMAINS.some(domain => lowerUrl.includes(domain))) {
      return 'adobe-official';
    }

    // YouTube Adobe channels
    if (lowerUrl.includes('youtube.com') && 
        (lowerTitle.includes('adobe') || this.YOUTUBE_ADOBE_CHANNELS.some(channel => 
          lowerTitle.includes(channel.toLowerCase())))) {
      return 'youtube-adobe';
    }

    // Adobe community
    if (lowerUrl.includes('community.adobe.com') || lowerTitle.includes('adobe community')) {
      return 'adobe-community';
    }

    return 'third-party';
  }

  /**
   * Calculate quality score based on source, relevance, and content indicators
   */
  private calculateQualityScore(
    url: string,
    title: string,
    description: string,
    targetApps: string[]
  ): number {
    let score = 0;
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    const lowerUrl = url.toLowerCase();

    // Source quality scoring
    const source = this.determineSource(url, title);
    switch (source) {
      case 'adobe-official': score += 10; break;
      case 'youtube-adobe': score += 8; break;
      case 'adobe-community': score += 6; break;
      case 'third-party': score += 3; break;
    }

    // App relevance scoring
    const appMatches = targetApps.filter(app => 
      lowerTitle.includes(app.toLowerCase()) || lowerDesc.includes(app.toLowerCase())
    );
    score += appMatches.length * 2;

    // Tutorial quality indicators
    const qualityIndicators = [
      'step by step', 'complete guide', 'beginners', 'tutorial', 
      'how to', 'learn', 'master', 'complete course'
    ];
    const indicatorMatches = qualityIndicators.filter(indicator => 
      lowerTitle.includes(indicator) || lowerDesc.includes(indicator)
    );
    score += indicatorMatches.length;

    // Recent content bonus
    if (lowerTitle.includes('2024') || lowerTitle.includes('2025')) {
      score += 2;
    }

    // Comprehensive content bonus
    if (lowerDesc.length > 200) {
      score += 1;
    }

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Determine difficulty level from content
   */
  private determineDifficulty(
    title: string,
    description: string,
    fallback: string
  ): Tutorial['difficulty'] {
    const content = (title + ' ' + description).toLowerCase();
    
    if (content.includes('beginner') || content.includes('basics') || 
        content.includes('getting started') || content.includes('introduction')) {
      return 'beginner';
    }
    
    if (content.includes('advanced') || content.includes('professional') || 
        content.includes('expert') || content.includes('mastery')) {
      return 'advanced';
    }
    
    if (content.includes('intermediate') || content.includes('next level')) {
      return 'intermediate';
    }
    
    return fallback as Tutorial['difficulty'];
  }

  /**
   * Extract relevant Adobe apps from content
   */
  private extractApps(title: string, description: string, targetApps: string[]): string[] {
    const content = (title + ' ' + description).toLowerCase();
    const appMap: { [key: string]: string } = {
      'photoshop': 'photoshop',
      'illustrator': 'illustrator',
      'premiere': 'premiere',
      'premiere pro': 'premiere',
      'after effects': 'aftereffects',
      'indesign': 'indesign',
      'lightroom': 'lightroom',
      'acrobat': 'acrobat'
    };

    const foundApps: string[] = [];
    for (const [keyword, app] of Object.entries(appMap)) {
      if (content.includes(keyword) && targetApps.includes(app)) {
        foundApps.push(app);
      }
    }

    return [...new Set(foundApps)];
  }

  /**
   * Extract topics and skills from content
   */
  private extractTopics(title: string, description: string): string[] {
    const content = (title + ' ' + description).toLowerCase();
    const topics: string[] = [];

    const topicKeywords = {
      'photo editing': ['photo edit', 'image edit', 'retouch'],
      'design': ['logo', 'brand', 'design', 'graphic'],
      'video editing': ['video edit', 'video production', 'film'],
      'social media': ['social media', 'instagram', 'facebook'],
      'web design': ['web design', 'website', 'ui', 'ux'],
      'typography': ['typography', 'fonts', 'text'],
      'color': ['color', 'colour', 'palette'],
      'animation': ['animation', 'motion', 'animate']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Estimate tutorial duration from description
   */
  private estimateDuration(description: string): string {
    const content = description.toLowerCase();
    
    // Look for explicit duration mentions
    const durationPatterns = [
      /(\d+)\s*(?:hours?|hrs?)/i,
      /(\d+)\s*(?:minutes?|mins?)/i,
      /(\d+)\s*(?:seconds?|secs?)/i
    ];

    for (const pattern of durationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Estimate based on content length and type
    if (content.includes('quick') || content.includes('fast')) {
      return '5-10 min';
    } else if (content.includes('complete') || content.includes('comprehensive')) {
      return '30-60 min';
    } else if (content.includes('series') || content.includes('course')) {
      return '2-4 hours';
    }

    return '15-30 min'; // Default estimate
  }

  /**
   * Clean and format tutorial titles
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/\s*-\s*YouTube$/, '') // Remove YouTube suffix
      .replace(/\s*\|\s*Adobe.*$/, '') // Remove Adobe branding
      .trim();
  }

  /**
   * Extract meaningful description from content
   */
  private extractDescription(content: string): string {
    if (!content) return '';
    
    // Take first paragraph or meaningful sentence
    const sentences = content.split(/[.!?]+/);
    const meaningfulSentences = sentences
      .filter(sentence => sentence.length > 20 && sentence.length < 200)
      .slice(0, 2);
    
    return meaningfulSentences.join('. ').trim() + '.';
  }

  /**
   * Extract date information from content
   */
  private extractDate(content: string): string | undefined {
    const datePattern = /(?:published|updated|created).*?(\d{4})/i;
    const match = content.match(datePattern);
    return match ? match[1] : undefined;
  }

  /**
   * Remove duplicate tutorials based on URL and title similarity
   */
  private removeDuplicates(tutorials: Tutorial[]): Tutorial[] {
    const seen = new Set<string>();
    return tutorials.filter(tutorial => {
      const key = `${tutorial.url}-${tutorial.title.substring(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Apply filters to tutorial results
   */
  private applyFilters(tutorials: Tutorial[], filters: TutorialFilters): Tutorial[] {
    return tutorials.filter(tutorial => {
      if (filters.apps && filters.apps.length > 0) {
        if (!tutorial.apps.some(app => filters.apps!.includes(app))) {
          return false;
        }
      }

      if (filters.difficulty && filters.difficulty.length > 0) {
        if (!filters.difficulty.includes(tutorial.difficulty)) {
          return false;
        }
      }

      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.includes(tutorial.source)) {
          return false;
        }
      }

      if (filters.minQualityScore && tutorial.qualityScore < filters.minQualityScore) {
        return false;
      }

      return true;
    });
  }

  /**
   * Rank tutorials by quality score and relevance
   */
  private rankByQuality(tutorials: Tutorial[]): Tutorial[] {
    return tutorials.sort((a, b) => {
      // Primary sort by quality score
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      
      // Secondary sort by source priority
      const sourcePriority = {
        'adobe-official': 4,
        'youtube-adobe': 3,
        'adobe-community': 2,
        'third-party': 1
      };
      
      return sourcePriority[b.source] - sourcePriority[a.source];
    });
  }

  /**
   * Find documentation resources
   */
  private async findDocumentation(apps: string[], sourcePreference: 'official' | 'community' | 'mixed' = 'mixed'): Promise<Array<{
    title: string;
    url: string;
    type: string;
  }>> {
    const documentation: Array<{ title: string; url: string; type: string; }> = [];
    
    for (const app of apps.slice(0, 2)) {
      try {
        let query: string;
        
        if (sourcePreference === 'official') {
          query = `Adobe ${app} user guide documentation site:helpx.adobe.com OR site:experienceleague.adobe.com`;
        } else if (sourcePreference === 'community') {
          query = `Adobe ${app} community guides tutorials site:community.adobe.com`;
        } else {
          query = `Adobe ${app} documentation guides site:helpx.adobe.com OR site:experienceleague.adobe.com OR site:community.adobe.com`;
        }
        
        const results = await webSearch(query);
        const docs = results.slice(0, 2).map(result => ({
          title: this.cleanTitle(result.title),
          url: result.url,
          type: this.determineSource(result.url, result.title) === 'adobe-official' ? 'Official Guide' : 'Community Guide'
        }));
        
        documentation.push(...docs);
      } catch (error) {
        console.error(`Error finding documentation for ${app}:`, error);
      }
    }
    
    return documentation.slice(0, 4);
  }

  /**
   * Find practice files and sample projects
   */
  private async findPracticeFiles(apps: string[], goals: string): Promise<PracticeFile[]> {
    const files: PracticeFile[] = [];
    
    // This would integrate with Adobe's sample file repositories
    // For now, return common practice file types
    apps.forEach(app => {
      switch (app) {
        case 'photoshop':
          files.push({
            name: 'Sample PSD Files',
            description: 'Practice Photoshop files for learning',
            downloadUrl: '#', // Would link to actual Adobe sample files
            fileType: 'PSD'
          });
          break;
        case 'illustrator':
          files.push({
            name: 'Vector Practice Files',
            description: 'Illustrator templates and practice files',
            downloadUrl: '#',
            fileType: 'AI'
          });
          break;
      }
    });

    return files;
  }

  /**
   * Find related courses and training
   */
  private async findRelatedCourses(focus: string, apps: string[]): Promise<RelatedCourse[]> {
    const courses: RelatedCourse[] = [];
    
    try {
      const query = `Adobe ${apps.join(' ')} ${focus} course training certification`;
      const results = await webSearch(query);
      
      if (Array.isArray(results)) {
        results.slice(0, 3).forEach(result => {
          courses.push({
            title: result.title || 'Adobe Training Course',
            provider: this.extractProvider(result.url),
            url: result.url,
            isPaid: this.isPaidCourse(result.title, result.content)
          });
        });
      }
    } catch (error) {
      console.error('Error finding related courses:', error);
    }

    return courses;
  }

  private extractProvider(url: string): string {
    if (url.includes('adobe.com')) return 'Adobe';
    if (url.includes('udemy.com')) return 'Udemy';
    if (url.includes('coursera.org')) return 'Coursera';
    if (url.includes('linkedin.com')) return 'LinkedIn Learning';
    return 'Unknown';
  }

  private isPaidCourse(title: string, content: string): boolean {
    const paidIndicators = ['certification', 'premium', 'paid', 'enroll', '$'];
    const text = (title + ' ' + content).toLowerCase();
    return paidIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Generate fallback tutorials when search fails
   */
  private generateFallbackTutorials(apps: string[], goals: string, difficulty: string): Tutorial[] {
    const fallbackTutorials: Tutorial[] = [];
    
    apps.forEach((app, index) => {
      const appName = app.charAt(0).toUpperCase() + app.slice(1);
      
      fallbackTutorials.push({
        id: `fallback-${app}-${index}`,
        title: `${appName} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Tutorial`,
        description: `Learn ${appName} fundamentals with this comprehensive ${difficulty} tutorial covering essential tools and techniques.`,
        url: `https://experienceleague.adobe.com/docs/${app}/tutorials`,
        source: 'adobe-official',
        difficulty: difficulty as Tutorial['difficulty'],
        duration: difficulty === 'beginner' ? '15-30 min' : difficulty === 'intermediate' ? '30-45 min' : '45-60 min',
        topics: this.getTopicsForApp(app, goals),
        apps: [app],
        qualityScore: 8,
        lastUpdated: '2024'
      });
    });

    return fallbackTutorials;
  }

  /**
   * Get source preferences based on learning path focus
   */
  private getSourcePreferencesByFocus(focus: string): {
    tutorialSources: string[];
    docSource: 'official' | 'community' | 'mixed';
  } {
    const lowerFocus = focus.toLowerCase();
    
    if (lowerFocus.includes('technical') || lowerFocus.includes('mastery') || lowerFocus.includes('advanced')) {
      return {
        tutorialSources: ['adobe-official', 'third-party'], // Official docs + expert tutorials
        docSource: 'official'
      };
    } else if (lowerFocus.includes('creative') || lowerFocus.includes('process') || lowerFocus.includes('artistic')) {
      return {
        tutorialSources: ['adobe-community', 'youtube-adobe'], // Community inspiration + Adobe channels
        docSource: 'community'
      };
    } else if (lowerFocus.includes('professional') || lowerFocus.includes('portfolio') || lowerFocus.includes('career')) {
      return {
        tutorialSources: ['adobe-official', 'adobe-community'], // Mix of official + professional community
        docSource: 'mixed'
      };
    } else {
      return {
        tutorialSources: ['adobe-official', 'youtube-adobe', 'adobe-community'], // Balanced mix
        docSource: 'mixed'
      };
    }
  }

  /**
   * Get relevant topics for an app based on goals
   */
  private getTopicsForApp(app: string, goals: string): string[] {
    const lowerGoals = goals.toLowerCase();
    const topics: string[] = [];

    switch (app) {
      case 'photoshop':
        if (lowerGoals.includes('photo') || lowerGoals.includes('image')) {
          topics.push('photo editing', 'image retouching');
        }
        if (lowerGoals.includes('social media')) {
          topics.push('social media design');
        }
        if (topics.length === 0) {
          topics.push('photo editing', 'layers');
        }
        break;
      case 'illustrator':
        if (lowerGoals.includes('logo') || lowerGoals.includes('brand')) {
          topics.push('logo design', 'branding');
        }
        if (lowerGoals.includes('vector')) {
          topics.push('vector graphics');
        }
        if (topics.length === 0) {
          topics.push('vector graphics', 'illustration');
        }
        break;
      case 'premiere':
        if (lowerGoals.includes('video') || lowerGoals.includes('youtube')) {
          topics.push('video editing', 'content creation');
        }
        if (topics.length === 0) {
          topics.push('video editing', 'timeline');
        }
        break;
      default:
        topics.push('design fundamentals');
    }

    return topics;
  }
}

// Create and export singleton instance
export const tutorialService = new TutorialService(); 