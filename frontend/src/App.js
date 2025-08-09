import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

const PaulFrenchBuddy = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Salut ! Je suis Paul, ton ami français. Comment ça va ?", 
      sender: 'paul',
      correction: null
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCorrection, setShowCorrection] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const messagesEndRef = useRef(null);
  const correctionTimeoutRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Avatar animation states
  const [mouthOpen, setMouthOpen] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(false);

  // Random eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 150);
    }, Math.random() * 3000 + 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text-to-Speech function
  const speakText = (text) => {
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      let mouthInterval;
      utterance.onstart = () => {
        setIsSpeaking(true);
        mouthInterval = setInterval(() => {
          setMouthOpen(prev => !prev);
        }, 120);
      };

      utterance.onend = () => {
        clearInterval(mouthInterval);
        setIsSpeaking(false);
        setMouthOpen(false);
      };

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      correction: null
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    if (correctionTimeoutRef.current) {
      clearTimeout(correctionTimeoutRef.current);
    }
    setShowCorrection(null);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();
      
      const paulMessage = {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'paul',
        correction: data.correction
      };

      setMessages(prev => [...prev, paulMessage]);
      
      if (data.correction && data.correction !== "Aucune correction nécessaire.") {
        setShowCorrection(data.correction);
        correctionTimeoutRef.current = setTimeout(() => {
          setShowCorrection(null);
        }, 5000);
      }

      speakText(data.reply);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Désolé, j'ai un problème de connexion. Vérifie que le serveur est en marche !",
        sender: 'paul',
        correction: null
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setMouthOpen(false);
    }
    setIsMuted(!isMuted);
  };

  // Enhanced Avatar Component with inline styles
  const Avatar = () => (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Glow effect when speaking */}
      <div style={{
        position: 'absolute',
        inset: '0',
        borderRadius: '50%',
        boxShadow: isSpeaking 
          ? '0 0 40px rgba(59, 130, 246, 0.8)' 
          : '0 0 20px rgba(59, 130, 246, 0.3)',
        transform: isSpeaking ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s ease'
      }}></div>
      
      {/* Main avatar container */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        overflow: 'hidden',
        transform: isSpeaking ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease',
        border: '4px solid #3b82f6'
      }}>
        
        {/* Background */}
        <div style={{
          position: 'absolute',
          inset: '0',
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
          animation: isSpeaking ? 'pulse 1s infinite' : 'none'
        }}></div>
        
        {/* Face container */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          bottom: '8px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          
          {/* Hair */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70px',
            height: '25px',
            background: 'linear-gradient(to bottom, #92400e, #b45309)',
            borderRadius: '50px 50px 20px 20px'
          }}></div>
          
          {/* Eyes container */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '8px',
            marginTop: '20px'
          }}>
            {/* Left eye */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '16px',
                height: eyeBlink ? '2px' : '16px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}>
                {!eyeBlink && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    background: '#1e40af',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    paddingLeft: '2px',
                    paddingTop: '2px'
                  }}>
                    <div style={{
                      width: '3px',
                      height: '3px',
                      background: 'white',
                      borderRadius: '50%'
                    }}></div>
                  </div>
                )}
              </div>
              {/* Eyebrow */}
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '0',
                width: '16px',
                height: '2px',
                background: '#92400e',
                borderRadius: '2px'
              }}></div>
            </div>
            
            {/* Right eye */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '16px',
                height: eyeBlink ? '2px' : '16px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}>
                {!eyeBlink && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    background: '#1e40af',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    paddingLeft: '2px',
                    paddingTop: '2px'
                  }}>
                    <div style={{
                      width: '3px',
                      height: '3px',
                      background: 'white',
                      borderRadius: '50%'
                    }}></div>
                  </div>
                )}
              </div>
              {/* Eyebrow */}
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '0',
                width: '16px',
                height: '2px',
                background: '#92400e',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>
          
          {/* Nose */}
          <div style={{
            width: '6px',
            height: '8px',
            background: '#f59e0b',
            borderRadius: '50%',
            marginBottom: '4px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}></div>
          
          {/* Mouth */}
          <div style={{
            width: mouthOpen ? '24px' : '24px',
            height: mouthOpen ? '16px' : '4px',
            background: mouthOpen ? '#7f1d1d' : '#dc2626',
            borderRadius: '50%',
            transition: 'all 0.15s ease',
            boxShadow: mouthOpen ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {mouthOpen && (
              <div style={{
                width: '12px',
                height: '6px',
                background: 'linear-gradient(to bottom, #fda4af, #f472b6)',
                borderRadius: '50%'
              }}></div>
            )}
          </div>
          
          {/* Cheeks */}
          <div style={{
            position: 'absolute',
            top: '32px',
            left: '8px',
            width: '12px',
            height: '12px',
            background: '#fda4af',
            borderRadius: '50%',
            opacity: 0.6
          }}></div>
          <div style={{
            position: 'absolute',
            top: '32px',
            right: '8px',
            width: '12px',
            height: '12px',
            background: '#fda4af',
            borderRadius: '50%',
            opacity: 0.6
          }}></div>
        </div>
      </div>

      {/* Status indicators */}
      {isSpeaking && (
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          right: '-8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            animation: 'bounce 0.6s infinite'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            animation: 'bounce 0.6s infinite 0.1s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            animation: 'bounce 0.6s infinite 0.2s'
          }}></div>
        </div>
      )}
      
      {isListening && (
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          left: '-8px',
          width: '24px',
          height: '24px',
          background: '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1s infinite'
        }}>
          <Mic style={{ width: '12px', height: '12px', color: 'white' }} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #1e1b4b 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px'
    }}>
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
            padding: '32px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
              }}>
                <Avatar />
                <div>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    Paul – Ton Ami Français
                  </h1>
                  <p style={{
                    color: '#c7d2fe',
                    fontSize: '18px',
                    margin: 0,
                    marginBottom: '8px'
                  }}>Parle avec moi en français ! 🇫🇷</p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#10b981',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      <span style={{
                        fontSize: '14px',
                        color: '#c7d2fe'
                      }}>En ligne</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mute button */}
              <button
                onClick={toggleMute}
                style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{
            height: '400px',
            overflowY: 'auto',
            padding: '24px',
            background: 'linear-gradient(to bottom, rgba(249, 250, 251, 0.5), rgba(255, 255, 255, 0.5))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeIn 0.3s ease-out',
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'backwards'
                }}
              >
                <div
                  style={{
                    maxWidth: '320px',
                    padding: '16px 20px',
                    borderRadius: '20px',
                    ...(message.sender === 'user' ? {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      color: 'white',
                      borderBottomRightRadius: '6px',
                      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                    } : {
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#374151',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      borderBottomLeftRadius: '6px',
                      border: '1px solid rgba(229, 231, 235, 0.5)'
                    }),
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = message.sender === 'user' 
                      ? '0 20px 40px -10px rgba(59, 130, 246, 0.5)'
                      : '0 20px 40px -10px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = message.sender === 'user'
                      ? '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                      : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <p style={{ 
                    margin: 0, 
                    lineHeight: '1.6',
                    fontSize: '16px'
                  }}>
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '16px 20px',
                  borderRadius: '20px',
                  borderBottomLeftRadius: '6px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '50%',
                        animation: 'bounce 0.6s infinite'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '50%',
                        animation: 'bounce 0.6s infinite 0.1s'
                      }}></div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '50%',
                        animation: 'bounce 0.6s infinite 0.2s'
                      }}></div>
                    </div>
                    <span style={{
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>Paul réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Correction Box */}
          {showCorrection && (
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #fefbf3 0%, #fef3c7 100%)',
              borderTop: '1px solid #f59e0b'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  !
                </div>
                <div style={{ color: '#92400e' }}>
                  <span style={{ fontWeight: '600' }}>Correction: </span>
                  <span style={{ fontStyle: 'italic' }}>{showCorrection}</span>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
            borderTop: '1px solid rgba(229, 231, 235, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Voice Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: isListening 
                    ? 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)'
                    : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: isListening ? 'white' : '#6b7280',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  animation: isListening ? 'pulse 1s infinite' : 'none'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* Text Input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écris ou parle en français..."
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    paddingRight: '48px',
                    border: '2px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '16px',
                    outline: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#374151',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(229, 231, 235, 0.5)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                />
                {inputText && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}></div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                style={{
                  padding: '16px',
                  background: (!inputText.trim() || isLoading) 
                    ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: (!inputText.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: (!inputText.trim() || isLoading) 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    : '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                }}
                onMouseOver={(e) => {
                  if (!(!inputText.trim() || isLoading)) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 20px 40px -10px rgba(59, 130, 246, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = (!inputText.trim() || isLoading) 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    : '0 10px 25px -5px rgba(59, 130, 246, 0.4)';
                }}
              >
                <Send size={24} />
              </button>
            </div>

            {/* Status indicators */}
            <div style={{
              marginTop: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '24px',
                fontSize: '14px'
              }}>
                {isListening && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#dc2626',
                    animation: 'pulse 1s infinite'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#dc2626',
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ fontWeight: '500' }}>Écoute en cours...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#059669'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '2px'
                    }}>
                      <div style={{
                        width: '3px',
                        height: '16px',
                        background: '#059669',
                        borderRadius: '2px',
                        animation: 'pulse 1s infinite'
                      }}></div>
                      <div style={{
                        width: '3px',
                        height: '16px',
                        background: '#059669',
                        borderRadius: '2px',
                        animation: 'pulse 1s infinite 0.1s'
                      }}></div>
                      <div style={{
                        width: '3px',
                        height: '16px',
                        background: '#059669',
                        borderRadius: '2px',
                        animation: 'pulse 1s infinite 0.2s'
                      }}></div>
                    </div>
                    <span style={{ fontWeight: '500' }}>Paul parle...</span>
                  </div>
                )}
                {isLoading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#2563eb'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #2563eb',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontWeight: '500' }}>Paul réfléchit...</span>
                  </div>
                )}
                {!isListening && !isSpeaking && !isLoading && (
                  <div style={{ color: '#6b7280' }}>Prêt à discuter !</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 100% { 
            transform: translateY(0); 
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1); 
          }
          50% { 
            transform: translateY(-25%); 
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaulFrenchBuddy;