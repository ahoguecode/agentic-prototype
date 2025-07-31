// Backend Web Scraping Service for Adobe Sites
// This would run on your backend server (Node.js/Express)

const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Real web scraping endpoint that receives personalized user context
 */
app.post('/api/scrape-adobe-content', async (req, res) => {
  try {
    const { userGoals, targetSkill, userBackground, targetIndustry, searchTerm, moduleIndex } = req.body;
    
    console.log(`🕷️ Backend scraping for: ${userBackground} learning ${targetSkill} for ${targetIndustry}`);
    console.log(`📝 Search term: ${searchTerm}`);
    
    // Generate personalized search queries based on user context
    const searchQueries = generatePersonalizedQueries({
      userGoals,
      targetSkill, 
      userBackground,
      targetIndustry,
      searchTerm,
      moduleIndex
    });
    
    const results = [];
    
    // Scrape Adobe Experience League
    const learnResults = await scrapeAdobeLearn(searchQueries.experienceLeague);
    results.push(...learnResults);
    
    // Scrape Adobe HelpX
    const helpResults = await scrapeAdobeHelp(searchQueries.helpX);
    results.push(...helpResults);
    
    // Scrape Adobe Community
    const communityResults = await scrapeAdobeCommunity(searchQueries.community);
    results.push(...communityResults);
    
    console.log(`✅ Found ${results.length} real Adobe resources`);
    res.json({ success: true, results });
    
  } catch (error) {
    console.error('❌ Backend scraping error:', error);
    res.status(500).json({ error: 'Scraping failed', message: error.message });
  }
});

/**
 * Generate personalized search queries based on user context
 */
function generatePersonalizedQueries({ userGoals, targetSkill, userBackground, targetIndustry, moduleIndex }) {
  // Create highly specific search queries using the analyzed user context
  const baseQueries = {
    experienceLeague: [
      `"${targetSkill}" "${userBackground}" tutorial`,
      `"${targetSkill}" workflow "${targetIndustry}"`,
      `"${targetSkill}" professional "${userBackground} to ${targetSkill}"`
    ],
    helpX: [
      `"${targetSkill}" "${targetIndustry}" best practices`,
      `"${targetSkill}" setup "${userBackground}"`,
      `"${targetSkill}" troubleshooting workflow`
    ],
    community: [
      `"${targetSkill}" "${targetIndustry}" examples`,
      `"${userBackground}" career transition "${targetSkill}"`,
      `"${targetSkill}" inspiration "${targetIndustry}"`
    ]
  };
  
  // Return specific query for this module to avoid repetition
  return {
    experienceLeague: baseQueries.experienceLeague[moduleIndex % baseQueries.experienceLeague.length],
    helpX: baseQueries.helpX[moduleIndex % baseQueries.helpX.length],
    community: baseQueries.community[moduleIndex % baseQueries.community.length]
  };
}

/**
 * Scrape Adobe Experience League with real HTTP requests
 */
async function scrapeAdobeLearn(searchQuery) {
  try {
    const searchUrl = `https://experienceleague.adobe.com/search.html?q=${encodeURIComponent(searchQuery)}`;
    console.log(`🎓 Scraping Adobe Learn: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Adobe-Learning-Scraper)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    
    // Parse search results from Adobe Learn
    $('.search-result-item').each((index, element) => {
      const title = $(element).find('.result-title').text().trim();
      const url = $(element).find('.result-title a').attr('href');
      const description = $(element).find('.result-description').text().trim();
      const duration = $(element).find('.duration').text().trim() || 'Self-paced';
      
      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://experienceleague.adobe.com${url}`,
          summary: description,
          duration,
          type: 'tutorial',
          source: 'Adobe Experience League'
        });
      }
    });
    
    console.log(`✅ Adobe Learn: Found ${results.length} results`);
    return results.slice(0, 2); // Limit results
    
  } catch (error) {
    console.error('❌ Adobe Learn scraping failed:', error);
    return [];
  }
}

/**
 * Scrape Adobe HelpX with real HTTP requests
 */
async function scrapeAdobeHelp(searchQuery) {
  try {
    const searchUrl = `https://helpx.adobe.com/search.html?q=${encodeURIComponent(searchQuery)}`;
    console.log(`📚 Scraping Adobe Help: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Adobe-Help-Scraper)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    
    // Parse help articles
    $('.help-result').each((index, element) => {
      const title = $(element).find('.title').text().trim();
      const url = $(element).find('.title a').attr('href');
      const description = $(element).find('.description').text().trim();
      
      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://helpx.adobe.com${url}`,
          summary: description,
          type: 'documentation',
          source: 'Adobe HelpX'
        });
      }
    });
    
    console.log(`✅ Adobe Help: Found ${results.length} results`);
    return results.slice(0, 2);
    
  } catch (error) {
    console.error('❌ Adobe Help scraping failed:', error);
    return [];
  }
}

/**
 * Scrape Adobe Community with real HTTP requests
 */
async function scrapeAdobeCommunity(searchQuery) {
  try {
    const searchUrl = `https://community.adobe.com/search?q=${encodeURIComponent(searchQuery)}`;
    console.log(`💬 Scraping Adobe Community: ${searchUrl}`);
    
    const response = await fetch(searchUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    
    // Parse community discussions
    $('.community-post').each((index, element) => {
      const title = $(element).find('.post-title').text().trim();
      const url = $(element).find('.post-title a').attr('href');
      const description = $(element).find('.post-excerpt').text().trim();
      const author = $(element).find('.author-name').text().trim();
      
      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://community.adobe.com${url}`,
          summary: description,
          author,
          type: 'discussion',
          source: 'Adobe Community'
        });
      }
    });
    
    console.log(`✅ Adobe Community: Found ${results.length} results`);
    return results.slice(0, 2);
    
  } catch (error) {
    console.error('❌ Adobe Community scraping failed:', error);
    return [];
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Adobe scraping service running on port ${PORT}`);
});

module.exports = app; 