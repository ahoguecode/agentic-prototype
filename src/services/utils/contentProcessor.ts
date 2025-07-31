export interface ProcessedContent {
  title: string;
  url: string;
  summary: string;
  sections: string[];
  steps: string[];
  prerequisites: string[];
  keyAdvice: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  contentType: 'tutorial' | 'article' | 'guide' | 'video' | 'interactive';
  tags: string[];
}

export interface AdobeResource {
  title: string;
  url: string;
  summary: string;
  content: ProcessedContent;
  relevanceScore: number;
  source: 'learn' | 'help' | 'community' | 'blog';
}

/**
 * Extract structured sections from HTML content
 */
export function extractContentSections(htmlContent: string): string[] {
  const sections: string[] = [];
  
  // Extract headings (h1-h6)
  const headingMatches = htmlContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
  if (headingMatches) {
    headingMatches.forEach(heading => {
      const cleanHeading = heading.replace(/<[^>]*>/g, '').trim();
      if (cleanHeading && cleanHeading.length > 3) {
        sections.push(cleanHeading);
      }
    });
  }
  
  // Extract section content from common patterns
  const sectionPatterns = [
    /##\s*(.*?)(?=##|\n)/g,
    /\*\*(.*?)\*\*/g,
    /<strong>(.*?)<\/strong>/gi
  ];
  
  sectionPatterns.forEach(pattern => {
    const matches = htmlContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanMatch = match.replace(/[#*<>\/\s]+/g, ' ').trim();
        if (cleanMatch && cleanMatch.length > 5 && !sections.includes(cleanMatch)) {
          sections.push(cleanMatch);
        }
      });
    }
  });
  
  return sections.slice(0, 8); // Limit to most important sections
}

/**
 * Extract step-by-step instructions
 */
export function extractSteps(content: string): string[] {
  const steps: string[] = [];
  
  const stepPatterns = [
    /(?:step\s*\d+[:\s]+)(.*?)(?=step\s*\d+|$)/gi,
    /(?:\d+\.\s+)(.*?)(?=\d+\.|$)/gi,
    /(?:•\s+)(.*?)(?=•|$)/gi,
    /(?:-\s+)(.*?)(?=-|$)/gi
  ];
  
  stepPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanStep = match
          .replace(/^(step\s*\d+[:\s]*|\d+\.\s*|•\s*|-\s*)/i, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        if (cleanStep && cleanStep.length > 10 && cleanStep.length < 200) {
          steps.push(cleanStep);
        }
      });
    }
  });
  
  return steps.slice(0, 10); // Limit to 10 most important steps
}

/**
 * Extract prerequisites and requirements
 */
export function extractPrerequisites(content: string): string[] {
  const prerequisites: string[] = [];
  
  const prereqPatterns = [
    /(?:prerequisites?[:\s]+)(.*?)(?=\n\n|\.|before|requirements?)/gi,
    /(?:before you begin[:\s]+)(.*?)(?=\n\n|\.|prerequisites?)/gi,
    /(?:requirements?[:\s]+)(.*?)(?=\n\n|\.|before|prerequisites?)/gi,
    /(?:you need[:\s]+)(.*?)(?=\n\n|\.|before|to)/gi,
    /(?:required[:\s]+)(.*?)(?=\n\n|\.|before|to)/gi
  ];
  
  prereqPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanPrereq = match
          .replace(/^(prerequisites?[:\s]*|before you begin[:\s]*|requirements?[:\s]*|you need[:\s]*|required[:\s]*)/i, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        if (cleanPrereq && cleanPrereq.length > 5 && cleanPrereq.length < 150) {
          prerequisites.push(cleanPrereq);
        }
      });
    }
  });
  
  return prerequisites.slice(0, 5);
}

/**
 * Extract key advice and tips
 */
export function extractKeyAdvice(content: string): string[] {
  const advice: string[] = [];
  
  const advicePatterns = [
    /(?:tip[:\s]+)(.*?)(?=\n|tip|note|important)/gi,
    /(?:note[:\s]+)(.*?)(?=\n|tip|note|important)/gi,
    /(?:important[:\s]+)(.*?)(?=\n|tip|note|important)/gi,
    /(?:remember[:\s]+)(.*?)(?=\n|tip|note|remember)/gi,
    /(?:pro tip[:\s]+)(.*?)(?=\n|tip|note|pro)/gi,
    /(?:best practice[:\s]+)(.*?)(?=\n|tip|note|best)/gi
  ];
  
  advicePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanAdvice = match
          .replace(/^(tip[:\s]*|note[:\s]*|important[:\s]*|remember[:\s]*|pro tip[:\s]*|best practice[:\s]*)/i, '')
          .replace(/<[^>]*>/g, '')
          .trim();
        
        if (cleanAdvice && cleanAdvice.length > 10 && cleanAdvice.length < 200) {
          advice.push(cleanAdvice);
        }
      });
    }
  });
  
  return advice.slice(0, 6);
}

/**
 * Determine content difficulty level
 */
export function extractDifficulty(title: string, content: string): 'beginner' | 'intermediate' | 'advanced' {
  const text = (title + ' ' + content).toLowerCase();
  
  const beginnerKeywords = ['beginner', 'basic', 'intro', 'getting started', 'first', 'simple', 'easy'];
  const advancedKeywords = ['advanced', 'expert', 'professional', 'complex', 'deep dive', 'mastery'];
  const intermediateKeywords = ['intermediate', 'medium', 'next level', 'beyond basics'];
  
  const beginnerCount = beginnerKeywords.reduce((count, keyword) => 
    count + (text.includes(keyword) ? 1 : 0), 0);
  const advancedCount = advancedKeywords.reduce((count, keyword) => 
    count + (text.includes(keyword) ? 1 : 0), 0);
  const intermediateCount = intermediateKeywords.reduce((count, keyword) => 
    count + (text.includes(keyword) ? 1 : 0), 0);
  
  if (advancedCount > beginnerCount && advancedCount > intermediateCount) {
    return 'advanced';
  } else if (intermediateCount > beginnerCount) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

/**
 * Estimate content duration
 */
export function estimateContentDuration(content: string): string {
  const wordCount = content.split(/\s+/).length;
  const readingSpeed = 200; // words per minute
  
  if (wordCount < 300) return '2-5 min';
  if (wordCount < 800) return '5-10 min';
  if (wordCount < 1500) return '10-20 min';
  if (wordCount < 3000) return '20-30 min';
  return '30+ min';
}

/**
 * Determine content type
 */
export function determineContentType(title: string, content: string): 'tutorial' | 'article' | 'guide' | 'video' | 'interactive' {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('video') || text.includes('watch') || text.includes('youtube')) {
    return 'video';
  } else if (text.includes('interactive') || text.includes('playground') || text.includes('demo')) {
    return 'interactive';
  } else if (text.includes('tutorial') || text.includes('step by step') || text.includes('how to')) {
    return 'tutorial';
  } else if (text.includes('guide') || text.includes('complete') || text.includes('comprehensive')) {
    return 'guide';
  } else {
    return 'article';
  }
}

/**
 * Extract tags from content
 */
export function extractTags(title: string, content: string): string[] {
  const text = (title + ' ' + content).toLowerCase();
  const tags: string[] = [];
  
  // Adobe app tags
  const adobeApps = ['photoshop', 'illustrator', 'indesign', 'premiere', 'after effects', 'lightroom', 'acrobat', 'express'];
  adobeApps.forEach(app => {
    if (text.includes(app)) tags.push(app);
  });
  
  // Skill level tags
  if (text.includes('beginner') || text.includes('basic')) tags.push('beginner');
  if (text.includes('intermediate')) tags.push('intermediate');
  if (text.includes('advanced') || text.includes('expert')) tags.push('advanced');
  
  // Content type tags
  if (text.includes('design')) tags.push('design');
  if (text.includes('photo')) tags.push('photography');
  if (text.includes('video')) tags.push('video-editing');
  if (text.includes('print')) tags.push('print-design');
  if (text.includes('web')) tags.push('web-design');
  
  return [...new Set(tags)];
}

/**
 * Calculate relevance score based on user goals and content
 */
export function calculateRelevanceScore(content: ProcessedContent, userGoals: string, targetApp: string): number {
  let score = 0;
  const goals = userGoals.toLowerCase();
  const contentText = (content.title + ' ' + content.summary).toLowerCase();
  
  // App match (high weight)
  if (contentText.includes(targetApp.toLowerCase())) score += 40;
  
  // Goal keywords match
  const goalWords = goals.split(/\s+/).filter(word => word.length > 3);
  goalWords.forEach(word => {
    if (contentText.includes(word)) score += 10;
  });
  
  // Content quality indicators
  if (content.steps.length > 0) score += 15;
  if (content.prerequisites.length > 0) score += 10;
  if (content.keyAdvice.length > 0) score += 10;
  if (content.sections.length > 2) score += 5;
  
  // Content type preferences
  if (content.contentType === 'tutorial') score += 10;
  if (content.contentType === 'guide') score += 8;
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Process raw search result into structured content
 */
export function processSearchResult(result: any, userGoals: string, targetApp: string): AdobeResource {
  const processedContent: ProcessedContent = {
    title: result.title,
    url: result.url,
    summary: result.description || result.summary || '',
    sections: extractContentSections(result.content || result.description || ''),
    steps: extractSteps(result.content || result.description || ''),
    prerequisites: extractPrerequisites(result.content || result.description || ''),
    keyAdvice: extractKeyAdvice(result.content || result.description || ''),
    difficulty: extractDifficulty(result.title, result.content || result.description || ''),
    duration: estimateContentDuration(result.content || result.description || ''),
    contentType: determineContentType(result.title, result.content || result.description || ''),
    tags: extractTags(result.title, result.content || result.description || '')
  };
  
  const relevanceScore = calculateRelevanceScore(processedContent, userGoals, targetApp);
  
  // Determine source from URL
  let source: 'learn' | 'help' | 'community' | 'blog' = 'learn';
  if (result.url.includes('helpx.adobe.com')) source = 'help';
  else if (result.url.includes('community.adobe.com')) source = 'community';
  else if (result.url.includes('blog.adobe.com')) source = 'blog';
  
  return {
    title: result.title,
    url: result.url,
    summary: processedContent.summary,
    content: processedContent,
    relevanceScore,
    source
  };
} 