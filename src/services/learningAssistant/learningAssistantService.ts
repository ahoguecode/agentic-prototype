import { sendTextMessage } from '../claude/claudeService';
import { tutorialService, Tutorial, LearningResource } from '../tutorials/tutorialService';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserProfile {
  selectedApps: string[];
  goals: string;
  files?: File[];
  preferences?: any;
}

export interface LearningAssistantContext {
  conversation: ConversationMessage[];
  userProfile: UserProfile;
  currentStep: string;
}

export interface LearningModule {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  objectives: string[];
  resources: {
    adobeLearnTutorials: Array<{
      title: string;
      url: string;
      summary: string;
      duration: string;
      type: 'video' | 'article' | 'interactive';
    }>;
    adobeHelpArticles: Array<{
      title: string;
      url: string;
      summary: string;
      relevance: string;
    }>;
    communityInspiration: Array<{
      title: string;
      url: string;
      summary: string;
      creator: string;
      inspirationType: 'showcase' | 'tutorial' | 'discussion';
    }>;
  };
  practiceExercises: Array<{
    title: string;
    description: string;
    estimatedTime: string;
    deliverable: string;
  }>;
}

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: string;
  duration: string;
  timeCommitment: string;
  focus: string;
  apps: string[];
  personalizedReason: string;
  goalConnection: string;
  modules: LearningModule[];
  resources?: LearningResource;
}

// Static titles and subtitles to avoid AI generation costs
const STATIC_TITLES = {
  'goal-input': {
    title: 'What do you want to learn?',
    subtitle: 'Describe what you want to learn, upload a project you\'re working on, or share your goals. I\'ll guide you with tailored tutorials, community resources, and inspiration from real creators.'
  },
  'app-prediction': {
    title: 'Based on your goals, these are the apps you should focus on most:',
    subtitle: 'Let me know if this assessment looks accurate for your specific objectives.'
  },
  'learning-paths': {
    title: 'Great! Here are the learning paths I recommend for you.',
    subtitle: 'Select a path to begin.'
  },
  'learning-paths-predicted': {
    title: 'Great! Here are the learning paths I recommend for you.',
    subtitle: 'Select a path to begin.'
  },
  'skill-assessment': {
    title: 'Quick Skill Assessment',
    subtitle: 'Help me understand your current skill level to create the perfect learning plan.'
  },
  'learning-paths-manual': {
    title: 'Great! Here are the learning paths I recommend for you.',
    subtitle: 'Select a path to begin.'
  },
  'revision-input': {
    title: 'Revise Your Learning Plan',
    subtitle: 'Tell me what you\'d like to change about your current learning paths.'
  }
};

// Enhanced system prompt focused on learning path generation
const LEARNING_PATH_SYSTEM_PROMPT = `You are an expert Adobe Learning Assistant. Your role is to create highly personalized learning paths that match users' specific goals and skill gaps.

Key guidelines:
- Analyze user goals deeply to understand their creative objectives
- Identify specific skill gaps between current abilities and desired outcomes
- Create learning paths that build progressively from their current level
- Focus on practical, project-based learning
- Consider real-world applications of their goals
- Recommend the most relevant Adobe apps for their objectives
- Provide realistic timelines and daily commitments
- Make each path feel unique and specifically tailored to their needs

Available Adobe Apps: Photoshop, Illustrator, Premiere Pro, InDesign, Lightroom, Acrobat

Your goal is to create learning paths that will genuinely help users achieve their specific creative objectives.`;

class LearningAssistantService {
  private context: LearningAssistantContext;
  private pathCache: Map<string, LearningPath[]> = new Map();
  private fastMode: boolean = false; // Enable content enhancement to load real resources

  constructor() {
    this.context = {
      conversation: [],
      userProfile: {
        selectedApps: [],
        goals: '',
      },
      currentStep: 'welcome'
    };
  }

  /**
   * Update user profile information
   */
  updateUserProfile(updates: Partial<UserProfile>): void {
    this.context.userProfile = { ...this.context.userProfile, ...updates };
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(message: ConversationMessage): void {
    this.context.conversation.push(message);
  }

  /**
   * Generate personalized subtitle for learning paths based on user goals
   */
  private generatePersonalizedSubtitle(predictions?: { confident: string[]; needHelp: string[]; }): string {
    const { goals } = this.context.userProfile;
    const appsToLearn = predictions?.needHelp || this.context.userProfile.selectedApps;
    const confidentApps = predictions?.confident || [];
    
    if (!goals) {
      return "These learning paths are designed to help you achieve your creative goals. \n\nSelect a path to begin.";
    }
    
    // Analyze goals to determine background and target
    const goalsLower = goals.toLowerCase();
    
    // Common transition patterns
    let personalizedText = "These learning paths are tailored to ";
    
    if (goalsLower.includes('switch') || goalsLower.includes('transition') || goalsLower.includes('change career')) {
      if (goalsLower.includes('textile') && goalsLower.includes('graphic')) {
        personalizedText += "support your transition from textile design to graphic design.\n\nSince you already have creative expertise, these paths are designed to build on your design strengths while introducing the key digital skills and workflows you'll need in your new role.";
      } else if (goalsLower.includes('print') && goalsLower.includes('digital')) {
        personalizedText += "help you transition from print to digital design. Your existing design foundation will be valuable as we focus on digital tools and workflows that complement your creative experience.";
      } else if (goalsLower.includes('photography') && (goalsLower.includes('video') || goalsLower.includes('motion'))) {
        personalizedText += "support your expansion from photography into video and motion graphics. Your visual storytelling skills will translate well as we introduce video editing and motion design techniques.";
      } else {
        const fromMatch = goalsLower.match(/from\s+(\w+(?:\s+\w+)?)/);
        const toMatch = goalsLower.match(/to\s+(\w+(?:\s+\w+)?)/);
        if (fromMatch && toMatch) {
          personalizedText += `support your transition from ${fromMatch[1]} to ${toMatch[1]}. Your existing creative background provides a strong foundation as we focus on the specific skills and workflows you'll need for this career change.`;
        } else {
          personalizedText += "support your career transition. Your creative background will be valuable as we introduce new skills and workflows tailored to your goals.";
        }
      }
    } else if (goalsLower.includes('beginner') || goalsLower.includes('new to') || goalsLower.includes('just starting')) {
      personalizedText += "introduce you to Adobe's creative tools. As a beginner, these paths start with fundamentals and gradually build your skills through hands-on practice and real projects.";
    } else if (goalsLower.includes('improve') || goalsLower.includes('advance') || goalsLower.includes('next level')) {
      if (confidentApps.length > 0) {
        personalizedText += `build on your existing Adobe experience and take your skills to the next level. Since you already have experience with ${confidentApps.join(' and ')}, these paths focus on advanced techniques and professional workflows.`;
      } else {
        personalizedText += "help you advance your creative skills. These paths focus on professional techniques and workflows to elevate your work.";
      }
    } else if (goalsLower.includes('business') || goalsLower.includes('startup') || goalsLower.includes('entrepreneur')) {
      personalizedText += "equip you with the creative skills needed for your business goals. These paths focus on practical design skills that entrepreneurs and business owners need most.";
    } else if (goalsLower.includes('freelance') || goalsLower.includes('client work')) {
      personalizedText += "prepare you for freelance success. These paths cover both creative skills and professional workflows that client work demands.";
    } else if (goalsLower.includes('portfolio') || goalsLower.includes('showcase')) {
      personalizedText += "help you build a strong creative portfolio. These paths focus on creating compelling work that showcases your abilities and attracts opportunities.";
    } else {
      // Generic but still personalized based on apps
      if (appsToLearn.length > 0) {
        const appNames = appsToLearn.map(app => {
          const appMap: {[key: string]: string} = {
            'photoshop': 'Photoshop',
            'illustrator': 'Illustrator', 
            'premiere': 'Premiere Pro',
            'indesign': 'InDesign',
            'lightroom': 'Lightroom',
            'acrobat': 'Acrobat'
          };
          return appMap[app] || app;
        }).join(' and ');
        personalizedText += `help you master ${appNames} to achieve your creative goals. These paths are structured to build skills progressively while working on projects relevant to your interests.`;
      } else {
        personalizedText += "help you achieve your creative goals. These paths are designed to build skills progressively through hands-on practice and real projects.";
      }
    }
    
    return personalizedText + "\n\nSelect a path to begin.";
  }

  /**
   * Get title and subtitle for interface headers with personalization for learning paths
   */
  getStaticTitleSubtitle(step: string, predictions?: { confident: string[]; needHelp: string[]; }): { title: string; subtitle: string } {
    const staticTitle = STATIC_TITLES[step as keyof typeof STATIC_TITLES];
    
    if (staticTitle) {
      // For learning paths, use personalized subtitle
      if (step.includes('learning-paths')) {
        return {
          title: staticTitle.title,
          subtitle: this.generatePersonalizedSubtitle(predictions)
        };
      }
      return staticTitle;
    }
    
    // Fallback
    return {
      title: "Great! Here are the learning paths I recommend for you.",
      subtitle: this.generatePersonalizedSubtitle(predictions)
    };
  }

  /**
   * Analyze user goals and predict app proficiency using AI
   */
  async analyzeGoalsAndPredictApps(goals: string, files?: File[]): Promise<{
    confident: string[];
    needHelp: string[];
    reasoning: string;
  }> {
    this.updateUserProfile({ goals, files });

    let analysisPrompt = `Analyze this user's learning goals and predict their Adobe app proficiency:

Goals: "${goals}"`;

    if (files && files.length > 0) {
      analysisPrompt += `\nFiles uploaded: ${files.map(f => f.name).join(', ')}`;
    }

    analysisPrompt += `

Based on these specific goals, predict:
1. Which Adobe apps they might already be confident with (if any)
2. Which apps they need to learn to achieve their goals

Consider their goals carefully and be realistic about what skills they'll need.

Respond in this exact JSON format:
{
  "confident": ["app1", "app2"],
  "needHelp": ["app3", "app4"], 
  "reasoning": "Brief explanation focusing on what they need to learn for their specific goals"
}

Use these exact app names: photoshop, illustrator, premiere, indesign, lightroom, acrobat`;

    try {
      console.log('🤖 AI: Analyzing goals and predicting app proficiency...');
      console.log(`📝 User goals: "${goals}"`);
      console.log(`🎯 Sending analysis prompt to Claude AI...`);
      
      const response = await sendTextMessage(
        analysisPrompt,
        LEARNING_PATH_SYSTEM_PROMPT,
        {
          max_tokens: 300,
          temperature: 0.3
        }
      );
      console.log('✅ AI analysis response:', response);
      console.log(`📏 Analysis response length: ${response.length} characters`);

      try {
        // Clean the response
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        const analysis = JSON.parse(cleanedResponse);
        console.log('🎉 SUCCESS: AI generated app predictions!');
        console.log(`📊 Confident apps: [${analysis.confident.join(', ')}]`);
        console.log(`📈 Need help with: [${analysis.needHelp.join(', ')}]`);
        console.log(`💭 AI reasoning: "${analysis.reasoning}"`);
        
        return analysis;
      } catch (parseError) {
        console.error('❌ Error parsing AI prediction JSON:', parseError);
        console.log('🔍 Raw AI response that failed to parse:', response);
        console.log('⚠️ Using fallback prediction logic...');
        return this.fallbackPrediction(goals);
      }
    } catch (error) {
      console.error('❌ Error calling Claude AI for predictions:', error);
      console.log('⚠️ Using fallback prediction logic...');
      return this.fallbackPrediction(goals);
    }
  }

  /**
   * Generate personalized learning paths using AI based on user goals and needs
   */
  async generatePersonalizedLearningPaths(predictions?: {
    confident: string[];
    needHelp: string[];
  }): Promise<LearningPath[]> {
    const { goals, selectedApps } = this.context.userProfile;
    const appsToLearn = predictions?.needHelp || selectedApps;
    const confidentApps = predictions?.confident || [];
    
    // Create cache key
    const cacheKey = `${goals.toLowerCase().substring(0, 50)}-${appsToLearn.join(',')}-${confidentApps.join(',')}`;
    
    // Check cache first
    if (this.pathCache.has(cacheKey)) {
      console.log('⚡ CACHE HIT: Returning cached learning paths');
      return this.pathCache.get(cacheKey)!;
    }
    
    console.log('💾 CACHE MISS: Generating new learning paths');
    
    const prompt = `Create 2 personalized Adobe learning path titles and descriptions for this user:

USER GOALS: "${goals}"
APPS TO LEARN: ${appsToLearn.join(', ')}
CONFIDENT WITH: ${confidentApps.join(', ') || 'None specified'}

IMPORTANT: Analyze the user's background and create titles that bridge their existing skills to their target goals.

Examples for different contexts:
- Textile designer → Graphic design: "Bridging Textile to Graphic Design", "Surface Design for Digital Branding"
- Marketing → UX Design: "Marketing Insights to User Experience", "Brand Strategy to Digital Product Design"  
- Photography → Visual Design: "Visual Storytelling to Brand Design", "Photography Skills for Creative Direction"
- Teacher → Learning Design: "Educational Expertise to Digital Learning", "Classroom Skills for Online Course Creation"

Create titles that:
1. Reference their specific background/profession if mentioned
2. Show clear connection between old skills and new goals
3. Feel like a personalized bridge rather than generic training

Return JSON array with exactly this structure:
[
  {
    "id": 1,
    "title": "Bridge-focused title connecting their background to first target skill",
    "description": "Foundation description that acknowledges their existing skills while introducing new applications",
    "personalizedReason": "Why this specifically works for their background transition",
    "goalConnection": "How this directly serves their stated goals"
  },
  {
    "id": 2,
    "title": "Advanced title for professional development in target field", 
    "description": "Professional growth description for establishing credibility in new field",
    "personalizedReason": "Advanced skills needed for successful transition",
    "goalConnection": "Professional success and career advancement in target area"
  }
]`

    try {
      console.log('🤖 AI: Generating structured learning paths with modules...');
      console.log(`📝 User goals: "${goals}"`);
      console.log(`🎯 Apps to learn: ${appsToLearn.join(', ')}`);
      console.log(`✅ Apps confident with: ${confidentApps.join(', ')}`);
      console.log(`🎯 Sending SIMPLIFIED prompt to Claude AI...`);
      
      const response = await sendTextMessage(
        prompt,
        LEARNING_PATH_SYSTEM_PROMPT,
        {
          max_tokens: 500,
          temperature: 0.3
        }
      );
      console.log('✅ AI structured learning paths response received');
      console.log(`📏 Response length: ${response.length} characters`);
      console.log(`🔍 FIRST 500 chars of AI response:`, response.substring(0, 500));

      try {
        // Clean the response to ensure it's valid JSON
        let cleanedResponse = response.trim();
        
        // Remove any markdown formatting if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        console.log(`🧹 Cleaned response for parsing...`);
        
        const paths = JSON.parse(cleanedResponse);
        
        if (Array.isArray(paths) && paths.length > 0) {
          console.log(`🎉 SUCCESS: AI generated ${paths.length} basic learning paths!`);
          console.log(`📝 Generated path titles:`, paths.map(p => p.title));
          
          // Add standardized modules to the AI-generated basic paths
          const fullPaths = paths.map((basicPath, index) => 
            this.addStandardModules(basicPath, index, appsToLearn)
          );
          
          console.log(`🔧 Added standardized modules to paths`);
          console.log(`📝 Full paths:`, fullPaths.map(p => ({ title: p.title, modules: p.modules?.length || 0 })));
          
          // Cache the basic paths for faster future access
          this.pathCache.set(cacheKey, fullPaths);
          
          // In fast mode, return paths immediately without heavy content enhancement
          if (this.fastMode) {
            console.log('⚡ FAST MODE: Returning paths without content enhancement');
            console.log(`🎯 Generated ${fullPaths.length} personalized learning paths (fast mode)`);
            return fullPaths;
          }
          
          // Enhance each path with real Adobe content (slower)
          const enhancedPaths = await this.enhancePathsWithRealContent(fullPaths, goals);
          console.log(`🎯 Generated ${enhancedPaths.length} AI-powered learning paths with real Adobe content`);
          return enhancedPaths;
        } else {
          console.log('⚠️ AI response was not a valid array, using structured fallback paths');
          console.log('🔍 Response content:', response.substring(0, 200) + '...');
          console.log('⚠️ USING FALLBACK PATHS - AI FAILED TO GENERATE VALID PATHS');
          const fallbackPaths = this.createStructuredFallbackPaths(goals, appsToLearn);
          
          // Cache fallback paths too
          this.pathCache.set(cacheKey, fallbackPaths);
          
          // Return fallback paths immediately in fast mode
          if (this.fastMode) {
            console.log('⚡ FAST MODE: Returning fallback paths without content enhancement');
            return fallbackPaths;
          }
          
          return await this.enhancePathsWithRealContent(fallbackPaths, goals);
        }
      } catch (parseError) {
        console.error('❌ Error parsing structured learning paths JSON:', parseError);
        console.log('🔍 Raw AI response that failed to parse:', response.substring(0, 300) + '...');
        console.log('⚠️ USING FALLBACK PATHS - JSON PARSING FAILED');
        const fallbackPaths = this.createStructuredFallbackPaths(goals, appsToLearn);
        
        // Cache fallback paths
        this.pathCache.set(cacheKey, fallbackPaths);
        
        if (this.fastMode) {
          console.log('⚡ FAST MODE: Returning fallback paths without content enhancement');
          return fallbackPaths;
        }
        
        return await this.enhancePathsWithRealContent(fallbackPaths, goals);
      }
    } catch (error) {
      console.error('❌ Error calling Claude AI for structured learning paths:', error);
      console.log('⚠️ USING FALLBACK PATHS - AI SERVICE FAILED');
      const fallbackPaths = this.createStructuredFallbackPaths(goals, appsToLearn);
      
      // Cache fallback paths
      this.pathCache.set(cacheKey, fallbackPaths);
      
      if (this.fastMode) {
        console.log('⚡ FAST MODE: Returning fallback paths without content enhancement');
        return fallbackPaths;
      }
      
      return await this.enhancePathsWithRealContent(fallbackPaths, goals);
    }
  }

  /**
   * Enhance learning paths with real Adobe content for each module
   */
  private async enhancePathsWithRealContent(paths: LearningPath[], goals: string): Promise<LearningPath[]> {
    console.log('📚 Enhancing learning paths with real Adobe content...');
    console.log('🎯 Paths to enhance:', paths.length, paths.map(p => p.title));
    console.log('🎯 Goals:', goals);
    
    const { searchAdobeLearn, searchAdobeHelp, searchAdobeCommunity } = await import('../utils/webSearchService');
    
    const enhancedPaths = await Promise.all(
      paths.map(async (path) => {
        try {
          console.log(`🔍 Sourcing real content for: "${path.title}"`);
          
          // Enhance each module with real Adobe content
          const enhancedModules = await Promise.all(
            (path.modules || []).map(async (module, moduleIndex) => {
              const primaryApp = path.apps[0] || 'photoshop';
              
              console.log(`🔧 Module ${moduleIndex}: "${module.title}" - Generating unique content for ${goals.slice(0, 50)}...`);
              
              // Get real content from Adobe sources with module index for uniqueness
              const [adobeLearnTutorials, adobeHelpArticles, communityInspiration] = await Promise.all([
                searchAdobeLearn(module.title, primaryApp, module.difficulty, goals, moduleIndex),
                searchAdobeHelp(module.title, primaryApp, goals, moduleIndex),
                searchAdobeCommunity(module.title, primaryApp, goals, moduleIndex)
              ]);
              
              console.log(`✅ Module ${moduleIndex} enhanced with:`, {
                learn: adobeLearnTutorials.length,
                help: adobeHelpArticles.length, 
                community: communityInspiration.length
              });
              
              return {
                ...module,
                resources: {
                  adobeLearnTutorials: adobeLearnTutorials.map(tutorial => ({
                    title: tutorial.title,
                    url: tutorial.url,
                    summary: tutorial.summary,
                    duration: tutorial.duration,
                    type: tutorial.type
                  })),
                  adobeHelpArticles: adobeHelpArticles.map(article => ({
                    title: article.title,
                    url: article.url,
                    summary: article.summary,
                    relevance: `Highly relevant for ${module.title} - ${article.type} documentation`
                  })),
                  communityInspiration: communityInspiration.map(inspiration => ({
                    title: inspiration.title,
                    url: inspiration.url,
                    summary: inspiration.summary,
                    creator: inspiration.author || 'Adobe Community',
                    inspirationType: inspiration.type as 'showcase' | 'tutorial' | 'discussion'
                  }))
                }
              };
            })
          );
          
          console.log(`✅ Enhanced "${path.title}" with real Adobe content across ${enhancedModules.length} modules`);
          
          return {
            ...path,
            modules: enhancedModules
          };
        } catch (error) {
          console.error(`Error enhancing path "${path.title}" with real content:`, error);
          return path;
        }
      })
    );
    
    return enhancedPaths;
  }

  /**
   * Search for specific tutorials based on user query
   */
  async searchTutorials(query: string, apps: string[] = [], difficulty: string = 'beginner') {
    console.log('🔍 Searching tutorials for user query:', query);
    
    try {
      const searchResult = await tutorialService.searchTutorials(
        query,
        apps.length > 0 ? apps : this.context.userProfile.selectedApps,
        difficulty,
        {
          maxResults: 10,
          minQualityScore: 6,
          sources: ['adobe-official', 'youtube-adobe', 'adobe-community']
        }
      );
      
      console.log(`✅ Found ${searchResult.tutorials.length} tutorials for "${query}"`);
      return searchResult;
    } catch (error) {
      console.error('Error searching tutorials:', error);
      return {
        tutorials: [],
        totalFound: 0,
        searchQuery: query,
        filters: {}
      };
    }
  }

  /**
   * Fallback prediction logic if AI fails
   */
  private fallbackPrediction(goals: string): { confident: string[], needHelp: string[], reasoning: string } {
    const lowerGoals = goals.toLowerCase();
    const confident: string[] = [];
    const needHelp: string[] = [];

    if (lowerGoals.includes('photo') || lowerGoals.includes('image') || lowerGoals.includes('social media')) {
      needHelp.push('photoshop');
      if (lowerGoals.includes('professional') || lowerGoals.includes('photography')) {
        needHelp.push('lightroom');
      }
    }
    if (lowerGoals.includes('logo') || lowerGoals.includes('design') || lowerGoals.includes('vector') || lowerGoals.includes('brand')) {
      needHelp.push('illustrator');
    }
    if (lowerGoals.includes('video') || lowerGoals.includes('youtube') || lowerGoals.includes('content') || lowerGoals.includes('film')) {
      needHelp.push('premiere');
    }
    if (lowerGoals.includes('web') || lowerGoals.includes('ui') || lowerGoals.includes('ux')) {
      needHelp.push('illustrator', 'photoshop');
    }

    if (needHelp.length === 0) {
      needHelp.push('photoshop', 'illustrator');
    }

    return {
      confident,
      needHelp,
      reasoning: `Based on your "${goals}" goal, these Adobe apps will be most relevant for achieving your objectives.`
    };
  }

  /**
   * Create structured fallback learning paths with modules
   */
  private createStructuredFallbackPaths(goals: string, appsToLearn: string[]): LearningPath[] {
    const lowerGoals = goals.toLowerCase();
    const primaryApp = appsToLearn[0] || 'photoshop';
    const secondaryApp = appsToLearn[1] || 'illustrator';
    
    // Analyze goals to extract background and target information
    let userBackground = 'creative professional';
    let targetField = 'digital design';
    let transitionType = 'skill development';
    
    // Detect specific career transitions and backgrounds
    if (lowerGoals.includes('textile') && lowerGoals.includes('graphic')) {
      userBackground = 'textile designer';
      targetField = 'graphic design';
      transitionType = 'career transition';
    } else if (lowerGoals.includes('photography') && lowerGoals.includes('video')) {
      userBackground = 'photographer';
      targetField = 'video production';
      transitionType = 'medium expansion';
    } else if (lowerGoals.includes('restaurant') || lowerGoals.includes('food')) {
      userBackground = 'restaurant owner';
      targetField = 'marketing design';
      transitionType = 'business development';
    } else if (lowerGoals.includes('marketing') && lowerGoals.includes('business')) {
      userBackground = 'business professional';
      targetField = 'marketing design';
      transitionType = 'skill acquisition';
    } else if (lowerGoals.includes('social media') || lowerGoals.includes('content')) {
      userBackground = 'content creator';
      targetField = 'social media design';
      transitionType = 'platform expansion';
    } else if (lowerGoals.includes('freelance') || lowerGoals.includes('client')) {
      userBackground = 'aspiring freelancer';
      targetField = 'client services';
      transitionType = 'business launch';
    } else if (lowerGoals.includes('career') && lowerGoals.includes('change')) {
      userBackground = 'career changer';
      targetField = 'creative field';
      transitionType = 'career transition';
    }

    // Create highly specific path themes based on their exact situation
    const pathThemes = {
      foundation: `${targetField.charAt(0).toUpperCase() + targetField.slice(1)} Foundations for ${userBackground === 'creative professional' ? 'Creative Professionals' : userBackground.charAt(0).toUpperCase() + userBackground.slice(1) + 's'}`,
      translation: `Translating ${userBackground === 'creative professional' ? 'Creative' : userBackground.charAt(0).toUpperCase() + userBackground.slice(1)} Skills to ${targetField.charAt(0).toUpperCase() + targetField.slice(1)}`,
      professional: `Building a ${targetField.charAt(0).toUpperCase() + targetField.slice(1)} ${transitionType === 'career transition' ? 'Career' : 'Portfolio'} from ${userBackground === 'creative professional' ? 'Creative' : userBackground.charAt(0).toUpperCase() + userBackground.slice(1)} Background`
    };

    return [
      {
        id: 1,
        title: pathThemes.foundation,
        description: `Master essential ${targetField} fundamentals designed specifically for ${userBackground}s making the transition. Build on your existing creative knowledge while learning industry-standard techniques.`,
        level: 'Beginner',
        duration: '4-6 weeks',
        timeCommitment: '1hour/day',
        focus: 'Foundation Building for Career Transition',
        apps: [primaryApp],
        personalizedReason: `This path recognizes your ${userBackground} background and builds ${targetField} skills in a way that leverages your existing creative understanding and industry knowledge.`,
        goalConnection: `Provides the essential foundation needed for ${userBackground}s to successfully transition into ${targetField} with confidence and competence.`,
        modules: [
          {
            id: 1,
            title: `${primaryApp.charAt(0).toUpperCase() + primaryApp.slice(1)} Interface for ${userBackground.charAt(0).toUpperCase() + userBackground.slice(1)}s`,
            description: `Learn ${primaryApp} interface and tools with context specifically relevant to ${userBackground}s transitioning to ${targetField}. Understand how your existing creative knowledge applies.`,
            duration: '1-2 weeks',
            difficulty: 'beginner' as const,
            objectives: [
              `Navigate ${primaryApp} with efficiency relevant to ${targetField} work`,
              `Apply ${userBackground} design principles in digital ${targetField} context`,
              `Set up workflows that bridge ${userBackground} and ${targetField} methodologies`
            ],
            resources: {
              adobeLearnTutorials: [],
              adobeHelpArticles: [],
              communityInspiration: []
            },
            practiceExercises: [
              {
                title: `${userBackground.charAt(0).toUpperCase() + userBackground.slice(1)} to ${targetField.charAt(0).toUpperCase() + targetField.slice(1)} Translation Project`,
                description: `Create a ${primaryApp} project that demonstrates how your ${userBackground} sensibilities translate to effective ${targetField} work`,
                estimatedTime: '3-4 hours',
                deliverable: `Portfolio piece showing successful transition from ${userBackground} aesthetic to ${targetField} standards`
              }
            ]
          },
          {
            id: 2,
            title: `Core ${targetField.charAt(0).toUpperCase() + targetField.slice(1)} Principles for Career Changers`,
            description: `Master fundamental ${targetField} concepts and techniques, with specific focus on how they differ from and build upon ${userBackground} practices you already know.`,
            duration: '2-3 weeks',
            difficulty: 'beginner' as const,
            objectives: [
              `Understand ${targetField} industry standards and best practices`,
              `Apply color, typography, and composition principles specific to ${targetField}`,
              `Create professional-quality work that meets ${targetField} industry expectations`
            ],
            resources: {
              adobeLearnTutorials: [],
              adobeHelpArticles: [],
              communityInspiration: []
            },
            practiceExercises: [
              {
                title: `Professional ${targetField.charAt(0).toUpperCase() + targetField.slice(1)} Standards Project`,
                description: `Create a comprehensive project that demonstrates mastery of ${targetField} principles and professional standards for your new career path`,
                estimatedTime: '4-6 hours',
                deliverable: `Professional-quality ${targetField} project ready for portfolio inclusion`
              }
            ]
          }
        ]
      },
      {
        id: 2,
        title: pathThemes.professional,
        description: `Develop a compelling professional portfolio and positioning strategy that showcases your successful transition from ${userBackground} to ${targetField}, emphasizing your unique value proposition.`,
        level: 'Intermediate',
        duration: '6-8 weeks',
        timeCommitment: '1.5hours/day',
        focus: 'Professional Portfolio and Career Positioning',
        apps: appsToLearn.length > 1 ? [appsToLearn[0], appsToLearn[1]] : [primaryApp, secondaryApp],
        personalizedReason: `This path addresses the specific challenges ${userBackground}s face when positioning themselves professionally in ${targetField}, turning your background into a competitive advantage.`,
        goalConnection: `Establishes you as a distinctive ${targetField} professional whose ${userBackground} background provides unique value and perspective in the marketplace.`,
        modules: [
          {
            id: 1,
            title: `Portfolio Strategy for ${userBackground.charAt(0).toUpperCase() + userBackground.slice(1)} to ${targetField.charAt(0).toUpperCase() + targetField.slice(1)} Transition`,
            description: `Develop a strategic approach to portfolio creation that tells your compelling transition story and positions your ${userBackground} background as an asset in ${targetField}.`,
            duration: '3-4 weeks',
            difficulty: 'intermediate' as const,
            objectives: [
              `Create a portfolio narrative that positions your career transition as a strength`,
              `Develop signature pieces that showcase ${userBackground}-informed ${targetField} excellence`,
              `Build a professional brand that differentiates you in the ${targetField} market`
            ],
            resources: {
              adobeLearnTutorials: [],
              adobeHelpArticles: [],
              communityInspiration: []
            },
            practiceExercises: [
              {
                title: `Professional ${targetField.charAt(0).toUpperCase() + targetField.slice(1)} Portfolio Development`,
                description: `Create a complete professional portfolio that demonstrates your successful mastery of ${targetField} while highlighting the unique value your ${userBackground} background provides`,
                estimatedTime: '8-10 hours',
                deliverable: `Professional portfolio ready for ${targetField} career launch, positioning your transition as a competitive advantage`
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Add standardized modules to a basic learning path
   */
  private addStandardModules(basicPath: any, index: number, appsToLearn: string[]): LearningPath {
    const { goals } = this.context.userProfile;
    const isFoundation = index === 0;
    const primaryApp = appsToLearn[index] || appsToLearn[0] || 'photoshop';
    const secondaryApp = appsToLearn[1] || 'illustrator';

    // Analyze user goals to create highly personalized modules
    const goalsLower = goals.toLowerCase();
    const isTextileToGraphic = goalsLower.includes('textile') && goalsLower.includes('graphic');
    const isCareerTransition = goalsLower.includes('transition') || goalsLower.includes('career change') || goalsLower.includes('switch');
    const isFromTextile = goalsLower.includes('textile');
    const isToGraphicDesign = goalsLower.includes('graphic design');
    const isPortfolio = goalsLower.includes('portfolio');
    const isFreelance = goalsLower.includes('freelance');
    const hasExperience = goalsLower.includes('experience with') || goalsLower.includes('background in');

    // Create highly personalized modules based on specific transition
    let modules = [];

    if (isTextileToGraphic) {
      // Specific modules for textile to graphic design transition
      modules = [
        {
          id: 1,
          title: "Translating Textile Skills into Digital Design",
          description: "Learn how to apply your textile design intuition to graphic design. Understand the parallels between textile and graphic design principles.",
          duration: "2 weeks",
          difficulty: 'beginner' as const,
          objectives: [
            'Identify and translate textile design principles (texture, repetition, pattern) into digital compositions',
            'Create a digital mood board that reflects the essence of a textile-based collection',
            'Use Photoshop to reimagine physical textile elements into layered digital collages',
            'Understand how textile aesthetics can inform branding and visual storytelling'
          ],
          keyAdvice: [
            "Think of patterns as branding elements",
            "Use your understanding of texture and repetition to create compelling visual compositions", 
            "Treat fabric swatches like digital mood boards"
          ],
          projectIdeas: [
            "Create a digital mood board using Photoshop that reflects your textile-inspired brand concept",
            "Reinterpret a physical textile collection into a digital collage using Photoshop layers and blending modes"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Digital Textile Mood Board Creation',
              description: 'Create a digital mood board using Photoshop that reflects your textile-inspired brand concept, incorporating color stories, texture references, and pattern elements.',
              estimatedTime: '3-4 hours',
              deliverable: 'Professional mood board showcasing textile-to-digital design thinking'
            },
            {
              title: 'Pattern Digitization Project',
              description: 'Take one of your existing textile designs and recreate it digitally using Photoshop layers and blending modes to simulate fabric textures.',
              estimatedTime: '4-5 hours', 
              deliverable: 'Digital pattern that maintains the essence of the original textile design'
            }
          ]
        },
        {
          id: 2,
          title: "Surface Design for Branding and Packaging",
          description: "Apply your surface design skills to branding, packaging, and product design—key areas in graphic design.",
          duration: "3 weeks", 
          difficulty: 'intermediate' as const,
          objectives: [
            'Design and edit seamless patterns using Adobe Illustrator',
            'Apply surface design principles to branding assets such as packaging and stationery',
            'Use Photoshop smart objects and Illustrator tools to create realistic product mockups',
            'Evaluate how pattern design enhances brand identity and consumer experience'
          ],
          keyAdvice: [
            "Think about how patterns can enhance brand identity",
            "Use mockups to visualize your designs on products like stationery, apparel, or packaging"
          ],
          projectIdeas: [
            "Create a brand identity for a fictional product using your textile-inspired patterns",
            "Apply your designs to packaging mockups using Photoshop smart objects and Illustrator outlines"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Brand Pattern System Development',
              description: 'Create a cohesive pattern family for a fictional sustainable fashion brand, including business cards, packaging, and stationery applications.',
              estimatedTime: '6-8 hours',
              deliverable: 'Complete brand identity system with pattern applications across multiple touchpoints'
            },
            {
              title: 'Product Packaging Design',
              description: 'Design packaging for a beauty or lifestyle product that incorporates your textile-inspired patterns using smart objects and realistic mockups.',
              estimatedTime: '5-6 hours',
              deliverable: 'Professional packaging design with pattern integration and brand storytelling'
            }
          ]
        },
        {
          id: 3,
          title: "Building Your Transition Portfolio",
          description: "Create a professional portfolio that showcases your unique textile-to-graphic design perspective and attracts opportunities.",
          duration: "3 weeks",
          difficulty: 'intermediate' as const,
          objectives: [
            'Develop 5-7 portfolio pieces that demonstrate your textile design background applied to graphic design',
            'Create case studies that tell the story of your design process and creative thinking',
            'Present your work using Adobe Portfolio and InDesign layouts',
            'Network with graphic design professionals and get feedback on your transition portfolio'
          ],
          keyAdvice: [
            "Highlight your unique perspective as a textile designer entering graphic design",
            "Show before/after examples of how you've adapted textile concepts to digital applications",
            "Include personal projects that demonstrate passion for your new field"
          ],
          projectIdeas: [
            "Create a textile-inspired branding system for a sustainable fashion startup",
            "Design a series of album covers that incorporate your textile design aesthetic"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Transition Portfolio Case Study',
              description: 'Document your design process for one major project, showing how you applied textile design thinking to solve a graphic design challenge.',
              estimatedTime: '4-5 hours',
              deliverable: 'Professional case study presentation with process documentation and final outcomes'
            },
            {
              title: 'Portfolio Website Development',
              description: 'Create a professional portfolio website using Adobe Portfolio that tells your transition story and showcases your unique design perspective.',
              estimatedTime: '6-8 hours',
              deliverable: 'Live portfolio website optimized for both desktop and mobile viewing'
            }
          ]
        }
      ];
    } else if (isCareerTransition && isToGraphicDesign) {
      // Generic career transition to graphic design
      modules = [
        {
          id: 1,
          title: `${primaryApp.charAt(0).toUpperCase() + primaryApp.slice(1)} Fundamentals for Career Changers`,
          description: `Master essential ${primaryApp} skills while leveraging your existing professional experience and transferable skills.`,
          duration: "2-3 weeks",
          difficulty: 'beginner' as const,
          objectives: [
            `Master ${primaryApp} interface and essential tools`,
            'Create your first professional-quality design projects',
            'Understand design principles and how they apply to your career goals',
            'Build confidence transitioning from your previous field'
          ],
          keyAdvice: [
            "Draw connections between your previous work and design principles",
            "Start with projects that interest you personally to build motivation",
            "Don't be afraid to experiment and make mistakes while learning"
          ],
          projectIdeas: [
            "Create a personal branding package that reflects your professional transition",
            "Redesign materials from your previous career using graphic design principles"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Personal Branding Project',
              description: 'Create a complete personal branding package that reflects your professional transition, including logo, business cards, and letterhead.',
              estimatedTime: '4-6 hours',
              deliverable: 'Professional personal brand identity that bridges your previous career with your design goals'
            },
            {
              title: 'Industry Redesign Challenge',
              description: 'Choose a piece of marketing material from your previous industry and redesign it using graphic design principles and your new software skills.',
              estimatedTime: '3-4 hours',
              deliverable: 'Before/after comparison showing improved design with explanation of design decisions'
            }
          ]
        },
        {
          id: 2,
          title: "Professional Design Applications",
          description: "Apply your new design skills to real-world projects that demonstrate your capabilities to potential employers or clients.",
          duration: "3-4 weeks",
          difficulty: 'intermediate' as const,
          objectives: [
            'Create designs for multiple industries and applications',
            'Develop a consistent design style and approach',
            'Learn client communication and project management basics',
            'Build a portfolio that showcases your range and capabilities'
          ],
          keyAdvice: [
            "Focus on industries you understand from your previous career",
            "Create diverse projects to show your adaptability",
            "Get feedback from working designers and iterate on your work"
          ],
          projectIdeas: [
            "Design marketing materials for businesses in your former industry",
            "Create a complete brand identity for a fictional company in a field you're passionate about"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Multi-Industry Design Portfolio',
              description: 'Create marketing materials for three different industries, demonstrating your ability to adapt your design style to different contexts and audiences.',
              estimatedTime: '8-10 hours',
              deliverable: 'Portfolio of diverse design applications showing range and adaptability'
            },
            {
              title: 'Client Project Simulation',
              description: 'Complete a full design project from brief to final delivery, including client presentations and revisions, for a fictional client in your target industry.',
              estimatedTime: '6-8 hours',
              deliverable: 'Complete project documentation including brief, concepts, revisions, and final deliverables'
            }
          ]
        },
        {
          id: 3,
          title: "Launching Your Design Career",
          description: "Prepare for job hunting, freelancing, or starting your own design business with professional portfolio and business skills.",
          duration: "2-3 weeks",
          difficulty: 'intermediate' as const,
          objectives: [
            'Complete a professional portfolio website',
            'Prepare for design interviews and presentations',
            'Understand freelance vs agency vs in-house career paths',
            'Network within the design community and start building relationships'
          ],
          keyAdvice: [
            "Your unique background is an asset - don't hide it, highlight it",
            "Start networking before you feel 'ready' - the design community is welcoming",
            "Consider starting with freelance projects to build experience and confidence"
          ],
          projectIdeas: [
            "Create a case study presentation for your best portfolio piece",
            "Design your own business cards and promotional materials"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Portfolio Presentation Development',
              description: 'Create a compelling case study presentation for your strongest portfolio piece, including process documentation and design rationale.',
              estimatedTime: '4-5 hours',
              deliverable: 'Professional presentation ready for interviews or client meetings'
            },
            {
              title: 'Professional Materials Design',
              description: 'Design your own business cards, resume, and promotional materials that reflect your unique background and design aesthetic.',
              estimatedTime: '3-4 hours',
              deliverable: 'Complete set of professional materials for networking and job searching'
            }
          ]
        }
      ];
    } else {
      // Default creative skill building modules
      modules = [
        {
          id: 1,
          title: `${primaryApp.charAt(0).toUpperCase() + primaryApp.slice(1)} Fundamentals`,
          description: isFoundation ? 'Master essential tools and workflows for your creative goals' : 'Develop advanced techniques and professional workflows',
          duration: isFoundation ? '2 weeks' : '3 weeks',
          difficulty: isFoundation ? 'beginner' as const : 'intermediate' as const,
          objectives: isFoundation ? 
            ['Master interface and basic tools', 'Create first portfolio pieces', 'Build confidence with new software'] :
            ['Execute professional projects', 'Develop signature style', 'Build career portfolio'],
          keyAdvice: [
            "Practice consistently, even if just 15 minutes a day",
            "Focus on understanding principles, not just following tutorials",
            "Save and organize all your practice work - you'll be surprised how much you improve"
          ],
          projectIdeas: isFoundation ? [
            "Create a simple poster for an event you're interested in",
            "Design social media graphics for a hobby or interest"
          ] : [
            "Develop a complete brand identity for a fictional company",
            "Create a series of designs that showcase your unique style"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Personal Branding Project',
              description: 'Create a complete personal branding package that reflects your professional transition, including logo, business cards, and letterhead.',
              estimatedTime: '4-6 hours',
              deliverable: 'Professional personal brand identity that bridges your previous career with your design goals'
            },
            {
              title: 'Industry Redesign Challenge',
              description: 'Choose a piece of marketing material from your previous industry and redesign it using graphic design principles and your new software skills.',
              estimatedTime: '3-4 hours',
              deliverable: 'Before/after comparison showing improved design with explanation of design decisions'
            }
          ]
        },
        {
          id: 2,
          title: "Creative Project Development",
          description: "Apply your skills to meaningful projects that reflect your creative interests and goals",
          duration: "3-4 weeks",
          difficulty: 'intermediate' as const,
          objectives: [
            'Plan and execute complete creative projects from concept to completion',
            'Develop your unique creative voice and style',
            'Learn to present and discuss your creative work professionally',
            'Build a portfolio that represents your creative goals'
          ],
          keyAdvice: [
            "Choose projects you're genuinely excited about",
            "Don't be afraid to iterate and revise your work",
            "Seek feedback early and often in the creative process"
          ],
          projectIdeas: [
            "Create a passion project that combines your interests with your new design skills",
            "Collaborate with friends or local organizations on real design challenges"
          ],
          resources: {
            adobeLearnTutorials: [],
            adobeHelpArticles: [],
            communityInspiration: []
          },
          practiceExercises: [
            {
              title: 'Passion Project Development',
              description: 'Choose a cause, hobby, or interest you\'re passionate about and create a complete visual identity or campaign for it.',
              estimatedTime: '8-10 hours',
              deliverable: 'Complete project portfolio piece with documented creative process and final deliverables'
            },
            {
              title: 'Real-World Design Challenge',
              description: 'Partner with a local business, nonprofit, or community organization to solve an actual design need they have.',
              estimatedTime: '10-12 hours',
              deliverable: 'Professional client work with testimonial and case study documentation'
            }
          ]
        }
      ];
    }

    return {
      ...basicPath,
      level: isFoundation ? 'Beginner' : 'Intermediate',
      duration: isTextileToGraphic ? '8-10 weeks' : (isCareerTransition ? '6-8 weeks' : '4-6 weeks'),
      timeCommitment: isTextileToGraphic ? '1.5-2 hours/day' : '1-1.5 hours/day',
      focus: isTextileToGraphic ? 'Textile to Graphic Design Transition' : (isCareerTransition ? 'Career Transition' : 'Creative Skill Building'),
      apps: isFoundation ? [primaryApp] : [primaryApp, secondaryApp],
      modules: modules
    };
  }

  /**
   * Generate revised learning paths based on user feedback
   */
  async generateRevisedLearningPaths(
    revisionFeedback: string,
    currentPaths: LearningPath[],
    predictions?: { confident: string[]; needHelp: string[]; }
  ): Promise<LearningPath[]> {
    const { goals, selectedApps } = this.context.userProfile;
    const appsToLearn = predictions?.needHelp || selectedApps;
    const confidentApps = predictions?.confident || [];
    
    const prompt = `You are an expert Adobe Learning Consultant. The user has reviewed their learning paths and wants revisions.

ORIGINAL USER GOALS: "${goals}"
APPS CONFIDENT WITH: ${confidentApps.join(', ') || 'none specified'}
APPS TO LEARN: ${appsToLearn.join(', ') || 'general Adobe skills'}

CURRENT LEARNING PATHS:
${currentPaths.map((path, index) => `
${index + 1}. ${path.title}
   - ${path.description}
   - Level: ${path.level}, Duration: ${path.duration}
   - Focus: ${path.focus}
   - Apps: ${path.apps.join(', ')}
`).join('')}

USER'S REVISION REQUEST: "${revisionFeedback}"

INSTRUCTIONS:
1. Carefully analyze what the user wants changed based on their feedback
2. Keep what they liked about the current paths (if not mentioned for change)
3. Modify or replace paths according to their specific requests
4. Maintain the same high-quality, personalized approach
5. Create 3 distinct paths that address their revision needs

REVISION PRINCIPLES:
- If they want different apps, adjust the app focus accordingly
- If they want different difficulty, modify the level and complexity
- If they want different duration, adjust timeframes and content depth
- If they want different focus areas, change the emphasis and approach
- If they want specific changes to content, incorporate those changes

Create 3 revised learning paths that address their feedback while maintaining quality and personalization.

Respond in this exact JSON format:
[
  {
    "id": 1,
    "title": "Revised path name addressing their feedback (5-8 words)",
    "description": "What they'll achieve with this revised approach (25-35 words)",
    "level": "Beginner|Intermediate|Advanced",
    "duration": "4-6 weeks|6-8 weeks|8-10 weeks",
    "timeCommitment": "1hour/day|1.5hours/day|2hours/day",
    "focus": "Revised focus based on their feedback",
    "apps": ["app1", "app2"],
    "personalizedReason": "Why this revised approach addresses their feedback (25-35 words)",
    "goalConnection": "How this revised path serves their original goals (20-30 words)",
    "modules": [
      {
        "id": 1,
        "title": "Module name incorporating their revision requests",
        "description": "Learning outcomes revised based on their feedback (25-35 words)",
        "duration": "1-2 weeks",
        "difficulty": "beginner|intermediate|advanced",
        "objectives": [
          "Revised objective addressing their feedback",
          "Updated capability based on their requests",
          "Modified deliverable per their preferences"
        ],
        "practiceExercises": [
          {
            "title": "Revised exercise based on their feedback",
            "description": "Updated project incorporating their revision requests",
            "estimatedTime": "2-4 hours",
            "deliverable": "Revised output addressing their specific needs"
          }
        ]
      }
    ]
  }
]

Use these exact app names: photoshop, illustrator, premiere, indesign, lightroom, acrobat

CRITICAL: Address their specific revision request: "${revisionFeedback}" while maintaining relevance to their original goal: "${goals}"`

    try {
      console.log('🤖 AI: Generating revised learning paths based on feedback...')
      console.log(`📝 Original goals: "${goals}"`)
      console.log(`🔄 Revision request: "${revisionFeedback}"`)
      console.log(`📋 Current paths: ${currentPaths.length} paths`)
      
      const response = await sendTextMessage(
        prompt,
        LEARNING_PATH_SYSTEM_PROMPT,
        {
          max_tokens: 1500,
          temperature: 0.7
        }
      )
      console.log('✅ AI revised learning paths response received')
      console.log(`📏 Response length: ${response.length} characters`)

      try {
        // Clean the response to ensure it's valid JSON
        let cleanedResponse = response.trim()
        
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }
        
        console.log(`🧹 Cleaned response for parsing...`)
        
        const paths = JSON.parse(cleanedResponse)
        
        if (Array.isArray(paths) && paths.length > 0) {
          console.log(`🎉 SUCCESS: AI generated ${paths.length} revised learning paths!`)
          console.log(`📝 Revised paths:`, paths.map(p => ({ title: p.title, modules: p.modules?.length || 0 })))
          
          // Enhance each revised path with real Adobe content
          const enhancedPaths = await this.enhancePathsWithRealContent(paths, goals)
          console.log(`🎯 Generated ${enhancedPaths.length} revised learning paths with real Adobe content`)
          return enhancedPaths
        } else {
          console.log('⚠️ AI revised response was not a valid array, using enhanced fallback')
          const fallbackPaths = this.createRevisedFallbackPaths(revisionFeedback, goals, appsToLearn, currentPaths)
          return await this.enhancePathsWithRealContent(fallbackPaths, goals)
        }
      } catch (parseError) {
        console.error('❌ Error parsing revised learning paths JSON:', parseError)
        console.log('🔍 Raw AI response that failed to parse:', response.substring(0, 300) + '...')
        const fallbackPaths = this.createRevisedFallbackPaths(revisionFeedback, goals, appsToLearn, currentPaths)
        return await this.enhancePathsWithRealContent(fallbackPaths, goals)
      }
    } catch (error) {
      console.error('❌ Error calling Claude AI for revised learning paths:', error)
      const fallbackPaths = this.createRevisedFallbackPaths(revisionFeedback, goals, appsToLearn, currentPaths)
      return await this.enhancePathsWithRealContent(fallbackPaths, goals)
    }
  }

  /**
   * Create fallback revised learning paths when AI generation fails
   */
  private createRevisedFallbackPaths(
    revisionFeedback: string,
    goals: string,
    appsToLearn: string[],
    currentPaths: LearningPath[]
  ): LearningPath[] {
    console.log('🔧 Creating revised fallback paths based on feedback')
    
    // Analyze the revision feedback for key requests
    const lowerFeedback = revisionFeedback.toLowerCase()
    const lowerGoals = goals.toLowerCase()
    
    // Determine what the user wants changed
    const wantsMoreAdv = lowerFeedback.includes('advanced') || lowerFeedback.includes('harder') || lowerFeedback.includes('challenge')
    const wantsBeginner = lowerFeedback.includes('easier') || lowerFeedback.includes('beginner') || lowerFeedback.includes('basic')
    const wantsShorter = lowerFeedback.includes('shorter') || lowerFeedback.includes('faster') || lowerFeedback.includes('quick')
    const wantsLonger = lowerFeedback.includes('longer') || lowerFeedback.includes('more detail') || lowerFeedback.includes('comprehensive')
    const wantsDifferentApps = appsToLearn.some(app => lowerFeedback.includes(app))
    
    // Base the revised paths on the existing structured fallback system but modify based on feedback
    const revisedPaths = this.createStructuredFallbackPaths(goals, appsToLearn)
    
    // Apply revisions based on user feedback
    return revisedPaths.map((path, index) => ({
      ...path,
      id: index + 1,
      level: wantsMoreAdv ? 'Advanced' : wantsBeginner ? 'Beginner' : path.level,
      duration: wantsShorter ? '3-4 weeks' : wantsLonger ? '8-10 weeks' : path.duration,
      timeCommitment: wantsShorter ? '45min/day' : wantsLonger ? '2hours/day' : path.timeCommitment,
      title: `Revised ${path.title}`,
      description: `${path.description} Updated based on your feedback: "${revisionFeedback.substring(0, 30)}..."`,
      personalizedReason: `This revised path addresses your feedback: "${revisionFeedback.substring(0, 40)}..." while maintaining focus on your goals`,
      goalConnection: `Incorporates your revision requests while serving your original objective: "${goals.substring(0, 30)}..."`
    }))
  }

  /**
   * Enable or disable fast mode
   */
  setFastMode(enabled: boolean): void {
    this.fastMode = enabled;
    console.log(`🏃 Fast mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Clear the learning path cache
   */
  clearCache(): void {
    this.pathCache.clear();
    console.log('🧹 Learning path cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.pathCache.size,
      keys: Array.from(this.pathCache.keys())
    };
  }

  /**
   * Reset the conversation
   */
  reset(): void {
    this.context = {
      conversation: [],
      userProfile: {
        selectedApps: [],
        goals: '',
      },
      currentStep: 'welcome'
    };
  }

  /**
   * Get current context (for debugging)
   */
  getContext(): LearningAssistantContext {
    return { ...this.context };
  }
}

// Export singleton instance
export const learningAssistant = new LearningAssistantService(); 