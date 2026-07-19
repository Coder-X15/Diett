import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const ChatPage = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am Diett, your personal AI dietician. How can I help you with your meal planning today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8080/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessages),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // The backend returns a JSON-encoded string which we parse.
            const assistantReplyContent = await response.json();
            const assistantMessage = { role: 'assistant', content: assistantReplyContent };
            setMessages(prevMessages => [...prevMessages, assistantMessage]);

        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again later.' };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={styles.chatContainer}>
            <div style={styles.messageList}>
                {messages.map((msg, index) => (
                    <div key={index} style={styles.messageWrapper(msg.role)}>
                        <div style={styles.messageBubble(msg.role)}>
                            <p style={styles.messageRole}>{msg.role === 'user' ? 'You' : 'Diett'}</p>
                            <div style={styles.messageContent}>
                                {msg.role === 'assistant'
                                    ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    : msg.content
                                }
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={styles.messageWrapper('assistant')}>
                        <div style={styles.messageBubble('assistant')}>
                            <p style={styles.messageContent}>Thinking...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputArea}>
                <textarea
                    style={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your diet, meals, or nutrition..."
                    rows="2"
                    disabled={isLoading}
                />
                <button style={styles.sendButton} onClick={handleSend} disabled={isLoading}>
                    {isLoading ? '...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    chatContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(90vh)',
        width: '100%',
        maxWidth: '800px',
        margin: '20px auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    messageList: {
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        backgroundColor: '#f9f9f9',
    },
    messageWrapper: (role) => ({
        display: 'flex',
        justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: '15px',
    }),
    messageBubble: (role) => ({
        padding: '10px 15px',
        borderRadius: '18px',
        maxWidth: '80%',
        wordWrap: 'break-word',
        backgroundColor: role === 'user' ? '#007bff' : '#e9e9eb',
        color: role === 'user' ? 'white' : 'black',
    }),
    messageRole: {
        fontWeight: 'bold',
        fontSize: '0.9em',
        marginBottom: '5px',
        margin: 0,
    },
    messageContent: {
        margin: 0,
    },
    inputArea: {
        display: 'flex',
        padding: '10px',
        borderTop: '1px solid #ddd',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        padding: '10px 15px',
        borderRadius: '20px',
        border: '1px solid #ccc',
        marginRight: '10px',
        resize: 'none',
        fontSize: '1em',
        maxHeight: '100px',
    },
    sendButton: {
        padding: '0 20px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        cursor: 'pointer',
        fontSize: '1em',
    },
};

export default ChatPage;