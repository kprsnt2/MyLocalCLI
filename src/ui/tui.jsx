// MyLocalCLI - OpenCode-style TUI (Terminal User Interface)
// Full-screen terminal application with Ink (React for CLI)

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getAgentMode, getPerformanceMode, toggleAgentMode } from '../core/modes.js';
import { colors } from './terminal.js';

// Get terminal dimensions
const getTerminalSize = () => ({
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24
});

// ASCII Art Logo
const LOGO = `
 ███╗   ███╗██╗   ██╗██╗      ██████╗  ██████╗ █████╗ ██╗      ██████╗██╗     ██╗
 ████╗ ████║╚██╗ ██╔╝██║     ██╔═══██╗██╔════╝██╔══██╗██║     ██╔════╝██║     ██║
 ██╔████╔██║ ╚████╔╝ ██║     ██║   ██║██║     ███████║██║     ██║     ██║     ██║
 ██║╚██╔╝██║  ╚██╔╝  ██║     ██║   ██║██║     ██╔══██║██║     ██║     ██║     ██║
 ██║ ╚═╝ ██║   ██║   ███████╗╚██████╔╝╚██████╗██║  ██║███████╗╚██████╗███████╗██║
 ╚═╝     ╚═╝   ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚══════╝╚═╝
`;

const LOGO_SIMPLE = `
  ╔╦╗╦ ╦╦  ╔═╗╔═╗╔═╗╦  ╔═╗╦  ╦
  ║║║╚╦╝║  ║ ║║  ╠═╣║  ║  ║  ║
  ╩ ╩ ╩ ╩═╝╚═╝╚═╝╩ ╩╩═╝╚═╝╩═╝╩
`;

// Status Bar Component
const StatusBar = ({ mode, performanceMode, model, provider, tokens, cost, showInterrupt }) => {
    const { columns } = getTerminalSize();
    const modeColor = mode === 'build' ? 'green' : 'blue';
    const perfColor = performanceMode === 'smart' ? 'magenta' : 'yellow';

    return (
        <Box
            flexDirection="row"
            justifyContent="space-between"
            width={columns - 2}
            paddingX={1}
        >
            <Box>
                {showInterrupt && (
                    <Text color="gray">
                        <Text color="cyan">●●●●●●●</Text> esc interrupt
                    </Text>
                )}
            </Box>
            <Box>
                <Text color="gray">
                    <Text bold color={modeColor}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
                    {' '}
                    <Text color="white">{model}</Text>
                    {' '}
                    <Text color={perfColor}>{performanceMode.charAt(0).toUpperCase() + performanceMode.slice(1)}</Text>
                </Text>
            </Box>
            <Box>
                <Text color="gray">
                    tab <Text color="white">switch agent</Text>
                    ctrl+p <Text color="white">commands</Text>
                </Text>
            </Box>
        </Box>
    );
};

// Input Box Component
const InputBox = ({ value, onChange, onSubmit, placeholder, mode }) => {
    const { columns } = getTerminalSize();
    const modeColor = mode === 'build' ? 'green' : 'blue';

    return (
        <Box
            flexDirection="column"
            borderStyle="single"
            borderColor="gray"
            paddingX={1}
            width={columns - 4}
        >
            <Box>
                <TextInput
                    value={value}
                    onChange={onChange}
                    onSubmit={onSubmit}
                    placeholder={placeholder || 'Ask anything... "Fix broken tests"'}
                />
            </Box>
            <Box marginTop={1}>
                <Text bold color={modeColor}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
                <Text color="gray">  {' ← current mode'}</Text>
            </Box>
        </Box>
    );
};

// Message Display Component
const MessageDisplay = ({ messages, isThinking, currentResponse, toolCalls }) => {
    const { columns, rows } = getTerminalSize();
    const displayHeight = Math.max(10, rows - 15);

    return (
        <Box
            flexDirection="column"
            height={displayHeight}
            paddingX={2}
        >
            {messages.slice(-5).map((msg, i) => (
                <Box key={i} flexDirection="column" marginBottom={1}>
                    {msg.role === 'user' ? (
                        <Text color="cyan">{'> '}{msg.content}</Text>
                    ) : (
                        <Text>{msg.content.slice(0, 500)}{msg.content.length > 500 ? '...' : ''}</Text>
                    )}
                </Box>
            ))}

            {/* Current streaming response */}
            {currentResponse && (
                <Box flexDirection="column">
                    <Text>{currentResponse}</Text>
                </Box>
            )}

            {/* Tool calls display */}
            {toolCalls.map((tool, i) => (
                <Box key={i}>
                    <Text color="yellow">✦ {tool.name}</Text>
                    <Text color="gray"> {tool.status}</Text>
                </Box>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
                <Box>
                    <Text color="yellow" italic>
                        <Spinner type="dots" /> Thinking...
                    </Text>
                </Box>
            )}
        </Box>
    );
};

// Title Bar Component  
const TitleBar = ({ title, tokens, cost }) => {
    const { columns } = getTerminalSize();

    return (
        <Box
            flexDirection="row"
            justifyContent="space-between"
            width={columns - 2}
            paddingX={1}
            borderStyle="single"
            borderColor="gray"
        >
            <Box>
                <Text color="white" bold># {title || 'New Conversation'}</Text>
                <Text color="gray">  /share copy link</Text>
            </Box>
            <Box>
                <Text color="gray">
                    {tokens.toLocaleString()} {' '}
                    <Text color="green">{((tokens / 200000) * 100).toFixed(0)}%</Text>
                    {' '}
                    <Text color="gray">(${cost.toFixed(4)})</Text>
                </Text>
            </Box>
        </Box>
    );
};

// Welcome Screen Component
const WelcomeScreen = ({ onStart }) => {
    const [input, setInput] = useState('');
    const mode = getAgentMode();
    const perfMode = getPerformanceMode();
    const { columns, rows } = getTerminalSize();

    useInput((inputChar, key) => {
        if (key.tab) {
            toggleAgentMode();
        }
    });

    return (
        <Box
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height={rows - 2}
        >
            {/* Logo */}
            <Box marginBottom={2}>
                <Text color="cyan">{LOGO_SIMPLE}</Text>
            </Box>

            {/* Input Box */}
            <InputBox
                value={input}
                onChange={setInput}
                onSubmit={(val) => onStart(val)}
                placeholder='Ask anything... "Fix broken tests"'
                mode={mode.name}
            />

            {/* Status Bar */}
            <Box marginTop={2}>
                <StatusBar
                    mode={mode.name}
                    performanceMode={perfMode.name}
                    model="Local LLM"
                    provider="LM Studio"
                    tokens={0}
                    cost={0}
                    showInterrupt={false}
                />
            </Box>

            {/* Version */}
            <Box position="absolute" bottom={0} right={0}>
                <Text color="gray">3.3.0</Text>
            </Box>
        </Box>
    );
};

// Main Chat Screen Component
const ChatScreen = ({ initialMessage, provider, onExit }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');
    const [toolCalls, setToolCalls] = useState([]);
    const [tokens, setTokens] = useState(0);
    const [title, setTitle] = useState('');

    const mode = getAgentMode();
    const perfMode = getPerformanceMode();
    const { exit } = useApp();

    useInput((inputChar, key) => {
        if (key.escape) {
            // Interrupt current operation
            setIsThinking(false);
        }
        if (key.tab) {
            toggleAgentMode();
        }
        if (key.ctrl && inputChar === 'c') {
            onExit();
            exit();
        }
    });

    // Handle initial message
    useEffect(() => {
        if (initialMessage) {
            handleSubmit(initialMessage);
        }
    }, []);

    const handleSubmit = async (message) => {
        if (!message.trim()) return;

        // Add user message
        const userMsg = { role: 'user', content: message };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);
        setTitle(message.slice(0, 50));

        // Simulate AI response (replace with actual provider call)
        setTimeout(() => {
            setIsThinking(false);
            const assistantMsg = {
                role: 'assistant',
                content: `I'll help you with: "${message}"\n\nThis is a simulated response. The actual TUI will stream responses from your LLM provider.`
            };
            setMessages(prev => [...prev, assistantMsg]);
            setTokens(prev => prev + message.length * 2);
        }, 1500);
    };

    return (
        <Box flexDirection="column" height="100%">
            {/* Title Bar */}
            <TitleBar
                title={title}
                tokens={tokens}
                cost={tokens * 0.00001}
            />

            {/* Messages */}
            <MessageDisplay
                messages={messages}
                isThinking={isThinking}
                currentResponse={currentResponse}
                toolCalls={toolCalls}
            />

            {/* Input */}
            <InputBox
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                placeholder="Continue the conversation..."
                mode={mode.name}
            />

            {/* Status Bar */}
            <StatusBar
                mode={mode.name}
                performanceMode={perfMode.name}
                model="Local LLM"
                provider="LM Studio"
                tokens={tokens}
                cost={tokens * 0.00001}
                showInterrupt={isThinking}
            />
        </Box>
    );
};

// Main TUI App
const App = ({ provider }) => {
    const [screen, setScreen] = useState('welcome');
    const [initialMessage, setInitialMessage] = useState('');

    const handleStart = (message) => {
        setInitialMessage(message);
        setScreen('chat');
    };

    const handleExit = () => {
        process.exit(0);
    };

    return (
        <Box flexDirection="column">
            {screen === 'welcome' ? (
                <WelcomeScreen onStart={handleStart} />
            ) : (
                <ChatScreen
                    initialMessage={initialMessage}
                    provider={provider}
                    onExit={handleExit}
                />
            )}
        </Box>
    );
};

// Render the TUI
export function startTUI(options = {}) {
    const { provider } = options;

    // Clear screen
    process.stdout.write('\x1B[2J\x1B[0f');

    // Render React app
    render(<App provider={provider} />);
}

export default { startTUI };
