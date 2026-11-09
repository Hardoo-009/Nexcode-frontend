import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Check,
  Code2,
  Lightbulb,
  Bug,
  Zap,
} from 'lucide-react';

import axiosClient from '../utils/axiosClient';
import ChatMessage from './ai/ChatMessage';
import TypingIndicator from './ai/TypingIndicator';

const suggestions = [
  {
    label: 'Give me a hint',
    prompt:
      'Give me a small hint for solving this problem. Do not reveal the complete solution.',
    icon: Lightbulb,
  },
  {
    label: 'Analyze my code',
    prompt:
      'Analyze my current code and identify any logical mistakes or improvements.',
    icon: Bug,
  },
  {
    label: 'Optimal approach',
    prompt: 'Explain the optimal approach for solving this problem.',
    icon: Zap,
  },
];

function ChatAi({ problem, code, language, onApplyCode }) {
  const [messages, setMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  // ---- reveal state ----
  const [displayedLastText, setDisplayedLastText] = useState('');
  const chatScrollRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const targetTextRef = useRef('');
  const revealedRef = useRef('');
  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };
  const [streaming, setStreaming] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [feedback, setFeedback] = useState({});
  const requestLock = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const messageField = register('message', {
    required: true,
    minLength: 2,
  });

  // Sync the complete server response with the reveal target
  useEffect(() => {
    if (!isAtBottomRef.current) return;

    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'auto',
    });
  }, [displayedLastText]);
  // Smooth character-by-character reveal

  useEffect(() => {
    const last = chatMessages[chatMessages.length - 1];

    if (!last || last.role !== 'model') {
      targetTextRef.current = '';
      revealedRef.current = '';
      setDisplayedLastText('');
      return;
    }

    const fullText =
      last.parts?.map((part) => part.text || '').join('\n') || '';

    targetTextRef.current = fullText;
  }, [chatMessages]);

  useEffect(() => {
    let animationFrame;
    let previousTime = 0;
    let characterAccumulator = 0;

    const CHARACTERS_PER_SECOND = 18;

    const animate = (timestamp) => {
      if (!previousTime) previousTime = timestamp;

      const delta = Math.min(timestamp - previousTime, 100);
      previousTime = timestamp;

      const target = targetTextRef.current;
      const revealed = revealedRef.current;

      if (revealed.length < target.length) {
        characterAccumulator += (delta / 1000) * CHARACTERS_PER_SECOND;

        const charactersToReveal = Math.floor(characterAccumulator);

        if (charactersToReveal > 0) {
          characterAccumulator -= charactersToReveal;

          const next = target.slice(0, revealed.length + charactersToReveal);

          revealedRef.current = next;
          setDisplayedLastText(next);
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  // Send a request to the backend
  const requestAI = async (conversation) => {
    if (requestLock.current) return;

    requestLock.current = true;
    setLoading(true);
    setStreaming(true);

    let fullResponse = '';
    let assistantAdded = false;

    try {
      const starterCode =
        problem?.starterCode?.find((item) => item.language === language)
          ?.boilerplateCode || '';

      const endpoint = new URL(
        'ai/chat',
        axiosClient.defaults.baseURL,
      ).toString();

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify({
          messages: conversation,
          title: problem?.title,
          description: problem?.description,
          testCases: problem?.visibleTestCases || [],
          startCode: starterCode,
          userCode: code,
          language,
        }),
      });
      if (!response.ok) {
        let errorText = 'Something went wrong. Please try again.';

        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch {
          // Response wasn't valid JSON
        }

        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is missing.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      const assistantMessage = {
        role: 'model',
        parts: [{ text: '' }],
      };

      assistantAdded = true;

      setChatMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, {
          stream: true,
        });
        if (!chunk) continue;
        fullResponse += chunk;
        setChatMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          if (updated[lastIndex]?.role === 'model') {
            updated[lastIndex] = {
              role: 'model',
              parts: [{ text: fullResponse }],
            };
          }
          return updated;
        });
      }

      // Flush the decoder.
      const remaining = decoder.decode();

      if (remaining) {
        fullResponse += remaining;
      }

      if (!fullResponse.trim()) {
        throw new Error(
          'The server completed the stream without sending any text.',
        );
      }

      const aiMessage = {
        role: 'model',
        parts: [{ text: fullResponse }],
      };

      setMessages([...conversation, aiMessage]);

      setChatMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        if (updated[lastIndex]?.role === 'model') {
          updated[lastIndex] = aiMessage;
        }

        return updated;
      });

      console.log('Final AI response:', fullResponse);
    } catch (error) {
      console.error('AI streaming error:', error);

      if (assistantAdded) {
        setChatMessages((prev) => {
          const updated = [...prev];

          if (updated[updated.length - 1]?.role === 'model') {
            updated.pop();
          }

          return [
            ...updated,
            {
              role: 'error',
              parts: [
                {
                  text: error.message || 'Unable to connect to AI.',
                },
              ],
            },
          ];
        });
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'error',
            parts: [
              {
                text: error.message || 'Unable to connect to AI.',
              },
            ],
          },
        ]);
      }
    } finally {
      requestLock.current = false;
      setLoading(false);
      setStreaming(false);
    }
  };

  // Normal message submission
  const onSubmit = async (data) => {
    if (requestLock.current || loading) return;

    const text = data.message?.trim();

    if (!text) return;

    const userMessage = {
      role: 'user',
      parts: [{ text }],
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setChatMessages((prev) => [...prev, userMessage]);

    reset();

    await requestAI(updatedMessages);
  };

  // Suggested prompt submission
  const handleSuggestion = (prompt) => {
    if (requestLock.current || loading) return;

    setValue('message', prompt);

    // Submit on the next normal form interaction
    inputRef.current?.focus();
  };

  // Copy an entire AI response
  const copyResponse = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedMessage(index);

      setTimeout(() => {
        setCopiedMessage(null);
      }, 1800);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Regenerate the most recent AI response
  const regenerateResponse = async () => {
    if (requestLock.current || loading || messages.length < 2) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== 'model') return;

    // Remove the previous AI response from conversation history
    const previousMessages = messages.slice(0, -1);

    setMessages(previousMessages);
    setChatMessages((prev) => prev.slice(0, -1));

    await requestAI(previousMessages);
  };

  // Submit a simple rating
  const handleFeedback = (index, value) => {
    setFeedback((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const getText = (message) =>
    message.parts?.map((part) => part.text || '').join('\n') || '';

  return (
    <div className="flex flex-col h-full min-h-0 bg-base-100">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="text-primary" size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-sm">DSA Assistant</h3>

            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-xs text-base-content/50">
                {streaming
                  ? 'Generating response...'
                  : `AI powered · ${language}`}
              </span>
            </div>
          </div>
        </div>

        <div className="badge badge-ghost badge-sm">
          <Code2 size={12} className="mr-1" />
          {problem?.title || 'Current problem'}
        </div>
      </div>

      {/* CHAT CONTENT */}
      <div
        ref={chatScrollRef}
        onScroll={handleChatScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-5"
      >
        {/* WELCOME SCREEN */}
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Sparkles size={30} className="text-primary" />
            </div>

            <h2 className="text-xl font-bold mb-2">
              Hey, let's solve this together!
            </h2>

            <p className="text-sm text-base-content/50 leading-6 mb-7">
              I'm your DSA assistant. Ask questions, debug your code, explore
              optimal approaches, or get hints without spoiling the solution.
            </p>

            <div className="w-full space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/40 mb-3">
                Suggested questions
              </p>

              {suggestions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSuggestion(item.prompt)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-base-300 hover:border-primary/50 hover:bg-base-200 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon size={17} />
                    </div>

                    <span className="text-sm font-medium flex-1">
                      {item.label}
                    </span>

                    <span className="text-base-content/30 group-hover:text-primary">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        <div className="space-y-6">
          {chatMessages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isError = msg.role === 'error';
            const text = getText(msg);

            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* AVATAR */}
                <div
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${
                    isUser
                      ? 'bg-primary text-primary-content'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {isUser ? <User size={16} /> : <Bot size={17} />}
                </div>

                {/* MESSAGE */}
                <div
                  className={`min-w-0 max-w-[88%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-primary text-primary-content rounded-tr-sm'
                        : isError
                          ? 'bg-error/10 border border-error/20'
                          : 'bg-base-200/70 rounded-tl-sm'
                    }`}
                  >
                    <ChatMessage
                      message={
                        index === chatMessages.length - 1 &&
                        msg.role === 'model'
                          ? { ...msg, parts: [{ text: displayedLastText }] }
                          : msg
                      }
                      onApplyCode={onApplyCode}
                    />
                  </div>

                  {/* MESSAGE ACTIONS */}
                  {!isUser && !isError && (
                    <div className="flex items-center gap-1 mt-2 ml-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-base-content/50"
                        onClick={() => copyResponse(text, index)}
                        title="Copy response"
                      >
                        {copiedMessage === index ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}

                        {copiedMessage === index ? 'Copied' : 'Copy'}
                      </button>

                      {index === chatMessages.length - 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-base-content/50"
                          onClick={regenerateResponse}
                          disabled={loading}
                          title="Regenerate response"
                        >
                          <RefreshCw size={13} />
                          Retry
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleFeedback(index, 'up')}
                        className={`btn btn-ghost btn-xs ${
                          feedback[index] === 'up'
                            ? 'text-success'
                            : 'text-base-content/40'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFeedback(index, 'down')}
                        className={`btn btn-ghost btn-xs ${
                          feedback[index] === 'down'
                            ? 'text-error'
                            : 'text-base-content/40'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 border-t border-base-300 bg-base-100 p-3 sm:p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="relative">
          <textarea
            {...messageField}
            ref={(element) => {
              messageField.ref(element);
              inputRef.current = element;
            }}
            placeholder="Ask anything about this problem..."
            disabled={loading}
            rows={2}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="textarea textarea-bordered w-full resize-none pr-14 bg-base-200 focus:outline-none focus:border-primary rounded-xl text-sm min-h-19"
          />

          <button
            type="submit"
            disabled={loading || !!errors.message}
            className="btn btn-primary btn-sm absolute bottom-3 right-3 rounded-lg"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[10px] text-base-content/40">
            Shift + Enter for a new line
          </span>

          <span className="text-[10px] text-base-content/40">
            AI can make mistakes. Verify generated code.
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatAi;
