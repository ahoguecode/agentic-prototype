import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import './ConversationalInterface.css'
import LearningPathDetail from './LearningPathDetail'
import { learningAssistant, LearningPath } from '../services/learningAssistant'

// Adobe Apps for skill assessment
const adobeApps = [
  { id: 'photoshop', name: 'Photoshop', icon: '🎨' },
  { id: 'illustrator', name: 'Illustrator', icon: '📐' },
  { id: 'premiere', name: 'Premiere Pro', icon: '🎬' },
  { id: 'indesign', name: 'InDesign', icon: '📄' },
  { id: 'lightroom', name: 'Lightroom', icon: '📸' },
  { id: 'acrobat', name: 'Acrobat', icon: '📋' }
]

// Learning goal suggestions
const goalSuggestions = [
  "Photo editing for social media",
  "Logo design and branding a new business", 
  "Getting started with digital illustration in Illustrator",
  "Video editing basics"
]

// Types
interface Step {
  type: string;
  content: any;
}

interface Predictions {
  confident: string[];
  needHelp: string[];
}

function StepContainer({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
  return (
    <div className={`step-container ${isVisible ? 'visible' : 'hidden'}`}>
      {children}
    </div>
  )
}

function AppPredictionStep({ predictions, apps, onConfirm, onManualSelect, title, subtitle }: {
  predictions: Predictions;
  apps: typeof adobeApps;
  onConfirm: () => void;
  onManualSelect: () => void;
  title?: string;
  subtitle?: string;
}) {
  const getAppById = (id: string) => apps.find(app => app.id === id)
  
  return (
    <div className="action-step app-prediction-step">
      <div className="step-header">
        <h2>{title || "Based on your goals, these are the apps you should focus on most:"}</h2>
        <p>{subtitle || "Let me know if this looks accurate"}</p>
      </div>
      <div className="step-body">
        <div className="prediction-sections">
          <div className="prediction-section help-section">
            <div className="predicted-apps">
              {[...new Set(predictions.needHelp)].map(appId => {
                const app = getAppById(appId)
                return app ? (
                  <div key={`prediction-${appId}`} className="predicted-app need-help">
                    <div className="app-icon">{app.icon}</div>
                    <div className="app-name">{app.name}</div>
                  </div>
                ) : null
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="step-actions">
        <button className="continue-btn" onClick={onConfirm}>
          Yes, let's do it!
        </button>
        <button className="secondary-btn" onClick={onManualSelect}>
          Let me choose manually
        </button>
      </div>
    </div>
  )
}

function SkillAssessmentStep({ apps, selectedApps, onAppToggle, onContinue, title, subtitle }: {
  apps: typeof adobeApps;
  selectedApps: string[];
  onAppToggle: (appId: string) => void;
  onContinue: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="action-step skill-assessment-step">
      <div className="step-header">
        <h2>{title || "What Adobe apps have you used previously?"}</h2>
        <p>{subtitle || "Select any apps you feel confident in"}</p>
      </div>
      <div className="step-body">
        <div className="adobe-apps-grid">
          {apps.map(app => (
            <div 
              key={app.id}
              className={`adobe-app-card ${selectedApps.includes(app.id) ? 'selected' : ''}`}
              onClick={() => onAppToggle(app.id)}
            >
              <div className="app-icon">{app.icon}</div>
              <div className="app-name">{app.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="step-actions">
        <button className="continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}

function GoalInputStep({ goalSuggestions, onSubmit, title, subtitle }: {
  goalSuggestions: string[];
  onSubmit: (goal: { text: string; files?: File[] }) => void;
  title?: string;
  subtitle?: string;
}) {
  const [inputValue, setInputValue] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isListening, setIsListening] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setHasContent(inputValue.trim().length > 0 || selectedFiles.length > 0)
  }, [inputValue, selectedFiles])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setVoiceError(null)
          console.log('Voice recognition started')
        }
        
        recognition.onresult = (event: any) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          
          if (event.results[event.results.length - 1].isFinal) {
            // Final result - append to existing text with proper spacing
            const currentText = inputValue.trim()
            const newText = currentText ? `${currentText} ${transcript.trim()}` : transcript.trim()
            setInputValue(newText)
            setIsListening(false)
          } else {
            // Interim result - temporarily show what's being said
            const currentText = inputValue.trim()
            const tempText = currentText ? `${currentText} ${transcript.trim()}` : transcript.trim()
            setInputValue(tempText)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          switch (event.error) {
            case 'no-speech':
              setVoiceError('No speech detected. Please try again.')
              break
            case 'network':
              setVoiceError('Network error. Please check your connection.')
              break
            case 'not-allowed':
              setVoiceError('Microphone access denied. Please allow microphone permissions.')
              break
            default:
              setVoiceError('Voice recognition error. Please try again.')
          }
          
          // Clear error after 3 seconds
          setTimeout(() => setVoiceError(null), 3000)
        }
        
        recognition.onend = () => {
          console.log('Voice recognition ended')
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      } else {
        console.warn('Speech recognition not supported in this browser')
        setVoiceError('Voice input not supported in this browser')
      }
    }
  }, [])

  const handleSubmit = () => {
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSubmit({
        text: inputValue.trim(),
        files: selectedFiles.length > 0 ? selectedFiles : undefined
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      setVoiceError('Voice input not available')
      return
    }

    if (isListening) {
      // Stop listening
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      // Start listening
      try {
        setVoiceError(null)
        setIsListening(true)
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start voice recognition:', error)
        setVoiceError('Failed to start voice input')
        setIsListening(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && hasContent) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="action-step goal-input-step">
      <div className="step-header">
        <h1>{title || "What do you want to learn?"}</h1>
        <p>{subtitle || "Describe what you want to learn, upload a project you're working on, or share your goals. I'll guide you with tailored tutorials, community resources, and inspiration from real creators."}</p>
      </div>
      
      <div className="step-body">
        <div className="modern-input-container">
          {/* Main textarea input */}
          <div className="input-wrapper">
            <textarea
              className="modern-goal-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your learning goals"
              rows={3}
            />
          </div>
          
          {/* Action buttons below */}
          <div className="input-actions-row">
            <div className="input-actions-left">
              <button
                className="input-action-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Add files"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              <button
                className={`input-action-btn voice-btn ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceInput}
                title={isListening ? "Stop voice input" : "Start voice input"}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1C8.5 1 7 2.5 7 4V10C7 11.5 8.5 13 10 13C11.5 13 13 11.5 13 10V4C13 2.5 11.5 1 10 1Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 8V10C16 13.866 12.866 17 9 17H11C7.134 17 4 13.866 4 10V8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 17V19M6 19H14" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {isListening && <div className="listening-indicator">●</div>}
              </button>
            </div>
            
            <button
              className={`send-action-btn ${hasContent ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={!hasContent}
              title="Send"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18 2L9 11L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 2L12 18L9 11L2 8L18 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.psd,.ai,.indd"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Suggestion chips */}
        <div className="modern-suggestions">
          {goalSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="modern-suggestion-chip"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="chip-icon">💡</span>
              {suggestion}
            </button>
          ))}
        </div>

                  {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files:</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  📄 {file.name}
                </div>
              ))}
            </div>
          )}

          {voiceError && (
            <div className="voice-error">
              ⚠️ {voiceError}
            </div>
          )}

          {isListening && (
            <div className="voice-status">
              🎤 Listening... Speak now
            </div>
          )}
      </div>
      
      <div className="step-actions">
        <button 
          className="modern-continue-btn"
          onClick={handleSubmit}
          disabled={!hasContent}
        >
          Continue
        </button>
      </div>
      
      {/* Disclaimer */}
      <div className="disclaimer">
        AI responses may be inaccurate. Check answers and sources. <a href="#" className="terms-link">Terms</a>
      </div>
    </div>
  )
}

function WelcomeStep({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="action-step welcome-step">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome! Let's build your personalized learning path.</h1>
        <div className="welcome-description">
          <p className="welcome-message">I’m your Adobe creative learning assistant, here to help you grow your career skills and 
            master the Adobe tools that bring your ideas to life.</p>
        </div>
        <div className="welcome-actions">
          <button className="get-started-btn" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}

// Source indicator component
function SourceBadge({ source }: { source: string }) {
  const getSourceDisplay = (source: string) => {
    switch (source) {
      case 'adobe-official': return { text: 'Adobe Official', className: 'source-official' }
      case 'youtube-adobe': return { text: 'Adobe YouTube', className: 'source-youtube' }
      case 'adobe-community': return { text: 'Adobe Community', className: 'source-community' }
      default: return { text: 'External', className: 'source-external' }
    }
  }

  const { text, className } = getSourceDisplay(source)
  return <span className={`source-badge ${className}`}>{text}</span>
}

// Enhanced LearningPathsStep with tutorial resources
function LearningPathsStep({ paths, onPathSelect, onRevise, title, subtitle }: {
  paths: LearningPath[];
  onPathSelect: (pathId: number) => void;
  onRevise: () => void;
  title?: string;
  subtitle?: string;
}) {
  const getAppIcon = (appId: string) => {
    const app = adobeApps.find(app => app.id === appId);
    return app ? app.icon : '🎯';
  };

  const handlePathSelect = (pathId: number) => {
    console.log('🎯 Selected learning path:', pathId)
    onPathSelect(pathId)
  }

  return (
    <div className="action-step learning-paths-step">
      <div className="step-header">
        <h2>{title || "Your Personalized Learning Paths"}</h2>
        <p>{subtitle || "Select a path to begin."}</p>
      </div>
      <div className="step-body">
        <div className="learning-paths">
          {paths.map(path => (
            <div key={path.id} className="learning-path-card">
              <div className="path-header">
                <h3 className="path-title">{path.title}</h3>
                <span className="path-level">{path.level}</span>
              </div>
              <p className="path-description">{path.description}</p>
              {path.focus && (
                <div className="path-focus">
                  <strong>Focus:</strong> {path.focus}
                </div>
              )}
              {path.apps && path.apps.length > 0 && (
                <div className="path-apps">
                  <strong>Adobe Apps:</strong>
                  {[...new Set(path.apps)].map((appId, index) => (
                    <span key={`path-${path.id}-app-${appId}`} className="path-app">
                      {getAppIcon(appId)} {adobeApps.find(app => app.id === appId)?.name || appId}
                      {index < [...new Set(path.apps)].length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
              {path.personalizedReason && (
                <div className="personalized-reason">
                  <em>{path.personalizedReason}</em>
                </div>
              )}

              <button 
                className="path-select-btn"
                onClick={() => handlePathSelect(path.id)}
              >
                Start This Path
              </button>
            </div>
          ))}
        </div>
        <div className="learning-paths-actions">
          <button className="revise-btn" onClick={onRevise}>
            Not what you're looking for?
          </button>
        </div>
      </div>
    </div>
  )
}

// Learning Path Detail Step - Full page for selected path with expandable modules
function LearningPathDetailStep({ path, onBack, onStartLearning }: {
  path: LearningPath;
  onBack: () => void;
  onStartLearning: () => void;
}) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([1])) // First module expanded by default
  const [activeModuleSection, setActiveModuleSection] = useState<{ [key: number]: 'overview' | 'learn' | 'help' | 'community' }>({})

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const setModuleSection = (moduleId: number, section: 'overview' | 'learn' | 'help' | 'community') => {
    setActiveModuleSection(prev => ({
      ...prev,
      [moduleId]: section
    }))
  }

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="action-step learning-path-detail-step">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Learning Paths
        </button>
        <div className="path-header-content">
          <div className="path-title-section">
            <h1 className="detail-path-title">{path.title}</h1>
            <span className="detail-path-level">{path.level}</span>
          </div>
          <p className="detail-path-description">{path.description}</p>
          
          <div className="path-overview-meta">
            <div className="meta-grid">
              <div className="meta-card">
                <span className="meta-icon">⏱️</span>
                <div className="meta-content">
                  <span className="meta-label">Duration</span>
                  <span className="meta-value">{path.duration}</span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-icon">📅</span>
                <div className="meta-content">
                  <span className="meta-label">Time Commitment</span>
                  <span className="meta-value">{path.timeCommitment}</span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-icon">🎯</span>
                <div className="meta-content">
                  <span className="meta-label">Focus Area</span>
                  <span className="meta-value">{path.focus}</span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-icon">🛠️</span>
                <div className="meta-content">
                  <span className="meta-label">Apps</span>
                  <span className="meta-value">{path.apps.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {path.personalizedReason && (
            <div className="detail-personalized-reason">
              <h3>Why This Path is Perfect for You</h3>
              <p>💡 {path.personalizedReason}</p>
            </div>
          )}

          {path.goalConnection && (
            <div className="goal-connection">
              <h3>How This Advances Your Goals</h3>
              <p>🎯 {path.goalConnection}</p>
            </div>
          )}
        </div>
      </div>

      <div className="learning-modules">
        <h2>Learning Modules</h2>
        <p className="modules-intro">Complete these modules in order to master your learning path</p>
        
        {path.modules && path.modules.map((module, index) => (
          <div key={module.id} className={`learning-module ${expandedModules.has(module.id) ? 'expanded' : ''}`}>
            <div className="module-header" onClick={() => toggleModule(module.id)}>
              <div className="module-number">{index + 1}</div>
              <div className="module-title-section">
                <h3 className="module-title">{module.title}</h3>
                <p className="module-description">{module.description}</p>
                <div className="module-meta">
                  <span className="module-duration">⏱️ {module.duration}</span>
                  <span className="module-difficulty">📊 {module.difficulty}</span>
                </div>
              </div>
              <button className="module-toggle">
                {expandedModules.has(module.id) ? '▼' : '▶'}
              </button>
            </div>

            {expandedModules.has(module.id) && (
              <div className="module-content">
                {/* Module Objectives */}
                <div className="module-objectives">
                  <h4>What You'll Learn</h4>
                  <ul>
                    {module.objectives.map((objective, idx) => (
                      <li key={idx}>{objective}</li>
                    ))}
                  </ul>
                </div>

                {/* Resource Navigation */}
                <div className="module-resource-nav">
                  <button 
                    className={`resource-nav-btn ${!activeModuleSection[module.id] || activeModuleSection[module.id] === 'overview' ? 'active' : ''}`}
                    onClick={() => setModuleSection(module.id, 'overview')}
                  >
                    📋 Overview
                  </button>
                  {module.resources?.adobeLearnTutorials?.length > 0 && (
                    <button 
                      className={`resource-nav-btn ${activeModuleSection[module.id] === 'learn' ? 'active' : ''}`}
                      onClick={() => setModuleSection(module.id, 'learn')}
                    >
                      🎓 Adobe Learn ({module.resources.adobeLearnTutorials.length})
                    </button>
                  )}
                  {module.resources?.adobeHelpArticles?.length > 0 && (
                    <button 
                      className={`resource-nav-btn ${activeModuleSection[module.id] === 'help' ? 'active' : ''}`}
                      onClick={() => setModuleSection(module.id, 'help')}
                    >
                      📚 Adobe Help ({module.resources.adobeHelpArticles.length})
                    </button>
                  )}
                  {module.resources?.communityInspiration?.length > 0 && (
                    <button 
                      className={`resource-nav-btn ${activeModuleSection[module.id] === 'community' ? 'active' : ''}`}
                      onClick={() => setModuleSection(module.id, 'community')}
                    >
                      ✨ Inspiration ({module.resources.communityInspiration.length})
                    </button>
                  )}
                </div>

                {/* Resource Content */}
                <div className="module-resource-content">
                  {(!activeModuleSection[module.id] || activeModuleSection[module.id] === 'overview') && (
                    <div className="module-overview">
                      <h4>Practice Exercises</h4>
                      <div className="practice-exercises">
                        {module.practiceExercises.map((exercise, idx) => (
                          <div key={idx} className="practice-exercise">
                            <h5>{exercise.title}</h5>
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

                  {activeModuleSection[module.id] === 'learn' && module.resources?.adobeLearnTutorials && (
                    <div className="adobe-learn-section">
                      <h4>Official Adobe Learn Tutorials</h4>
                      <p className="section-description">Comprehensive tutorials from Adobe's official learning platform</p>
                      <div className="resource-list">
                        {module.resources.adobeLearnTutorials.map((tutorial, idx) => (
                          <div key={idx} className="resource-item learn-item">
                            <div className="resource-header">
                              <h5>{tutorial.title}</h5>
                              <div className="resource-badges">
                                <span className="resource-type">{tutorial.type}</span>
                                <span className="resource-duration">{tutorial.duration}</span>
                              </div>
                            </div>
                            <p className="resource-summary">{tutorial.summary}</p>
                            <button className="resource-link" onClick={() => openLink(tutorial.url)}>
                              🎓 Start Tutorial
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeModuleSection[module.id] === 'help' && module.resources?.adobeHelpArticles && (
                    <div className="adobe-help-section">
                      <h4>Adobe Help Documentation</h4>
                      <p className="section-description">In-depth guides and documentation from Adobe Support</p>
                      <div className="resource-list">
                        {module.resources.adobeHelpArticles.map((article, idx) => (
                          <div key={idx} className="resource-item help-item">
                            <div className="resource-header">
                              <h5>{article.title}</h5>
                            </div>
                            <p className="resource-summary">{article.summary}</p>
                            <p className="resource-relevance"><em>{article.relevance}</em></p>
                            <button className="resource-link" onClick={() => openLink(article.url)}>
                              📚 Read Guide
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeModuleSection[module.id] === 'community' && module.resources?.communityInspiration && (
                    <div className="community-section">
                      <h4>Community Inspiration</h4>
                      <p className="section-description">Real projects and discussions from the Adobe creative community</p>
                      <div className="resource-list">
                        {module.resources.communityInspiration.map((inspiration, idx) => (
                          <div key={idx} className="resource-item community-item">
                            <div className="resource-header">
                              <h5>{inspiration.title}</h5>
                              <div className="resource-badges">
                                <span className="inspiration-type">{inspiration.inspirationType}</span>
                                <span className="creator-name">by {inspiration.creator}</span>
                              </div>
                            </div>
                            <p className="resource-summary">{inspiration.summary}</p>
                            <button className="resource-link" onClick={() => openLink(inspiration.url)}>
                              ✨ View Inspiration
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="detail-actions">
        <button className="start-learning-btn" onClick={onStartLearning}>
          🚀 Start Learning This Path
        </button>
      </div>
    </div>
  )
}

// Revision Input Step - Allows users to specify how to revise their learning plan
function RevisionInputStep({ onSubmit, onBack, currentPaths }: {
  onSubmit: (revisionInput: string) => void;
  onBack: () => void;
  currentPaths: LearningPath[];
}) {
  const [revisionInput, setRevisionInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!revisionInput.trim()) return
    
    setIsSubmitting(true)
    await onSubmit(revisionInput.trim())
    setIsSubmitting(false)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="action-step revision-input-step">
      <div className="step-header">
        <h2>How can I revise your learning plan?</h2>
        <p>Tell me what you'd like to change about your current learning paths, and I'll create an updated plan that better fits your needs.</p>
      </div>

      <div className="current-paths-summary">
        <h3>Your Current Learning Paths:</h3>
        <div className="paths-summary-list">
          {currentPaths.map((path, index) => (
            <div key={path.id} className="path-summary-item">
              <span className="path-number">{index + 1}</span>
              <div className="path-summary-content">
                <h4>{path.title}</h4>
                <p>{path.description}</p>
                <div className="path-summary-meta">
                  <span>📊 {path.level}</span>
                  <span>⏱️ {path.duration}</span>
                  <span>🎯 {path.focus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="revision-input-section">
        <h3>What would you like me to change?</h3>
        <div className="revision-suggestions">
          <p>For example, you might want to:</p>
          <ul>
            <li>Focus more on specific Adobe apps</li>
            <li>Adjust the difficulty level or duration</li>
            <li>Emphasize different aspects of your goals</li>
            <li>Include different types of projects or exercises</li>
            <li>Change the learning approach or methodology</li>
          </ul>
        </div>

        <div className="revision-input-container">
          <textarea
            value={revisionInput}
            onChange={(e) => setRevisionInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe what you'd like me to revise... (Ctrl/Cmd + Enter to submit)"
            className="revision-textarea"
            rows={6}
          />
          
          <div className="revision-actions">
            <button 
              className="back-btn" 
              onClick={onBack}
              disabled={isSubmitting}
            >
              ← Back to Learning Paths
            </button>
            <button 
              className="submit-revision-btn" 
              onClick={handleSubmit}
              disabled={!revisionInput.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating Revised Plan...' : 'Revise My Learning Plan'}
              {!isSubmitting && ' ✨'}
            </button>
          </div>
        </div>

        <div className="revision-tip">
          <p><strong>💡 Tip:</strong> Be specific about what you want changed. The more details you provide, the better I can tailor your revised learning plan.</p>
        </div>
      </div>
    </div>
  )
}

function NavigationControls({ currentStep, totalSteps, onNavigate }: {
  currentStep: number;
  totalSteps: number;
  onNavigate: (direction: 'up' | 'down') => void;
}) {
  return (
    <div className="navigation-controls">
      <button 
        className="nav-btn up"
        onClick={() => onNavigate('up')}
        disabled={currentStep === 0}
      >
        ↑
      </button>
      <div className="step-indicator">
        {currentStep + 1} / {totalSteps}
      </div>
      <button 
        className="nav-btn down"
        onClick={() => onNavigate('down')}
        disabled={currentStep === totalSteps - 1}
      >
        ↓
      </button>
    </div>
  )
}

// Loading Step - Animated loading screen with customizable message
function LoadingStep({ message, subMessage }: { 
  message?: string; 
  subMessage?: string; 
}) {
  return (
    <div className="action-step loading-step">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2 className="loading-message">
          {message || 'Analyzing your goals...'}
        </h2>
        {subMessage && (
          <p className="loading-sub-message">{subMessage}</p>
        )}
      </div>
    </div>
  )
}

// Main Component
export default function ConversationalInterface() {
  const [steps, setSteps] = useState<Step[]>([
    {
      type: 'welcome',
      content: {}
    }
  ])
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)
  const [showPathDetail, setShowPathDetail] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTimeout, setCurrentTimeout] = useState<number | null>(null)
  const [currentResolve, setCurrentResolve] = useState<(() => void) | null>(null)
  const [appPredictions, setAppPredictions] = useState<Predictions | null>(null)
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  
  // State for AI-generated titles and subtitles
  const [stepTitles, setStepTitles] = useState<{[key: string]: {title: string, subtitle: string}}>({})

  const simulateTyping = async (duration = 4000) => {
    setIsProcessing(true)
    return new Promise<void>(resolve => {
      setCurrentResolve(() => resolve)
      const timeout = setTimeout(() => {
        setIsProcessing(false)
        setCurrentTimeout(null)
        setCurrentResolve(null)
        resolve()
      }, duration)
      setCurrentTimeout(timeout)
    })
  }

  const skipTyping = () => {
    if (currentTimeout && currentResolve) {
      clearTimeout(currentTimeout)
      setCurrentTimeout(null)
      setIsProcessing(false)
      currentResolve()
      setCurrentResolve(null)
    }
  }

  const predictAppsFromGoal = (goal: string): Predictions => {
    const predictions: Predictions = { confident: [], needHelp: [] }
    const lowerGoal = goal.toLowerCase()

    // Photo editing keywords
    if (lowerGoal.includes('photo') || lowerGoal.includes('image') || lowerGoal.includes('edit') || 
        lowerGoal.includes('retouch') || lowerGoal.includes('filter') || lowerGoal.includes('social media')) {
      predictions.confident.push('photoshop')
      predictions.needHelp.push('lightroom')
    }

    // Design/Graphics keywords  
    if (lowerGoal.includes('logo') || lowerGoal.includes('brand') || lowerGoal.includes('graphic') || 
        lowerGoal.includes('vector') || lowerGoal.includes('illustration') || lowerGoal.includes('poster')) {
      predictions.confident.push('illustrator')
      predictions.needHelp.push('photoshop')
    }

    // Video keywords
    if (lowerGoal.includes('video') || lowerGoal.includes('movie') || lowerGoal.includes('film') || 
        lowerGoal.includes('edit') || lowerGoal.includes('youtube') || lowerGoal.includes('content')) {
      predictions.confident.push('premiere')
    }

    // If no specific matches, give beginner-friendly defaults
    if (predictions.confident.length === 0) {
      predictions.confident.push('photoshop')
      predictions.needHelp.push('illustrator', 'premiere')
    }

    return predictions
  }

  const addStep = (step: Step) => {
    setSteps(prev => [...prev, step])
    setCurrentStepIndex(prev => prev + 1)
  }

  const navigateToStep = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentStepIndex > 0) {
      // When going up (backwards), skip any loading steps
      let newIndex = currentStepIndex - 1
      while (newIndex >= 0 && steps[newIndex]?.type === 'loading') {
        newIndex--
      }
      if (newIndex >= 0) {
        setCurrentStepIndex(newIndex)
      }
    } else if (direction === 'down') {
      if (currentStepIndex < steps.length - 1) {
        // When going down (forwards), skip any loading steps
        let newIndex = currentStepIndex + 1
        while (newIndex < steps.length && steps[newIndex]?.type === 'loading') {
          newIndex++
        }
        if (newIndex < steps.length) {
          setCurrentStepIndex(newIndex)
        }
      }
    }
  }

  const handleAppToggle = (appId: string) => {
    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
  }

  // Generate AI title and subtitle for goal input step
  const generateGoalInputTitle = async () => {
    // Use static title instead of AI generation
    return learningAssistant.getStaticTitleSubtitle('goal-input');
  }

  const handleWelcomeContinue = async () => {
    setIsProcessing(true)
    
    try {
      // Get static title for goal input step (no AI call)
      const goalTitles = learningAssistant.getStaticTitleSubtitle('goal-input');
      setStepTitles(prev => ({ ...prev, 'goal-input': goalTitles }))
      
      addStep({
        type: 'goal-input',
        content: goalTitles
      })
    } catch (error) {
      console.error('Error in welcome continue:', error)
      addStep({
        type: 'goal-input',
        content: {}
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoalSubmit = async (goal: { text: string; files?: File[] }) => {
    // Immediately show loading step for instant feedback
    addStep({
      type: 'loading',
      content: { 
        message: 'Analyzing your goals...',
        subMessage: 'I\'m reviewing your learning objectives and determining the best Adobe apps for your journey.'
      }
    })
    
    setIsProcessing(true)
    
    try {
      // Get AI analysis and predictions (this uses AI)
      const predictions = await learningAssistant.analyzeGoalsAndPredictApps(
        goal.text || '',
        goal.files
      )
      setAppPredictions(predictions)
      
      // Use static title for prediction step (no AI call)
      const predictionTitles = learningAssistant.getStaticTitleSubtitle('app-prediction');
      setStepTitles(prev => ({ ...prev, 'app-prediction': predictionTitles }))
      
      addStep({
        type: 'app-prediction',
        content: { predictions, ...predictionTitles }
      })
    } catch (error) {
      console.error('Error analyzing goals:', error)
      const predictions = predictAppsFromGoal(goal.text || '')
      setAppPredictions(predictions)
      
      addStep({
        type: 'app-prediction',
        content: { predictions }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePredictionConfirm = async () => {
    // Immediately show loading step for instant feedback
    addStep({
      type: 'loading',
      content: { 
        message: 'Perfect! Generating your learning paths...',
        subMessage: 'Creating personalized Adobe learning journeys based on your goals and the apps we identified.'
      }
    })
    
    if (appPredictions) {
      setSelectedApps(appPredictions.confident)
      learningAssistant.updateUserProfile({ selectedApps: appPredictions.confident })
    }
    
    setIsProcessing(true)
    
    try {
      // Generate personalized learning paths based on predictions (this uses AI)
      const personalizedPaths = await learningAssistant.generatePersonalizedLearningPaths(appPredictions || undefined)
      setLearningPaths(personalizedPaths)
      
      // Use static title for learning paths after prediction (no AI call)
      const pathTitles = learningAssistant.getStaticTitleSubtitle('learning-paths-predicted', appPredictions || undefined);
      setStepTitles(prev => ({ ...prev, 'learning-paths': pathTitles }))
      
      addStep({
        type: 'learning-paths',
        content: { paths: personalizedPaths, ...pathTitles }
      })
    } catch (error) {
      console.error('Error generating learning paths:', error)
      addStep({
        type: 'learning-paths',
        content: { paths: learningPaths }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePredictionReject = async () => {
    setIsProcessing(true)
    
    try {
      // Use static title for skill assessment (no AI call)
      const skillTitles = learningAssistant.getStaticTitleSubtitle('skill-assessment');
      setStepTitles(prev => ({ ...prev, 'skill-assessment': skillTitles }))
      
      addStep({
        type: 'skill-assessment',
        content: skillTitles
      })
    } catch (error) {
      console.error('Error in skill assessment step:', error)
      addStep({
        type: 'skill-assessment',
        content: {}
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkillAssessmentContinue = async () => {
    learningAssistant.updateUserProfile({ selectedApps })
    
    // Immediately show loading step for instant feedback
    addStep({
      type: 'loading',
      content: { 
        message: 'Creating your learning paths...',
        subMessage: 'Building personalized Adobe learning journeys based on your skill selections.'
      }
    })
    
    setIsProcessing(true)
    
    try {
      // Generate personalized learning paths based on manual selection (this uses AI)
      const manualSelectionPredictions = { confident: selectedApps, needHelp: [] }
      const personalizedPaths = await learningAssistant.generatePersonalizedLearningPaths(manualSelectionPredictions)
      setLearningPaths(personalizedPaths)
      
      // Use static title for learning paths after manual selection (no AI call)
      const manualSelectionData = { confident: selectedApps, needHelp: [] }
      const pathTitles = learningAssistant.getStaticTitleSubtitle('learning-paths-manual', manualSelectionData);
      setStepTitles(prev => ({ ...prev, 'learning-paths': pathTitles }))
      
      addStep({
        type: 'learning-paths',
        content: { paths: personalizedPaths, ...pathTitles }
      })
    } catch (error) {
      console.error('Error generating learning paths:', error)
      addStep({
        type: 'learning-paths',
        content: { paths: learningPaths }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePathSelect = (pathId: number) => {
    console.log('🎯 Selected learning path:', pathId)
    const path = learningPaths.find(p => p.id === pathId)
    if (path) {
      setSelectedPath(path)
      setShowPathDetail(true)
    }
  }

  const handleBackToPathsList = () => {
    setShowPathDetail(false)
    setSelectedPath(null)
  }

  // Show detailed learning path view if selected
  if (showPathDetail && selectedPath) {
    return <LearningPathDetail path={selectedPath} onBack={handleBackToPathsList} />
  }

  const handlePathSelectOld = (pathId: number) => {
    console.log('🎯 Selected learning path:', pathId)
    const path = learningPaths.find(p => p.id === pathId)
    if (path) {
      // Show loading screen first
      addStep({
        type: 'loading',
        content: { 
          message: 'Great! Creating your personalized plan now...',
          subMessage: 'Analyzing your background and customizing your learning journey...'
        }
      })
      
      // After a brief delay, show the detailed path
      setTimeout(() => {
        setSelectedPath(path)
        addStep({
          type: 'learning-path-detail',
          content: { path }
        })
      }, 2500) // 2.5 second loading screen
    }
  }

  const handleRevise = () => {
    // Immediately show loading step for instant feedback
    addStep({
      type: 'loading',
      content: { 
        message: 'Setting up your revision workspace...',
        subMessage: 'Preparing the interface for you to customize your learning paths.'
      }
    })
    
    // After a brief moment, show the revision input
    setTimeout(() => {
      addStep({
        type: 'revision-input',
        content: { 
          currentPaths: learningPaths,
          title: 'Revise Your Learning Plan',
          subtitle: 'Tell me what you\'d like to change'
        }
      })
    }, 800) // Brief loading period for better UX
  }

  const handleRevisionSubmit = async (revisionInput: string) => {
    console.log('📝 Processing revision request:', revisionInput)
    
    // Immediately show loading step for instant feedback
    addStep({
      type: 'loading',
      content: { 
        message: 'Updating your learning paths...',
        subMessage: 'Applying your feedback and regenerating personalized learning journeys.'
      }
    })
    
    setIsProcessing(true)
    
    try {
      // Generate revised learning paths based on user feedback
      const revisedPaths = await learningAssistant.generateRevisedLearningPaths(
        revisionInput,
        learningPaths,
        appPredictions || undefined
      )
      
      setLearningPaths(revisedPaths)
      
      addStep({
        type: 'learning-paths',
        content: { 
          paths: revisedPaths, 
          title: 'Your Revised Learning Paths',
          subtitle: 'Updated based on your feedback'
        }
      })
    } catch (error) {
      console.error('Error generating revised learning paths:', error)
      addStep({
        type: 'learning-paths',
        content: { 
          paths: learningPaths,
          title: 'Learning Paths (Revision Failed)',
          subtitle: 'Unable to apply changes. Here are your original paths.'
        }
      })
    } finally {
      setIsProcessing(false)
    }
  }



  const handleStartLearning = () => {
    console.log('🚀 Starting learning journey for path:', selectedPath)
    // TODO: Implement actual learning journey start logic
    alert('Learning journey will start soon! 🎯')
  }

  const renderCurrentStep = () => {
    const currentStep = steps[currentStepIndex]
    if (!currentStep) return null

    switch (currentStep.type) {
      case 'welcome':
        return (
          <WelcomeStep onGetStarted={handleWelcomeContinue} />
        )
      case 'app-prediction':
        return (
          <AppPredictionStep
            predictions={currentStep.content.predictions}
            apps={adobeApps}
            onConfirm={handlePredictionConfirm}
            onManualSelect={handlePredictionReject}
            title={currentStep.content.title}
            subtitle={currentStep.content.subtitle}
          />
        )
      case 'skill-assessment':
        return (
          <SkillAssessmentStep
            apps={adobeApps}
            selectedApps={selectedApps}
            onAppToggle={handleAppToggle}
            onContinue={handleSkillAssessmentContinue}
            title={currentStep.content.title}
            subtitle={currentStep.content.subtitle}
          />
        )
      case 'goal-input':
        return (
          <GoalInputStep
            goalSuggestions={goalSuggestions}
            onSubmit={handleGoalSubmit}
            title={currentStep.content.title}
            subtitle={currentStep.content.subtitle}
          />
        )
      case 'learning-paths':
        return (
          <LearningPathsStep
            paths={currentStep.content.paths || learningPaths}
            onPathSelect={handlePathSelect}
            onRevise={handleRevise}
            title={currentStep.content.title}
            subtitle={currentStep.content.subtitle}
          />
        )
      case 'learning-path-detail':
        if (selectedPath) {
          return (
            <LearningPathDetailStep
                          path={selectedPath}
            onBack={handleBackToPathsList}
              onStartLearning={handleStartLearning}
            />
          )
        }
        return <div>Path not found</div>

      case 'revision-input':
        return (
          <RevisionInputStep
            currentPaths={currentStep.content.currentPaths || learningPaths}
            onSubmit={handleRevisionSubmit}
                          onBack={handleBackToPathsList}
          />
        )
      case 'loading':
        return (
          <LoadingStep 
            message={currentStep.content.message}
            subMessage={currentStep.content.subMessage}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app-container single-step">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="adobe-logo">
            <span className="logo-text">Adobe</span>
            <span className="logo-subtitle">Learning Assistant</span>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <input type="text" placeholder="Search" />
            </div>
            <div className="user-menu">
              <span className="user-avatar">👤</span>
            </div>
          </div>
        </div>
      </header>

      {/* Single Step Display */}
      <main className="step-main">
        <div className="step-viewport">
          <StepContainer isVisible={true}>
            {renderCurrentStep()}
          </StepContainer>
        </div>
      </main>

      {/* Navigation Controls */}
      <NavigationControls
        currentStep={currentStepIndex}
        totalSteps={steps.length}
        onNavigate={navigateToStep}
      />
    </div>
  )
} 