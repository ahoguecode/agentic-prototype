import React, { useState, useEffect } from 'react';
import { LearningPath, LearningModule } from '../services/learningAssistant/learningAssistantService';
import './LearningPathDetail.css';

interface LearningPathDetailProps {
  path: LearningPath;
  onBack: () => void;
}

interface EmbeddedResource {
  title: string;
  url: string;
  summary: string;
  duration?: string;
  type?: string;
  sections?: string[];
  steps?: string[];
  prerequisites?: string[];
  keyAdvice?: string[];
  tags?: string[];
  embedUrl?: string;
  source: 'learn' | 'help' | 'community';
}

const LearningPathDetail: React.FC<LearningPathDetailProps> = ({ path, onBack }) => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0])); // First module expanded by default
  const [loadingResources, setLoadingResources] = useState<boolean>(true);
  const [embeddedResources, setEmbeddedResources] = useState<{ [moduleIndex: number]: EmbeddedResource[] }>({});

  useEffect(() => {
    loadEmbeddedResources();
  }, [path]);

  const loadEmbeddedResources = async () => {
    setLoadingResources(true);
    const resourcesMap: { [moduleIndex: number]: EmbeddedResource[] } = {};

    try {
      console.log('🔍 Loading resources for path:', path.title);
      console.log('📚 Path modules:', path.modules);
      
      // Load resources for each module
      for (let i = 0; i < path.modules.length; i++) {
        const module = path.modules[i];
        console.log(`📖 Processing module ${i}:`, module.title, module.resources);
        const moduleResources: EmbeddedResource[] = [];

        // Process Adobe Learn tutorials
        if (module.resources?.adobeLearnTutorials) {
          module.resources.adobeLearnTutorials.forEach(tutorial => {
            moduleResources.push({
              ...tutorial,
              source: 'learn' as const
            });
          });
        }

        // Process Adobe Help articles
        if (module.resources?.adobeHelpArticles) {
          module.resources.adobeHelpArticles.forEach(article => {
            moduleResources.push({
              ...article,
              source: 'help' as const
            });
          });
        }

        // Process Community inspiration
        if (module.resources?.communityInspiration) {
          module.resources.communityInspiration.forEach(inspiration => {
            moduleResources.push({
              title: inspiration.title,
              url: inspiration.url,
              summary: inspiration.summary,
              source: 'community' as const,
              keyAdvice: [] // Will be populated with extracted advice
            });
          });
        }

        resourcesMap[i] = moduleResources;
        console.log(`✅ Module ${i} loaded ${moduleResources.length} resources:`, moduleResources);
      }

      console.log('🎯 Final resources map:', resourcesMap);
      setEmbeddedResources(resourcesMap);
    } catch (error) {
      console.error('Error loading embedded resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const toggleModule = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  const renderResource = (resource: EmbeddedResource, index: number) => {
    return (
      <div key={index} className={`embedded-resource ${resource.source}`}>
        <div className="resource-header">
          <div className="resource-badge">
            {resource.source === 'learn' && '📚 Adobe Learn'}
            {resource.source === 'help' && '📖 Adobe Help'}
            {resource.source === 'community' && '💡 Community'}
          </div>
          {resource.duration && <span className="resource-duration">{resource.duration}</span>}
          {resource.type && <span className="resource-type">{resource.type}</span>}
        </div>
        
        <h4 className="resource-title">
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            {resource.title}
          </a>
        </h4>
        
        <p className="resource-summary">{resource.summary}</p>

        {resource.prerequisites && resource.prerequisites.length > 0 && (
          <div className="resource-section">
            <h5>Prerequisites</h5>
            <ul>
              {resource.prerequisites.slice(0, 3).map((prereq, i) => (
                <li key={i}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        {resource.steps && resource.steps.length > 0 && (
          <div className="resource-section">
            <h5>Key Steps</h5>
            <ol className="resource-steps">
              {resource.steps.slice(0, 5).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
              {resource.steps.length > 5 && (
                <li className="more-indicator">... and {resource.steps.length - 5} more steps</li>
              )}
            </ol>
          </div>
        )}

        {resource.keyAdvice && resource.keyAdvice.length > 0 && (
          <div className="resource-section">
            <h5>Key Tips</h5>
            <ul className="resource-advice">
              {resource.keyAdvice.slice(0, 3).map((advice, i) => (
                <li key={i}>💡 {advice}</li>
              ))}
            </ul>
          </div>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <div className="resource-tags">
            {resource.tags.slice(0, 5).map((tag, i) => (
              <span key={i} className="resource-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="resource-actions">
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-link">
            Open Resource →
          </a>
          {resource.embedUrl && resource.embedUrl !== resource.url && (
            <button className="embed-btn" onClick={() => window.open(resource.embedUrl, '_blank')}>
              View Embedded
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="learning-path-detail">
      <div className="path-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Learning Paths
        </button>
        <div className="path-info">
          <h1>{path.title}</h1>
          <p className="path-description">{path.description}</p>
          <div className="path-meta">
            <span className="path-apps">
              Apps: {path.apps.map(app => app.charAt(0).toUpperCase() + app.slice(1)).join(', ')}
            </span>
            <span className="path-modules">
              {path.modules.length} Modules
            </span>
          </div>
          <div className="goal-connection">
            <h3>How this connects to your goals:</h3>
            <p>{path.goalConnection}</p>
          </div>
        </div>
      </div>

      <div className="modules-container">
        {path.modules.map((module, moduleIndex) => (
          <div key={moduleIndex} className={`learning-module ${expandedModules.has(moduleIndex) ? 'expanded' : ''}`}>
            <div className="module-header" onClick={() => toggleModule(moduleIndex)}>
              <h2>
                <span className="module-number">{moduleIndex + 1}</span>
                {module.title}
              </h2>
              <div className="module-meta">
                <span className="module-difficulty">{module.difficulty}</span>
                <span className="toggle-icon">{expandedModules.has(moduleIndex) ? '−' : '+'}</span>
              </div>
            </div>

            {expandedModules.has(moduleIndex) && (
              <div className="module-content">
                <p className="module-description">{module.description}</p>
                
                {module.objectives && module.objectives.length > 0 && (
                  <div className="module-section">
                    <h3>Learning Objectives</h3>
                    <ul className="objectives-list">
                      {module.objectives.map((objective, i) => (
                        <li key={i}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="module-section">
                  <h3>Resources & Tutorials</h3>
                  {loadingResources ? (
                    <div className="loading-resources">
                      <div className="loading-spinner"></div>
                      <p>Loading curated Adobe resources...</p>
                    </div>
                  ) : embeddedResources[moduleIndex] && embeddedResources[moduleIndex].length > 0 ? (
                    <div className="resources-grid">
                      {embeddedResources[moduleIndex].map((resource, i) => renderResource(resource, i))}
                    </div>
                  ) : (
                    <div className="no-resources">
                      <p>No specific resources found for this module. Check back as we continue to enhance our content library.</p>
                    </div>
                  )}
                </div>

                {module.practiceExercises && module.practiceExercises.length > 0 && (
                  <div className="module-section">
                    <h3>Practice Exercises</h3>
                    <div className="practice-list">
                      {module.practiceExercises.map((exercise, i) => (
                        <div key={i} className="practice-exercise">
                          <h4>{exercise.title}</h4>
                          <p>{exercise.description}</p>
                          <div className="exercise-meta">
                            <span className="exercise-time">⏱️ {exercise.estimatedTime}</span>
                            <span className="exercise-deliverable">📋 {exercise.deliverable}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningPathDetail; 